import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  ShieldCheck,
  Check,
  Sparkles,
  Search,
  ExternalLink,
  MessageSquare,
  Lock,
  ArrowLeft,
  Settings,
  X,
  FileText,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';
import { SocialCommunity, SocialPost } from '../../types';
import { communityService } from '../../services/communityService';
import { postService } from '../../services/postService';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { PostCard } from './PostCard';
import { PostComposer } from './PostComposer';

interface CommunitiesViewProps {
  onSelectPost?: (post: SocialPost) => void;
  onSelectUser?: (username: string) => void;
  onOpenReply?: (post: SocialPost) => void;
  onOpenQuote?: (post: SocialPost) => void;
  initialCommunityHandle?: string | null;
}

const CATEGORIES = [
  'All',
  'Generative Art',
  'Living Lore',
  'Wearables & Fashion',
  'Identity & Avatars',
  'Creator Guilds',
];

export const CommunitiesView: React.FC<CommunitiesViewProps> = ({
  onSelectPost,
  onSelectUser,
  onOpenReply,
  onOpenQuote,
  initialCommunityHandle,
}) => {
  const { currentUser } = useAuth();
  const [communities, setCommunities] = useState<SocialCommunity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCommunity, setActiveCommunity] = useState<SocialCommunity | null>(null);
  const [communityPosts, setCommunityPosts] = useState<SocialPost[]>([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Form states for creating a community
  const [createName, setCreateName] = useState('');
  const [createHandle, setCreateHandle] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createCategory, setCreateCategory] = useState('Creator Guilds');
  const [createAvatar, setCreateAvatar] = useState('');
  const [createCover, setCreateCover] = useState('');
  const [createPostingPermission, setCreatePostingPermission] = useState<'all' | 'members' | 'admins'>('members');
  const [createError, setCreateError] = useState<string | null>(null);

  // Form states for editing admin settings
  const [editDesc, setEditDesc] = useState('');
  const [editPostingPermission, setEditPostingPermission] = useState<'all' | 'members' | 'admins'>('members');
  const [editRules, setEditRules] = useState<string[]>([]);
  const [newRuleInput, setNewRuleInput] = useState('');

  // Load communities
  const refreshCommunities = () => {
    setCommunities(communityService.getAllCommunities());
    if (activeCommunity) {
      const refreshed = communityService.getCommunityById(activeCommunity.id);
      if (refreshed) {
        setActiveCommunity(refreshed);
        setCommunityPosts(communityService.getCommunityPosts(refreshed.id));
      }
    }
  };

  useEffect(() => {
    const unsubscribe = communityService.subscribe((list) => {
      setCommunities(list);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (initialCommunityHandle) {
      const found = communityService.getCommunityByHandle(initialCommunityHandle);
      if (found) {
        handleOpenCommunity(found);
      }
    }
  }, [initialCommunityHandle]);

  const handleOpenCommunity = (comm: SocialCommunity) => {
    setActiveCommunity(comm);
    setCommunityPosts(communityService.getCommunityPosts(comm.id));
    setEditDesc(comm.description);
    setEditPostingPermission(comm.postingPermission);
    setEditRules(comm.rules || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setActiveCommunity(null);
    setCommunityPosts([]);
  };

  const handleToggleJoin = async (comm: SocialCommunity) => {
    if (!currentUser) {
      alert('Please sign in to join communities.');
      return;
    }
    const isMember = comm.memberIds.includes(currentUser.id);
    if (isMember) {
      const updated = await communityService.leaveCommunity(comm.id, currentUser.id);
      if (activeCommunity?.id === comm.id) setActiveCommunity(updated);
    } else {
      const updated = await communityService.joinCommunity(comm.id, currentUser.id, {
        name: currentUser.displayName,
        username: currentUser.username,
        photoURL: currentUser.photoURL,
      });
      if (activeCommunity?.id === comm.id) setActiveCommunity(updated);
    }
    refreshCommunities();
  };

  const handleCreateCommunitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setCreateError(null);

    try {
      const created = await communityService.createCommunity({
        name: createName,
        handle: createHandle,
        description: createDesc,
        category: createCategory,
        avatarUrl: createAvatar,
        coverUrl: createCover,
        postingPermission: createPostingPermission,
        creatorId: currentUser.id,
        creatorName: currentUser.displayName,
      });

      setIsCreateModalOpen(false);
      setCreateName('');
      setCreateHandle('');
      setCreateDesc('');
      setCreateAvatar('');
      setCreateCover('');
      handleOpenCommunity(created);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create community.');
    }
  };

  const handleSaveAdminSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeCommunity) return;

    try {
      const updated = await communityService.updateCommunitySettings(
        activeCommunity.id,
        {
          description: editDesc,
          postingPermission: editPostingPermission,
          rules: editRules,
        },
        currentUser.id
      );
      setActiveCommunity(updated);
      setIsAdminSettingsOpen(false);
      refreshCommunities();
    } catch (err: any) {
      alert(err.message || 'Failed to update community settings.');
    }
  };

  const handleAddRule = () => {
    if (newRuleInput.trim()) {
      setEditRules([...editRules, newRuleInput.trim()]);
      setNewRuleInput('');
    }
  };

  const handleRemoveRule = (index: number) => {
    setEditRules(editRules.filter((_, i) => i !== index));
  };

  // Filter list
  const filteredCommunities = communities.filter((c) => {
    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  /* ------------------------------------------------------------- */
  /* DETAIL VIEW FOR A SINGLE COMMUNITY                            */
  /* ------------------------------------------------------------- */
  if (activeCommunity) {
    const isMember = currentUser ? activeCommunity.memberIds.includes(currentUser.id) : false;
    const isAdmin = currentUser ? communityService.isAdmin(activeCommunity.id, currentUser.id) : false;
    const canPostStatus = communityService.canPost(activeCommunity.id, currentUser?.id);

    return (
      <div className="space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5 bg-[#05060b]/80 backdrop-blur-md sticky top-0 z-20">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Communities</span>
          </button>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setIsAdminSettingsOpen(true)}
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold text-cyan-300 border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Admin Controls</span>
              </button>
            )}

            <button
              onClick={() => handleToggleJoin(activeCommunity)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isMember
                  ? 'bg-purple-950/40 text-purple-300 border border-purple-500/40 hover:bg-rose-950/30 hover:text-rose-300 hover:border-rose-500/40'
                  : 'bg-white text-slate-950 hover:bg-slate-200'
              }`}
            >
              {isMember ? 'Joined (Leave)' : 'Join Community'}
            </button>
          </div>
        </div>

        {/* Cover & Profile Header */}
        <div className="relative border-b border-white/10 bg-[#090b16]">
          {/* Banner */}
          <div className="h-36 sm:h-52 bg-slate-900 relative overflow-hidden">
            {activeCommunity.coverUrl ? (
              <img
                src={activeCommunity.coverUrl}
                alt={activeCommunity.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-purple-950 via-cyan-950 to-slate-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#090b16] via-transparent to-black/30" />
          </div>

          <div className="px-5 pb-5 -mt-12 sm:-mt-16 space-y-4 relative">
            <div className="flex justify-between items-end">
              <img
                src={activeCommunity.avatarUrl}
                alt={activeCommunity.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-[#090b16] shadow-2xl border border-cyan-500/30"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">{activeCommunity.name}</h1>
                {activeCommunity.isVerified ? (
                  <span title="Verified Creator Collective">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                    Community
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-purple-400">c/{activeCommunity.handle}</p>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {activeCommunity.description}
              </p>

              {/* Badges & Statistics */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400 border-t border-white/5">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold">
                  {activeCommunity.category}
                </span>

                <button
                  onClick={() => setShowMembersModal(true)}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-semibold text-slate-300"
                >
                  <strong className="text-white">{activeCommunity.membersCount}</strong> Members
                </button>

                <span>·</span>

                <span>
                  <strong className="text-white">{communityPosts.length}</strong> Posts
                </span>

                <span>·</span>

                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Created {new Date(activeCommunity.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </span>
              </div>
            </div>

            {/* Community Rules Box */}
            {activeCommunity.rules && activeCommunity.rules.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-white text-[11px] uppercase tracking-wider">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Community Guidelines</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-xs">
                  {activeCommunity.rules.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Post Composer for Community */}
        <div className="px-4 sm:px-6">
          {canPostStatus.allowed ? (
            <div className="rounded-2xl border border-white/10 bg-[#06070a] overflow-hidden shadow-lg">
              <div className="px-4 py-2 border-b border-white/5 text-xs text-slate-400 flex items-center justify-between">
                <span>Publishing into <strong className="text-white">{activeCommunity.name}</strong></span>
                <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
                  Permission: {activeCommunity.postingPermission}
                </span>
              </div>
              <PostComposer
                placeholder={`Share an update or artwork with c/${activeCommunity.handle}...`}
                onPostCreated={() => {
                  setCommunityPosts(communityService.getCommunityPosts(activeCommunity.id));
                }}
              />
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-slate-400 text-center space-y-2">
              <Lock className="w-5 h-5 text-slate-500 mx-auto" />
              <p className="font-semibold text-slate-300">{canPostStatus.reason}</p>
              {!isMember && currentUser && (
                <button
                  onClick={() => handleToggleJoin(activeCommunity)}
                  className="px-4 py-1.5 rounded-full bg-white text-slate-900 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Join to Publish
                </button>
              )}
            </div>
          )}
        </div>

        {/* Community Feed */}
        <div className="px-4 sm:px-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Community Feed</span>
            </h2>
            <span className="text-xs text-slate-500">{communityPosts.length} posts</span>
          </div>

          {communityPosts.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-1" />
              <h3 className="text-base font-bold text-white">No discussions yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Be the first to share an art drop, creative update, or discuss new NFT mechanics in this community!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {communityPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onSelectPost={onSelectPost}
                  onSelectUser={onSelectUser}
                  onOpenReply={onOpenReply}
                  onOpenQuote={onOpenQuote}
                />
              ))}
            </div>
          )}
        </div>

        {/* Admin Settings Modal */}
        {isAdminSettingsOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsAdminSettingsOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#090b16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-cyan-400" />
                  <span>Admin Settings: {activeCommunity.name}</span>
                </h3>
                <button
                  onClick={() => setIsAdminSettingsOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAdminSettings} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Who Can Post</label>
                  <select
                    value={editPostingPermission}
                    onChange={(e: any) => setEditPostingPermission(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#0d1020] border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="members">Joined Members Only (Recommended)</option>
                    <option value="all">Anyone on Mosaic</option>
                    <option value="admins">Designated Administrators Only</option>
                  </select>
                </div>

                {/* Rules Editor */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Community Rules</label>
                  <div className="space-y-1.5">
                    {editRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/5 text-xs text-slate-300">
                        <span>{rule}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRule(idx)}
                          className="text-rose-400 hover:text-rose-300 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newRuleInput}
                      onChange={(e) => setNewRuleInput(e.target.value)}
                      placeholder="Add a new guideline..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddRule}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsAdminSettingsOpen(false)}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Member List Modal */}
        {showMembersModal && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowMembersModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#090b16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Members ({activeCommunity.membersCount})</span>
                </h3>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {activeCommunity.memberIds.map((memberId) => (
                  <div key={memberId} className="flex items-center justify-between p-2 rounded-xl bg-white/5">
                    <span className="text-xs font-semibold text-white truncate">{memberId}</span>
                    {activeCommunity.adminIds.includes(memberId) && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Admin
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ------------------------------------------------------------- */
  /* DISCOVERY / LIST VIEW FOR COMMUNITIES                         */
  /* ------------------------------------------------------------- */
  return (
    <div className="p-4 sm:p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>Communities & Guilds</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Discover decentralized creative hubs, narrative worldbuilding clubs, and token guilds
          </p>
        </div>

        <button
          onClick={() => {
            if (!currentUser) {
              alert('Please sign in to launch a community.');
              return;
            }
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:opacity-95 text-slate-950 font-bold text-xs transition-opacity shadow-lg shadow-purple-900/30 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          <span>Launch Community</span>
        </button>
      </div>

      {/* Search & Categories */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search communities by name, topic, or handle..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Community Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCommunities.map((comm) => {
          const isMember = currentUser ? comm.memberIds.includes(currentUser.id) : false;

          return (
            <div
              key={comm.id}
              onClick={() => handleOpenCommunity(comm)}
              className="rounded-2xl bg-[#090c1a] border border-white/10 hover:border-cyan-500/40 transition-all overflow-hidden group flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-cyan-950/20"
            >
              {/* Mini Cover */}
              <div className="h-24 bg-slate-900 relative overflow-hidden">
                {comm.coverUrl ? (
                  <img
                    src={comm.coverUrl}
                    alt={comm.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-purple-950 via-cyan-950 to-slate-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#090c1a] via-transparent to-black/30" />
              </div>

              {/* Body */}
              <div className="p-4 pt-0 -mt-8 space-y-3 relative flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-end justify-between gap-2">
                    <img
                      src={comm.avatarUrl}
                      alt={comm.name}
                      className="w-16 h-16 rounded-2xl object-cover ring-4 ring-[#090c1a] shadow-xl border border-cyan-500/30"
                      loading="lazy"
                    />

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleJoin(comm);
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        isMember
                          ? 'bg-purple-950/40 text-purple-300 border border-purple-500/40'
                          : 'bg-white text-slate-950 hover:bg-slate-200'
                      }`}
                    >
                      {isMember ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Joined
                        </span>
                      ) : (
                        'Join'
                      )}
                    </button>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {comm.name}
                      </h3>
                      {comm.isVerified && (
                        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" title="Verified Community" />
                      )}
                    </div>
                    <p className="text-xs text-purple-400 font-mono">c/{comm.handle}</p>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                    {comm.description}
                  </p>
                </div>

                {/* Footer Stats */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="px-2 py-0.5 rounded-full bg-cyan-950/40 text-cyan-300 border border-cyan-500/20">
                    {comm.category}
                  </span>
                  <span>{comm.membersCount} members</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCommunities.length === 0 && (
        <div className="py-20 text-center space-y-2">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-1" />
          <h3 className="text-base font-bold text-white">No communities found</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Try adjusting your search query or launch a brand new collective!
          </p>
        </div>
      )}

      {/* Create Community Modal */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#090b16] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 text-slate-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Launch New Community</span>
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCommunitySubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Community Name *</label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Generative Shaders Collective"
                  className="w-full px-3.5 py-2 rounded-2xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Handle / URL Slug *</label>
                <div className="flex items-center px-3.5 py-2 rounded-2xl bg-black/40 border border-white/10 text-xs">
                  <span className="text-slate-500 font-mono">c/</span>
                  <input
                    type="text"
                    required
                    value={createHandle}
                    onChange={(e) => setCreateHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="shader-collective"
                    className="flex-1 bg-transparent text-white font-mono focus:outline-none pl-1"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Category</label>
                <select
                  value={createCategory}
                  onChange={(e) => setCreateCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-[#0d1020] border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  rows={2}
                  placeholder="What is the mission or focus of this guild?"
                  className="w-full px-3.5 py-2 rounded-2xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Avatar Image URL (Optional)</label>
                <input
                  type="url"
                  value={createAvatar}
                  onChange={(e) => setCreateAvatar(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:opacity-95 text-slate-950 font-bold text-xs"
                >
                  Create Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
