
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types'; 
import MessageItem from './MessageItem';
import { Send, Sparkles, Settings, ArrowDown } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (query: string, sessionId?: string) => void;
  isLoading: boolean;
  placeholderText?: string;
  assistantName: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  placeholderText,
  assistantName
}) => {
  const [userQuery, setUserQuery] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMessageCount = useRef(messages.length);

  // Fonction pour vérifier si on est en bas
  const checkScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // On considère qu'on est en bas si on est à moins de 100px du bord réel
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setIsAtBottom(atBottom);
    setShowScrollButton(!atBottom && messages.length > 5);
  }, [messages.length]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Effet lors de l'arrivée de nouveaux messages
  useEffect(() => {
    const isNewMessageFromUser = messages.length > 0 && messages[messages.length - 1].sender === 'user';
    
    // On descend automatiquement seulement si :
    // 1. C'est le premier message
    // 2. L'utilisateur était déjà en bas
    // 3. L'utilisateur vient d'envoyer un message (priorité absolue)
    if (messages.length === 1 || isAtBottom || isNewMessageFromUser) {
      scrollToBottom(isNewMessageFromUser ? "auto" : "smooth");
    }
    
    lastMessageCount.current = messages.length;
  }, [messages, isAtBottom]);

  const handleSend = () => {
    if (userQuery.trim() && !isLoading) {
      onSendMessage(userQuery.trim());
      setUserQuery('');
      // On force le scroll immediat après l'envoi
      setTimeout(() => scrollToBottom("auto"), 50);
    }
  };

  const hasKnowledge = placeholderText && !placeholderText.includes("Commencez par ajouter");

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden relative">
      {/* Zone des messages */}
      <div 
        ref={containerRef}
        onScroll={checkScroll}
        className="flex-grow overflow-y-auto chat-container p-6 space-y-2 scroll-smooth"
      >
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
            <div ref={messagesEndRef} className="h-2" />
          </div>
        )}
      </div>

      {/* Bouton de retour rapide en bas (apparaît si on a remonté) */}
      {showScrollButton && (
        <button 
          onClick={() => scrollToBottom()}
          className="absolute bottom-28 right-10 p-3 bg-indigo-600 text-white rounded-full shadow-xl hover:bg-indigo-700 transition-all animate-in fade-in slide-in-from-bottom-4 z-10"
          title="Retourner aux derniers messages"
        >
          <ArrowDown size={20} />
        </button>
      )}

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
      </div>
    </div>
  );
};

export default ChatInterface;
