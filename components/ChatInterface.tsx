

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types'; 
import MessageItem from './MessageItem';
import { Send, Sparkles, Settings } from 'lucide-react'; // Ajout de Settings

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (query: string, sessionId?: string) => void; // sessionId is optional as it's passed only in embed mode
  isLoading: boolean;
  placeholderText?: string;
  assistantName: string; // New: Name for the AI assistant
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  placeholderText,
  assistantName
}) => {
  const [userQuery, setUserQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (userQuery.trim() && !isLoading) {
      onSendMessage(userQuery.trim());
      setUserQuery('');
    }
  };

  const hasKnowledge = placeholderText && !placeholderText.includes("Commencez par ajouter");

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Zone des messages */}
      <div className="flex-grow overflow-y-auto chat-container p-6 space-y-2">
        {messages.length === 1 && messages[0].sender === 'system' && messages[0].id === 'welcome-new' && !hasKnowledge ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <Settings size={48} className="text-indigo-500" />
            <p className="text-base font-medium text-gray-600">
              Votre assistant attend des connaissances !<br/>
              Allez dans l'administration pour lui ajouter des sources.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
            <Sparkles size={48} className="text-blue-500" />
            <p className="text-base font-medium text-gray-600">Commencez une conversation...</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full">
            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} assistantName={assistantName} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Zone de saisie flottante */}
      <div className="p-6 bg-gradient-to-t from-gray-50 to-transparent">
        <div className="max-w-4xl mx-auto relative group">
          <textarea
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder={placeholderText || "Posez votre question..."}
            className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-500 rounded-2xl py-4 pl-6 pr-20 text-sm focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all resize-none shadow-md min-h-[60px]"
            rows={1}
            disabled={isLoading}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !userQuery.trim()}
            className={`absolute right-3 bottom-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isLoading || !userQuery.trim() 
                ? 'bg-gray-200 text-gray-500' 
                : 'bg-blue-600 text-white shadow-md shadow-blue-600/40 hover:scale-105 active:scale-95'
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin"></div> 
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        {/* Supprimé : Paragraphe "Propulsé par Google Gemini 3 Flash" */}
      </div>
    </div>
  );
};

export default ChatInterface;