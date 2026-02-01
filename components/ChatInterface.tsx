
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, ChatSession } from '../types'; 
import MessageItem from './MessageItem';
import { Send, Sparkles, Settings, ArrowDown, Cpu } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (query: string, sessionId?: string) => void;
  isLoading: boolean;
  placeholderText?: string;
  assistantName: string;
  session?: ChatSession;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  placeholderText,
  assistantName,
  session
}) => {
  const [userQuery, setUserQuery] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const checkScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(atBottom);
    setShowScrollButton(!atBottom && messages.length > 5);
  }, [messages.length]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isAtBottom) scrollToBottom("smooth");
  }, [messages, isAtBottom]);

  const handleSend = () => {
    if (userQuery.trim() && !isLoading) {
      onSendMessage(userQuery.trim());
      setUserQuery('');
      setTimeout(() => scrollToBottom("auto"), 50);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden relative">
      <div 
        ref={containerRef}
        onScroll={checkScroll}
        className="flex-grow overflow-y-auto chat-container p-6 space-y-2 scroll-smooth"
      >
        <div className="max-w-4xl mx-auto w-full">
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} assistantName={assistantName} />
          ))}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </div>

      {showScrollButton && (
        <button 
          onClick={() => scrollToBottom()}
          className="absolute bottom-28 right-10 p-3 bg-indigo-600 text-white rounded-full shadow-xl"
        >
          <ArrowDown size={20} />
        </button>
      )}

      <div className="p-6 bg-gradient-to-t from-gray-50 to-transparent">
        {session && (
          <div className="max-w-4xl mx-auto mb-2 flex items-center gap-2 opacity-40">
            <Cpu size={12} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {session.aiProvider === 'gemini' ? 'Google Gemini' : 'OpenRouter'} | {session.modelName}
            </span>
          </div>
        )}
        <div className="max-w-4xl mx-auto relative group">
          <textarea
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder={placeholderText || "Posez votre question..."}
            className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-500 rounded-2xl py-4 pl-6 pr-20 text-sm focus:border-blue-500/50 outline-none transition-all resize-none shadow-md min-h-[60px]"
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
                : 'bg-blue-600 text-white shadow-md'
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
