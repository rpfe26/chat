
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { AppView, ChatSession } from '../types'; // Import de ChatSession
import { MessageSquare, Settings, GraduationCap, CheckCircle } from 'lucide-react'; // Import de CheckCircle

interface SidebarProps {
  onGoToAdmin: () => void;
  onGoToChat: () => void;
  currentView: AppView;
  allChatSessions: ChatSession[]; // Nouvelle prop
  activeChatSessionId: string | null; // Nouvelle prop
  onSelectChat: (id: string) => void; // Nouvelle prop
}

const Sidebar: React.FC<SidebarProps> = ({
  onGoToAdmin,
  onGoToChat,
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
            <h2 className="text-sm font-black tracking-tighter text-gray-900">PEDAGOCHAT</h2>
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Assistant Intelligent</span>
          </div>
        </div>
      </div>

      {/* Chat Sessions List */}
      <div className="flex-grow overflow-y-auto p-4 space-y-2 chat-container">
        {allChatSessions.length === 0 ? (
          <div className="text-center text-gray-500 text-xs py-4 px-2">
            Aucune session. Allez à l'administration pour en créer une.
          </div>
        ) : (
          allChatSessions.map(session => (
            <button
              key={session.id}
              onClick={() => onSelectChat(session.id)}
              className={`w-full text-left flex items-center gap-2 p-3 rounded-lg text-sm font-bold transition-all ${
                session.id === activeChatSessionId
                  ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {session.id === activeChatSessionId ? <CheckCircle size={16} /> : <MessageSquare size={16} />}
              <span className="truncate">{session.name}</span>
            </button>
          ))
        )}
      </div>

      {/* Navigation Button to Admin/Chat */}
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={currentView === 'admin' ? onGoToChat : onGoToAdmin}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all shadow-md ${
            currentView === 'admin' 
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          {currentView === 'admin' ? <MessageSquare size={16} /> : <Settings size={16} />}
          {currentView === 'admin' ? 'Retourner au Chat' : 'Administration'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;