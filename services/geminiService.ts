
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UrlContextMetadataItem, KnowledgeBase } from '../types';

interface GeminiResponse {
  text: string;
  urlContextMetadata?: UrlContextMetadataItem[];
}

const formatGeminiError = (error: any): string => {
  console.error("Détails Erreur Gemini:", error);
  let errorMessage = error?.message || "";

  if (error?.response?.error?.message) {
    errorMessage = error.response.error.message;
  }

  const msgStr = errorMessage.toString();

  if (msgStr.includes("429") || msgStr.includes("RESOURCE_EXHAUSTED")) {
    return "QUOTA_EXCEEDED: Limite de requêtes atteinte. Attendez 60s.";
  }
  
  if (msgStr.includes("Requested entity was not found") || msgStr.includes("API_KEY_INVALID")) {
    return "API_KEY_ERROR: Clé API non valide ou projet non trouvé. Veuillez sélectionner une clé API valide via l'onglet 'Configuration IA' dans l'Espace Admin.";
  }

  return errorMessage || "Erreur de connexion à l'IA.";
};

export const generateContentWithUrlContext = async (
  prompt: string,
  kb: KnowledgeBase,
  modelName: string = "gemini-3-flash-preview"
): Promise<GeminiResponse> => {
  // CRITICAL: Always create a new instance right before the call to pick up the updated process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Préparation du contexte textuel
  const formattedUrls = kb.urls.length > 0 
    ? kb.urls.map(u => `- SOURCE WEB: ${u.url} (MODE: ${u.crawlMode === 'site' ? 'Domaine complet' : 'Page seule'})`).join('\n') 
    : '- Aucune source web.';
  
  const videoLinks = kb.videoLinks || [];
  const formattedVideoLinks = videoLinks.length > 0
    ? videoLinks.map(v => `- VIDÉO (URL): ${v.url}`).join('\n')
    : '- Aucun lien vidéo externe.';

  const formattedNotes = kb.rawTexts.length > 0 
    ? kb.rawTexts.map(t => `TITRE: ${t.title}\nCONTENU: ${t.content}`).join('\n---\n') 
    : '- Aucune note interne.';

  const systemInstruction = `Vous êtes PedagoChat, un assistant pédagogique opérant en SYSTÈME FERMÉ STRICT.

RÈGLE ABSOLUE : Vous ne devez utiliser QUE les ressources fournies ci-dessous pour répondre. 
INTERDICTION : Ne faites JAMAIS appel à vos connaissances externes non fournies par l'enseignant.

RESSOURCES DISPONIBLES :
1. DOCUMENTS TEXTUELS : Notes de cours et fichiers textes.
2. IMAGES : Schémas et photos fournis en fichiers.
3. VIDÉOS (FICHIERS) : Des vidéos entières sont fournies en pièces jointes. Analysez le contenu visuel et audio (dialogues, scènes).
4. LIENS WEB ET VIDÉOS : Utilisez vos outils de recherche (Google Search) pour consulter UNIQUEMENT les URLs listées. Pour les liens YouTube, analysez le contenu de la vidéo correspondante via la recherche.

COMPORTEMENT :
- Si l'information est présente : Répondez en citant la source exacte ("D'après la vidéo...", "Comme indiqué dans la note...").
- Si l'information est ABSENTE : Dites exactement : "Désolé, je n'ai pas trouvé cette information dans les ressources mises à ma disposition par votre enseignant."

CONSIGNES DE STYLE :
- Soyez encourageant, structuré (Markdown) et pédagogue.`;

  const parts: any[] = [{ text: prompt }];

  // 1. Contexte textuel
  parts.push({ text: `BASE DE CONNAISSANCES :\n\nNOTES :\n${formattedNotes}\n\nSOURCES WEB :\n${formattedUrls}\n\nLIENS VIDÉOS EXTERNES :\n${formattedVideoLinks}` });

  // 2. Fichiers multimédias
  kb.files.forEach(file => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type === 'application/pdf') {
      parts.push({ 
        inlineData: { 
          data: file.base64Data, 
          mimeType: file.type 
        } 
      });
      parts.push({ text: `PIÈCE JOINTE (${file.type.split('/')[0].toUpperCase()}) : ${file.name}` });
    } else {
      try {
        const decodedText = atob(file.base64Data);
        parts.push({ text: `CONTENU FICHIER ${file.name} :\n${decodedText}` });
      } catch (e) { /* silent */ }
    }
  });

  try {
    const isPro = modelName.includes('pro');
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: parts }],
      config: { 
        tools: [{ googleSearch: {} }],
        systemInstruction: systemInstruction,
        temperature: 0.1,
        // Active "thinking" pour les modèles qui le supportent (Gemini 3 Pro)
        thinkingConfig: isPro ? { thinkingBudget: 32768 } : undefined
      },
    });

    const text = response.text || "Désolé, je n'ai pas pu générer de réponse.";
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
    throw new Error(formatGeminiError(error));
  }
};
