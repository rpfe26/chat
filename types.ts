
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export enum MessageSender {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
}

export interface UrlItem {
  url: string;
  crawlWholeSite: boolean;
}

export interface UrlContextMetadataItem {
  uri: string;
  title?: string;
}

export interface KnowledgeFile {
  id: string;
  name: string;
  type: string;
  size: number;
  base64Data: string;
}

export interface KnowledgeText {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: Date;
  isLoading?: boolean;
  urlContext?: UrlContextMetadataItem[];
}

export interface KnowledgeBase {
  urls: UrlItem[];
  files: KnowledgeFile[];
  rawTexts: KnowledgeText[];
}

export interface ChatSession {
  id: string;
  name: string;
  knowledgeBase: KnowledgeBase;
  chatMessages: ChatMessage[];
}

export type AppView = 'chat' | 'admin';
