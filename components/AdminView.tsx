

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { 
  Globe, FileText, Type, Trash2, Plus, 
  Search, FileUp, Save, 
  ArrowLeft, Info, GraduationCap, MessageSquare, CheckCircle, Settings
} from 'lucide-react';
import { KnowledgeBase, UrlItem, KnowledgeFile, KnowledgeText, ChatSession, AppView } from '../types';
import ChatSessionsAdmin from './ChatSessionsAdmin'; // Nouveau composant pour la gestion des sessions

interface AdminViewProps {
  // Props pour la gestion de la base de connaissances (session active)
  knowledgeBase: KnowledgeBase; // Used to derive initial assistantName
  onAddUrl: (item: UrlItem) => void;
  onRemoveUrl: (url: string) => void;
  onAddFile: (file: KnowledgeFile) => void;
  onRemoveFile: (id: string) => void;
  onAddText: (text: KnowledgeText) => void;
  onRemoveText: (id: string) => void;
  onGoToChat: () => void;
  
  // Props pour la gestion des sessions de chat (passées au nouvel onglet)
  allChatSessions: ChatSession[];
  activeChatSessionId: string | null;
  onDeleteChat: (id: string) => void;
  onCreateNewChat: (name: string) => void;
  onAdminSelectChat: (id: string) => void; // Nouvelle prop pour la sélection depuis l'admin
}

const AdminView: React.FC<AdminViewProps> = ({
  knowledgeBase, onAddUrl, onRemoveUrl, onAddFile, onRemoveFile, onAddText, onRemoveText, onGoToChat,
  allChatSessions, activeChatSessionId, onDeleteChat, onCreateNewChat, onAdminSelectChat
}) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'knowledge'>('sessions');

  // const currentSession = allChatSessions.find(s => s.id === activeChatSessionId); // No longer needed for assistant name

  // State for assistant name removed

  // Met à jour l'onglet actif lorsque la session active change
  useEffect(() => {
    if (activeChatSessionId && activeTab !== 'knowledge') {
      // Si une session est active et que nous ne sommes pas déjà sur l'onglet connaissance,
      // basculer vers l'onglet connaissance. Ceci gère la création/sélection de chat depuis l'admin.
      setActiveTab('knowledge');
    } else if (activeChatSessionId === null && activeTab !== 'sessions') {
      // Si aucune session n'est active (ex: après suppression de la dernière), revenir à l'onglet sessions.
      setActiveTab('sessions');
    }
  }, [activeChatSessionId]); // activeTab n'est pas une dépendance ici pour éviter une boucle infinie ou un comportement non désiré.

  // Update tempAssistantName when activeChatSessionId changes removed


  const [urlInput, setUrlInput] = useState('');
  // const [crawlWhole, setCrawlWhole] = useState(false); // Removed as per user request
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onAddUrl({ url: urlInput.trim() /*, crawlWholeSite: crawlWhole*/ }); // crawlWholeSite removed
    setUrlInput('');
    // setCrawlWhole(false); // Removed as per user request
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

  // handleSaveAssistantName removed

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 md:p-10 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Admin */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-700 shrink-0 shadow-lg">
              <GraduationCap size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Espace d'Administration</h2>
              <p className="text-gray-500 mt-1 max-w-xl text-sm">
                Gérez vos sessions de chat et configurez les sources de connaissances pour votre assistant **PedagoChat**.
              </p>
            </div>
          </div>
          <button 
            onClick={onGoToChat}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 transition-all self-start"
          >
            <ArrowLeft size={18} /> Retour à la Discussion
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200 mb-8">
          <button 
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'sessions' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare size={16} /> Sessions de Chat
          </button>
          <button 
            onClick={() => setActiveTab('knowledge')}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'knowledge' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings size={16} /> Base de Données
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'sessions' ? (
          <ChatSessionsAdmin
            allChatSessions={allChatSessions}
            activeChatSessionId={activeChatSessionId}
            onCreateNewChat={onCreateNewChat}
            onDeleteChat={onDeleteChat}
            onAdminSelectChat={onAdminSelectChat} // Pass the prop down
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* COLONNE 1: WEB */}
            <section className="space-y-6 bg-white p-6 rounded-3xl border border-gray-200 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                  <Globe size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Portail Web (Références uniquement)</h3>
              </div>

              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div className="relative">
                  <input 
                    type="url"
                    placeholder="https://..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-300 rounded-2xl p-4 pl-12 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-gray-900 placeholder-gray-500"
                  />
                  <Search className="absolute left-4 top-4 text-gray-400" size={18} />
                </div>
                {/* Checkbox "Indexation complète" retirée */}
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-600/40 transition-all active:scale-95"
                  disabled={!urlInput.trim()}
                >
                  <Plus size={18} /> Ajouter la référence
                </button>
              </form>

              <div className="pt-4 space-y-2 max-h-[400px] overflow-y-auto chat-container pr-2">
                {knowledgeBase.urls.length === 0 && (
                  <p className="text-center text-gray-500 py-4 text-xs">Aucune référence web ajoutée pour cette session.</p>
                )}
                {knowledgeBase.urls.map((item, idx) => (
                  <div key={idx} className="group flex items-center justify-between p-4 bg-gray-100 border border-gray-200 rounded-2xl hover:border-gray-300 transition-all">
                    <div className="flex flex-col truncate pr-4">
                      <span className="text-xs font-bold text-gray-800 truncate">{item.url}</span>
                      <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1">
                        Référence URL
                      </span> {/* Simplifié */}
                    </div>
                    <button onClick={() => onRemoveUrl(item.url)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* COLONNE 2: FICHIERS */}
            <section className="space-y-6 bg-white p-6 rounded-3xl border border-gray-200 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                  <FileText size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Documents PDF</h3>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all group"
              >
                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 group-hover:scale-110 transition-transform">
                  <FileUp size={28} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-800">Déposer un document</p>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-bold">PDF uniquement recommandé</p>
                </div>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileUpload}
                  accept=".pdf"
                />
              </div>

              <div className="pt-4 space-y-2 max-h-[400px] overflow-y-auto chat-container pr-2">
                {knowledgeBase.files.length === 0 && (
                  <p className="text-center text-gray-500 py-4 text-xs">Aucun document ajouté pour cette session.</p>
                )}
                {knowledgeBase.files.map((file) => (
                  <div key={file.id} className="flex items-center gap-4 p-4 bg-gray-100 border border-gray-200 rounded-2xl">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700">
                      <FileText size={18} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{file.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-wider">{formatSize(file.size)}</p>
                    </div>
                    <button onClick={() => onRemoveFile(file.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* COLONNE 3: NOTES / TEXTE et Paramètres de l'Assistant */}
            <div className="flex flex-col gap-8">
              <section className="space-y-6 bg-white p-6 rounded-3xl border border-gray-200 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                    <Type size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Notes Pédagogiques</h3>
                </div>

                <div className="space-y-4">
                  <input 
                    placeholder="Titre de la leçon ou note..."
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-300 rounded-2xl p-4 text-sm focus:border-amber-500 outline-none transition-all text-gray-900 placeholder-gray-500"
                  />
                  <textarea 
                    placeholder="Contenu brut de la connaissance..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={5}
                    className="w-full bg-gray-100 border border-gray-300 rounded-2xl p-4 text-sm focus:border-amber-500 outline-none resize-none transition-all text-gray-900 placeholder-gray-500"
                  />
                  <button 
                    onClick={handleTextSubmit}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-amber-600/40 transition-all active:scale-95"
                    disabled={!noteTitle.trim() || !noteContent.trim()}
                  >
                    <Save size={18} /> Enregistrer la note
                  </button>
                </div>

                <div className="pt-4 space-y-2 max-h-[300px] overflow-y-auto chat-container pr-2">
                  {knowledgeBase.rawTexts.length === 0 && (
                    <p className="text-center text-gray-500 py-4 text-xs">Aucune note ajoutée pour cette session.</p>
                  )}
                  {knowledgeBase.rawTexts.map((text) => (
                    <div key={text.id} className="group p-4 bg-gray-100 border border-gray-200 rounded-2xl relative overflow-hidden">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-700 truncate pr-8">{text.title}</span>
                        <button onClick={() => onRemoveText(text.id)} className="p-2 text-gray-400 hover:text-red-600 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-600 line-clamp-2 leading-relaxed">{text.content}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Pied de page informatif */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-3xl p-6 flex gap-4 items-start shadow-md mt-10">
          <Info className="text-indigo-600 shrink-0" size={20} />
          <div>
            <h4 className="text-sm font-bold text-indigo-700 uppercase tracking-widest">Informations Serveur</h4>
            <p className="text-xs text-indigo-600/80 mt-1 leading-relaxed">
              Toutes les données déposées ici sont persistantes et stockées localement sur votre appareil. Votre assistant **PedagoChat** consultera ces documents en priorité pour répondre aux questions de la session active. L'indexation des PDF volumineux peut prendre quelques secondes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminView;