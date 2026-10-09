import React, { useState } from 'react';
import { Search, X, User, Layers, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { nftService } from '../../services/nftService';
import { userService } from '../../services/userService';
import { projectService } from '../../services/projectService';
import { NftItem, NftProjectAccount } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNft: (nft: NftItem) => void;
  onSelectUser?: (username: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectNft,
  onSelectUser,
}) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'nfts' | 'creators' | 'projects'>('all');

  if (!isOpen) return null;

  const allProjects = projectService.getAllProjects();
  const allNfts = nftService.getAllNfts();
  const allCreators = userService.getAllUsers();

  const filteredNfts = allNfts.filter(
    (n) =>
      n.name.toLowerCase().includes(query.toLowerCase()) ||
      n.collection.toLowerCase().includes(query.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredCreators = allCreators.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.handle.toLowerCase().includes(query.toLowerCase()) ||
      c.bio.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProjects = allProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.username.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-[#0a0c16] border border-white/10 rounded-2xl p-6 shadow-2xl shadow-purple-950/50 z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-white/10 pb-4">
          <Search className="w-5 h-5 text-purple-400 mr-3 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search NFTs, creators, stories, and projects..."
            autoFocus
            className="w-full bg-transparent text-white placeholder-slate-500 text-base md:text-lg focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 py-3 border-b border-white/5 text-xs">
          {(['all', 'nfts', 'creators', 'projects'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-full capitalize font-medium transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'bg-purple-600/30 text-white border border-purple-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Results Scroll Area */}
        <div className="overflow-y-auto space-y-6 pt-4 flex-1">
          {/* NFTs Results */}
          {(activeTab === 'all' || activeTab === 'nfts') && filteredNfts.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                NFTs ({filteredNfts.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredNfts.map((nft) => (
                  <div
                    key={nft.id}
                    onClick={() => {
                      onSelectNft(nft);
                      onClose();
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer group"
                  >
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-12 h-12 rounded-lg object-cover bg-slate-800 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                        {nft.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{nft.collection}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Creators Results */}
          {(activeTab === 'all' || activeTab === 'creators') && filteredCreators.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-purple-400" />
                Creators ({filteredCreators.length})
              </h4>
              <div className="space-y-1.5">
                {filteredCreators.map((creator) => (
                  <div
                    key={creator.id}
                    onClick={() => {
                      if (onSelectUser) onSelectUser(creator.handle.replace('@', ''));
                      onClose();
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
                  >
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-purple-500/20"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{creator.name}</p>
                        <span className="text-xs text-slate-400">{creator.handle}</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{creator.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects Results */}
          {(activeTab === 'all' || activeTab === 'projects') && filteredProjects.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                NFT Projects ({filteredProjects.length})
              </h4>
              <div className="space-y-1.5">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => {
                      if (onSelectUser) onSelectUser(project.username);
                      onClose();
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-cyan-500/20 transition-colors cursor-pointer group"
                  >
                    <img
                      src={project.logo}
                      alt={project.name}
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-cyan-500/30"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
                          {project.name}
                        </p>
                        <span className="text-xs text-purple-400">@{project.username}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-bold">
                          {project.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{project.description}</p>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {project.followersCount.toLocaleString()} followers
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredNfts.length === 0 && filteredCreators.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">
              No results found for &ldquo;{query}&rdquo;. Try &ldquo;Contrarian&rdquo;, &ldquo;Sarah&rdquo;, or &ldquo;Relay&rdquo;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
