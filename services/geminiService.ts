
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
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
    ? kb.urls.map(u => `- ${u.url}`).join('\n') 
    : '- Aucune URL disponible.';
  const formattedFiles = kb.files.length > 0 
    ? kb.files.map(f => `- ${f.name}`).join('\n') 
    : '- Aucun document joint.';
  const formattedNotes = kb.rawTexts.length > 0 
    ? kb.rawTexts.map(t => `- ${t.title}`).join('\n') 
    : '- Aucune note interne.';

  const systemInstruction = `Vous êtes un Assistant Pédagogique (PedagoChat). 
  Votre mission est d'accompagner les élèves de CAP et Bac Pro dans leurs activités, en utilisant **exclusivement les informations contenues dans les DOCUMENTS JOINTS, les NOTES PÉDAGOGIQUES INTERNES qui vous sont directement fournies, et le contenu des pages web dont les URL exactes sont listées ci-dessous**.

  Voici la base de connaissances que vous avez à votre disposition :
  
  DOCUMENTS JOINTS :
  ${formattedFiles}
  
  NOTES PÉDAGOGIQUES INTERNES :
  ${formattedNotes}

  SOURCES WEB (Vous pouvez utiliser un outil de recherche interne *exclusivement* pour récupérer le contenu des URL exactes listées. Vous ne devez pas faire de recherche générale, ni naviguer ou suivre des liens à partir de ces URLs) :
  ${formattedUrls}

  DIRECTIVES DE RÉPONSE :
  - Répondez toujours en Français.
  - Priorisez **strictement** les informations provenant des DOCUMENTS JOINTS, des NOTES PÉDAGOGIQUES INTERNES, et du contenu des URLs web que vous avez pu consulter.
  - Lorsque vous citez des informations, mentionnez toujours la source de manière élégante (par exemple, "Selon le document X...", "D'après la note 'Z'...", "Sur la page web Y...").
  - Si une information n'est pas trouvée dans les sources (documents, notes, et contenu des URLs *spécifiques* consultées), indiquez-le clairement par une phrase comme "Je n'ai pas trouvé cette information dans ma base de connaissances." ou "Mes sources ne contiennent pas cette donnée." **Ne tentez pas de générer une réponse basée sur des connaissances générales ou externes.**
  - Adaptez votre vocabulaire pour être clair et accessible à des élèves de niveau CAP et Bac Pro.
  - Fournissez des réponses concises et directes, évitant les digressions.`;

  const parts: any[] = [{ text: prompt }];

  if (kb.rawTexts.length > 0) {
    const textContext = kb.rawTexts.map(t => `NOTE PÉDAGOGIQUE [${t.title}]: ${t.content}`).join('\n\n');
    parts.push({ text: `CONNAISSANCE LOCALE :\n${textContext}` });
  }

  kb.files.forEach(file => {
    if (file.type === 'application/pdf') {
      parts.push({ inlineData: { data: file.base64Data, mimeType: 'application/pdf' } });
    } else {
      try {
        parts.push({ text: `CONTENU DU FICHIER ${file.name} :\n${atob(file.base64Data)}` });
      } catch (e) {
        console.warn(`Erreur de lecture base64 pour le fichier ${file.name}.`);
      }
    }
  });

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: parts }],
      config: { 
        tools: [{ googleSearch: {} }],
        systemInstruction: systemInstruction,
      },
    });

    const text = response.text || "Désolé, je n'ai pas pu générer de réponse.";
    
    // Safety check on response structure
    const candidate = response.candidates?.[0];
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks;
    
    let extractedUrlContextMetadata: UrlContextMetadataItem[] | undefined = undefined;

    if (groundingChunks) {
      extractedUrlContextMetadata = (groundingChunks as any[])
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          uri: chunk.web.uri,
          title: chunk.web.title,
        }));
    }
    
    return { text, urlContextMetadata: extractedUrlContextMetadata };
  } catch (error: any) {
    const err = new Error(formatGeminiError(error));
    if (error.name) {
      err.name = error.name;
    }
    throw err;
  }
};
