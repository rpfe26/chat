
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChatMessage, MessageSender, AppView, UrlItem, KnowledgeFile, KnowledgeText, ChatSession } from './types';
import { generateContentWithUrlContext } from './services/geminiService';
import { apiService } from './services/apiService';
import ChatInterface from './components/ChatInterface';
import AdminView from './components/AdminView';
import Sidebar from './components/Sidebar';
import { GraduationCap, CloudCheck, Sparkles, Loader2, Database, User, ShieldCheck, Lock } from 'lucide-react';

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

  // Récupération de l'identité via URL (WordPress) ou LocalStorage
  const { visitorId, visitorDisplayName } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
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

  const [embedMode, setEmbedMode] = useState(false);
  const [embedSessionId, setEmbedSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier si déjà connecté en admin
    const authStatus = sessionStorage.getItem('pedagochat_admin_auth');
    if (authStatus === 'true') setIsAdminLoggedIn(true);

    const handleHashChange = () => {
      const hash = window.location.hash;
      const embedMatch = hash.match(/^#\/embed\/(.+)$/);
      if (embedMatch && embedMatch[1]) {
        const idPart = embedMatch[1].split('?')[0];
        setEmbedMode(true);
        setEmbedSessionId(idPart);
      } else {
        setEmbedMode(false);
        setEmbedSessionId(null);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const sessions = await apiService.fetchSessions();
        setAllChatSessions(sessions);
        const localMode = apiService.isLocalMode();
        setIsLocalMode(localMode);
        setIsServerConnected(!localMode);
        
        if (sessions.length > 0 && !activeChatSessionId) {
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
  }, [activeChatSessionId]);

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
      const response = await generateContentWithUrlContext(query, targetSession.knowledgeBase);
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
        <p className="font-bold animate-pulse">Chargement de PedagoChat...</p>
      </div>
    );
  }

  if (embedMode) {
    const embeddedSession = allChatSessions.find(s => s.id === embedSessionId);
    if (embeddedSession) {
      const sessionMessages = embeddedSession.chatMessages.filter(m => m.visitorId === visitorId || m.sender === MessageSender.SYSTEM);
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-50 p-4">
          <ChatInterface
            messages={sessionMessages}
            onSendMessage={(query) => handleSendMessage(query, embeddedSession.id)}
            isLoading={isLoading}
            placeholderText="Posez votre question..."
            assistantName={embeddedSession.assistantName}
          />
        </div>
      );
    }
    return <div className="h-screen flex items-center justify-center">Session introuvable</div>;
  }

  return (
    <div className="h-screen bg-gray-50 text-gray-900 flex font-sans overflow-hidden">
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

      <div className="flex flex-col flex-grow overflow-hidden">
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <GraduationCap className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter text-gray-900 uppercase">PEDAGOCHAT</h1>
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 ${isServerConnected ? 'text-green-600' : 'text-amber-500'}`}>
                  {isSyncing ? <Loader2 size={10} className="animate-spin" /> : isServerConnected ? <CloudCheck size={10} /> : <Database size={10} />}
                  <span className="text-[9px] uppercase font-bold">
                    {isServerConnected ? 'Connecté au serveur' : 'Mode Local'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${isAdminLoggedIn ? 'bg-purple-50 border-purple-100' : 'bg-indigo-50 border-indigo-100'}`}>
            {isAdminLoggedIn ? <ShieldCheck size={14} className="text-purple-500" /> : <User size={14} className="text-indigo-500" />}
            <div className="flex flex-col">
               <span className={`text-[10px] font-black uppercase tracking-tighter leading-none ${isAdminLoggedIn ? 'text-purple-700' : 'text-indigo-700'}`}>
                 {isAdminLoggedIn ? 'Rôle : Administrateur' : 'Connecté en tant que'}
               </span>
               <span className="text-xs font-bold text-gray-700 leading-tight">
                 {isAdminLoggedIn ? 'Administrateur' : visitorDisplayName}
               </span>
            </div>
          </div>
        </header>

        <main className="flex-grow overflow-hidden relative">
          {view === 'admin' && isAdminLoggedIn ? (
            <AdminView 
              knowledgeBase={currentSession?.knowledgeBase || { urls: [], files: [], rawTexts: [] }}
              onAddUrl={(url) => updateCurrentSession(s => ({...s, knowledgeBase: {...s.knowledgeBase, urls: [...s.knowledgeBase.urls, url]}}))}
              onRemoveUrl={(url) => updateCurrentSession(s => ({...s, knowledgeBase: {...s.knowledgeBase, urls: s.knowledgeBase.urls.filter(u => u.url !== url)}}))}
              onAddFile={(file) => updateCurrentSession(s => ({...s, knowledgeBase: {...s.knowledgeBase, files: [...s.knowledgeBase.files, file]}}))}
              onRemoveFile={(id) => updateCurrentSession(s => ({...s, knowledgeBase: {...s.knowledgeBase, files: s.knowledgeBase.files.filter(f => f.id !== id)}}))}
              onAddText={(text) => updateCurrentSession(s => ({...s, knowledgeBase: {...s.knowledgeBase, rawTexts: [...s.knowledgeBase.rawTexts, text]}}))}
              onRemoveText={(id) => updateCurrentSession(s => ({...s, knowledgeBase: {...s.knowledgeBase, rawTexts: s.knowledgeBase.rawTexts.filter(t => t.id !== id)}}))}
              onGoToChat={() => setView('chat')}
              allChatSessions={allChatSessions}
              activeChatSessionId={activeChatSessionId}
              onCreateNewChat={async (name) => {
                 const newS: ChatSession = { id: `chat-${Date.now()}`, name, knowledgeBase: {urls:[], files:[], rawTexts:[]}, chatMessages: [], assistantName: 'Bob' };
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
            <div className="h-full max-w-5xl mx-auto w-full p-4 flex flex-col">
              {activeChatSessionId ? (
                <ChatInterface
                  messages={filteredChatMessages}
                  onSendMessage={(q) => handleSendMessage(q, activeChatSessionId)}
                  isLoading={isLoading}
                  placeholderText={`Posez votre question à ${currentAssistantName}...`}
                  assistantName={currentAssistantName}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-center opacity-50">
                  <div>
                    <Sparkles size={48} className="mx-auto mb-4 text-indigo-400" />
                    <p>Sélectionnez une session dans la barre latérale</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modal Login */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Espace Admin</h2>
              <p className="text-gray-500 text-sm">Veuillez vous authentifier</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Identifiant</label>
                <input 
                  type="text" 
                  autoFocus
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all"
                  value={loginForm.id}
                  onChange={e => setLoginForm({...loginForm, id: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">Mot de passe</label>
                <input 
                  type="password" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all"
                  value={loginForm.mdp}
                  onChange={e => setLoginForm({...loginForm, mdp: e.target.value})}
                />
              </div>
              
              {loginError && <p className="text-red-500 text-[10px] font-bold text-center">{loginError}</p>}
              
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowLogin(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                  Connexion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
