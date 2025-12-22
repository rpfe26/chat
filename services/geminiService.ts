
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { UrlContextMetadataItem } from '../types';

// Use gemini-3-flash-preview for documentation analysis and search grounding tasks
const MODEL_NAME = "gemini-3-flash-preview"; 

interface GeminiResponse {
  text: string;
  urlContextMetadata?: UrlContextMetadataItem[];
}

export const generateContentWithUrlContext = async (
  prompt: string,
  urls: string[]
): Promise<GeminiResponse> => {
  // Initialize AI client using the API key from environment variables
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `Vous êtes un Assistant de Connaissances spécialisé capable de parcourir la documentation et d'analyser le contenu vidéo via les URLs fournies. 
  Répondez TOUJOURS en Français.
  Utilisez l'outil googleSearch pour vérifier et enrichir vos réponses avec des informations à jour si nécessaire.
  Répondez précisément aux questions en combinant les informations des documents textuels et des ressources vidéo mentionnées. 
  Si vous faites référence à une ressource, mentionnez son titre et fournissez le lien.`;

  let fullPrompt = prompt;
  if (urls.length > 0) {
    const urlList = urls.join('\n');
    fullPrompt = `${prompt}\n\nContexte (URLs de documentation et vidéos à consulter en priorité) :\n${urlList}`;
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      config: { 
        // Use googleSearch tool for grounding as specified in guidelines
        tools: [{ googleSearch: {} }],
        systemInstruction: systemInstruction,
      },
    });

    const text = response.text;
    const candidate = response.candidates?.[0];
    let extractedUrlContextMetadata: UrlContextMetadataItem[] | undefined = undefined;

    // Correctly extract grounding information from groundingChunks
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks;
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
    console.error("Erreur API Gemini :", error);
    throw new Error(error.message || "Erreur IA inconnue.");
  }
};

export const getInitialSuggestions = async (urls: string[]): Promise<GeminiResponse> => {
  if (urls.length === 0) return { text: JSON.stringify({ suggestions: [] }) };
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const urlList = urls.join('\n');
  
  const promptText = `En vous basant sur ces URLs de documentation et de vidéo, suggérez 3 ou 4 questions concises qu'un utilisateur pourrait poser. 
  Les questions DOIVENT être en Français.
  S'il y a des vidéos, incluez au moins une question spécifique au contenu vidéo.
  Renvoyez l'objet JSON contenant les suggestions.

URLs :
${urlList}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      config: {
        responseMimeType: "application/json",
        // Recommended method to ensure valid JSON output from the model
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["suggestions"],
          propertyOrdering: ["suggestions"]
        },
      },
    });
    return { text: response.text };
  } catch (error) {
    console.error("Erreur lors de la récupération des suggestions :", error);
    return { text: JSON.stringify({ suggestions: [] }) };
  }
};
