import React, { useState } from 'react';
import { NftProjectAccount, SocialPost, NftItem } from '../types';
import { postService } from '../services/postService';
import { projectService } from '../services/projectService';
import { nftService } from '../services/nftService';
import { useAuth } from '../context/AuthContext';
import { PostCard } from '../components/social/PostCard';
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  Globe,
  Share2,
  Users,
  GitFork,
  ExternalLink,
  Layers,
  Calendar,
  Sparkles,
  Check,
} from 'lucide-react';

interface ProjectProfileViewProps {
  project: NftProjectAccount;
  onBack: () => void;
  onOpenReply?: (post: SocialPost) => void;
  onOpenQuote?: (post: SocialPost) => void;
  onSelectPost?: (post: SocialPost) => void;
  onSelectUser?: (username: string) => void;
  onSelectHashtag?: (tag: string) => void;
}

export const ProjectProfileView: React.FC<ProjectProfileViewProps> = ({
  project,
  onBack,
  onOpenReply,
  onOpenQuote,
  onSelectPost,
  onSelectUser,
  onSelectHashtag,
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'media' | 'nfts' | 'relays' | 'about'>('posts');
  const [isFollowing, setIsFollowing] = useState(() => {
    if (!currentUser) return false;
    return projectService.getFollowedProjectIds(currentUser.id).includes(project.id);
  });
  const [copiedShare, setCopiedShare] = useState(false);

  const handleToggleFollow = () => {
    if (!currentUser) return;
    const nowFollowing = projectService.toggleFollowProject(project.id, currentUser.id);
    setIsFollowing(nowFollowing);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  // Find posts by this project
  const projectPosts = postService.getUserPosts(project.username);

  return (
    <div className="min-h-screen bg-[#06070a] text-slate-100 border-x border-white/5 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#06070a]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              <span>{project.name}</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </h2>
            <p className="text-xs text-slate-400">NFT Project Identity</p>
          </div>
        </div>

        {copiedShare && (
          <span className="text-xs font-semibold text-cyan-400 animate-in fade-in">
            Link copied!
          </span>
        )}
      </div>

      {/* Project Banner & Logo Header */}
      <div className="relative">
        <div className="h-36 sm:h-52 bg-slate-900 overflow-hidden relative border-b border-white/5">
          <img
            src={project.banner}
            alt={project.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06070a] via-transparent to-black/30" />
        </div>

        <div className="px-5 pb-4">
          {/* Logo & Follow Action Row */}
          <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4">
            <div className="relative">
              <img
                src={project.logo}
                alt={project.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-[#06070a] shadow-xl border border-cyan-500/30"
              />
              <span className="absolute bottom-1 right-1 p-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                <Layers className="w-3 h-3" />
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-full border border-white/15 text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                title="Share Project"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleToggleFollow}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isFollowing
                    ? 'bg-purple-950/40 text-purple-300 border border-purple-500/40'
                    : 'bg-white text-slate-900 hover:bg-slate-200'
                }`}
              >
                {isFollowing ? (
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Following
                  </span>
                ) : (
                  'Follow'
                )}
              </button>
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">{project.name}</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                NFT PROJECT
              </span>

              {/* Verification Status Badge */}
              {project.collection?.verificationStatus === 'verified' ? (
                <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Collection
                </span>
              ) : project.collection?.verificationStatus === 'pending' ? (
                <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/30">
                  <Clock className="w-3 h-3" />
                  Verification Pending
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                  Community Project
                </span>
              )}
            </div>

            <p className="text-xs text-purple-400 font-semibold">@{project.username}</p>

            <p className="text-sm text-slate-300 pt-1 leading-relaxed">
              {project.description}
            </p>

            {/* Links & Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="text-slate-300 font-semibold">{project.category}</span>
              {project.website && (
                <a
                  href={project.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{new URL(project.website).hostname}</span>
                </a>
              )}
              {project.communityLink && (
                <a
                  href={project.communityLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-purple-300 hover:underline"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Community Guild</span>
                </a>
              )}
              <span className="flex items-center gap-1 text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>Founded 2026</span>
              </span>
            </div>

            {/* Social Metric Counters */}
            <div className="flex items-center gap-6 text-xs pt-3">
              <span>
                <strong className="text-white">{project.followersCount.toLocaleString()}</strong>{' '}
                <span className="text-slate-400">Followers</span>
              </span>
              <span>
                <strong className="text-white">{project.relaysCount}</strong>{' '}
                <span className="text-slate-400">Relays Co-Created</span>
              </span>
            </div>
          </div>
        </div>

        {/* Project Profile Tabs */}
        <div className="flex border-b border-white/10 text-xs font-bold uppercase tracking-wider overflow-x-auto">
          {(['posts', 'replies', 'media', 'nfts', 'relays', 'about'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-center transition-colors cursor-pointer shrink-0 px-3 ${
                activeTab === tab
                  ? 'text-white border-b-2 border-cyan-400'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === 'posts' && (
          <div className="divide-y divide-white/5">
            {projectPosts.length > 0 ? (
              projectPosts.map((post: SocialPost) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onSelectPost={onSelectPost}
                  onOpenReply={onOpenReply}
                  onOpenQuote={onOpenQuote}
                  onSelectUser={onSelectUser}
                  onSelectHashtag={onSelectHashtag}
                />
              ))
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs space-y-2">
                <Layers className="w-6 h-6 mx-auto text-slate-600" />
                <p>No posts from @{project.username} yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'replies' && (
          <div className="divide-y divide-white/5">
            {postService.getAllPosts().filter(
              (p: SocialPost) =>
                p.replyToUsername?.toLowerCase() === project.username.toLowerCase() ||
                (p.authorUsername.toLowerCase() === project.username.toLowerCase() && p.replyToId)
            ).length > 0 ? (
              postService
                .getAllPosts()
                .filter(
                  (p: SocialPost) =>
                    p.replyToUsername?.toLowerCase() === project.username.toLowerCase() ||
                    (p.authorUsername.toLowerCase() === project.username.toLowerCase() && p.replyToId)
                )
                .map((post: SocialPost) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onSelectPost={onSelectPost}
                    onOpenReply={onOpenReply}
                    onOpenQuote={onOpenQuote}
                    onSelectUser={onSelectUser}
                    onSelectHashtag={onSelectHashtag}
                  />
                ))
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs space-y-2">
                <p>No conversation replies involving @{project.username} yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <div className="p-4">
            {projectPosts.flatMap((p: SocialPost) => p.mediaUrls || []).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {projectPosts
                  .flatMap((p: SocialPost) => p.mediaUrls || [])
                  .map((url: string, i: number) => (
                    <div
                      key={i}
                      className="aspect-square bg-slate-900 rounded-xl overflow-hidden border border-white/5 group relative"
                    >
                      <img
                        src={url}
                        alt="Project media"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs space-y-2">
                <p>No media files uploaded by @{project.username} yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'nfts' && (
          <div className="p-4 space-y-4">
            {project.collection ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#090d1c] border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{project.collection.name}</h3>
                    <p className="text-xs text-slate-400">
                      {project.collection.itemsCount || 1000} Collection Pieces · Status:{' '}
                      <span className="capitalize text-cyan-300 font-semibold">
                        {project.collection.verificationStatus}
                      </span>
                    </p>
                  </div>
                  {project.collection.contractAddress && (
                    <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-3 py-1 rounded-lg">
                      {project.collection.contractAddress}
                    </span>
                  )}
                </div>

                {project.collection.verificationStatus === 'verified' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {nftService
                      .getAllNfts()
                      .filter(
                        (nft) =>
                          nft.collection.toLowerCase() === project.collection?.name.toLowerCase()
                      )
                      .map((nft: NftItem) => (
                        <div
                          key={nft.id}
                          className="rounded-2xl bg-[#0a0d1a] border border-white/10 overflow-hidden"
                        >
                          <img
                            src={nft.image}
                            alt={nft.name}
                            className="w-full aspect-square object-cover"
                          />
                          <div className="p-2.5">
                            <p className="text-xs font-bold text-white truncate">{nft.name}</p>
                            <p className="text-[10px] text-purple-400">{nft.relaysCount} Relays</p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-[#080b18] border border-white/10 text-center space-y-3">
                    <ShieldCheck className="w-8 h-8 text-amber-400/80 mx-auto" />
                    <h4 className="text-sm font-bold text-white">Verification-Ready Architecture</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Collection ownership is unverified. Mosaic does not claim on-chain smart contract ownership without verified cryptographic proof.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#090d1c] border border-white/10 text-center space-y-3">
                <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Collection Linked</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  This project has not connected an NFT collection yet. When connected, it can be submitted for verification.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'relays' && (
          <div className="p-4 space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-blue-950/40 border border-purple-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <GitFork className="w-4 h-4" />
                  Associated Relays ({project.relaysCount})
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  Living artifact forks initiated by {project.name}.
                </p>
              </div>
            </div>

            {project.relaysCount > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {nftService.getAllNfts().slice(0, project.relaysCount).map((nft: NftItem) => (
                  <div key={nft.id} className="p-3 rounded-2xl bg-[#0a0d1a] border border-white/10 flex items-center gap-3">
                    <img src={nft.image} alt={nft.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{nft.name}</p>
                      <p className="text-[11px] text-slate-400">{nft.collection}</p>
                      <span className="text-[10px] text-cyan-400 font-semibold">{nft.relaysCount} Collaborators</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <GitFork className="w-6 h-6 mx-auto text-slate-600" />
                <p>No active Relays co-created with @{project.username} yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="p-5 space-y-6 text-xs text-slate-300 leading-relaxed">
            <div className="p-4 rounded-2xl bg-[#090d1a] border border-white/10 space-y-3">
              <h4 className="text-sm font-bold text-white">Manifesto & Mission</h4>
              <p>{project.description}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#090d1a] border border-white/10 space-y-2">
              <h4 className="text-sm font-bold text-white">Project Identity & Provenance</h4>
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-500">Classification:</span>
                  <p className="font-semibold text-white">{project.category}</p>
                </div>
                <div>
                  <span className="text-slate-500">Verification Status:</span>
                  <p className="font-semibold text-cyan-400 capitalize">
                    {project.collection?.verificationStatus || 'Community Project'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
