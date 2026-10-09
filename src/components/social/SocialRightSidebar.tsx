import React, { useState, useEffect } from 'react';
import { Search, Sparkles, GitFork, Layers, Users, TrendingUp } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { postService } from '../../services/postService';
import { projectService } from '../../services/projectService';
import { userService } from '../../services/userService';
import { relayService } from '../../services/relayService';
import { nftService } from '../../services/nftService';
import { NftProjectAccount, Creator, RelayExperience, NftItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SocialRightSidebarProps {
  onSearch?: (query: string) => void;
  onSelectHashtag?: (tag: string) => void;
  onSelectCreator?: (handle: string) => void;
  onOpenRelay?: () => void;
}

export const SocialRightSidebar: React.FC<SocialRightSidebarProps> = ({
  onSearch,
  onSelectHashtag,
  onSelectCreator,
  onOpenRelay,
}) => {
  const { currentUser } = useAuth();
  const [query, setQuery] = useState('');

  // Real database states
  const [trendingHashtags, setTrendingHashtags] = useState<Array<{ tag: string; count: number }>>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<Creator[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<NftProjectAccount[]>([]);
  const [featuredNfts, setFeaturedNfts] = useState<NftItem[]>([]);
  const [featuredRelays, setFeaturedRelays] = useState<RelayExperience[]>([]);

  const [followedProjectIds, setFollowedProjectIds] = useState<string[]>(() => {
    return currentUser ? projectService.getFollowedProjectIds(currentUser.id) : [];
  });
  const [followedState, setFollowedState] = useState<Record<string, boolean>>(() => {
    if (!currentUser) return {};
    const following = postService.getFollowingIds(currentUser.id);
    const map: Record<string, boolean> = {};
    following.forEach((id) => (map[id] = true));
    return map;
  });

  const loadData = () => {
    try {
      // 1. Trending topics calculated strictly from real database posts
      setTrendingHashtags(postService.getTrendingHashtags().slice(0, 5));

      // 2. Who to follow from real user registry
      setSuggestedUsers(userService.getSuggestedFollows(currentUser?.id).slice(0, 3));

      // 3. Featured NFT projects
      setFeaturedProjects(projectService.getAllProjects().slice(0, 3));

      // 4. Featured NFT artifacts
      setFeaturedNfts(nftService.getAllNfts().slice(0, 2));

      // 5. Featured Relays
      setFeaturedRelays(relayService.getAllRelays().slice(0, 1));

      if (currentUser) {
        setFollowedProjectIds(projectService.getFollowedProjectIds(currentUser.id));
        const following = postService.getFollowingIds(currentUser.id);
        const map: Record<string, boolean> = {};
        following.forEach((id) => (map[id] = true));
        setFollowedState(map);
      }
    } catch (e) {
      console.error('Error loading sidebar data', e);
    }
  };

  useEffect(() => {
    loadData();

    const unsubProjects = projectService.subscribe(() => {
      setFeaturedProjects(projectService.getAllProjects().slice(0, 3));
      if (currentUser) {
        setFollowedProjectIds(projectService.getFollowedProjectIds(currentUser.id));
      }
    });

    const unsubPosts = postService.subscribe(() => {
      setTrendingHashtags(postService.getTrendingHashtags().slice(0, 5));
    });

    return () => {
      unsubProjects();
      unsubPosts();
    };
  }, [currentUser?.id]);

  const handleToggleFollow = (creatorId: string) => {
    if (!currentUser) return;
    const isNowFollowing = postService.toggleFollow(creatorId, currentUser.id);
    setFollowedState((prev) => ({ ...prev, [creatorId]: isNowFollowing }));
  };

  const handleToggleProjectFollow = (projectId: string) => {
    if (!currentUser) return;
    projectService.toggleFollowProject(projectId, currentUser.id);
    setFollowedProjectIds(projectService.getFollowedProjectIds(currentUser.id));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <aside className="hidden lg:block w-80 xl:w-88 h-screen sticky top-0 p-4 border-l border-white/10 shrink-0 select-none overflow-y-auto bg-[#05060b] space-y-5 scrollbar-thin">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search culture, tags, projects..."
          className="w-full bg-[#0a0d1c] border border-white/10 hover:border-white/20 focus:border-cyan-400 rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
        />
      </form>

      {/* 1. Who To Follow Box */}
      <div className="p-4 rounded-3xl bg-[#080a14] border border-white/10 space-y-3">
        <h3 className="text-sm font-extrabold text-white flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-cyan-400" />
            Who to follow
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Active Creators</span>
        </h3>

        {suggestedUsers.length > 0 ? (
          <div className="space-y-3">
            {suggestedUsers.map((user) => {
              const isFollowing = !!followedState[user.id];

              return (
                <div key={user.id} className="flex items-center justify-between gap-2.5">
                  <div
                    onClick={() => onSelectCreator && onSelectCreator(user.handle.replace('@', ''))}
                    className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
                  >
                    <Avatar src={user.avatar} name={user.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-purple-400 truncate">{user.handle}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleFollow(user.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                      isFollowing
                        ? 'bg-purple-950/40 text-purple-300 border border-purple-500/40'
                        : 'bg-white text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-2 text-center">No other creators found to follow.</p>
        )}
      </div>

      {/* 2. Trending Topics (Real Database Hashtags - No fake numbers) */}
      <div className="p-4 rounded-3xl bg-[#080a14] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-pink-400" />
            <span>Trending topics</span>
          </h3>
          <span className="text-[10px] text-pink-400 font-semibold uppercase">Real-time</span>
        </div>

        {trendingHashtags.length > 0 ? (
          <div className="space-y-2.5 divide-y divide-white/5">
            {trendingHashtags.map((topic, i) => (
              <div
                key={i}
                onClick={() => onSelectHashtag && onSelectHashtag(topic.tag)}
                className="pt-2 first:pt-0 cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors">
                    #{topic.tag}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {topic.count} {topic.count === 1 ? 'post' : 'posts'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2 text-center">
            <p className="text-xs text-slate-400">No hashtags trending yet.</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Use #hashtags in posts to spark discussions.</p>
          </div>
        )}
      </div>

      {/* 3. Featured NFT Projects */}
      <div className="p-4 rounded-3xl bg-[#080a14] border border-cyan-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Featured NFT projects</span>
          </h3>
          <span className="text-[10px] text-cyan-400 font-semibold uppercase">Guilds</span>
        </div>

        {featuredProjects.length > 0 ? (
          <div className="space-y-3">
            {featuredProjects.map((project) => {
              const isFollowing = followedProjectIds.includes(project.id);

              return (
                <div key={project.id} className="flex items-center justify-between gap-2.5">
                  <div
                    onClick={() => onSelectCreator && onSelectCreator(project.username)}
                    className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
                  >
                    <img
                      src={project.logo}
                      alt={project.name}
                      className="w-8 h-8 rounded-xl object-cover shrink-0 border border-cyan-500/30"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {project.name}
                      </p>
                      <p className="text-[10px] text-purple-400 truncate">@{project.username}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleProjectFollow(project.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                      isFollowing
                        ? 'bg-purple-950/40 text-purple-300 border border-purple-500/40'
                        : 'bg-white text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-2 text-center">No projects registered yet.</p>
        )}
      </div>

      {/* 4. Featured Relays */}
      {featuredRelays.length > 0 ? (
        <div
          onClick={onOpenRelay}
          className="p-4 rounded-3xl bg-gradient-to-br from-[#0c0f24] to-[#090b16] border border-purple-500/30 hover:border-purple-400/60 transition-colors cursor-pointer group space-y-2"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-cyan-400 flex items-center gap-1.5">
              <GitFork className="w-4 h-4" />
              FEATURED RELAY
            </span>
            <span className="text-[10px] text-purple-300 font-semibold uppercase">
              Stage {featuredRelays[0].currentStage} Active
            </span>
          </div>

          <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors truncate">
            {featuredRelays[0].title}
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
            {featuredRelays[0].description}
          </p>
          <div className="text-[10px] text-cyan-400 font-semibold pt-1 flex items-center gap-2">
            <span>{featuredRelays[0].participantsCount} Collaborators</span>
            <span>·</span>
            <span>{featuredRelays[0].steps.length} Steps Co-Created</span>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-3xl bg-[#080a14] border border-white/10 text-center">
          <p className="text-xs text-slate-400">No active relays at the moment.</p>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-[10px] text-slate-600 px-2 space-y-0.5">
        <p>© 2026 MOSAIC Social NFT Platform</p>
        <p>Curated discovery · Real provenance</p>
      </div>
    </aside>
  );
};
