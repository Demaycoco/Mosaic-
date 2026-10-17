import React from 'react';
import { projectService } from '../../services/projectService';
import { NftProjectAccount } from '../../types';
import {
  ExternalLink,
  Layers,
  Sparkles,
  ShieldCheck,
  Plus,
} from 'lucide-react';

interface UserBioExtrasProps {
  xLink?: string;
  instagramLink?: string;
  tiktokLink?: string;
  website?: string;
  nftCommunities?: string[];
  isOwnProfile?: boolean;
  onOpenEditCommunities?: () => void;
  onSelectProject?: (projectUsername: string) => void;
}

export const UserBioExtras: React.FC<UserBioExtrasProps> = ({
  xLink,
  instagramLink,
  tiktokLink,
  website,
  nftCommunities = [],
  isOwnProfile = false,
  onOpenEditCommunities,
  onSelectProject,
}) => {
  const hasSocials = !!(xLink || instagramLink || tiktokLink || website);

  // Look up full project details for the community IDs
  const allProjects = projectService.getAllProjects();
  const joinedCommunities: NftProjectAccount[] = nftCommunities
    .map((idOrHandle) =>
      allProjects.find(
        (p) => p.id === idOrHandle || p.username.toLowerCase() === idOrHandle.toLowerCase()
      )
    )
    .filter(Boolean) as NftProjectAccount[];

  // Helper to extract clean handle for display
  const getDisplayHandle = (urlOrHandle: string, platform: string) => {
    try {
      if (urlOrHandle.startsWith('http://') || urlOrHandle.startsWith('https://')) {
        const u = new URL(urlOrHandle);
        const parts = u.pathname.split('/').filter(Boolean);
        return parts.length > 0 ? `@${parts[parts.length - 1]}` : platform;
      }
      return urlOrHandle.startsWith('@') ? urlOrHandle : `@${urlOrHandle}`;
    } catch {
      return urlOrHandle;
    }
  };

  return (
    <div className="space-y-3.5 pt-2">
      {/* 1. SOCIAL MEDIA LINKS ROW */}
      {hasSocials && (
        <div className="flex flex-wrap items-center gap-2">
          {/* X (Twitter) */}
          {xLink && (
            <a
              href={xLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 hover:bg-black text-slate-200 hover:text-white border border-white/10 hover:border-white/30 text-xs font-semibold transition-all group shadow-sm"
              title="Visit X profile"
            >
              <span className="font-extrabold text-[12px] leading-none text-white">𝕏</span>
              <span className="group-hover:text-cyan-300 transition-colors">
                {getDisplayHandle(xLink, 'X')}
              </span>
              <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300 ml-0.5" />
            </a>
          )}

          {/* Instagram */}
          {instagramLink && (
            <a
              href={instagramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-950/40 via-rose-950/40 to-amber-950/40 hover:from-purple-950/70 hover:to-rose-950/70 text-rose-200 hover:text-white border border-rose-500/20 hover:border-rose-500/40 text-xs font-semibold transition-all group shadow-sm"
              title="Visit Instagram profile"
            >
              <span className="text-[12px] leading-none">📸</span>
              <span className="group-hover:text-rose-300 transition-colors">
                {getDisplayHandle(instagramLink, 'Instagram')}
              </span>
              <ExternalLink className="w-3 h-3 text-rose-400/60 group-hover:text-rose-300 ml-0.5" />
            </a>
          )}

          {/* TikTok */}
          {tiktokLink && (
            <a
              href={tiktokLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 hover:bg-cyan-950/40 text-cyan-200 hover:text-white border border-cyan-500/20 hover:border-cyan-400/40 text-xs font-semibold transition-all group shadow-sm"
              title="Visit TikTok profile"
            >
              <span className="text-[12px] leading-none">🎵</span>
              <span className="group-hover:text-cyan-300 transition-colors">
                {getDisplayHandle(tiktokLink, 'TikTok')}
              </span>
              <ExternalLink className="w-3 h-3 text-cyan-400/60 group-hover:text-cyan-300 ml-0.5" />
            </a>
          )}

          {/* Website */}
          {website && (
            <a
              href={website.startsWith('http') ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all group"
            >
              <span className="text-xs">🌐</span>
              <span className="truncate max-w-[140px]">{website.replace(/^https?:\/\//, '')}</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          )}
        </div>
      )}

      {/* 2. NFT COMMUNITIES ON MOSAIC SECTION */}
      <div className="pt-1">
        <div className="flex items-center justify-between pb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Communities on Mosaic</span>
          </span>

          {isOwnProfile && onOpenEditCommunities && (
            <button
              type="button"
              onClick={onOpenEditCommunities}
              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>{joinedCommunities.length === 0 ? 'Add Communities' : 'Edit'}</span>
            </button>
          )}
        </div>

        {joinedCommunities.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {joinedCommunities.map((community) => (
              <div
                key={community.id}
                onClick={() => onSelectProject && onSelectProject(community.username)}
                className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-xl bg-[#090d1f] hover:bg-[#0e1329] border border-cyan-500/20 hover:border-cyan-400/40 transition-all cursor-pointer group shadow-sm"
                title={`View ${community.name} channel on Mosaic`}
              >
                <img
                  src={community.logo}
                  alt={community.name}
                  className="w-5 h-5 rounded-lg object-cover ring-1 ring-white/10"
                />
                <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  {community.name}
                </span>
                <span className="text-[10px] text-purple-400">@{community.username}</span>
              </div>
            ))}
          </div>
        ) : (
          isOwnProfile && (
            <div
              onClick={onOpenEditCommunities}
              className="p-3 rounded-2xl border border-dashed border-white/10 hover:border-cyan-500/30 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Sparkles className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
                <span>Add your NFT communities on Mosaic to display them on your profile</span>
              </div>
              <span className="text-xs font-bold text-cyan-400 group-hover:underline">
                Select Guilds →
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
};
