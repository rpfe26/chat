
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { ChatMessage, MessageSender } from '../types';
import { Video, ExternalLink, PlayCircle } from 'lucide-react';

marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-',
} as any);

interface MessageItemProps {
  message: ChatMessage;
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
      <div className="mt-4 rounded-xl overflow-hidden aspect-video border border-white/10 bg-black">
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
      <div className="mt-4 rounded-xl overflow-hidden border border-white/10 bg-black">
        <video controls className="w-full">
          <source src={url} />
          Votre navigateur ne supporte pas la balise vidéo.
        </video>
      </div>
    );
  }

  return null;
};

const SenderAvatar: React.FC<{ sender: MessageSender }> = ({ sender }) => {
  const isUser = sender === MessageSender.USER;
  const isAI = sender === MessageSender.MODEL;
  
  return (
    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black tracking-tighter shrink-0 shadow-lg ${
      isUser ? 'bg-blue-600 text-white' : isAI ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white/40'
    }`}>
      {isUser ? 'MOI' : isAI ? 'IA' : 'SYS'}
    </div>
  );
};

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.sender === MessageSender.USER;
  const isModel = message.sender === MessageSender.MODEL;
  const isSystem = message.sender === MessageSender.SYSTEM;

  // Extract video URLs from text for embedding
  const videoRegex = /(https?:\/\/[^\s]+(?:youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm|\.mov)[^\s]*)/gi;
  const foundVideos = message.text.match(videoRegex) || [];

  const renderMessageContent = () => {
    if (isModel && !message.isLoading) {
      const rawMarkup = marked.parse(message.text || "") as string;
      return (
        <div className="space-y-4">
          <div className="prose prose-sm prose-invert max-w-none text-white/90" dangerouslySetInnerHTML={{ __html: rawMarkup }} />
          {foundVideos.slice(0, 1).map((vUrl, idx) => (
            <VideoEmbed key={idx} url={vUrl} />
          ))}
        </div>
      );
    }
    
    return <div className={`whitespace-pre-wrap text-sm leading-relaxed ${isUser ? 'text-white' : 'text-white/60'}`}>{message.text}</div>;
  };
  
  return (
    <div className={`flex mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-3 max-w-[90%] md:max-w-[80%]`}>
        {!isUser && <SenderAvatar sender={message.sender} />}
        <div className={`p-4 rounded-2xl shadow-xl transition-all ${
          isUser 
            ? 'bg-blue-600/20 border border-blue-500/30 rounded-tr-none' 
            : isModel 
              ? 'bg-white/5 border border-white/10 rounded-tl-none'
              : 'bg-white/5 border border-white/5 text-white/40 italic'
        }`}>
          {message.isLoading ? (
            <div className="flex items-center gap-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"></div>
            </div>
          ) : (
            renderMessageContent()
          )}
          
          {isModel && message.urlContext && message.urlContext.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <PlayCircle size={10} /> Sources Consultées
              </p>
              <div className="flex flex-wrap gap-1.5">
                {message.urlContext.map((meta, index) => {
                  const isVideo = /(youtube|youtu\.be|vimeo|\.mp4|\.webm)/.test(meta.retrievedUrl);
                  return (
                    <a key={index} href={meta.retrievedUrl} target="_blank" rel="noopener noreferrer" 
                       className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] border transition-colors ${
                         isVideo ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20' : 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                       }`}>
                      {isVideo ? <Video size={10} /> : <ExternalLink size={10} />}
                      Source {index + 1}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {isUser && <SenderAvatar sender={message.sender} />}
      </div>
    </div>
  );
};

export default MessageItem;
