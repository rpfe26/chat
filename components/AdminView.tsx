
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Globe, FileText, Type, Trash2, Plus, 
  FileUp, ArrowLeft, Settings, Users, User, Clock, MessageSquare, AlertCircle,
  Maximize2, Minimize2, Save, Image as ImageIcon, Music, Film, Download, Database,
  MousePointer2, Layers, Video, Youtube, Cpu, Key, ExternalLink, ShieldCheck, Sparkles,
  Link, Zap, Info, StickyNote, Eraser, Edit3
} from 'lucide-react';
import { KnowledgeBase, UrlItem, VideoLinkItem, KnowledgeFile, KnowledgeText, ChatSession, MessageSender, AIProvider } from '../types';
import ChatSessionsAdmin from './ChatSessionsAdmin';

interface AdminViewProps {
  knowledgeBase: KnowledgeBase;
  onAddUrl: (item: UrlItem) => void;
  onRemoveUrl: (url: string) => void;
  onAddVideoLink: (item: VideoLinkItem) => void;
  onRemoveVideoLink: (url: string) => void;
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
  onUpdateSession: (updates: Partial<ChatSession>) => void;
}

const AdminView: React.FC<AdminViewProps> = ({
  knowledgeBase, onAddUrl, onRemoveUrl, onAddVideoLink, onRemoveVideoLink, onAddFile, onRemoveFile, onAddText, onRemoveText, onGoToChat,
  allChatSessions, activeChatSessionId, onDeleteChat, onCreateNewChat, onAdminSelectChat, onUpdateSession
}) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'knowledge' | 'monitoring' | 'config'>('knowledge');
  const [selectedVisitorFilter, setSelectedVisitorFilter] = useState<string | 'all'>('all');
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  const currentSession = allChatSessions.find(s => s.id === activeChatSessionId);

  const [urlInput, setUrlInput] = useState('');
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [crawlMode, setCrawlMode] = useState<'page' | 'site'>('page');
  
  // États de l'éditeur de notes
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio) {
        const result = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(result);
      }
    };
    checkKey();
  }, [activeTab]);

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

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onAddUrl({ url: urlInput.trim(), crawlMode });
    setUrlInput('');
  };

  const handleTextSubmit = () => {
    if (!noteTitle.trim() || !noteContent.trim()) return;
    
    if (editingNoteId) {
      // Mode modification : on supprime l'ancienne et on ajoute la nouvelle (simplification)
      // Ou mieux: on gère la mise à jour via onUpdateSession si on veut être propre, 
      // mais ici on utilise onRemoveText + onAddText pour rester compatible avec les props actuelles.
      onRemoveText(editingNoteId);
    }

    onAddText({
      id: editingNoteId || Math.random().toString(36).substr(2, 9),
      title: noteTitle.trim(),
      content: noteContent.trim(),
      createdAt: new Date()
    });
    
    clearNoteEditor();
  };

  const clearNoteEditor = () => {
    setNoteTitle('');
    setNoteContent('');
    setEditingNoteId(null);
  };

  const openNoteForEditing = (text: KnowledgeText) => {
    setNoteTitle(text.title);
    setNoteContent(text.content);
    setEditingNoteId(text.id);
  };

  const handleOpenKeyPicker = async () => {
    try {
      if ((window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
        setHasKey(true);
      } else {
        alert("L'interface de sélection de clé n'est disponible que dans l'environnement AI Studio.");
      }
    } catch (error) {
      console.error("Erreur lors de l'ouverture du sélecteur de clé:", error);
    }
  };

  const visitors = useMemo(() => {
    if (!currentSession) return [];
    const ids = new Set<string>();
    currentSession.chatMessages.forEach(m => { if (m.visitorId) ids.add(m.visitorId); });
    return Array.from(ids);
  }, [currentSession]);

  return (
    <div className="h-full overflow-y-auto bg-gray-50/50 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Settings size={24} />
             </div>
             <div>
               <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Espace Enseignant</h2>
               <p className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                 Session : <span className="text-indigo-600">{currentSession?.name || 'Veuillez choisir'}</span>
               </p>
             </div>
          </div>
          <button onClick={onGoToChat} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2">
            <ArrowLeft size={14} /> Retour au Chat
          </button>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-gray-200/60 p-1.5 rounded-2xl inline-flex shadow-inner">
            <button onClick={() => setActiveTab('sessions')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sessions' ? 'bg-white text-indigo-700 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
              Sessions
            </button>
            <button onClick={() => setActiveTab('knowledge')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'knowledge' ? 'bg-white text-indigo-700 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
              Ressources
            </button>
            <button onClick={() => setActiveTab('monitoring')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'monitoring' ? 'bg-white text-indigo-700 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
              Suivi
            </button>
            <button onClick={() => setActiveTab('config')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-white text-indigo-700 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
              Configuration IA
            </button>
          </div>
        </div>

        {activeTab === 'knowledge' && (
          !currentSession ? (
            <div className="bg-white p-12 rounded-[2rem] border border-gray-100 shadow-xl text-center flex flex-col items-center justify-center space-y-4">
               <AlertCircle size={48} className="text-amber-500 mb-2" />
               <h3 className="text-lg font-bold">Sélectionnez d'abord une session</h3>
               <button onClick={() => setActiveTab('sessions')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase shadow-lg shadow-indigo-200">Choisir une session</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 animate-in slide-in-from-bottom-8 duration-500">
              {/* Colonne 1: Liens */}
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-[750px] space-y-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Globe size={20} /></div>
                    <h3 className="font-black text-xs uppercase tracking-widest text-gray-800">Liens & Sites Web</h3>
                  </div>
                  <form onSubmit={handleUrlSubmit} className="space-y-2">
                    <div className="flex gap-2">
                      <input type="text" value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://site.com" className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500" />
                      <button type="submit" className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95"><Plus size={20}/></button>
                    </div>
                  </form>
                </div>
                <div className="flex-grow overflow-y-auto chat-container pr-2 space-y-3 pt-4 border-t border-gray-100">
                  {knowledgeBase.urls.map((u, i) => (
                    <div key={`u-${i}`} className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100 group">
                      <span className="text-[10px] font-bold truncate text-blue-600">{u.url}</span>
                      <button onClick={() => onRemoveUrl(u.url)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12}/></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colonne 2: Médiathèque */}
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-[750px]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Database size={20} /></div>
                  <h3 className="font-black text-xs uppercase tracking-widest text-gray-800">Médiathèque</h3>
                </div>
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-[1.5rem] py-10 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-all hover:border-indigo-300 mb-6 group">
                  <FileUp size={28} className="text-indigo-400 mb-2 group-hover:scale-110" />
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center">Ajouter un fichier</span>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                </div>
                <div className="flex-grow overflow-y-auto chat-container pr-2 space-y-3">
                  {knowledgeBase.files.map((f) => (
                    <div key={f.id} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 group hover:border-indigo-200 transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black truncate text-gray-700">{f.name}</span>
                        <button onClick={() => onRemoveFile(f.id)} className="p-1.5 text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colonne 3: Notes & Documents */}
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-[750px]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><Type size={20} /></div>
                  <h3 className="font-black text-xs uppercase tracking-widest text-gray-800">Notes & Documents</h3>
                </div>
                <div className="space-y-3 mb-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-black uppercase text-amber-600 tracking-widest">
                      {editingNoteId ? 'Modification en cours...' : 'Nouveau Document'}
                    </span>
                    {editingNoteId && (
                      <button onClick={clearNoteEditor} className="text-[9px] font-black uppercase text-gray-400 hover:text-red-500 flex items-center gap-1">
                        <Eraser size={10} /> Annuler
                      </button>
                    )}
                  </div>
                  <input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="Titre..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-400 transition-all" />
                  <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="Contenu..." className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none h-32 resize-none focus:border-amber-400 transition-all" />
                  <button onClick={handleTextSubmit} className={`w-full py-3 text-white font-black rounded-xl text-[10px] uppercase shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${editingNoteId ? 'bg-indigo-600 shadow-indigo-100' : 'bg-amber-500 shadow-amber-100'}`}>
                    <Save size={14} /> {editingNoteId ? 'Mettre à jour la note' : 'Enregistrer la note'}
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto chat-container pr-2 space-y-3 border-t border-gray-100 pt-4">
                  {knowledgeBase.rawTexts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-300">
                      <StickyNote size={32} strokeWidth={1} />
                      <p className="text-[9px] font-black uppercase tracking-widest mt-2">Aucune note</p>
                    </div>
                  ) : (
                    knowledgeBase.rawTexts.map((text) => (
                      <div 
                        key={text.id} 
                        onClick={() => openNoteForEditing(text)}
                        className={`p-4 rounded-2xl border transition-all relative cursor-pointer group hover:scale-[1.02] active:scale-95 ${
                          editingNoteId === text.id 
                            ? 'bg-amber-50 border-amber-300 shadow-md ring-2 ring-amber-200' 
                            : 'bg-gray-50/80 border-gray-100 hover:border-amber-200 hover:bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-xs font-black text-gray-800 truncate pr-10">{text.title}</h4>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onRemoveText(text.id); if(editingNoteId === text.id) clearNoteEditor(); }} 
                            className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                          {text.content}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded border ${
                            editingNoteId === text.id ? 'bg-amber-200 border-amber-400 text-amber-800' : 'bg-amber-50 border-amber-100 text-amber-600'
                          }`}>
                            {editingNoteId === text.id ? 'Édition active' : 'Note Enregistrée'}
                          </span>
                          <Edit3 size={10} className="text-gray-400 opacity-0 group-hover:opacity-100 ml-auto" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {/* Autres onglets (Config, Sessions, etc.) */}
        {activeTab === 'config' && currentSession && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Fournisseur d'IA</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Technologie active</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => onUpdateSession({ aiProvider: 'gemini' })}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${currentSession.aiProvider === 'gemini' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'}`}
                  >
                    <Sparkles size={20} className={currentSession.aiProvider === 'gemini' ? 'text-indigo-600' : 'text-gray-400'} />
                    <span className="text-[10px] font-black uppercase">Google Gemini</span>
                  </button>
                  <button 
                    onClick={() => onUpdateSession({ aiProvider: 'openrouter' })}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${currentSession.aiProvider === 'openrouter' ? 'border-amber-600 bg-amber-50' : 'border-gray-100 hover:border-amber-200'}`}
                  >
                    <Link size={20} className={currentSession.aiProvider === 'openrouter' ? 'text-amber-600' : 'text-gray-400'} />
                    <span className="text-[10px] font-black uppercase">OpenRouter</span>
                  </button>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Cpu size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Identifiant Modèle</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Moteur de réflexion</p>
                  </div>
                </div>

                {currentSession.aiProvider === 'gemini' ? (
                  <div className="space-y-3">
                    <button 
                      onClick={() => onUpdateSession({ modelName: 'gemini-3-flash-preview' })}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${currentSession.modelName === 'gemini-3-flash-preview' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <h4 className="text-xs font-black uppercase">Gemini 3 Flash</h4>
                      <p className="text-[9px] text-gray-500 font-bold">Standard, équilibré, multimédia.</p>
                    </button>
                    <button 
                      onClick={() => onUpdateSession({ modelName: 'gemini-3-pro-preview' })}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${currentSession.modelName === 'gemini-3-pro-preview' ? 'border-purple-600 bg-purple-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <h4 className="text-xs font-black uppercase">Gemini 3 Pro</h4>
                      <p className="text-[9px] text-gray-500 font-bold">Expertise, raisonnement poussé.</p>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      value={currentSession.modelName} 
                      onChange={(e) => onUpdateSession({ modelName: e.target.value })}
                      placeholder="ex: anthropic/claude-3.5-sonnet"
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 text-sm font-mono outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl space-y-6 md:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <Key size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Authentification API</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Sécurité de session</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Clé API pour cette session :</label>
                    <div className="flex gap-2">
                      <input 
                        type="password" 
                        value={currentSession.sessionApiKey || ''} 
                        onChange={(e) => onUpdateSession({ sessionApiKey: e.target.value })}
                        placeholder="sk-or-v1-..."
                        className="flex-grow bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-mono outline-none focus:border-indigo-400"
                      />
                      {currentSession.aiProvider === 'gemini' && (
                        <button 
                          onClick={handleOpenKeyPicker}
                          className="bg-indigo-600 text-white px-6 rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-indigo-100"
                        >
                          Sélecteur Google
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <ChatSessionsAdmin 
            allChatSessions={allChatSessions} 
            activeChatSessionId={activeChatSessionId} 
            onCreateNewChat={onCreateNewChat} 
            onDeleteChat={onDeleteChat} 
            onAdminSelectChat={(id) => {
              onAdminSelectChat(id);
              setActiveTab('knowledge');
            }} 
          />
        )}
      </div>
    </div>
  );
};

export default AdminView;
