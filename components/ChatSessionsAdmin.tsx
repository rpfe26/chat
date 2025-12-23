
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { ChatSession } from '../types';
import { Plus, MessageSquare, CheckCircle, Trash2, Sparkles, FolderOpen, Share2, X, Copy, AlertTriangle, Database, Cloud } from 'lucide-react'; 
import { apiService } from '../services/apiService';

interface ChatSessionsAdminProps {
  allChatSessions: ChatSession[];
  activeChatSessionId: string | null;
  onDeleteChat: (id: string) => void;
  onCreateNewChat: (name: string) => void;
  onAdminSelectChat: (id: string) => void;
}

const ChatSessionsAdmin: React.FC<ChatSessionsAdminProps> = ({
  allChatSessions,
  activeChatSessionId,
  onCreateNewChat,
  onDeleteChat,
  onAdminSelectChat,
}) => {
  const [newChatName, setNewChatName] = useState('');
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [currentEmbedSessionId, setCurrentEmbedSessionId] = useState<string | null>(null);

  const handleCreateChat = () => {
    if (!newChatName.trim()) return;
    onCreateNewChat(newChatName.trim());
    setNewChatName('');
  };

  const handleShowEmbedCode = (sessionId: string) => {
    setCurrentEmbedSessionId(sessionId);
    setShowEmbedModal(true);
  };

  const currentEmbedUrl = currentEmbedSessionId 
    ? `${window.location.href.split('#')[0]}#/embed/${currentEmbedSessionId}`
    : '';

  const iframeCode = `<iframe src="${currentEmbedUrl}" width="600" height="400" frameborder="0" allowfullscreen></iframe>`;
  const isLocalMode = apiService.isLocalMode();

  return (
    <section className="space-y-6 bg-white p-6 rounded-3xl border border-gray-200 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
          <MessageSquare size={20} />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Gérer les Sessions de Chat</h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <input 
          type="text"
          placeholder="Nom de la nouvelle session..."
          value={newChatName}
          onChange={(e) => setNewChatName(e.target.value)}
          className="flex-grow bg-gray-100 border border-gray-300 rounded-2xl p-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-gray-900 placeholder-gray-500"
        />
        <button 
          onClick={handleCreateChat}
          disabled={!newChatName.trim()}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-600/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} /> Créer une Nouvelle Session
        </button>
      </div>

      <div className="pt-4 space-y-2 max-h-[300px] overflow-y-auto chat-container pr-2 border-t border-gray-100 mt-4">
        {allChatSessions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-8">
            <Sparkles size={32} className="text-blue-400 mb-3" />
            <p className="text-sm font-medium">Aucune session de chat existante.</p>
            <p className="text-xs mt-1">Créez-en une pour commencer ! {isLocalMode && "(Mode Test Local)"}</p>
          </div>
        ) : (
          allChatSessions.map((session) => (
            <div key={session.id} className={`group flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl border transition-all ${
              session.id === activeChatSessionId 
                ? 'bg-blue-50 border-blue-300 shadow-md' 
                : 'bg-gray-100 border-gray-200 hover:border-gray-300'
            }`}>
              <div className="flex items-center gap-3 mb-2 sm:mb-0 w-full sm:w-auto">
                {session.id === activeChatSessionId ? (
                  <CheckCircle size={18} className="text-blue-600" />
                ) : (
                  <MessageSquare size={18} className="text-gray-500" />
                )}
                <span className={`text-sm font-bold truncate ${session.id === activeChatSessionId ? 'text-blue-800' : 'text-gray-800'}`}>{session.name}</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                {session.id !== activeChatSessionId && (
                  <button 
                    onClick={() => onAdminSelectChat(session.id)} 
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
                  >
                    <FolderOpen size={16} /> Sélectionner
                  </button>
                )}
                 <button 
                  onClick={() => handleShowEmbedCode(session.id)} 
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
                >
                  <Share2 size={16} /> Intégrer
                </button>
                <button 
                  onClick={() => onDeleteChat(session.id)} 
                  className="px-4 py-2 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-all active:scale-95"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showEmbedModal && currentEmbedSessionId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-lg w-full relative">
            <button
              onClick={() => setShowEmbedModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
            <h4 className="text-xl font-bold text-gray-900 mb-4">Code d'Intégration du Chat</h4>
            <p className="text-gray-700 mb-4 text-sm">Utilisez ce code pour intégrer cette session sur votre site web.</p>
            
            <label className="block text-sm font-bold text-gray-700 mb-2">Lien direct:</label>
            <div className="relative mb-4">
              <input
                type="text"
                readOnly
                value={currentEmbedUrl}
                className="w-full bg-gray-100 border border-gray-300 rounded-xl p-3 pr-10 text-sm text-gray-800 font-mono"
              />
              <button
                onClick={() => navigator.clipboard.writeText(currentEmbedUrl)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Copy size={16} />
              </button>
            </div>
            
            <label className="block text-sm font-bold text-gray-700 mb-2">Code Iframe:</label>
            <div className="relative mb-4">
              <textarea
                readOnly
                value={iframeCode}
                rows={4}
                className="w-full bg-gray-100 border border-gray-300 rounded-xl p-3 pr-10 text-sm font-mono text-gray-800 resize-none"
              />
              <button
                onClick={() => navigator.clipboard.writeText(iframeCode)}
                className="absolute right-2 top-2 p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Copy size={16} />
              </button>
            </div>

            <div className={`p-4 rounded-2xl flex gap-3 items-start text-xs leading-relaxed border ${
              isLocalMode 
                ? 'bg-amber-50 border-amber-200 text-amber-800' 
                : 'bg-green-50 border-green-200 text-green-800'
            }`}>
              {isLocalMode ? <AlertTriangle size={18} className="shrink-0" /> : <Cloud size={18} className="shrink-0" />}
              <div>
                <span className="font-bold uppercase block mb-1">
                  {isLocalMode ? "Attention : Mode Local Actif" : "Information : Mode Serveur Actif"}
                </span>
                {isLocalMode ? (
                  "L'application tourne en mode test (localStorage). L'iframe ne fonctionnera pas s'il est intégré sur un autre domaine car les données ne sont pas partagées. Lancez le serveur Node.js pour un fonctionnement universel."
                ) : (
                  "L'application est connectée au serveur. Les données intégrées via l'iframe seront accessibles de n'importe où tant que votre serveur est en ligne."
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ChatSessionsAdmin;
