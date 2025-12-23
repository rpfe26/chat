

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { ChatMessage, MessageSender } from '../types';
import { Video, ExternalLink, PlayCircle, AlertTriangle } from 'lucide-react';

marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-',
} as any);

interface MessageItemProps {
  message: ChatMessage;
  assistantName: string; // New: Name for the AI assistant
}

const getYoutubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const VideoEmbed: React.FC<{ url: string }> = ({ url }) => {
  const ytId = getYoutubeId(url);
  
  if (ytId) {
    return (
      <div className="mt-4 rounded-xl overflow-hidden aspect-video border border-gray-200 bg-gray-900">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${ytId}`}
          title="Aperçu vidéo"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  const isDirectVideo = /\.mp4|\.webm|\.mov/.test(url);
  if (isDirectVideo) {
    return (
      <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 bg-gray-900">
        <video controls className="w-full">
          <source src={url} />
          Votre navigateur ne supporte pas la balise vidéo.
        </video>
      </div>
    );
  }

  return null;
};

// Modified SenderAvatar to use assistantName
const SenderAvatar: React.FC<{ sender: MessageSender; assistantName: string }> = ({ sender, assistantName }) => {
  const isUser = sender === MessageSender.USER;
  const isAI = sender === MessageSender.MODEL;
  const isSystem = sender === MessageSender.SYSTEM;
  
  let label = '';
  let bgColor = '';

  if (isUser) {
    label = 'MOI';
    bgColor = 'bg-blue-600 text-white';
  } else if (isAI) {
    label = assistantName; // Use the custom assistant name
    bgColor = 'bg-indigo-600 text-white';
  } else { // isSystem
    label = 'SYS';
    bgColor = 'bg-red-100 text-red-700';
  }

  return (
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black tracking-tighter shrink-0 shadow-md ${bgColor}`}>
      {label}
    </div>
  );
};

const MessageItem: React.FC<MessageItemProps> = ({ message, assistantName }) => {
  const isUser = message.sender === MessageSender.USER;
  const isModel = message.sender === MessageSender.MODEL;
  const isSystem = message.sender === MessageSender.SYSTEM;

  const videoRegex = /(https?:\/\/[^\s]+(?:youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm|\.mov)[^\s]*)/gi;
  const foundVideos = message.text.match(videoRegex) || [];

  const renderMessageContent = () => {
    if (isSystem) {
      const isQuotaError = message.text.includes("QUOTA_EXCEEDED");
      return (
        <div className={`flex items-start gap-2 text-sm leading-relaxed ${isQuotaError ? 'text-amber-800' : 'text-gray-600 italic'}`}>
          {isQuotaError && <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />}
          <div className="whitespace-pre-wrap">{message.text}</div>
        </div>
      );
    }

    if (isModel && !message.isLoading) {
      const rawMarkup = marked.parse(message.text || "") as string;
      return (
        <div className="space-y-4">
          <div className="prose prose-sm max-w-none text-gray-900" dangerouslySetInnerHTML={{ __html: rawMarkup }} />
          {foundVideos.slice(0, 1).map((vUrl, idx) => (
            <VideoEmbed key={idx} url={vUrl} />
          ))}
        </div>
      );
    }
    
    return <div className={`whitespace-pre-wrap text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-900'}`}>{message.text}</div>;
  };
  
  return (
    <div className={`flex mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-3 max-w-[90%] md:max-w-[80%]`}>
        {!isUser && <SenderAvatar sender={message.sender} assistantName={assistantName} />}
        <div className={`p-4 rounded-2xl shadow-md transition-all ${
          isUser 
            ? 'bg-blue-50 border border-blue-200 rounded-tr-none' 
            : isModel 
              ? 'bg-gray-100 border border-gray-200 rounded-tl-none'
              : message.text.includes("QUOTA_EXCEEDED") 
                ? 'bg-amber-50 border border-amber-200 rounded-tl-none'
                : 'bg-gray-100 border border-gray-200 rounded-tl-none' // Fallback for other system messages
        }`}>
          {message.isLoading ? (
            <div className="flex items-center gap-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"></div>
            </div>
          ) : (
            renderMessageContent()
          )}
          
          {isModel && message.urlContext && message.urlContext.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <PlayCircle size={10} /> Sources Consultées
              </p>
              <div className="flex flex-wrap gap-1.5">
                {message.urlContext.map((meta, index) => {
                  const isVideo = /(youtube|youtu\.be|vimeo|\.mp4|\.webm)/.test(meta.uri);
                  return (
                    <a key={index} href={meta.uri} target="_blank" rel="noopener noreferrer" 
                       className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] border transition-colors ${
                         isVideo ? 'bg-indigo-100 border-indigo-200 text-indigo-700 hover:bg-indigo-200' : 'bg-blue-100 border-blue-200 text-blue-700 hover:bg-blue-200'
                       }`}>
                      {isVideo ? <Video size={10} /> : <ExternalLink size={10} />}
                      {meta.title || `Source ${index + 1}`}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {isUser && <SenderAvatar sender={message.sender} assistantName={assistantName} />}
      </div>
    </div>
  );
};

export default MessageItem;