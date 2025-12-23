
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { UrlContextMetadataItem, KnowledgeBase } from '../types';

const MODEL_NAME = "gemini-3-flash-preview"; 

interface GeminiResponse {
  text: string;
  urlContextMetadata?: UrlContextMetadataItem[];
}

const formatGeminiError = (error: any): string => {
  console.error("Détails Erreur Gemini:", error);
  let errorMessage = error?.message || "";

  // Check for more specific error messages from the API response
  if (error?.response?.error?.message) {
    errorMessage = error.response.error.message;
  }

  if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
    return "QUOTA_EXCEEDED: Limite de requêtes atteinte. Attendez 60s.";
  }
  return errorMessage || "Erreur de connexion à l'IA.";
};

export const generateContentWithUrlContext = async (
  prompt: string,
  kb: KnowledgeBase
): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const formattedUrls = kb.urls.length > 0 
    ? kb.urls.map(u => `- ${u.url} (${u.crawlWholeSite ? 'Site complet' : 'Page seule'})`).join('\n') 
    : '- Aucune URL disponible.';
  const formattedFiles = kb.files.length > 0 
    ? kb.files.map(f => `- ${f.name}`).join('\n') 
    : '- Aucun document joint.';
  const formattedNotes = kb.rawTexts.length > 0 
    ? kb.rawTexts.map(t => `- ${t.title}`).join('\n') 
    : '- Aucune note interne.';

  const systemInstruction = `Vous êtes un Assistant Pédagogique (PedagoChat). 
  Votre mission est d'accompagner les élèves de CAP et Bac Pro dans leurs activités, en utilisant **exclusivement** les informations de la base de données fournie. Vous ne devez en aucun cas consulter ou utiliser des informations qui ne proviennent pas explicitement de ces sources.
  
  Voici la liste des sources que vous avez à votre disposition :
  SOURCES WEB :
  ${formattedUrls}
  
  DOCUMENTS JOINTS :
  ${formattedFiles}
  
  NOTES PÉDAGOGIQUES INTERNES :
  ${formattedNotes}

  DIRECTIVES DE RÉPONSE :
  - Répondez toujours en Français.
  - Priorisez **strictement** les informations provenant de ces sources.
  - Lorsque vous citez des informations, mentionnez toujours la source de manière élégante (par exemple, "Selon le document X...", "D'après la page web Y...", "Dans la note 'Z'...").
  - Si une information n'est pas trouvée dans les sources fournies, indiquez-le clairement par une phrase comme "Je n'ai pas trouvé cette information dans ma base de connaissances." ou "Mes sources ne contiennent pas cette donnée." **Ne tentez pas de générer une réponse basée sur des connaissances générales ou externes.**
  - Adaptez votre vocabulaire pour être clair et accessible à des élèves de niveau CAP et Bac Pro.
  - Fournissez des réponses concises et directes, évitant les digressions.`;

  const parts: any[] = [{ text: prompt }];

  // Injection des notes
  if (kb.rawTexts.length > 0) {
    const textContext = kb.rawTexts.map(t => `NOTE PÉDAGOGIQUE [${t.title}]: ${t.content}`).join('\n\n');
    parts.push({ text: `CONNAISSANCE LOCALE :\n${textContext}` });
  }

  // Injection des fichiers
  kb.files.forEach(file => {
    // Seuls les PDF sont envoyés via inlineData. Les autres types (TXT, DOCX) sont lus en texte clair si possible.
    if (file.type === 'application/pdf') {
      parts.push({ inlineData: { data: file.base64Data, mimeType: 'application/pdf' } });
    } else {
      try {
        parts.push({ text: `CONTENU DU FICHIER ${file.name} :\n${atob(file.base64Data)}` });
      } catch (e) {
        console.warn(`Erreur de lecture base64 pour le fichier ${file.name}. Il pourrait être corrompu ou d'un format non supporté pour une lecture directe.`);
      }
    }
  });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: parts }],
      config: { 
        // L'outil googleSearch a été retiré pour respecter la consigne de ne consulter que la base de données interne.
        systemInstruction: systemInstruction,
      },
    });

    const text = response.text;
    // Même si groundingChunks pourrait potentiellement exister pour d'autres modèles,
    // sans l'outil googleSearch, il ne devrait pas y avoir de liens web issus d'une recherche.
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    let extractedUrlContextMetadata: UrlContextMetadataItem[] | undefined = undefined;

    if (groundingChunks) {
      extractedUrlContextMetadata = groundingChunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          uri: chunk.web.uri,
          title: chunk.web.title,
        }));
    }
    
    return { text, urlContextMetadata: extractedUrlContextMetadata };
  } catch (error: any) {
    // Preserve the original error type if possible for more specific handling upstream
    const err = new Error(formatGeminiError(error));
    if (error.name) {
      err.name = error.name;
    }
    throw err;
  }
};
