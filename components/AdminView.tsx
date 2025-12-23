
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useMemo } from 'react';
import { 
  Globe, FileText, Type, Trash2, Plus, 
  Search, FileUp, ArrowLeft, Settings, Users, User, Clock, MessageSquare, AlertCircle,
  Edit3, Maximize2, Minimize2, Save, X
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

  // States pour l'édition
  const [urlInput, setUrlInput] = useState('');
  const [editingUrlOldValue, setEditingUrlOldValue] = useState<string | null>(null);
  
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isFullscreenNote, setIsFullscreenNote] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitoring logic
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

  // Handlers pour la navigation automatique
  const handleSelectChatAndSwitch = (id: string) => {
    onAdminSelectChat(id);
    setActiveTab('knowledge');
  };

  const handleCreateChatAndSwitch = (name: string) => {
    onCreateNewChat(name);
    setActiveTab('knowledge');
  };

  // Handlers pour URLs
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    
    if (editingUrlOldValue) {
      onRemoveUrl(editingUrlOldValue);
    }
    onAddUrl({ url: urlInput.trim() });
    setUrlInput('');
    setEditingUrlOldValue(null);
  };

  const handleEditUrl = (url: string) => {
    setUrlInput(url);
    setEditingUrlOldValue(url);
  };

  // Handlers pour Fichiers
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

  // Handlers pour Notes
  const handleTextSubmit = () => {
    if (!noteTitle.trim() || !noteContent.trim()) return;
    
    if (editingNoteId) {
      onRemoveText(editingNoteId);
    }

    onAddText({
      id: editingNoteId || Math.random().toString(36).substr(2, 9),
      title: noteTitle.trim(),
      content: noteContent.trim(),
      createdAt: new Date()
    });
    
    setNoteTitle('');
    setNoteContent('');
    setEditingNoteId(null);
    setIsFullscreenNote(false);
  };

  const handleEditNote = (note: KnowledgeText) => {
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setEditingNoteId(note.id);
  };

  const cancelEditNote = () => {
    setNoteTitle('');
    setNoteContent('');
    setEditingNoteId(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 md:p-10 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Settings size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Configuration & Suivi</h2>
              <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                <p>Gérez les connaissances et suivez les interactions.</p>
                {currentSession && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
                      <MessageSquare size={12} /> {currentSession.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button onClick={onGoToChat} className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 transition-all shadow-sm active:scale-95">
            <ArrowLeft size={16} /> Retour au Chat
          </button>
        </div>

        {/* Tab Navigation */}
        <nav className="flex bg-gray-200/50 p-1.5 rounded-2xl border border-gray-200">
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

        {/* Tab Content */}
        {activeTab === 'sessions' && (
          <ChatSessionsAdmin 
            allChatSessions={allChatSessions} 
            activeChatSessionId={activeChatSessionId} 
            onCreateNewChat={handleCreateChatAndSwitch} 
            onDeleteChat={onDeleteChat} 
            onAdminSelectChat={handleSelectChatAndSwitch} 
          />
        )}

        {activeTab === 'knowledge' && (
          !currentSession ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-200 shadow-sm text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
                <AlertCircle size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Aucune session sélectionnée</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">Veuillez d'abord sélectionner une session dans l'onglet "Sessions" pour pouvoir lui ajouter des ressources.</p>
              </div>
              <button onClick={() => setActiveTab('sessions')} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs transition-all active:scale-95 shadow-lg shadow-indigo-600/20">Aller aux Sessions</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* Web URLs */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4 flex flex-col h-[550px]">
                <h3 className="font-bold flex items-center gap-2 text-blue-700 shrink-0"><Globe size={18}/> Liens Web / IP</h3>
                <form onSubmit={handleUrlSubmit} className="flex gap-2 shrink-0">
                  <input 
                    type="text" 
                    value={urlInput} 
                    onChange={e => setUrlInput(e.target.value)} 
                    placeholder="https://... ou adresse IP" 
                    className={`flex-grow bg-gray-50 border rounded-xl px-4 py-2 text-sm outline-none transition-all ${editingUrlOldValue ? 'border-amber-400 focus:border-amber-500' : 'border-gray-200 focus:border-blue-500'}`} 
                  />
                  <button type="submit" className={`p-2 text-white rounded-xl transition-colors shadow-md ${editingUrlOldValue ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}>
                    {editingUrlOldValue ? <Save size={20}/> : <Plus size={20}/>}
                  </button>
                  {editingUrlOldValue && (
                    <button type="button" onClick={() => {setUrlInput(''); setEditingUrlOldValue(null);}} className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-all">
                      <X size={20}/>
                    </button>
                  )}
                </form>
                <div className="space-y-2 overflow-y-auto pr-2 chat-container flex-grow">
                  {knowledgeBase.urls.length === 0 ? (
                    <p className="text-[10px] text-center text-gray-400 italic py-4">Aucun lien web.</p>
                  ) : (
                    knowledgeBase.urls.map((u, i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 group transition-all hover:border-blue-200">
                        <span className="text-[10px] font-medium truncate flex-grow pr-2 text-gray-600">{u.url}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditUrl(u.url)} className="text-gray-400 hover:text-amber-500 transition-colors p-1"><Edit3 size={14}/></button>
                          <button onClick={() => onRemoveUrl(u.url)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4 flex flex-col h-[550px]">
                <h3 className="font-bold flex items-center gap-2 text-indigo-700 shrink-0"><FileText size={18}/> Documents PDF</h3>
                <div onClick={() => fileInputRef.current?.click()} className="shrink-0 border-2 border-dashed border-gray-200 rounded-2xl py-6 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all hover:border-indigo-300">
                  <FileUp size={24} className="text-indigo-400 mb-2" />
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Ajouter un PDF</span>
                  <input ref={fileInputRef} type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                </div>
                <div className="space-y-2 overflow-y-auto pr-2 chat-container flex-grow">
                  {knowledgeBase.files.length === 0 ? (
                    <p className="text-[10px] text-center text-gray-400 italic py-4">Aucun document.</p>
                  ) : (
                    knowledgeBase.files.map((f) => (
                      <div key={f.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 transition-all hover:border-indigo-200 group">
                        <span className="text-[10px] font-medium truncate flex-grow pr-2 text-gray-600">{f.name}</span>
                        <button onClick={() => onRemoveFile(f.id)} className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4 flex flex-col h-[550px]">
                <div className="flex items-center justify-between shrink-0">
                  <h3 className="font-bold flex items-center gap-2 text-amber-700"><Type size={18}/> Notes Internes</h3>
                  {editingNoteId && (
                    <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Mode Édition</span>
                  )}
                </div>
                
                <div className="space-y-3 shrink-0">
                  <input 
                    value={noteTitle} 
                    onChange={e => setNoteTitle(e.target.value)} 
                    placeholder="Titre de la note..." 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-amber-500 transition-all" 
                  />
                  <div className="relative">
                    <textarea 
                      value={noteContent} 
                      onChange={e => setNoteContent(e.target.value)} 
                      placeholder="Contenu pédagogique..." 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none h-24 resize-none focus:border-amber-500 transition-all" 
                    />
                    <button 
                      onClick={() => setIsFullscreenNote(true)}
                      className="absolute bottom-2 right-2 p-1.5 bg-white border border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-200 rounded-lg transition-all shadow-sm"
                      title="Éditer en plein écran"
                    >
                      <Maximize2 size={14} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleTextSubmit} 
                      className={`flex-grow py-2 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 ${editingNoteId ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'}`}
                    >
                      {editingNoteId ? 'Mettre à jour la note' : 'Enregistrer la note'}
                    </button>
                    {editingNoteId && (
                      <button onClick={cancelEditNote} className="px-3 py-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-all">
                        <X size={16}/>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 overflow-y-auto pr-2 chat-container flex-grow border-t border-gray-100 pt-4">
                  {knowledgeBase.rawTexts.length === 0 ? (
                    <p className="text-[10px] text-center text-gray-400 italic py-4">Aucune note interne.</p>
                  ) : (
                    knowledgeBase.rawTexts.map((t) => (
                      <div 
                        key={t.id} 
                        className={`p-3 rounded-xl border transition-all space-y-1 relative group cursor-pointer ${editingNoteId === t.id ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100' : 'bg-gray-50 border-gray-100 hover:border-amber-200'}`}
                        onClick={() => handleEditNote(t)}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-black text-amber-700 uppercase truncate pr-10">{t.title}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 absolute top-2 right-2 transition-opacity">
                            <button className="text-gray-400 hover:text-amber-600 p-1"><Edit3 size={12}/></button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onRemoveText(t.id); if(editingNoteId === t.id) cancelEditNote(); }} 
                              className="text-gray-300 hover:text-red-500 p-1"
                            >
                              <Trash2 size={12}/>
                            </button>
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-500 line-clamp-2 leading-relaxed">{t.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {activeTab === 'monitoring' && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[600px] animate-in slide-in-from-bottom-4 duration-500">
            {/* Liste des Visiteurs */}
            <div className="w-full md:w-64 border-r border-gray-200 flex flex-col bg-gray-50/50">
              <div className="p-4 border-b border-gray-200 bg-white">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <Users size={14} /> Élèves Connectés ({visitors.length})
                </h4>
              </div>
              <div className="flex-grow overflow-y-auto p-2 space-y-1 chat-container">
                <button 
                  onClick={() => setSelectedVisitorFilter('all')}
                  className={`w-full text-left px-3 py-3 rounded-xl text-xs font-bold transition-all ${selectedVisitorFilter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                  Tous les messages
                </button>
                {visitors.length === 0 ? (
                  <p className="text-[10px] text-center text-gray-400 py-6 italic">Aucun élève identifié.</p>
                ) : (
                  visitors.map(id => (
                    <button 
                      key={id}
                      onClick={() => setSelectedVisitorFilter(id)}
                      className={`w-full text-left px-3 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${selectedVisitorFilter === id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                      <User size={12} />
                      <span className="truncate">{id}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Visualisation des messages */}
            <div className="flex-grow flex flex-col bg-white">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/30">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {selectedVisitorFilter === 'all' ? "Journal des interactions globales" : `Conversation de l'élève : ${selectedVisitorFilter}`}
                </span>
              </div>
              <div className="flex-grow overflow-y-auto p-6 space-y-4 chat-container">
                {monitoredMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center opacity-30 italic text-sm">Aucun message pour ce filtre</div>
                ) : (
                  monitoredMessages.map(m => (
                    <div key={m.id} className={`flex flex-col ${m.sender === MessageSender.USER ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-xs shadow-sm ${
                        m.sender === MessageSender.USER ? 'bg-blue-600 text-white' : 
                        m.sender === MessageSender.MODEL ? 'bg-gray-100 border border-gray-200 text-gray-800' : 
                        'bg-amber-50 text-amber-700 italic border border-amber-100'
                      }`}>
                        <div className="font-black text-[9px] uppercase tracking-tighter opacity-70 mb-1 flex justify-between gap-4 border-b border-current/10 pb-1">
                          <span>{m.sender === MessageSender.USER ? `ÉLÈVE (${m.visitorId})` : m.sender.toUpperCase()}</span>
                          <span className="flex items-center gap-1 font-medium"><Clock size={8}/> {new Date(m.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="whitespace-pre-wrap pt-1">{m.text}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL ÉDITION PLEIN ÉCRAN */}
      {isFullscreenNote && (
        <div className="fixed inset-0 z-[110] bg-white flex flex-col animate-in slide-in-from-bottom-8 duration-300">
          <header className="h-20 border-b border-gray-100 flex items-center justify-between px-8 bg-gray-50/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                <Type size={24} />
              </div>
              <div>
                <input 
                  value={noteTitle} 
                  onChange={e => setNoteTitle(e.target.value)} 
                  placeholder="Titre de la note pédagogique..." 
                  className="bg-transparent text-xl font-black text-gray-900 outline-none w-96 placeholder-gray-300" 
                />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Éditeur immersif PedagoChat</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsFullscreenNote(false)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all"
              >
                <Minimize2 size={16} /> Réduire
              </button>
              <button 
                onClick={handleTextSubmit}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-600/20 transition-all"
              >
                <Save size={16} /> {editingNoteId ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </header>
          <main className="flex-grow p-12 bg-white flex justify-center overflow-hidden">
            <textarea 
              value={noteContent} 
              onChange={e => setNoteContent(e.target.value)} 
              placeholder="Commencez à rédiger votre contenu pédagogique ici... Votre assistant utilisera ce texte pour répondre aux questions des élèves." 
              className="w-full max-w-4xl h-full text-lg leading-relaxed text-gray-800 outline-none resize-none font-medium placeholder-gray-200" 
              autoFocus
            />
          </main>
          <footer className="h-12 border-t border-gray-50 px-8 flex items-center justify-between text-[10px] font-medium text-gray-400">
            <span>Nombre de caractères : {noteContent.length}</span>
            <span className="italic">Les modifications sont enregistrées une fois que vous cliquez sur "Enregistrer" ou "Mettre à jour".</span>
          </footer>
        </div>
      )}
    </div>
  );
};

export default AdminView;
