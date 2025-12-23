
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { ChatMessage, MessageSender, AppView, UrlItem, KnowledgeFile, KnowledgeText, ChatSession } from './types';
import { generateContentWithUrlContext } from './services/geminiService';
import { apiService } from './services/apiService';
import ChatInterface from './components/ChatInterface';
import AdminView from './components/AdminView';
import Sidebar from './components/Sidebar';
import { Settings, GraduationCap, CloudCheck, CloudOff, Sparkles, Loader2, Database } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('chat');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  
  const [allChatSessions, setAllChatSessions] = useState<ChatSession[]>([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Embed mode state
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
      } else {
        setEmbedMode(false);
        setEmbedSessionId(null);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Initial load from Backend or Local
  useEffect(() => {
    const loadData = async () => {
      try {
        const sessions = await apiService.fetchSessions();
        setAllChatSessions(sessions);
        const localMode = apiService.isLocalMode();
        setIsLocalMode(localMode);
        setIsServerConnected(!localMode);
        
        if (sessions.length > 0) {
          setActiveChatSessionId(sessions[0].id);
        }
      } catch (error) {
        console.error("Erreur d'initialisation:", error);
        setIsLocalMode(true);
        setIsServerConnected(false);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadData();
  }, []);

  const currentSession = allChatSessions.find(s => s.id === activeChatSessionId);
  const currentKnowledgeBase = currentSession?.knowledgeBase || { urls: [], files: [], rawTexts: [] };
  const currentChatMessages = currentSession?.chatMessages || [];
  const currentAssistantName = currentSession?.assistantName || 'Bob';

  const updateCurrentSessionOnServer = async (updatedSession: ChatSession) => {
    setIsSyncing(true);
    try {
      await apiService.updateSession(updatedSession.id, updatedSession);
      const localMode = apiService.isLocalMode();
      setIsLocalMode(localMode);
      setIsServerConnected(!localMode);
    } catch (e) {
      console.error("Sync error:", e);
      setIsLocalMode(true);
      setIsServerConnected(false);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const updateCurrentSession = useCallback((updater: (session: ChatSession) => ChatSession) => {
    setAllChatSessions(prevSessions => {
      const newSessions = prevSessions.map(session =>
        session.id === activeChatSessionId ? updater(session) : session
      );
      const updated = newSessions.find(s => s.id === activeChatSessionId);
      if (updated) updateCurrentSessionOnServer(updated);
      return newSessions;
    });
  }, [activeChatSessionId]);

  const handleSendMessage = async (query: string, sessionId: string) => {
    const targetSession = allChatSessions.find(s => s.id === sessionId);
    if (!query.trim() || isLoading || !process.env.API_KEY || !targetSession) return;
    
    setIsLoading(true);
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, text: query, sender: MessageSender.USER, timestamp: new Date() };
    const modelPlaceholder: ChatMessage = { id: `m-${Date.now()}`, text: 'Réflexion en cours...', sender: MessageSender.MODEL, timestamp: new Date(), isLoading: true };

    const updatedSession = { ...targetSession, chatMessages: [...targetSession.chatMessages, userMsg, modelPlaceholder] };
    
    setAllChatSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));

    try {
      const response = await generateContentWithUrlContext(query, targetSession.knowledgeBase);
      const finalMessages = updatedSession.chatMessages.map(msg => 
        msg.id === modelPlaceholder.id 
          ? { ...modelPlaceholder, text: response.text || "Désolé, je n'ai pas pu générer de réponse.", isLoading: false, urlContext: response.urlContextMetadata } 
          : msg
      );
      const finalSession = { ...updatedSession, chatMessages: finalMessages };
      setAllChatSessions(prev => prev.map(s => s.id === sessionId ? finalSession : s));
      updateCurrentSessionOnServer(finalSession);
    } catch (e: any) {
      const errorSession = {
        ...updatedSession,
        chatMessages: updatedSession.chatMessages.map(msg => 
          msg.id === modelPlaceholder.id 
            ? { ...modelPlaceholder, text: e.message, sender: MessageSender.SYSTEM, isLoading: false } 
            : msg
        )
      };
      setAllChatSessions(prev => prev.map(s => s.id === sessionId ? errorSession : s));
    } finally {
      setIsLoading(false);
    }
  };

  const addUrl = (item: UrlItem) => updateCurrentSession(session => ({ ...session, knowledgeBase: { ...session.knowledgeBase, urls: [...session.knowledgeBase.urls, item] } }));
  const removeUrl = (url: string) => updateCurrentSession(session => ({ ...session, knowledgeBase: { ...session.knowledgeBase, urls: session.knowledgeBase.urls.filter(u => u.url !== url) } }));
  const addFile = (file: KnowledgeFile) => updateCurrentSession(session => ({ ...session, knowledgeBase: { ...session.knowledgeBase, files: [...session.knowledgeBase.files, file] } }));
  const removeFile = (id: string) => updateCurrentSession(session => ({ ...session, knowledgeBase: { ...session.knowledgeBase, files: session.knowledgeBase.files.filter(f => f.id !== id) } }));
  const addText = (text: KnowledgeText) => updateCurrentSession(session => ({ ...session, knowledgeBase: { ...session.knowledgeBase, rawTexts: [...session.knowledgeBase.rawTexts, text] } }));
  const removeText = (id: string) => updateCurrentSession(session => ({ ...session, knowledgeBase: { ...session.knowledgeBase, rawTexts: session.knowledgeBase.rawTexts.filter(t => t.id !== id) } }));

  const createNewChat = async (name: string) => {
    const newSessionId = `chat-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      name: name,
      knowledgeBase: { urls: [], files: [], rawTexts: [] },
      chatMessages: [{
        id: 'welcome-new',
        text: `Bienvenue dans la session **${name}** ! Utilisez l'onglet "Base de Données" pour configurer ses connaissances.`,
        sender: MessageSender.SYSTEM,
        timestamp: new Date(),
      }],
      assistantName: 'Bob',
    };

    try {
      await apiService.createSession(newSession);
      const localMode = apiService.isLocalMode();
      setIsLocalMode(localMode);
      setIsServerConnected(!localMode);
      setAllChatSessions(prev => [...prev, newSession]);
      setActiveChatSessionId(newSession.id);
      setView('admin');
    } catch (e) {
      console.error("Failed to create session", e);
      setIsLocalMode(true);
      setIsServerConnected(false);
    }
  };

  const selectChat = (id: string) => {
    setActiveChatSessionId(id);
    setView('chat');
    if (embedMode) window.location.hash = '#/'; 
  };
  
  const handleAdminSelectChat = useCallback((id: string) => {
    setActiveChatSessionId(id);
    setView('admin');
    if (embedMode) window.location.hash = '#/';
  }, [embedMode]);

  const deleteChat = async (id: string) => {
    if (allChatSessions.length === 0) return;
    const storageMsg = isLocalMode ? "Supprimer cette session de votre navigateur ?" : "Supprimer définitivement cette session du serveur ?";
    if (confirm(storageMsg)) {
      try {
        await apiService.deleteSession(id);
        setAllChatSessions(prev => {
          const remaining = prev.filter(s => s.id !== id);
          if (activeChatSessionId === id) {
            setActiveChatSessionId(remaining.length > 0 ? remaining[0].id : null);
          }
          return remaining;
        });
      } catch (e) {
        setIsServerConnected(false);
      }
    }
  };

  if (isInitialLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 text-indigo-600">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold animate-pulse">Initialisation PedagoChat...</p>
      </div>
    );
  }

  if (embedMode) {
    const embeddedSession = allChatSessions.find(s => s.id === embedSessionId);
    if (embeddedSession) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-50 p-4">
          <ChatInterface
            messages={embeddedSession.chatMessages}
            onSendMessage={(query) => handleSendMessage(query, embeddedSession.id)}
            isLoading={isLoading}
            placeholderText="Posez une question à cette base..."
            assistantName={embeddedSession.assistantName || 'Bob'}
          />
        </div>
      );
    }
    return <div className="h-screen flex items-center justify-center">Session introuvable</div>;
  }

  return (
    <div className="h-screen bg-gray-50 text-gray-900 flex font-sans">
      <Sidebar
        onGoToAdmin={() => setView('admin')}
        onGoToChat={() => setView('chat')}
        currentView={view}
        allChatSessions={allChatSessions}
        activeChatSessionId={activeChatSessionId}
        onSelectChat={selectChat}
      />

      <div className="flex flex-col flex-grow overflow-hidden">
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter text-gray-900">PEDAGOCHAT</h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {isSyncing ? (
                     <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                  ) : isServerConnected ? (
                     <CloudCheck size={10} className="text-green-600" />
                  ) : isLocalMode ? (
                     <Database size={10} className="text-amber-500" />
                  ) : (
                     <CloudOff size={10} className="text-red-500" />
                  )}
                  <span className={`text-[9px] uppercase font-bold ${isServerConnected ? 'text-green-600' : isLocalMode ? 'text-amber-500' : 'text-red-500'}`}>
                    {isServerConnected ? 'Stockage: Serveur' : isLocalMode ? 'Stockage: Local (Test)' : 'Erreur Connexion'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

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
              onAdminSelectChat={handleAdminSelectChat}
            />
          ) : (
            activeChatSessionId === null ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Sparkles size={48} className="text-blue-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">Prêt à commencer ?</h2>
                  <button onClick={() => setView('admin')} className="text-indigo-600 underline">Créez votre première session</button>
                </div>
              </div>
            ) : (
              <div className="h-full max-w-5xl mx-auto w-full p-4 md:p-6 flex flex-col">
                <ChatInterface
                  messages={currentChatMessages}
                  onSendMessage={(query) => handleSendMessage(query, activeChatSessionId!)}
                  isLoading={isLoading}
                  placeholderText="Posez votre question..."
                  assistantName={currentAssistantName}
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
