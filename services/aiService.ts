
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UrlContextMetadataItem, KnowledgeBase, ChatSession } from '../types';

interface AIResponse {
  text: string;
  urlContextMetadata?: UrlContextMetadataItem[];
}

const formatAIError = (error: any): string => {
  console.error("Détails Erreur IA:", error);
  const msg = error?.message || error?.toString() || "Erreur inconnue";
  
  if (msg.includes("401") || msg.includes("API_KEY_INVALID") || msg.includes("invalid_api_key")) {
    return "ERREUR_CLE: La clé API fournie est invalide ou expirée.";
  }
  if (msg.includes("429")) {
    return "QUOTA_EXCEDED: Trop de requêtes. Veuillez patienter ou vérifier vos crédits.";
  }
  return msg;
};

/**
 * Appel à OpenRouter ou API compatible OpenAI
 */
async function callOpenRouter(prompt: string, session: ChatSession, systemInstruction: string): Promise<AIResponse> {
  const apiKey = session.sessionApiKey || process.env.API_KEY;
  
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.origin,
      "X-Title": "PedagoChat"
    },
    body: JSON.stringify({
      model: session.modelName,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData?.error?.message || `Erreur OpenRouter (${response.status})`);
  }

  const data = await response.json();
  return {
    text: data.choices[0].message.content || "Pas de réponse reçue."
  };
}

/**
 * Appel direct à Google Gemini
 */
async function callGemini(prompt: string, session: ChatSession, systemInstruction: string): Promise<AIResponse> {
  const apiKey = session.sessionApiKey || process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey });
  const modelName = session.modelName || "gemini-3-flash-preview";

  const kb = session.knowledgeBase;
  const parts: any[] = [{ text: prompt }];

  // Ajout des fichiers multimédias au contexte Gemini
  kb.files.forEach(file => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type === 'application/pdf') {
      parts.push({ 
        inlineData: { 
          data: file.base64Data, 
          mimeType: file.type 
        } 
      });
    }
  });

  const isPro = modelName.includes('pro');
  
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: modelName,
    contents: [{ role: "user", parts: parts }],
    config: { 
      tools: [{ googleSearch: {} }],
      systemInstruction: systemInstruction,
      temperature: 0.1,
      thinkingConfig: isPro ? { thinkingBudget: 32768 } : undefined
    },
  });

  const text = response.text || "";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  
  let urlContext: UrlContextMetadataItem[] | undefined = undefined;
  if (groundingChunks) {
    urlContext = (groundingChunks as any[])
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        uri: chunk.web.uri,
        title: chunk.web.title,
      }));
  }

  return { text, urlContextMetadata: urlContext };
}

export const generateAIContent = async (
  prompt: string,
  session: ChatSession
): Promise<AIResponse> => {
  const kb = session.knowledgeBase;
  
  // Préparation des instructions système
  const formattedNotes = kb.rawTexts.map(t => `NOTE [${t.title}]: ${t.content}`).join('\n\n');
  const formattedUrls = kb.urls.map(u => `- SOURCE: ${u.url}`).join('\n');

  const systemInstruction = `Vous êtes PedagoChat, un assistant pédagogique opérant en SYSTÈME FERMÉ.
Vous devez répondre en priorité en utilisant les connaissances suivantes fournies par l'enseignant :

NOTES DE COURS :
${formattedNotes}

SITES WEB AUTORISÉS :
${formattedUrls}

CONSIGNE : Si l'information n'est pas dans les ressources, prévenez l'élève poliment. 
Utilisez le Markdown pour structurer vos réponses.`;

  try {
    if (session.aiProvider === 'openrouter') {
      return await callOpenRouter(prompt, session, systemInstruction);
    } else {
      return await callGemini(prompt, session, systemInstruction);
    }
  } catch (error: any) {
    throw new Error(formatAIError(error));
  }
};
