

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { ChatMessage, MessageSender, KnowledgeBase, AppView, UrlItem, KnowledgeFile, KnowledgeText, ChatSession } from './types';
import { generateContentWithUrlContext } from './services/geminiService';
import ChatInterface from './components/ChatInterface';
import AdminView from './components/AdminView';
import Sidebar from './components/Sidebar'; // Nouvelle importation de la Sidebar
import { Settings, MessageSquare, GraduationCap, CloudCheck, CloudOff, Sparkles } from 'lucide-react';

const STORAGE_KEY_SESSIONS = 'pedagochat_sessions';
const STORAGE_KEY_ACTIVE_SESSION = 'pedagochat_active_session_id';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('chat');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [allChatSessions, setAllChatSessions] = useState<ChatSession[]>([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);

  // New state for embed mode
  const [embedMode, setEmbedMode] = useState(false);
  const [embedSessionId, setEmbedSessionId] = useState<string | null>(null);

  // Effect to handle URL hash for embedded mode
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const embedMatch = hash.match(/^#\/embed\/(.+)$/);
      if (embedMatch && embedMatch[1]) {
        setEmbedMode(true);
        setEmbedSessionId(embedMatch[1]);
        // Do not change main view state when in embed mode, it's a different context
      } else {
        setEmbedMode(false);
        setEmbedSessionId(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run once on mount
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Initialisation et chargement des sessions depuis le stockage persistant
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
      const savedActiveSessionId = localStorage.getItem(STORAGE_KEY_ACTIVE_SESSION);

      let initialSessions: ChatSession[] = [];
      if (savedSessions) {
        initialSessions = JSON.parse(savedSessions).map((session: ChatSession) => ({
          ...session,
          chatMessages: session.chatMessages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp), // Convertir les chaînes de date en objets Date
          })),
          knowledgeBase: {
            ...session.knowledgeBase,
            rawTexts: session.knowledgeBase.rawTexts.map(text => ({
              ...text,
              createdAt: new Date(text.createdAt),
            })),
          }
        }));
      }

      // Si aucune session n'existe ou si l'ID de session active n'est pas valide,
      // l'application démarre sans session active, invitant l'utilisateur à en créer une.
      setAllChatSessions(initialSessions);
      if (savedActiveSessionId && initialSessions.some(s => s.id === savedActiveSessionId)) {
        setActiveChatSessionId(savedActiveSessionId);
      } else {
        setActiveChatSessionId(initialSessions.length > 0 ? initialSessions[0].id : null);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des sessions depuis localStorage:", error);
      // Fallback vers un état vide en cas d'erreur
      setAllChatSessions([]);
      setActiveChatSessionId(null);
    }
  }, []);

  // Sauvegarde automatique des sessions et de la session active
  useEffect(() => {
    if (allChatSessions.length > 0) { // Ne pas sauvegarder si l'état initial est vide ou si toutes les sessions ont été supprimées
      setIsSyncing(true);
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(allChatSessions));
      if (activeChatSessionId) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_SESSION, activeChatSessionId);
      }
      const timer = setTimeout(() => setIsSyncing(false), 800);
      return () => clearTimeout(timer);
    } else {
      // Si toutes les sessions sont supprimées, vider le localStorage
      localStorage.removeItem(STORAGE_KEY_SESSIONS);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_SESSION);
      setIsSyncing(true); // Afficher syncing un court instant pour indiquer la sauvegarde
      const timer = setTimeout(() => setIsSyncing(false), 800);
      return () => clearTimeout(timer);
    }
  }, [allChatSessions, activeChatSessionId]);

  const currentSession = allChatSessions.find(s => s.id === activeChatSessionId);
  const currentKnowledgeBase = currentSession?.knowledgeBase || { urls: [], files: [], rawTexts: [] };
  const currentChatMessages = currentSession?.chatMessages || [];

  const updateCurrentSession = useCallback((updater: (session: ChatSession) => ChatSession) => {
    setAllChatSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === activeChatSessionId ? updater(session) : session
      )
    );
  }, [activeChatSessionId]);

  const handleSendMessage = async (query: string, sessionId: string) => {
    // Note: sessionId parameter is added to allow sending messages in embed mode
    const targetSession = allChatSessions.find(s => s.id === sessionId);
    if (!query.trim() || isLoading || !process.env.API_KEY || !targetSession) return;
    
    setIsLoading(true);
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, text: query, sender: MessageSender.USER, timestamp: new Date() };
    const modelPlaceholder: ChatMessage = { id: `m-${Date.now()}`, text: 'Réflexion en cours...', sender: MessageSender.MODEL, timestamp: new Date(), isLoading: true };

    setAllChatSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === sessionId ? { ...session, chatMessages: [...session.chatMessages, userMsg, modelPlaceholder] } : session
      )
    );

    try {
      const response = await generateContentWithUrlContext(query, targetSession.knowledgeBase);
      setAllChatSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === sessionId
            ? {
                ...session,
                chatMessages: session.chatMessages.map(msg => 
                  msg.id === modelPlaceholder.id 
                    ? { ...modelPlaceholder, text: response.text || "Désolé, je n'ai pas pu générer de réponse.", isLoading: false, urlContext: response.urlContextMetadata } 
                    : msg
                )
              }
            : session
        )
      );
    } catch (e: any) {
      setAllChatSessions(prevSessions =>
        prevSessions.map(session =>
          session.id === sessionId
            ? {
                ...session,
                chatMessages: session.chatMessages.map(msg => 
                  msg.id === modelPlaceholder.id 
                    ? { ...modelPlaceholder, text: e.message, sender: MessageSender.SYSTEM, isLoading: false } 
                    : msg
                )
              }
            : session
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // `clearHistory` function and button are removed as per request.

  // Actions Admin pour la base de connaissances de la session active
  // Fix: Correctly update the knowledgeBase property within the ChatSession object
  const addUrl = (item: UrlItem) => updateCurrentSession(session => ({ ...session, knowledgeBase: { ...session.knowledgeBase, urls: [...session.knowledgeBase.urls, item] } }));
  // Fix: Correctly update the knowledgeBase property within the ChatSession object
  const removeUrl = (url: string) => updateCurrentSession(session => ({ ...session, knowledgeBase: { ...session.knowledgeBase, urls: session.knowledgeBase.urls.filter(u => u.url !== url) } }));
  
  // Fix: Correctly update the knowledgeBase property within the ChatSession object
  const addFile = (file: KnowledgeFile) => updateCurrentSession(session => ({ ...session, knowledgeBase: { ...session.knowledgeBase, files: [...session.knowledgeBase.files, file] } }));
  // Fix: Correctly update the knowledgeBase property within the ChatSession object
  const removeFile = (id: string) => updateCurrentSession(session => ({ ...session, knowledgeBase: { ...session.knowledgeBase, files: session.knowledgeBase.files.filter(f => f.id !== id) } }));
  
  // Fix: Correctly update the knowledgeBase property within the ChatSession object
  const addText = (text: KnowledgeText) => updateCurrentSession(session => ({ ...session, knowledgeBase: { ...session.knowledgeBase, rawTexts: [...session.knowledgeBase.rawTexts, text] } }));
  // Fix: Correctly update the knowledgeBase property within the ChatSession object
  const removeText = (id: string) => updateCurrentSession(session => ({ ...session, knowledgeBase: { ...session.knowledgeBase, rawTexts: session.knowledgeBase.rawTexts.filter(t => t.id !== id) } }));

  // Actions pour la gestion des sessions de chat
  const createNewChat = (name: string) => {
    const newSession: ChatSession = {
      id: `chat-${Date.now()}`,
      name: name,
      knowledgeBase: { urls: [], files: [], rawTexts: [] },
      chatMessages: [{
        id: 'welcome-new',
        text: `Bienvenue dans la session **${name}** ! Utilisez l'onglet "Base de Données" pour configurer ses connaissances.`,
        sender: MessageSender.SYSTEM,
        timestamp: new Date(),
      }],
    };
    setAllChatSessions(prev => [...prev, newSession]);
    setActiveChatSessionId(newSession.id);
    setView('admin'); // Basculer vers l'admin pour configurer la nouvelle session
  };

  const selectChat = (id: string) => {
    setActiveChatSessionId(id);
    setView('chat'); // Basculer vers le chat une fois la session sélectionnée
    // If we are in embed mode, navigate back to main app view
    if (embedMode) {
      window.location.hash = '#/'; 
    }
  };
  
  // Fonction pour sélectionner un chat depuis l'admin et basculer sur l'onglet Knowledge
  const handleAdminSelectChat = useCallback((id: string) => {
    setActiveChatSessionId(id);
    setView('admin'); // Assurez-vous que la vue est 'admin'
    // L'AdminView gérera elle-même le basculement d'onglet via son useEffect sur activeChatSessionId
    if (embedMode) { // Also exit embed mode if selecting from admin
      window.location.hash = '#/';
    }
  }, [embedMode]);

  const deleteChat = (id: string) => {
    if (allChatSessions.length === 0) return; // Ne rien faire s'il n'y a pas de sessions
    if (confirm("Êtes-vous sûr de vouloir supprimer cette session de chat et toutes ses données ?")) {
      setAllChatSessions(prev => {
        const remainingSessions = prev.filter(session => session.id !== id);
        if (remainingSessions.length === 0) {
          // Si toutes les sessions sont supprimées, réinitialiser à l'état vide
          setActiveChatSessionId(null);
          return [];
        }
        if (activeChatSessionId === id) {
          // Si la session supprimée était active, sélectionner la première restante
          setActiveChatSessionId(remainingSessions[0].id);
        }
        return remainingSessions;
      });
    }
  };

  // Render logic for embed mode
  if (embedMode) {
    const embeddedSession = allChatSessions.find(s => s.id === embedSessionId);
    if (embeddedSession) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-gray-900 font-sans p-4">
          <ChatInterface
            messages={embeddedSession.chatMessages}
            onSendMessage={(query) => handleSendMessage(query, embeddedSession.id)}
            isLoading={isLoading}
            placeholderText={
              embeddedSession.knowledgeBase.urls.length + embeddedSession.knowledgeBase.files.length + embeddedSession.knowledgeBase.rawTexts.length > 0 
                ? "Posez une question à cette base de données..." 
                : "Cette session n'a pas de base de connaissances configurée."
            }
          />
        </div>
      );
    } else {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-red-50 text-red-800 font-sans p-4">
          <div className="bg-red-100 border border-red-300 rounded-xl p-6 text-center shadow-lg">
            <h2 className="text-xl font-bold mb-2">Session de chat introuvable</h2>
            <p className="text-red-700">L'identifiant de session fourni dans l'URL est invalide ou la session n'existe plus.</p>
          </div>
        </div>
      );
    }
  }

  // Normal application render
  return (
    <div className="h-screen bg-gray-50 text-gray-900 flex font-sans">
      {/* Sidebar */}
      <Sidebar
        onGoToAdmin={() => setView('admin')}
        onGoToChat={() => setView('chat')}
        currentView={view}
        allChatSessions={allChatSessions} // Nouvelle prop
        activeChatSessionId={activeChatSessionId} // Nouvelle prop
        onSelectChat={selectChat} // Nouvelle prop
      />

      <div className="flex flex-col flex-grow overflow-hidden">
        {/* Barre de Navigation Supérieure */}
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <GraduationCap className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter text-gray-900">PEDAGOCHAT</h1>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                  Session: {currentSession?.name || 'Aucune session active'}
                </span>
                <div className="flex items-center gap-1">
                  {isSyncing ? (
                     <CloudOff size={10} className="text-amber-500 animate-pulse" />
                  ) : (
                     <CloudCheck size={10} className="text-green-600" />
                  )}
                  <span className="text-[9px] text-gray-400 uppercase font-bold">Données Locales</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* "Effacer l'historique" button removed */}
          </div>
        </header>

        {/* Zone de contenu principale */}
        <main className="flex-grow overflow-hidden relative">
          {view === 'admin' ? (
            <AdminView 
              knowledgeBase={currentKnowledgeBase}
              onAddUrl={addUrl}
              onRemoveUrl={removeUrl}
              onAddFile={addFile}
              onRemoveFile={removeFile}
              onAddText={addText}
              onRemoveText={removeText}
              onGoToChat={() => setView('chat')}

              allChatSessions={allChatSessions}
              activeChatSessionId={activeChatSessionId}
              onCreateNewChat={createNewChat}
              onDeleteChat={deleteChat}
              onAdminSelectChat={handleAdminSelectChat} // Nouvelle prop pour la sélection depuis l'admin
            />
          ) : ( // view === 'chat'
            activeChatSessionId === null ? (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-200 text-center max-w-lg mx-auto">
                  <Sparkles size={48} className="text-blue-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Bienvenue sur PedagoChat !</h2>
                  <p className="text-gray-600 mb-6">
                    Il semblerait que vous n'ayez aucune session de chat active.
                    Veuillez vous rendre dans l'<button onClick={() => setView('admin')} className="text-indigo-600 font-bold underline">Administration</button>
                    pour créer votre première session.
                  </p>
                  <button 
                    onClick={() => setView('admin')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-indigo-600/30 transition-all active:scale-95"
                  >
                    <Settings size={18} className="inline-block mr-2" /> Aller à l'administration
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full max-w-5xl mx-auto w-full p-4 md:p-6 flex flex-col">
                <ChatInterface
                  messages={currentChatMessages}
                  onSendMessage={(query) => handleSendMessage(query, activeChatSessionId)}
                  isLoading={isLoading}
                  placeholderText={currentKnowledgeBase.urls.length + currentKnowledgeBase.files.length + currentKnowledgeBase.rawTexts.length > 0 ? "Posez une question à votre base de données..." : "Allez dans l'administration pour enrichir ses connaissances."}
                />
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
};

export default App;