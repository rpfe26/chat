
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { ChatSession } from '../types';
import { Plus, MessageSquare, CheckCircle, Trash2, Sparkles, FolderOpen, Share2, X, Copy, AlertTriangle, Database, Cloud, QrCode } from 'lucide-react'; 
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

  // On construit l'URL de base propre pour la vue élève (/embed/)
  const currentEmbedUrl = currentEmbedSessionId 
    ? `${window.location.origin}${window.location.pathname}#/embed/${currentEmbedSessionId}`
    : '';

  const iframeCode = `<iframe src="${currentEmbedUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;
  
  // URL pour le QR Code (on utilise un service tiers gratuit et fiable)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentEmbedUrl)}`;

  const isLocalMode = apiService.isLocalMode();

  return (
    <section className="space-y-6 bg-white p-6 rounded-3xl border border-gray-200 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
          <MessageSquare size={20} />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Catalogue des Sessions</h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <input 
          type="text"
          placeholder="Titre de la leçon ou du chat..."
          value={newChatName}
          onChange={(e) => setNewChatName(e.target.value)}
          className="flex-grow bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm outline-none focus:border-indigo-500 transition-all shadow-inner"
        />
        <button 
          onClick={handleCreateChat}
          disabled={!newChatName.trim()}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] py-4 px-8 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
        >
          <Plus size={16} /> Créer la Session
        </button>
      </div>

      <div className="pt-4 space-y-2 max-h-[400px] overflow-y-auto chat-container pr-2 border-t border-gray-100 mt-4">
        {allChatSessions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-12">
            <Sparkles size={32} className="text-indigo-200 mb-3" />
            <p className="text-xs font-black uppercase tracking-widest">Aucune session active</p>
          </div>
        ) : (
          allChatSessions.map((session) => (
            <div key={session.id} className={`group flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl border transition-all ${
              session.id === activeChatSessionId 
                ? 'bg-indigo-50 border-indigo-200 shadow-md' 
                : 'bg-white border-gray-100 hover:border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-3 sm:mb-0 w-full sm:w-auto">
                <div className={`p-2 rounded-lg ${session.id === activeChatSessionId ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  <MessageSquare size={16} />
                </div>
                <span className={`text-sm font-black tracking-tight truncate ${session.id === activeChatSessionId ? 'text-indigo-900' : 'text-gray-700'}`}>
                  {session.name}
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                {session.id !== activeChatSessionId && (
                  <button 
                    onClick={() => onAdminSelectChat(session.id)} 
                    className="p-3 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all active:scale-95"
                    title="Ouvrir pour configurer"
                  >
                    <FolderOpen size={16} />
                  </button>
                )}
                 <button 
                  onClick={() => handleShowEmbedCode(session.id)} 
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-indigo-200 transition-all"
                >
                  <Share2 size={14} /> Partager aux élèves
                </button>
                <button 
                  onClick={() => onDeleteChat(session.id)} 
                  className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showEmbedModal && currentEmbedSessionId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl max-w-2xl w-full relative overflow-hidden">
            <button
              onClick={() => setShowEmbedModal(false)}
              className="absolute top-8 right-8 text-gray-400 hover:text-gray-700 p-3 rounded-2xl hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex flex-col md:flex-row gap-8">
              {/* Colonne QR Code */}
              <div className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shrink-0">
                 <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-4">
                   <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
                 </div>
                 <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Scanner pour rejoindre</h5>
              </div>

              {/* Colonne Liens */}
              <div className="flex-grow space-y-6">
                <div>
                  <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Partager la leçon</h4>
                  <p className="text-xs text-gray-500 font-bold mb-6">Les élèves accèderont uniquement à ce chat spécifique.</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-indigo-500 mb-2">Lien direct élève</label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={currentEmbedUrl}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 pr-12 text-xs font-mono text-indigo-700 outline-none"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(currentEmbedUrl)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:bg-indigo-100 rounded-xl transition-colors"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-indigo-500 mb-2">Code d'intégration (WordPress / LMS)</label>
                    <div className="relative">
                      <textarea
                        readOnly
                        value={iframeCode}
                        rows={3}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 pr-12 text-[10px] font-mono text-gray-600 resize-none outline-none"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(iframeCode)}
                        className="absolute right-3 top-4 p-2 text-indigo-400 hover:bg-indigo-100 rounded-xl transition-colors"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl flex gap-3 items-start border ${
                  isLocalMode 
                    ? 'bg-amber-50 border-amber-100 text-amber-700' 
                    : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                }`}>
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <p className="text-[9px] font-bold leading-relaxed uppercase tracking-tight">
                    {isLocalMode 
                      ? "Attention : Les données en mode local ne sont pas persistantes. Activez le serveur Node.js pour un partage réel."
                      : "Le lien est prêt ! Il inclut l'ID de session pour verrouiller l'interface élève."
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ChatSessionsAdmin;
