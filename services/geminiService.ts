
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Tool, HarmCategory, HarmBlockThreshold, Content } from "@google/genai";
import { UrlContextMetadataItem } from '../types';

const API_KEY = process.env.API_KEY;
let ai: GoogleGenAI;

const MODEL_NAME = "gemini-2.5-flash"; 

const getAiInstance = (): GoogleGenAI => {
  if (!API_KEY) throw new Error("Clé API Gemini non configurée.");
  if (!ai) ai = new GoogleGenAI({ apiKey: API_KEY });
  return ai;
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

interface GeminiResponse {
  text: string;
  urlContextMetadata?: UrlContextMetadataItem[];
}

export const generateContentWithUrlContext = async (
  prompt: string,
  urls: string[]
): Promise<GeminiResponse> => {
  const currentAi = getAiInstance();
  
  const systemInstruction = `Vous êtes un Assistant de Connaissances spécialisé capable de parcourir la documentation et d'analyser le contenu vidéo via les URLs fournies. 
  Répondez TOUJOURS en Français.
  Lorsqu'une URL pointe vers une vidéo (YouTube, Vimeo, etc.), utilisez l'outil urlContext pour récupérer les métadonnées, descriptions et transcriptions disponibles. 
  Répondez précisément aux questions en combinant les informations des documents textuels et des ressources vidéo. 
  Si vous faites référence à une vidéo, mentionnez son titre et fournissez le lien.`;

  let fullPrompt = prompt;
  if (urls.length > 0) {
    const urlList = urls.join('\n');
    fullPrompt = `${prompt}\n\nURLs de contexte (Docs & Vidéos) :\n${urlList}`;
  }

  const tools: Tool[] = [{ urlContext: {} }];
  const contents: Content[] = [{ role: "user", parts: [{ text: fullPrompt }] }];

  try {
    const response: GenerateContentResponse = await currentAi.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: { 
        tools: tools,
        safetySettings: safetySettings,
        systemInstruction: systemInstruction,
      },
    });

    const text = response.text;
    const candidate = response.candidates?.[0];
    let extractedUrlContextMetadata: UrlContextMetadataItem[] | undefined = undefined;

    if (candidate?.urlContextMetadata?.urlMetadata) {
      extractedUrlContextMetadata = candidate.urlContextMetadata.urlMetadata as UrlContextMetadataItem[];
    }
    
    return { text, urlContextMetadata: extractedUrlContextMetadata };
  } catch (error: any) {
    console.error("Erreur API Gemini :", error);
    throw new Error(error.message || "Erreur IA inconnue.");
  }
};

export const getInitialSuggestions = async (urls: string[]): Promise<GeminiResponse> => {
  if (urls.length === 0) return { text: JSON.stringify({ suggestions: [] }) };
  
  const currentAi = getAiInstance();
  const urlList = urls.join('\n');
  
  const promptText = `En vous basant sur ces URLs de documentation et de vidéo, suggérez 3 ou 4 questions concises qu'un utilisateur pourrait poser. 
  Les questions DOIVENT être en Français.
  S'il y a des vidéos, incluez au moins une question spécifique au contenu vidéo.
  Renvoyez UNIQUEMENT un objet JSON : {"suggestions": ["Question 1", "Question 2"]}.

URLs :
${urlList}`;

  const contents: Content[] = [{ role: "user", parts: [{ text: promptText }] }];

  try {
    const response: GenerateContentResponse = await currentAi.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        safetySettings: safetySettings,
        responseMimeType: "application/json",
      },
    });
    return { text: response.text };
  } catch (error) {
    console.error("Erreur lors de la récupération des suggestions :", error);
    return { text: JSON.stringify({ suggestions: [] }) };
  }
};
