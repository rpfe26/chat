
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { AppView, ChatSession } from '../types';
import { MessageSquare, Settings, GraduationCap, CheckCircle, LogOut, ShieldAlert } from 'lucide-react';

interface SidebarProps {
  onGoToAdmin: () => void;
  onGoToChat: () => void;
  onLogout: () => void;
  isAdmin: boolean;
  currentView: AppView;
  allChatSessions: ChatSession[];
  activeChatSessionId: string | null;
  onSelectChat: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  onGoToAdmin,
  onGoToChat,
  onLogout,
  isAdmin,
  currentView,
  allChatSessions,
  activeChatSessionId,
  onSelectChat,
}) => {

  return (
    <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0 shadow-lg z-40">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg flex items-center justify-center shadow-md shadow-indigo-600/20">
            <GraduationCap className="text-white" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tighter text-gray-900 uppercase leading-tight">PEDAGOCHAT</h2>
            <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest leading-none">Assistant Pro</span>
          </div>
        </div>
      </div>

      {/* Chat Sessions List */}
      <div className="flex-grow overflow-y-auto p-4 space-y-2 chat-container">
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-2 flex items-center gap-2">
          <MessageSquare size={10} /> Sessions actives
        </div>
        {allChatSessions.length === 0 ? (
          <div className="text-center text-gray-500 text-[10px] py-6 px-2 italic bg-gray-100/50 rounded-xl border border-dashed border-gray-200">
            Aucune session disponible.
          </div>
        ) : (
          allChatSessions.map(session => (
            <button
              key={session.id}
              onClick={() => onSelectChat(session.id)}
              className={`w-full text-left flex items-center gap-3 p-3 rounded-xl text-xs font-bold transition-all ${
                session.id === activeChatSessionId
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {session.id === activeChatSessionId ? <CheckCircle size={14} /> : <MessageSquare size={14} className="opacity-40" />}
              <span className="truncate">{session.name}</span>
            </button>
          ))
        )}
      </div>

      {/* Navigation Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2 bg-white/50">
        {isAdmin ? (
          <>
            <button 
              onClick={currentView === 'admin' ? onGoToChat : onGoToAdmin}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-tighter transition-all shadow-md ${
                currentView === 'admin' 
                  ? 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
              }`}
            >
              {currentView === 'admin' ? <MessageSquare size={14} /> : <Settings size={14} />}
              {currentView === 'admin' ? 'Retour Chat' : 'Administration'}
            </button>
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut size={12} /> Déconnexion Admin
            </button>
          </>
        ) : (
          <button 
            onClick={onGoToAdmin}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-xl text-xs font-black uppercase tracking-tighter transition-all"
          >
            <ShieldAlert size={14} /> Accès Enseignant
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
