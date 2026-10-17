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
import { Button } from '../common/Button';

interface SocialRightSidebarProps {
  onSearch?: (query: string) => void;
  onSelectHashtag?: (tag: string) => void;
  onSelectCreator?: (handle: string) => void;
  onOpenRelay?: (relayId?: string) => void;
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
    <aside className="social-discovery hidden xl:block w-[300px] shrink-0 select-none space-y-4 py-4 pr-1">
      {/* 1. Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search culture, tags, projects..."
          className="w-full bg-[#090c18] border border-white/10 hover:border-white/20 focus:border-cyan-400 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
        />
      </form>

      {/* 2. Trending Discussions (Real database hashtags) */}
      <div className="p-3.5 rounded-2xl bg-[#080a14] border border-white/5 space-y-2.5">
        <div className="flex items-center justify-between pb-1 border-b border-white/5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Trending discussions</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-medium">Real-time</span>
        </div>

        {trendingHashtags.length > 0 ? (
          <div className="space-y-2">
            {trendingHashtags.map((topic, i) => (
              <div
                key={i}
                onClick={() => onSelectHashtag && onSelectHashtag(topic.tag)}
                className="flex items-center justify-between py-1 cursor-pointer group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                    #{topic.tag}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {topic.count} {topic.count === 1 ? 'post' : 'posts'} in discussion
                  </p>
                </div>
                <span className="text-xs text-slate-600 group-hover:text-slate-400 transition-colors">→</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2 text-center text-[11px] text-slate-500">
            No hashtags trending yet. Use #topics in your posts.
          </div>
        )}
      </div>

      {/* 3. Suggested Communities (NFT Project Guilds) */}
      <div className="p-3.5 rounded-2xl bg-[#080a14] border border-white/5 space-y-2.5">
        <div className="flex items-center justify-between pb-1 border-b border-white/5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Suggested communities</span>
          </h3>
          <span className="text-[10px] text-purple-400 font-medium">NFT Guilds</span>
        </div>

        {featuredProjects.length > 0 ? (
          <div className="space-y-2.5">
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
                      className="w-8 h-8 rounded-xl object-cover shrink-0 border border-white/10"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-200 group-hover:text-purple-300 transition-colors truncate">
                        {project.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">@{project.username}</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={isFollowing ? 'secondary' : 'primary'}
                    aria-label={isFollowing ? `Joined ${project.name}` : `Join ${project.name}`}
                    onClick={() => handleToggleProjectFollow(project.id)}
                    className="!h-7 !px-3 !text-[11px]"
                  >
                    {isFollowing ? 'Joined' : 'Join'}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-2 text-center">No projects registered yet.</p>
        )}
      </div>

      {/* 4. People to Follow */}
      <div className="p-3.5 rounded-2xl bg-[#080a14] border border-white/5 space-y-2.5">
        <div className="flex items-center justify-between pb-1 border-b border-white/5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>People to follow</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-medium">Curators</span>
        </div>

        {suggestedUsers.length > 0 ? (
          <div className="space-y-2.5">
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
                      <p className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{user.handle}</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={isFollowing ? 'secondary' : 'primary'}
                    aria-label={isFollowing ? `Following ${user.name}` : `Follow ${user.name}`}
                    onClick={() => handleToggleFollow(user.id)}
                    className="!h-7 !px-3 !text-[11px]"
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-2 text-center">No other creators found.</p>
        )}
      </div>

      {/* 5. Relevant NFT Activity */}
      <div className="p-3.5 rounded-2xl bg-[#080a14] border border-white/5 space-y-2.5">
        <div className="flex items-center justify-between pb-1 border-b border-white/5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-pink-400" />
            <span>Relevant NFT activity</span>
          </h3>
          <span className="text-[10px] text-pink-400 font-medium">Relay Lore</span>
        </div>

        {featuredRelays.length > 0 ? (
          <div
            onClick={() => onOpenRelay && onOpenRelay(featuredRelays[0].id)}
            className="p-3 rounded-xl bg-gradient-to-br from-[#0a0d20] to-[#070914] border border-white/5 hover:border-pink-500/30 transition-colors cursor-pointer group space-y-2"
          >
            <div className="flex items-center gap-2.5">
              <img
                src={featuredRelays[0].nftImage}
                alt={featuredRelays[0].title}
                className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                  {featuredRelays[0].title}
                </h4>
                <p className="text-[10px] text-slate-400 truncate">
                  {featuredRelays[0].collection} {featuredRelays[0].tokenId}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
              &quot;{featuredRelays[0].question}&quot;
            </p>

            <div className="flex items-center justify-between text-[10px] text-cyan-400 pt-0.5 border-t border-white/5">
              <span>{featuredRelays[0].participantsCount} co-authors in provenance</span>
              <span className="font-bold group-hover:underline">View Relay →</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-1 text-center">No active relays yet.</p>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-[10px] text-slate-600 px-2 space-y-0.5">
        <p>© 2026 MOSAIC · Web3 Social Architecture</p>
        <p>Curated discovery · Real provenance</p>
      </div>
    </aside>
  );
};
