import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Lock,
  Sparkles,
  Users,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { projectService } from '../../services/projectService';

interface MessagesViewProps {
  onNavigate: (route: string) => void;
  onOpenQuickPost?: () => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  onNavigate,
  onOpenQuickPost,
}) => {
  const { currentUser } = useAuth();
  const [searchFilter, setSearchFilter] = useState('');
  const projects = projectService.getAllProjects();

  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#06070a]/90 backdrop-blur-md border-b border-white/10 px-4 py-3.5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            <span>Messages</span>
          </h1>
          <p className="text-xs text-slate-400">
            Encrypted direct communications for curators, collectors, and project founders
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-full">
          <Lock className="w-3 h-3" />
          <span>E2E Encrypted</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search messages or conversations..."
            className="w-full bg-[#080b18] border border-white/10 hover:border-white/20 focus:border-cyan-400 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Staged Rollout Notice */}
      <div className="mx-4 p-4 rounded-2xl bg-[#090d1f] border border-cyan-500/20 space-y-2">
        <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Staged Access Rollout</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Direct messaging is currently rolling out in batches to verified NFT project accounts and active living relay contributors. Public posts, thread replies, and project lore discussions remain fully active for all community members.
        </p>
      </div>

      {/* Empty State / Inbox Placeholder */}
      <div className="mx-4 p-8 rounded-2xl bg-[#080a14] border border-white/5 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto shadow-md">
          <MessageSquare className="w-6 h-6" />
        </div>

        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="text-sm font-bold text-white">No active conversations</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Connect with NFT project founders, curators, and collectors directly through public discussions in the feed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('/community')}
            className="w-full sm:w-auto h-9 px-4 rounded-full bg-white text-slate-950 hover:bg-slate-200 text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Discover Project Guilds</span>
          </button>

          <button
            type="button"
            onClick={onOpenQuickPost || (() => onNavigate('/home'))}
            className="w-full sm:w-auto h-9 px-4 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Start a Public Discussion</span>
          </button>
        </div>
      </div>

      {/* Suggested Curators to Connect With */}
      <div className="px-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Featured Community Guilds
        </h3>

        <div className="space-y-2">
          {projects.slice(0, 3).map((proj) => (
            <div
              key={proj.id}
              onClick={() => onNavigate(`/community`)}
              className="p-3 rounded-xl bg-[#080a14] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={proj.logo}
                  alt={proj.name}
                  className="w-9 h-9 rounded-xl object-cover shrink-0 border border-white/10"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                    {proj.name}
                  </p>
                  <p className="text-[11px] text-purple-400 truncate">@{proj.username}</p>
                </div>
              </div>

              <span className="text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                View →
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
