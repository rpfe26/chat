
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Globe, FileText, Type, Trash2, Plus, 
  Search, FileUp, Save, 
  ArrowLeft, Info, GraduationCap, MessageSquare, Settings, Users, User, Clock
} from 'lucide-react';
import { KnowledgeBase, UrlItem, KnowledgeFile, KnowledgeText, ChatSession, MessageSender } from '../types';
import ChatSessionsAdmin from './ChatSessionsAdmin';

interface AdminViewProps {
  knowledgeBase: KnowledgeBase;
  onAddUrl: (item: UrlItem) => void;
  onRemoveUrl: (url: string) => void;
  onAddFile: (file: KnowledgeFile) => void;
  onRemoveFile: (id: string) => void;
  onAddText: (text: KnowledgeText) => void;
  onRemoveText: (id: string) => void;
  onGoToChat: () => void;
  allChatSessions: ChatSession[];
  activeChatSessionId: string | null;
  onDeleteChat: (id: string) => void;
  onCreateNewChat: (name: string) => void;
  onAdminSelectChat: (id: string) => void;
}

const AdminView: React.FC<AdminViewProps> = ({
  knowledgeBase, onAddUrl, onRemoveUrl, onAddFile, onRemoveFile, onAddText, onRemoveText, onGoToChat,
  allChatSessions, activeChatSessionId, onDeleteChat, onCreateNewChat, onAdminSelectChat
}) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'knowledge' | 'monitoring'>('sessions');
  const [selectedVisitorFilter, setSelectedVisitorFilter] = useState<string | 'all'>('all');

  const currentSession = allChatSessions.find(s => s.id === activeChatSessionId);

  // Liste unique des visiteurs ayant posté dans cette session
  const visitors = useMemo(() => {
    if (!currentSession) return [];
    const ids = new Set<string>();
    currentSession.chatMessages.forEach(m => {
      if (m.visitorId) ids.add(m.visitorId);
    });
    return Array.from(ids);
  }, [currentSession]);

  const monitoredMessages = useMemo(() => {
    if (!currentSession) return [];
    if (selectedVisitorFilter === 'all') return currentSession.chatMessages;
    return currentSession.chatMessages.filter(m => m.visitorId === selectedVisitorFilter || m.sender === MessageSender.SYSTEM);
  }, [currentSession, selectedVisitorFilter]);

  const [urlInput, setUrlInput] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onAddUrl({ url: urlInput.trim() });
    setUrlInput('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      onAddFile({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        base64Data: base64
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTextSubmit = () => {
    if (!noteTitle.trim() || !noteContent.trim()) return;
    onAddText({
      id: Math.random().toString(36).substr(2, 9),
      title: noteTitle.trim(),
      content: noteContent.trim(),
      createdAt: new Date()
    });
    setNoteTitle('');
    setNoteContent('');
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 md:p-10 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Settings size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Configuration & Suivi</h2>
              <p className="text-gray-500 text-sm">Gérez les connaissances et suivez les interactions des élèves.</p>
            </div>
          </div>
          <button onClick={onGoToChat} className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 transition-all shadow-sm">
            <ArrowLeft size={16} /> Retour au Chat
          </button>
        </div>

        <nav className="flex bg-gray-200/50 p-1 rounded-2xl border border-gray-200">
          <button onClick={() => setActiveTab('sessions')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'sessions' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <MessageSquare size={14} /> Sessions
          </button>
          <button onClick={() => setActiveTab('knowledge')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'knowledge' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <FileText size={14} /> Connaissances
          </button>
          <button onClick={() => setActiveTab('monitoring')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'monitoring' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Users size={14} /> Suivi Élèves
          </button>
        </nav>

        {activeTab === 'sessions' && (
          <ChatSessionsAdmin allChatSessions={allChatSessions} activeChatSessionId={activeChatSessionId} onCreateNewChat={onCreateNewChat} onDeleteChat={onDeleteChat} onAdminSelectChat={onAdminSelectChat} />
        )}

        {activeTab === 'knowledge' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             {/* Web URLs */}
             <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
               <h3 className="font-bold flex items-center gap-2 text-blue-700"><Globe size={18}/> Liens Web</h3>
               <form onSubmit={handleUrlSubmit} className="flex gap-2">
                 <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://..." className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500" />
                 <button className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"><Plus size={20}/></button>
               </form>
               <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                 {knowledgeBase.urls.map((u, i) => (
                   <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 group">
                     <span className="text-[10px] font-medium truncate flex-grow pr-2">{u.url}</span>
                     <button onClick={() => onRemoveUrl(u.url)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                   </div>
                 ))}
               </div>
             </div>

             {/* Documents */}
             <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
               <h3 className="font-bold flex items-center gap-2 text-indigo-700"><FileText size={18}/> Documents PDF</h3>
               <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-2xl py-8 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors">
                 <FileUp size={24} className="text-indigo-400 mb-2" />
                 <span className="text-[10px] font-bold text-gray-400 uppercase">Cliquez pour ajouter</span>
                 <input ref={fileInputRef} type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
               </div>
               <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                 {knowledgeBase.files.map((f) => (
                   <div key={f.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                     <span className="text-[10px] font-medium truncate flex-grow pr-2">{f.name}</span>
                     <button onClick={() => onRemoveFile(f.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                   </div>
                 ))}
               </div>
             </div>

             {/* Notes */}
             <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
               <h3 className="font-bold flex items-center gap-2 text-amber-700"><Type size={18}/> Notes Internes</h3>
               <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="Titre..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none" />
               <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="Contenu..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none h-20 resize-none" />
               <button onClick={handleTextSubmit} className="w-full py-2 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700 transition-colors">Enregistrer</button>
             </div>
           </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[600px]">
            {/* Liste des Visiteurs */}
            <div className="w-full md:w-64 border-r border-gray-200 flex flex-col bg-gray-50/50">
              <div className="p-4 border-b border-gray-200 bg-white">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <Users size={14} /> Élèves Connectés ({visitors.length})
                </h4>
              </div>
              <div className="flex-grow overflow-y-auto p-2 space-y-1">
                <button 
                  onClick={() => setSelectedVisitorFilter('all')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedVisitorFilter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                  Tous les messages
                </button>
                {visitors.map(id => (
                  <button 
                    key={id}
                    onClick={() => setSelectedVisitorFilter(id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${selectedVisitorFilter === id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
                  >
                    <User size={12} />
                    <span className="truncate">{id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Visualisation des messages */}
            <div className="flex-grow flex flex-col bg-white">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">
                  {selectedVisitorFilter === 'all' ? "Vue globale" : `Conversation de l'élève : ${selectedVisitorFilter}`}
                </span>
              </div>
              <div className="flex-grow overflow-y-auto p-6 space-y-4 chat-container">
                {monitoredMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center opacity-30 italic text-sm">Aucun message pour ce filtre</div>
                ) : (
                  monitoredMessages.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.sender === MessageSender.USER ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-xs ${
                        m.sender === MessageSender.USER ? 'bg-blue-600 text-white' : 
                        m.sender === MessageSender.MODEL ? 'bg-gray-100 border border-gray-200' : 
                        'bg-amber-50 text-amber-700 italic border border-amber-100'
                      }`}>
                        <div className="font-black text-[9px] uppercase tracking-tighter opacity-70 mb-1 flex justify-between gap-4">
                          <span>{m.sender} {m.visitorId && `(${m.visitorId})`}</span>
                          <span className="flex items-center gap-1"><Clock size={8}/> {new Date(m.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="whitespace-pre-wrap">{m.text}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
