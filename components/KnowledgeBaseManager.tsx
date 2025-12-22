
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, X, Video, ExternalLink, Play } from 'lucide-react';
import { URLGroup } from '../types';

interface KnowledgeBaseManagerProps {
  urls: string[];
  onAddUrl: (url: string) => void;
  onRemoveUrl: (url: string) => void;
  maxUrls?: number;
  urlGroups: URLGroup[];
  activeUrlGroupId: string;
  onSetGroupId: (id: string) => void;
  onCloseSidebar?: () => void;
}

const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({ 
  urls, 
  onAddUrl, 
  onRemoveUrl, 
  maxUrls = 20,
  urlGroups,
  activeUrlGroupId,
  onSetGroupId,
  onCloseSidebar,
}) => {
  const [currentUrlInput, setCurrentUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  const isVideoUrl = (url: string): boolean => {
    const videoPatterns = [/youtube\.com/, /youtu\.be/, /vimeo\.com/, /\.mp4$/, /\.webm$/, /\.mov$/];
    return videoPatterns.some(pattern => pattern.test(url));
  };

  const handleAddUrl = () => {
    if (!currentUrlInput.trim()) {
      setError('L\'URL ne peut pas être vide.');
      return;
    }
    if (!isValidUrl(currentUrlInput)) {
      setError('Format d\'URL invalide.');
      return;
    }
    if (urls.length >= maxUrls) {
      setError(`Maximum ${maxUrls} URLs.`);
      return;
    }
    if (urls.includes(currentUrlInput)) {
      setError('URL déjà ajoutée.');
      return;
    }
    onAddUrl(currentUrlInput);
    setCurrentUrlInput('');
    setError(null);
  };

  return (
    <div className="p-4 bg-[#161616] shadow-2xl rounded-2xl h-full flex flex-col border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Hub de Savoir</h2>
        {onCloseSidebar && (
          <button onClick={onCloseSidebar} className="p-1 text-white/40 hover:text-white md:hidden">
            <X size={20} />
          </button>
        )}
      </div>
      
      <div className="mb-4">
        <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Groupe Actif</label>
        <div className="relative">
          <select
            value={activeUrlGroupId}
            onChange={(e) => onSetGroupId(e.target.value)}
            className="w-full py-2.5 pl-3 pr-10 appearance-none bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-sm transition-all"
          >
            {urlGroups.map(group => (
              <option key={group.id} value={group.id} className="bg-[#161616]">{group.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input
          type="url"
          value={currentUrlInput}
          onChange={(e) => setCurrentUrlInput(e.target.value)}
          placeholder="Coller URL doc ou vidéo..."
          className="flex-grow h-10 py-1 px-3 bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none text-sm transition-all"
          onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
        />
        <button
          onClick={handleAddUrl}
          disabled={urls.length >= maxUrls}
          className="h-10 w-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:bg-white/10 shadow-lg shadow-blue-900/20"
        >
          <Plus size={18} />
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mb-2 px-1">{error}</p>}
      
      <div className="flex-grow overflow-y-auto space-y-2 chat-container pr-1">
        {urls.length === 0 && (
          <div className="text-center py-10 opacity-30">
            <p className="text-sm">Groupe vide.</p>
          </div>
        )}
        {urls.map((url) => {
          const video = isVideoUrl(url);
          return (
            <div key={url} className={`group flex flex-col p-3 rounded-xl border transition-all ${video ? 'bg-indigo-500/5 border-indigo-500/10' : 'bg-white/5 border-white/5'}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {video ? <Video size={14} className="text-indigo-400 shrink-0" /> : <ExternalLink size={14} className="text-blue-400 shrink-0" />}
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium truncate text-white/70 hover:text-white transition-colors" title={url}>
                    {url}
                  </a>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   {video && (
                    <a href={url} target="_blank" className="p-1.5 text-white/40 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg">
                      <Play size={14} />
                    </a>
                   )}
                   <button onClick={() => onRemoveUrl(url)} className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {video && <span className="text-[9px] font-bold text-indigo-400/60 uppercase mt-1">Ressource Vidéo</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KnowledgeBaseManager;
