
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChatMessage, MessageSender, AppView, UrlItem, VideoLinkItem, KnowledgeFile, KnowledgeText, ChatSession } from './types';
import { generateAIContent } from './services/aiService';
import { apiService } from './services/apiService';
import ChatInterface from './components/ChatInterface';
import AdminView from './components/AdminView';
import Sidebar from './components/Sidebar';
import { GraduationCap, CloudCheck, Loader2, Database, User, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('chat');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ id: '', mdp: '' });
  const [loginError, setLoginError] = useState('');

  const [isSyncing, setIsSyncing] = useState(false);
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  
  const [allChatSessions, setAllChatSessions] = useState<ChatSession[]>([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Détection du mode Embed (Vue élève isolée)
  const isEmbedMode = useMemo(() => window.location.hash.includes('/embed/'), []);
  const embedSessionId = useMemo(() => {
    if (!isEmbedMode) return null;
    const parts = window.location.hash.split('/embed/');
    return parts[1]?.split('?')[0] || null;
  }, [isEmbedMode]);

  const { visitorId, visitorDisplayName } = useMemo(() => {
    const params = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
    const urlName = params.get('v_name');
    const urlId = params.get('v_id');

    if (urlId && urlName) {
      const decodedName = decodeURIComponent(urlName).replace(/_/g, ' ');
      return { visitorId: urlId, visitorDisplayName: decodedName };
    }

    let id = localStorage.getItem('pedagochat_visitor_id');
    if (!id) {
      id = `anon-${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('pedagochat_visitor_id', id);
    }
    return { visitorId: id, visitorDisplayName: id };
  }, []);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('pedagochat_admin_auth');
    if (authStatus === 'true') setIsAdminLoggedIn(true);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessions = await apiService.fetchSessions();
        setAllChatSessions(sessions);
        const localMode = apiService.isLocalMode();
        setIsLocalMode(localMode);
        setIsServerConnected(!localMode);
        
        // Si on est en mode embed, on force la session
        if (isEmbedMode && embedSessionId) {
          setActiveChatSessionId(embedSessionId);
        } else if (sessions.length > 0 && !activeChatSessionId) {
          setActiveChatSessionId(sessions[0].id);
        }
      } catch (error) {
        setIsLocalMode(true);
        setIsServerConnected(false);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [activeChatSessionId, isEmbedMode, embedSessionId]);

  const currentSession = allChatSessions.find(s => s.id === activeChatSessionId);
  const currentAssistantName = currentSession?.assistantName || 'Bob';

  const filteredChatMessages = useMemo(() => {
    if (!currentSession) return [];
    return currentSession.chatMessages.filter(msg => 
      msg.visitorId === visitorId || msg.sender === MessageSender.SYSTEM
    );
  }, [currentSession, visitorId]);

  const updateCurrentSessionOnServer = async (updatedSession: ChatSession) => {
    setIsSyncing(true);
    try {
      await apiService.updateSession(updatedSession.id, updatedSession);
    } catch (e) {
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
    if (!query.trim() || isLoading || !targetSession) return;
    
    setIsLoading(true);
    const userMsg: ChatMessage = { 
      id: `u-${Date.now()}`, 
      text: query, 
      sender: MessageSender.USER, 
      timestamp: new Date(),
      visitorId: visitorId 
    };
    
    const modelPlaceholder: ChatMessage = { 
      id: `m-${Date.now()}`, 
      text: 'Réflexion en cours...', 
      sender: MessageSender.MODEL, 
      timestamp: new Date(), 
      isLoading: true,
      visitorId: visitorId 
    };

    const updatedMessages = [...targetSession.chatMessages, userMsg, modelPlaceholder];
    const updatedSession = { ...targetSession, chatMessages: updatedMessages };
    
    setAllChatSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));

    try {
      const response = await generateAIContent(query, targetSession);
      const finalMessages = updatedMessages.map(msg => 
        msg.id === modelPlaceholder.id 
          ? { ...modelPlaceholder, text: response.text || "...", isLoading: false, urlContext: response.urlContextMetadata } 
          : msg
      );
      const finalSession = { ...targetSession, chatMessages: finalMessages };
      setAllChatSessions(prev => prev.map(s => s.id === sessionId ? finalSession : s));
      await updateCurrentSessionOnServer(finalSession);
    } catch (e: any) {
      const errorMessages = updatedMessages.map(msg => 
        msg.id === modelPlaceholder.id 
          ? { ...modelPlaceholder, text: e.message, sender: MessageSender.SYSTEM, isLoading: false } 
          : msg
      );
      const errorSession = { ...targetSession, chatMessages: errorMessages };
      setAllChatSessions(prev => prev.map(s => s.id === sessionId ? errorSession : s));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.id === 'admin' && loginForm.mdp === 'admin') {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('pedagochat_admin_auth', 'true');
      setShowLogin(false);
      setView('admin');
      setLoginError('');
    } else {
      setLoginError('Identifiants invalides');
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('pedagochat_admin_auth');
    setView('chat');
  };

  if (isInitialLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 text-indigo-600">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold animate-pulse">Préparation de la classe...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 text-gray-900 flex font-sans overflow-hidden">
      {/* Sidebar cachée en mode Embed */}
      {!isEmbedMode && (
        <Sidebar
          onGoToAdmin={() => isAdminLoggedIn ? setView('admin') : setShowLogin(true)}
          onGoToChat={() => setView('chat')}
          onLogout={handleLogout}
          isAdmin={isAdminLoggedIn}
          currentView={view}
          allChatSessions={allChatSessions}
          activeChatSessionId={activeChatSessionId}
          onSelectChat={(id) => { setActiveChatSessionId(id); setView('chat'); }}
        />
      )}

      <div className="flex flex-col flex-grow overflow-hidden">
        {/* Header simplifié en mode Embed */}
        <header className={`h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 z-50 ${isEmbedMode ? 'shadow-md' : 'shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br rounded-xl flex items-center justify-center shadow-lg ${isEmbedMode ? 'from-blue-500 to-indigo-600' : 'from-indigo-600 to-purple-700'}`}>
              <GraduationCap className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter text-gray-900 uppercase">
                {isEmbedMode ? (currentSession?.name || 'PEDAGOCHAT') : 'PEDAGOCHAT'}
              </h1>
              {!isEmbedMode && (
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 ${isServerConnected ? 'text-green-600' : 'text-amber-500'}`}>
                    {isSyncing ? <Loader2 size={10} className="animate-spin" /> : isServerConnected ? <CloudCheck size={10} /> : <Database size={10} />}
                    <span className="text-[9px] uppercase font-bold">{isServerConnected ? 'Connecté' : 'Mode Local'}</span>
                  </div>
                </div>
              )}
              {isEmbedMode && <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">Classe Virtuelle</p>}
            </div>
          </div>
          
          {/* Badge utilisateur (Élève/Admin) caché en mode Embed si besoin, ou gardé pour identification */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isAdminLoggedIn && !isEmbedMode ? 'bg-purple-50 border-purple-100' : 'bg-indigo-50 border-indigo-100'}`}>
            {isAdminLoggedIn && !isEmbedMode ? <ShieldCheck size={14} className="text-purple-500" /> : <User size={14} className="text-indigo-500" />}
            <div className="flex flex-col">
               <span className={`text-[10px] font-black uppercase tracking-tighter leading-none ${isAdminLoggedIn && !isEmbedMode ? 'text-purple-700' : 'text-indigo-700'}`}>
                 {isAdminLoggedIn && !isEmbedMode ? 'Enseignant' : 'Élève'}
               </span>
               <span className="text-xs font-bold text-gray-700 leading-tight truncate max-w-[120px]">
                 {isAdminLoggedIn && !isEmbedMode ? 'Admin' : visitorDisplayName}
               </span>
            </div>
          </div>
        </header>

        <main className="flex-grow overflow-hidden relative">
          {view === 'admin' && isAdminLoggedIn && !isEmbedMode ? (
            <AdminView 
              knowledgeBase={currentSession?.knowledgeBase || { urls: [], videoLinks: [], files: [], rawTexts: [] }}
              onAddUrl={(url) => updateCurrentSession(s => ({...s, knowledgeBase: {...s.knowledgeBase, urls: [...s.knowledgeBase.urls, url]}}))}
              onRemoveUrl={(url) => updateCurrentSession(s => ({...s, knowledgeBase: {...s.knowledgeBase, urls: s.knowledgeBase.urls.filter(u => u.url !== url)}}))}
              onAddVideoLink={(v) => updateCurrentSession(s => ({...s, knowledgeBase: {...s.knowledgeBase, videoLinks: [...(s.knowledgeBase.videoLinks || []), v]}}))}
              onRemoveVideoLink={(url) => updateCurrentSession(s => ({...s, knowledgeBase: {...s.knowledgeBase, videoLinks: (s.knowledgeBase.videoLinks || []).filter(v => v.url !== url)}}))}
              onAddFile={(file) => updateCurrentSession(s => ({...s, knowledgeBase: {...s.knowledgeBase, files: [...s.knowledgeBase.files, file]}}))}
              onRemoveFile={(id) => updateCurrentSession(s => ({...s, knowledgeBase: {...s.knowledgeBase, files: s.knowledgeBase.files.filter(f => f.id !== id)}}))}
              onAddText={(text) => updateCurrentSession(s => ({...s, knowledgeBase: {...s.knowledgeBase, rawTexts: [...s.knowledgeBase.rawTexts, text]}}))}
              onRemoveText={(id) => updateCurrentSession(s => ({...s, knowledgeBase: {...s.knowledgeBase, rawTexts: s.knowledgeBase.rawTexts.filter(t => t.id !== id)}}))}
              onUpdateSession={(updates) => updateCurrentSession(s => ({...s, ...updates}))}
              onGoToChat={() => setView('chat')}
              allChatSessions={allChatSessions}
              activeChatSessionId={activeChatSessionId}
              onCreateNewChat={async (name) => {
                 const newS: ChatSession = { 
                   id: `chat-${Date.now()}`, 
                   name, 
                   knowledgeBase: {urls:[], videoLinks: [], files:[], rawTexts:[]}, 
                   chatMessages: [], 
                   assistantName: 'Bob',
                   modelName: 'gemini-3-flash-preview',
                   aiProvider: 'gemini'
                 };
                 await apiService.createSession(newS);
                 setAllChatSessions(p => [...p, newS]);
                 setActiveChatSessionId(newS.id);
              }}
              onDeleteChat={async (id) => {
                await apiService.deleteSession(id);
                setAllChatSessions(p => p.filter(s => s.id !== id));
              }}
              onAdminSelectChat={(id) => { setActiveChatSessionId(id); }}
            />
          ) : (
            <div className={`h-full mx-auto w-full p-4 flex flex-col ${isEmbedMode ? 'max-w-full' : 'max-w-5xl'}`}>
              {activeChatSessionId ? (
                <ChatInterface
                  messages={filteredChatMessages}
                  onSendMessage={(q) => handleSendMessage(q, activeChatSessionId)}
                  isLoading={isLoading}
                  placeholderText={`Posez votre question à ${currentAssistantName}...`}
                  assistantName={currentAssistantName}
                  session={currentSession}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
                  <Loader2 size={32} className="animate-spin text-indigo-500" />
                  <p className="font-bold">Initialisation de la leçon...</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showLogin && !isEmbedMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full">
            <h2 className="text-2xl font-black mb-6 text-center">Espace Enseignant</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="text" placeholder="Identifiant" className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:border-indigo-500" value={loginForm.id} onChange={e => setLoginForm({...loginForm, id: e.target.value})} />
              <input type="password" placeholder="Mot de passe" className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:border-indigo-500" value={loginForm.mdp} onChange={e => setLoginForm({...loginForm, mdp: e.target.value})} />
              {loginError && <p className="text-red-500 text-xs text-center">{loginError}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowLogin(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Annuler</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Connexion</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
