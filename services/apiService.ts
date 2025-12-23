
import { ChatSession } from '../types';

const API_BASE = '/api';
const LOCAL_STORAGE_KEY = 'pedagochat_sessions_local';

// État interne pour savoir si on utilise le serveur ou le local
let useLocalStorage = false;

const getLocalSessions = (): ChatSession[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLocalSessions = (sessions: ChatSession[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
};

export const apiService = {
  isLocalMode: () => useLocalStorage,

  async fetchSessions(): Promise<ChatSession[]> {
    try {
      const response = await fetch(`${API_BASE}/sessions`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      useLocalStorage = false;
      return data;
    } catch (error) {
      console.warn("Serveur inaccessible, bascule en mode Local (localStorage)");
      useLocalStorage = true;
      return getLocalSessions();
    }
  },

  async createSession(session: ChatSession): Promise<ChatSession> {
    if (useLocalStorage) {
      const sessions = getLocalSessions();
      sessions.push(session);
      saveLocalSessions(sessions);
      return session;
    }

    try {
      const response = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
      if (!response.ok) throw new Error();
      return response.json();
    } catch (error) {
      useLocalStorage = true;
      return this.createSession(session);
    }
  },

  async updateSession(id: string, updates: Partial<ChatSession>): Promise<ChatSession> {
    if (useLocalStorage) {
      const sessions = getLocalSessions();
      const index = sessions.findIndex(s => s.id === id);
      if (index !== -1) {
        sessions[index] = { ...sessions[index], ...updates };
        saveLocalSessions(sessions);
        return sessions[index];
      }
      throw new Error('Session non trouvée en local');
    }

    try {
      const response = await fetch(`${API_BASE}/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error();
      return response.json();
    } catch (error) {
      useLocalStorage = true;
      return this.updateSession(id, updates);
    }
  },

  async deleteSession(id: string): Promise<void> {
    if (useLocalStorage) {
      const sessions = getLocalSessions();
      const filtered = sessions.filter(s => s.id !== id);
      saveLocalSessions(filtered);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/sessions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error();
    } catch (error) {
      useLocalStorage = true;
      return this.deleteSession(id);
    }
  }
};
