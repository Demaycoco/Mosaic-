import React, { useState, useEffect, useTransition } from 'react';
import {
  Search,
  Sparkles,
  Layers,
  Users,
  FileText,
  GitFork,
  Hash,
  Loader2,
  TrendingUp,
  X,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { discoveryService, SearchResults } from '../../services/discoveryService';
import { postService } from '../../services/postService';
import { nftService } from '../../services/nftService';
import { projectService } from '../../services/projectService';
import { userService } from '../../services/userService';
import { relayService } from '../../services/relayService';
import { communityService } from '../../services/communityService';
import { SocialPost, NftProjectAccount, Creator, NftItem, RelayExperience, SocialCommunity } from '../../types';
import { PostCard } from './PostCard';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';

interface ExploreViewProps {
  onSelectPost?: (post: SocialPost) => void;
  onOpenReply?: (post: SocialPost) => void;
  onOpenQuote?: (post: SocialPost) => void;
  onSelectUser?: (username: string) => void;
  onSelectHashtag?: (tag: string) => void;
  onOpenRelay?: (relay: RelayExperience) => void;
  onOpenCreateProject?: () => void;
  initialQuery?: string;
  initialSection?: 'trending' | 'communities' | 'nfts' | 'people' | 'projects' | 'posts' | 'relays';
}

type SectionKey = 'trending' | 'communities' | 'nfts' | 'people' | 'projects' | 'posts' | 'relays';


export const ExploreView: React.FC<ExploreViewProps> = ({
  onSelectPost,
  onOpenReply,
  onOpenQuote,
  onSelectUser,
  onSelectHashtag,
  onOpenRelay,
  onOpenCreateProject,
  initialQuery = '',
  initialSection = 'trending',
}) => {
  const { currentUser } = useAuth();
  const [activeSection, setActiveSection] = useState<SectionKey>(initialSection);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Real Database state for each section
  const [trendingHashtags, setTrendingHashtags] = useState<Array<{ tag: string; count: number }>>([]);
  const [trendingPosts, setTrendingPosts] = useState<SocialPost[]>([]);
  const [allNfts, setAllNfts] = useState<NftItem[]>([]);
  const [allUsers, setAllUsers] = useState<Creator[]>([]);
  const [allProjects, setAllProjects] = useState<NftProjectAccount[]>([]);
  const [allRelays, setAllRelays] = useState<RelayExperience[]>([]);
  const [followedProjectIds, setFollowedProjectIds] = useState<string[]>([]);

  // Load real database data
  const refreshData = () => {
    try {
      setTrendingHashtags(postService.getTrendingHashtags());
      setTrendingPosts(postService.getFeed('forYou', currentUser?.id));
      setAllNfts(nftService.getAllNfts());
      setAllUsers(userService.getAllUsers());
      setAllProjects(projectService.getAllProjects());
      setAllRelays(relayService.getAllRelays());
      if (currentUser) {
        setFollowedProjectIds(projectService.getFollowedProjectIds(currentUser.id));
      }
    } catch (e) {
      console.error('Error loading explore data', e);
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentUser?.id]);

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  // Debounced search effect (300ms)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setDebouncedQuery('');
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const timer = setTimeout(() => {
      try {
        setDebouncedQuery(searchQuery.trim());
        const results = discoveryService.searchAll(searchQuery.trim());
        setSearchResults(results);
      } catch (err) {
        setSearchError('Search failed to load results. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSearchResults(null);
  };

  const handleProjectFollow = (projectId: string) => {
    if (!currentUser) return;
    projectService.toggleFollowProject(projectId, currentUser.id);
    setFollowedProjectIds(projectService.getFollowedProjectIds(currentUser.id));
    setAllProjects(projectService.getAllProjects());
  };

  const sections: Array<{ id: SectionKey; label: string; icon: React.ReactNode }> = [
    { id: 'trending', label: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'nfts', label: 'NFTs', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'people', label: 'People', icon: <Users className="w-4 h-4" /> },
    { id: 'projects', label: 'Projects', icon: <Layers className="w-4 h-4" /> },
    { id: 'posts', label: 'Posts', icon: <FileText className="w-4 h-4" /> },
    { id: 'relays', label: 'Relays', icon: <GitFork className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#05060b] text-white">
      {/* Search Header Bar */}
      <div className="sticky top-0 z-30 bg-[#06070a]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, projects, posts, NFT collections, or #hashtags..."
            className="w-full bg-[#0b0e1e] border border-white/10 focus:border-cyan-400 rounded-full pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Section Tabs */}
        {!debouncedQuery && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeSection === sec.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {sec.icon}
                <span>{sec.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5">
        {/* Loading State */}
        {isSearching && (
          <div className="py-16 text-center space-y-3 animate-pulse">
            <Loader2 className="w-8 h-8 text-cyan-400 mx-auto animate-spin" />
            <p className="text-xs text-slate-400">Searching real database for &ldquo;{searchQuery}&rdquo;...</p>
          </div>
        )}

        {/* Search Error State */}
        {searchError && !isSearching && (
          <div className="py-12 text-center space-y-2 p-6 rounded-2xl bg-red-950/20 border border-red-500/30">
            <p className="text-sm font-semibold text-red-400">{searchError}</p>
            <p className="text-xs text-slate-400">Please check your connection and try again.</p>
          </div>
        )}

        {/* Search Results Display */}
        {debouncedQuery && !isSearching && searchResults && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Search results for &ldquo;{debouncedQuery}&rdquo;
                </h2>
                <p className="text-xs text-slate-400">
                  Found {searchResults.totalResults} real matches across Mosaic
                </p>
              </div>
              <button
                onClick={handleClearSearch}
                className="text-xs text-cyan-400 hover:underline font-semibold"
              >
                Clear Search
              </button>
            </div>

            {/* Empty Search State - Do not fabricate results */}
            {searchResults.totalResults === 0 && (
              <div className="py-20 text-center px-4 space-y-3">
                <Search className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No results found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No matching users, projects, posts, NFT collections, or hashtags found for &ldquo;{debouncedQuery}&rdquo;.
                </p>
              </div>
            )}

            {/* 1. Matching Users */}
            {searchResults.users.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>People ({searchResults.users.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {searchResults.users.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => onSelectUser && onSelectUser(u.handle.replace('@', ''))}
                      className="p-3.5 rounded-2xl bg-[#090d1c] border border-white/10 hover:border-cyan-500/40 transition-colors cursor-pointer flex items-center gap-3 group"
                    >
                      <Avatar src={u.avatar} name={u.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                          {u.name}
                        </h4>
                        <p className="text-[11px] text-purple-400 truncate">{u.handle}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{u.bio}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Matching NFT Projects */}
            {searchResults.projects.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Projects ({searchResults.projects.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {searchResults.projects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => onSelectUser && onSelectUser(proj.username)}
                      className="p-3.5 rounded-2xl bg-[#090d1c] border border-white/10 hover:border-cyan-500/40 transition-colors cursor-pointer flex items-center gap-3 group"
                    >
                      <img
                        src={proj.logo}
                        alt={proj.name}
                        className="w-12 h-12 rounded-xl object-cover border border-cyan-500/30"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                            {proj.name}
                          </h4>
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                            NFT
                          </span>
                        </div>
                        <p className="text-[11px] text-purple-400 truncate">@{proj.username}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{proj.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Matching NFT Collections */}
            {searchResults.collections.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>NFT Collections ({searchResults.collections.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {searchResults.collections.map((coll, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-[#090d1c] border border-white/10 space-y-2"
                    >
                      <img
                        src={coll.sampleImage}
                        alt={coll.name}
                        className="w-full aspect-video object-cover rounded-xl"
                      />
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white truncate">{coll.name}</h4>
                        <span className="text-[10px] text-purple-400 font-semibold">{coll.count} items</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Matching Hashtags */}
            {searchResults.hashtags.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-pink-400" />
                  <span>Hashtags ({searchResults.hashtags.length})</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {searchResults.hashtags.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => onSelectHashtag && onSelectHashtag(h.tag)}
                      className="px-3.5 py-2 rounded-xl bg-[#090d1c] border border-white/10 hover:border-pink-500/40 text-xs text-white hover:text-pink-300 transition-colors flex items-center gap-2 cursor-pointer group"
                    >
                      <span className="font-bold text-pink-400 group-hover:text-pink-300">#{h.tag}</span>
                      <span className="text-[10px] text-slate-400">{h.count} posts</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Matching Relays */}
            {searchResults.relays.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GitFork className="w-4 h-4 text-cyan-400" />
                  <span>Relay Experiences ({searchResults.relays.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {searchResults.relays.map((relay) => (
                    <div
                      key={relay.id}
                      onClick={() => onOpenRelay && onOpenRelay(relay)}
                      className="p-3.5 rounded-2xl bg-[#090d1c] border border-purple-500/20 hover:border-purple-400/50 transition-colors cursor-pointer group"
                    >
                      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 truncate">
                        {relay.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                        {relay.description}
                      </p>
                      <div className="mt-2 text-[10px] text-cyan-400 font-semibold flex items-center gap-2">
                        <span>{relay.steps.length} Steps Co-Created</span>
                        <span>·</span>
                        <span>{relay.participantsCount} Collaborators</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Matching Posts */}
            {searchResults.posts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Posts ({searchResults.posts.length})</span>
                </h3>
                <div className="divide-y divide-white/5 rounded-2xl bg-[#070914] border border-white/5 overflow-hidden">
                  {searchResults.posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onSelectPost={onSelectPost}
                      onOpenReply={onOpenReply}
                      onOpenQuote={onOpenQuote}
                      onSelectUser={onSelectUser}
                      onSelectHashtag={onSelectHashtag}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Default Sectioned Views when no active search query */}
        {!debouncedQuery && !isSearching && (
          <div>
            {/* A. TRENDING SECTION */}
            {activeSection === 'trending' && (
              <div className="space-y-6">
                {/* Trending Hashtags Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-pink-400" />
                      <span>Trending Topics & Hashtags</span>
                    </h3>
                  </div>

                  {trendingHashtags.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {trendingHashtags.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => onSelectHashtag && onSelectHashtag(item.tag)}
                          className="p-3.5 rounded-2xl bg-[#090d1c] border border-white/10 hover:border-pink-500/40 transition-colors cursor-pointer group"
                        >
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Rank #{idx + 1}</span>
                          <h4 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors">
                            #{item.tag}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1">{item.count} live posts</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-[#090d1c] border border-white/5 text-center">
                      <p className="text-xs text-slate-400">No trending topics yet. Use #hashtags in your posts to trend.</p>
                    </div>
                  )}
                </div>

                {/* Trending NFT Artifacts Strip */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Living NFT Artifacts</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {allNfts.slice(0, 3).map((nft) => (
                      <div
                        key={nft.id}
                        className="p-3 rounded-2xl bg-[#090d1c] border border-white/10 hover:border-purple-500/40 transition-colors group cursor-pointer"
                      >
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-full aspect-video object-cover rounded-xl mb-2"
                        />
                        <p className="text-[11px] text-purple-400 font-medium">{nft.collection}</p>
                        <h4 className="text-xs font-bold text-white group-hover:text-purple-300 truncate">
                          {nft.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">{nft.storySnippet}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Community Discussions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Recent Conversations
                  </h3>
                  <div className="divide-y divide-white/5 rounded-2xl bg-[#070914] border border-white/5 overflow-hidden">
                    {trendingPosts.slice(0, 5).map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onSelectPost={onSelectPost}
                        onOpenReply={onOpenReply}
                        onOpenQuote={onOpenQuote}
                        onSelectUser={onSelectUser}
                        onSelectHashtag={onSelectHashtag}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* B. NFTS SECTION */}
            {activeSection === 'nfts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Mosaic Living NFTs</span>
                  </h3>
                  <span className="text-xs text-purple-400">{allNfts.length} Total</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allNfts.map((nft) => (
                    <div
                      key={nft.id}
                      className="p-4 rounded-2xl bg-[#090d1c] border border-white/10 hover:border-purple-500/40 transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-2">
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-900">
                          <img
                            src={nft.image}
                            alt={nft.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-md text-white border border-white/10">
                            {nft.tokenId}
                          </span>
                        </div>
                        <div className="pt-1">
                          <p className="text-[11px] text-purple-400 font-semibold">{nft.collection}</p>
                          <h4 className="text-sm font-bold text-white group-hover:text-purple-300">{nft.name}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed mt-1 line-clamp-2">
                            {nft.storySnippet}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-slate-400">By {nft.creator.name}</span>
                        <span className="text-cyan-400 font-semibold">{nft.likes} appreciations</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* C. PEOPLE SECTION */}
            {activeSection === 'people' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>Creators & Storytellers</span>
                  </h3>
                  <span className="text-xs text-slate-400">{allUsers.length} Registered</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {allUsers.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => onSelectUser && onSelectUser(u.handle.replace('@', ''))}
                      className="p-4 rounded-2xl bg-[#090d1c] border border-white/10 hover:border-cyan-500/40 transition-colors cursor-pointer group flex items-start gap-3.5"
                    >
                      <Avatar src={u.avatar} name={u.name} size="lg" />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 truncate">
                          {u.name}
                        </h4>
                        <p className="text-xs text-purple-400 truncate">{u.handle}</p>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                          {u.bio}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
                          <span>{u.followersCount.toLocaleString()} Followers</span>
                          <span>{u.nftsCount} Artifacts</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* D. PROJECTS SECTION */}
            {activeSection === 'projects' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>NFT Projects & Guilds</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{allProjects.length} Projects</span>
                    {onOpenCreateProject && (
                      <button
                        onClick={onOpenCreateProject}
                        className="px-3.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-900/60 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        + Create Project
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {allProjects.map((proj) => {
                    const isFollowing = followedProjectIds.includes(proj.id);

                    return (
                      <div
                        key={proj.id}
                        className="p-4 rounded-2xl bg-[#090d1c] border border-white/10 hover:border-cyan-500/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div
                          onClick={() => onSelectUser && onSelectUser(proj.username)}
                          className="flex items-center gap-3.5 cursor-pointer group min-w-0 flex-1"
                        >
                          <img
                            src={proj.logo}
                            alt={proj.name}
                            className="w-14 h-14 rounded-2xl object-cover border border-cyan-500/30 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 truncate">
                                {proj.name}
                              </h4>
                              <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                                {proj.category}
                              </span>
                            </div>
                            <p className="text-xs text-purple-400">@{proj.username}</p>
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{proj.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                          <div className="text-right text-xs">
                            <span className="font-bold text-white">{proj.followersCount}</span>
                            <span className="text-slate-400 text-[11px] block">followers</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleProjectFollow(proj.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              isFollowing
                                ? 'bg-purple-950/40 text-purple-300 border border-purple-500/40'
                                : 'bg-white text-slate-900 hover:bg-slate-200'
                            }`}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* E. POSTS SECTION */}
            {activeSection === 'posts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Global Feed Posts</span>
                  </h3>
                  <span className="text-xs text-slate-400">{trendingPosts.length} Live</span>
                </div>

                <div className="divide-y divide-white/5 rounded-2xl bg-[#070914] border border-white/5 overflow-hidden">
                  {trendingPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onSelectPost={onSelectPost}
                      onOpenReply={onOpenReply}
                      onOpenQuote={onOpenQuote}
                      onSelectUser={onSelectUser}
                      onSelectHashtag={onSelectHashtag}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* F. RELAYS SECTION */}
            {activeSection === 'relays' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <GitFork className="w-4 h-4 text-purple-400" />
                    <span>Collaborative Relays</span>
                  </h3>
                  <span className="text-xs text-purple-400">{allRelays.length} Relays</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {allRelays.map((relay) => (
                    <div
                      key={relay.id}
                      onClick={() => onOpenRelay && onOpenRelay(relay)}
                      className="p-4 rounded-2xl bg-[#090d1c] border border-white/10 hover:border-purple-500/40 transition-all flex flex-col justify-between group cursor-pointer"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
                            {relay.status}
                          </span>
                          <span className="text-xs text-slate-400">
                            Stage {relay.currentStage} of {relay.totalStages}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                          {relay.title}
                        </h4>
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                          {relay.description}
                        </p>
                      </div>

                      <div className="pt-3 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                        <span>{relay.participantsCount} Collaborators</span>
                        <span className="text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          Enter Relay <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
