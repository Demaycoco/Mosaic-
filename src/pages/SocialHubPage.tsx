import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SocialPost, SocialNotification } from '../types';
import { postService } from '../services/postService';
import { SocialLeftNav } from '../components/social/SocialLeftNav';
import { SocialRightSidebar } from '../components/social/SocialRightSidebar';
import { PostComposer } from '../components/social/PostComposer';
import { PostCard } from '../components/social/PostCard';
import { PostDetailView } from '../components/social/PostDetailView';
import { ReplyModal } from '../components/social/ReplyModal';
import { QuoteModal } from '../components/social/QuoteModal';
import { Avatar } from '../components/common/Avatar';
import { ProjectProfileView } from './ProjectProfileView';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { projectService } from '../services/projectService';
import { NftProjectAccount } from '../types';
import { ExploreView } from '../components/social/ExploreView';
import {
  Home,
  Compass,
  Bell,
  Bookmark,
  User,
  Users,
  Plus,
  ArrowLeft,
  Sparkles,
  GitFork,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Link as LinkIcon,
  Check,
  Edit3,
  Layers,
  Clock,
  Hash,
  Camera,
  MessageSquare,
  Wallet,
  AlertTriangle,
  X,
  LogOut,
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { WalletButton } from '../components/wallet/WalletButton';
import { OwnedNftCard } from '../components/nft/OwnedNftCard';
import { OwnedNftDetailModal } from '../components/nft/OwnedNftDetailModal';
import { nftOwnershipService } from '../services/nftOwnershipService';
import { OwnedNft } from '../types/wallet';

interface SocialHubPageProps {
  initialRoute?: string;
  onNavigateHomeLanding: () => void;
  onOpenRelayLanding: () => void;
}

export const SocialHubPage: React.FC<SocialHubPageProps> = ({
  initialRoute = '/home',
  onNavigateHomeLanding,
  onOpenRelayLanding,
}) => {
  const { currentUser, signOut, updateUser } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>(initialRoute);
  const [isMobileComposerOpen, setIsMobileComposerOpen] = useState(false);
  const [feedTab, setFeedTab] = useState<'forYou' | 'following'>('forYou');
  const [posts, setPosts] = useState<SocialPost[]>([]);

  // Own profile states for /profile route
  const { walletState, connectWallet } = useWallet();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [ownProfileTab, setOwnProfileTab] = useState<'posts' | 'nfts' | 'bookmarks' | 'projects'>('nfts');
  const [hubOwnedNfts, setHubOwnedNfts] = useState<OwnedNft[]>([]);
  const [isLoadingHubNfts, setIsLoadingHubNfts] = useState(false);
  const [hubNftDetail, setHubNftDetail] = useState<OwnedNft | null>(null);

  // Keep internal route synced if parent route changes (e.g. browser history or external link)
  useEffect(() => {
    setCurrentRoute(initialRoute);
  }, [initialRoute]);

  // Load owned NFTs when on /profile or wallet connects
  useEffect(() => {
    if (walletState.address && currentRoute === '/profile') {
      setIsLoadingHubNfts(true);
      nftOwnershipService
        .getOwnedNfts(walletState.address)
        .then((items) => setHubOwnedNfts(items))
        .catch(console.warn)
        .finally(() => setIsLoadingHubNfts(false));
    } else if (!walletState.address) {
      setHubOwnedNfts([]);
    }
  }, [walletState.address, currentRoute]);

  // Active views & modals
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [replyModalPost, setReplyModalPost] = useState<SocialPost | null>(null);
  const [quoteModalPost, setQuoteModalPost] = useState<SocialPost | null>(null);
  const [viewingUsername, setViewingUsername] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState<'posts' | 'replies' | 'media' | 'nfts' | 'relays'>('posts');
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [projectsList, setProjectsList] = useState<NftProjectAccount[]>(() => projectService.getAllProjects());
  const [followedProjectIds, setFollowedProjectIds] = useState<string[]>(() => {
    return currentUser ? projectService.getFollowedProjectIds(currentUser.id) : [];
  });

  // Search in Explore
  const [searchFilter, setSearchFilter] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState<SocialNotification[]>([]);

  // Load and subscribe to live post and project changes
  useEffect(() => {
    const unsubPosts = postService.subscribe(() => {
      loadFeed();
      if (currentUser) {
        setNotifications(postService.getNotifications(currentUser.id));
      }
    });

    const unsubProjects = projectService.subscribe((list) => {
      setProjectsList(list);
      if (currentUser) {
        setFollowedProjectIds(projectService.getFollowedProjectIds(currentUser.id));
      }
    });

    loadFeed();
    return () => {
      unsubPosts();
      unsubProjects();
    };
  }, [feedTab, currentRoute, currentUser?.id]);

  const loadFeed = () => {
    if (currentRoute === '/bookmarks') {
      if (currentUser) {
        setPosts(postService.getBookmarkedPosts(currentUser.id));
      } else {
        setPosts([]);
      }
    } else if (currentRoute === '/profile') {
      if (currentUser) {
        setPosts(postService.getUserPosts(currentUser.username));
      } else {
        setPosts([]);
      }
    } else if (currentRoute.startsWith('/hashtag/')) {
      const tag = decodeURIComponent(currentRoute.replace('/hashtag/', '')).replace(/^#/, '');
      setPosts(postService.getPostsByHashtag(tag));
    } else {
      setPosts(postService.getFeed(feedTab, currentUser?.id));
    }

    if (currentUser) {
      setNotifications(postService.getNotifications(currentUser.id));
    }
  };

  const handleRouteNavigate = (route: string) => {
    if (route === '/') {
      onNavigateHomeLanding();
      return;
    }
    if (route.startsWith('/relay') || route === 'relay') {
      const target = route === 'relay' ? '/relay/relay-1847' : route;
      window.history.pushState({}, '', target);
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    setSelectedPost(null);
    setViewingUsername(null);
    setCurrentRoute(route);
    window.history.pushState({}, '', route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHashtag = (tag: string) => {
    const cleanTag = tag.replace(/^#/, '');
    handleRouteNavigate(`/hashtag/${cleanTag}`);
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const handleSelectUser = (username: string) => {
    setViewingUsername(username);
    setSelectedPost(null);
  };

  return (
    <div className="min-h-screen bg-[#05060b] text-slate-100 flex justify-center">
      <div className="w-full max-w-7xl flex">
        {/* LEFT COLUMN: Modern Social Navigation */}
        <SocialLeftNav
          currentRoute={currentRoute}
          onNavigate={handleRouteNavigate}
          onOpenQuickPost={() => {
            setSelectedPost(null);
            setViewingUsername(null);
            setCurrentRoute('/home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenCreateProject={() => setIsCreateProjectModalOpen(true)}
          unreadNotificationsCount={unreadNotifsCount}
        />

        {/* CENTER COLUMN: The Social Feed (Primary Visual Focus) */}
        <main className="flex-1 min-w-0 max-w-2xl border-x border-white/10 min-h-screen pb-20 md:pb-12 bg-[#06070a]">
          {/* A. If viewing a specific post detail conversation */}
          {selectedPost ? (
            <PostDetailView
              post={selectedPost}
              onBack={() => setSelectedPost(null)}
              onOpenReply={(p) => setReplyModalPost(p)}
              onOpenQuote={(p) => setQuoteModalPost(p)}
              onSelectUser={handleSelectUser}
              onSelectHashtag={handleSelectHashtag}
            />
          ) : viewingUsername ? (
            /* B. If viewing an NFT Project or Creator Profile */
            projectService.getProjectByUsername(viewingUsername) ? (
              <ProjectProfileView
                project={projectService.getProjectByUsername(viewingUsername)!}
                onBack={() => setViewingUsername(null)}
                onOpenReply={(p) => setReplyModalPost(p)}
                onOpenQuote={(p) => setQuoteModalPost(p)}
                onSelectPost={(p) => setSelectedPost(p)}
                onSelectUser={handleSelectUser}
                onSelectHashtag={handleSelectHashtag}
              />
            ) : (
            <div>
              <div className="sticky top-0 z-30 bg-[#06070a]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center gap-4">
                <button
                  onClick={() => setViewingUsername(null)}
                  className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-base font-bold text-white">@{viewingUsername}</h2>
                  <p className="text-xs text-slate-400">Creator Showcase</p>
                </div>
              </div>

              {/* Profile Header Canvas */}
              <div className="relative">
                <div className="h-32 sm:h-44 bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-pink-900/40 border-b border-white/5" />
                <div className="px-5 pb-4">
                  <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4">
                    <Avatar
                      src={
                        viewingUsername === currentUser?.username
                          ? currentUser?.photoURL
                          : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
                      }
                      name={viewingUsername}
                      size="xl"
                      className="ring-4 ring-[#06070a]"
                    />
                    {viewingUsername === currentUser?.username ? (
                      <button
                        onClick={() => handleRouteNavigate('/settings')}
                        className="px-4 py-1.5 rounded-full border border-white/20 text-xs font-semibold text-white hover:bg-white/5"
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (currentUser) {
                            postService.toggleFollow(viewingUsername, currentUser.id);
                            loadFeed();
                          }
                        }}
                        className="px-5 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold hover:bg-slate-200"
                      >
                        Follow
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-extrabold text-white">
                        {viewingUsername === currentUser?.username
                          ? currentUser?.displayName
                          : viewingUsername}
                      </h3>
                      <ShieldCheck className="w-4.5 h-4.5 text-cyan-400" />
                    </div>
                    <p className="text-xs text-purple-400 font-semibold">@{viewingUsername}</p>
                    <p className="text-sm text-slate-300 pt-1 leading-relaxed">
                      {viewingUsername === currentUser?.username
                        ? currentUser?.bio || 'Generative explorer on Mosaic.'
                        : 'Creating and participating in living NFT Relays. Co-author of Stage 2.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Joined Oct 2026</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span className="text-cyan-400">mosaic.art/@{viewingUsername}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-5 text-xs pt-3">
                      <span><strong className="text-white">124</strong> <span className="text-slate-400">Following</span></span>
                      <span><strong className="text-white">1,480</strong> <span className="text-slate-400">Followers</span></span>
                    </div>
                  </div>
                </div>

                {/* Profile Tabs */}
                <div className="flex border-b border-white/10 text-xs font-bold uppercase tracking-wider overflow-x-auto">
                  {(['posts', 'replies', 'media', 'nfts', 'relays'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setProfileTab(tab)}
                      className={`flex-1 py-3 text-center transition-colors cursor-pointer shrink-0 px-3 ${
                        profileTab === tab
                          ? 'text-white border-b-2 border-purple-500'
                          : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Profile Posts Feed */}
                <div className="divide-y divide-white/5">
                  {postService.getUserPosts(viewingUsername).map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onSelectPost={(p) => setSelectedPost(p)}
                      onOpenReply={(p) => setReplyModalPost(p)}
                      onOpenQuote={(p) => setQuoteModalPost(p)}
                      onSelectUser={handleSelectUser}
                      onSelectHashtag={handleSelectHashtag}
                    />
                  ))}
                </div>
              </div>
            </div>
            )
          ) : currentRoute === '/home' ? (
            /* C. Main Feed: For You / Following */
            <div>
              {/* Sticky Top Header with Segmented Tabs */}
              <div className="sticky top-0 z-30 bg-[#06070a]/90 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {currentUser && (
                      <button
                        onClick={() => handleRouteNavigate('/profile')}
                        className="md:hidden cursor-pointer"
                        title="Your Profile"
                      >
                        <Avatar src={currentUser.photoURL} name={currentUser.displayName} size="xs" />
                      </button>
                    )}
                    <h1 className="text-lg font-extrabold text-white tracking-tight">Home</h1>
                  </div>
                  <div className="flex items-center gap-3">
                    <WalletButton variant="nav" />
                    <span className="hidden sm:flex text-xs text-cyan-400 font-semibold items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Mosaic Social</span>
                    </span>
                  </div>
                </div>

                <div className="flex border-t border-white/5">
                  <button
                    onClick={() => setFeedTab('forYou')}
                    className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center transition-all cursor-pointer relative ${
                      feedTab === 'forYou' ? 'text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>For You</span>
                    {feedTab === 'forYou' && (
                      <span className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full" />
                    )}
                  </button>

                  <button
                    onClick={() => setFeedTab('following')}
                    className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center transition-all cursor-pointer relative ${
                      feedTab === 'following' ? 'text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Following</span>
                    {feedTab === 'following' && (
                      <span className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                    )}
                  </button>
                </div>
              </div>

              {/* Main Composer */}
              <PostComposer onPostCreated={loadFeed} />

              {/* Posts Feed Stream */}
              <div className="divide-y divide-white/5">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onSelectPost={(p) => setSelectedPost(p)}
                      onOpenReply={(p) => setReplyModalPost(p)}
                      onOpenQuote={(p) => setQuoteModalPost(p)}
                      onSelectUser={handleSelectUser}
                      onSelectHashtag={handleSelectHashtag}
                    />
                  ))
                ) : (
                  <div className="py-20 text-center px-4 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-white">No posts yet</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Be the first to share your perspective with the community! Use the composer above to publish a post.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (currentRoute === '/explore' || currentRoute.startsWith('/explore')) ? (
            /* D. Explore Route */
            <ExploreView
              key={currentRoute}
              initialQuery={
                currentRoute.includes('?q=')
                  ? decodeURIComponent(currentRoute.split('?q=')[1] || '')
                  : ''
              }
              onSelectPost={(p) => setSelectedPost(p)}
              onOpenReply={(p) => setReplyModalPost(p)}
              onOpenQuote={(p) => setQuoteModalPost(p)}
              onSelectUser={handleSelectUser}
              onSelectHashtag={handleSelectHashtag}
              onOpenRelay={(_r) => onOpenRelayLanding()}
              onOpenCreateProject={() => setIsCreateProjectModalOpen(true)}
            />
          ) : currentRoute.startsWith('/hashtag/') ? (
            /* D2. Dedicated Hashtag Route */
            <div>
              <div className="sticky top-0 z-30 bg-[#06070a]/90 backdrop-blur-md border-b border-white/10 px-4 py-3.5 flex items-center gap-4">
                <button
                  onClick={() => handleRouteNavigate('/home')}
                  className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-lg font-extrabold text-white flex items-center gap-1.5">
                    <Hash className="w-5 h-5 text-pink-400" />
                    <span>#{decodeURIComponent(currentRoute.replace('/hashtag/', '')).replace(/^#/, '')}</span>
                  </h1>
                  <p className="text-xs text-slate-400">{posts.length} {posts.length === 1 ? 'post' : 'posts'} tagged with this topic</p>
                </div>
              </div>

              {posts.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onSelectPost={(p) => setSelectedPost(p)}
                      onOpenReply={(p) => setReplyModalPost(p)}
                      onOpenQuote={(p) => setQuoteModalPost(p)}
                      onSelectUser={handleSelectUser}
                      onSelectHashtag={handleSelectHashtag}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center px-4 space-y-2">
                  <Hash className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-white">No posts for this hashtag yet</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Be the first creator to tag a post with #{decodeURIComponent(currentRoute.replace('/hashtag/', '')).replace(/^#/, '')}!
                  </p>
                </div>
              )}
            </div>
          ) : currentRoute === '/notifications' ? (
            /* E. Notifications Route */
            <div>
              <div className="sticky top-0 z-30 bg-[#06070a]/90 backdrop-blur-md border-b border-white/10 px-4 py-3.5 flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-extrabold text-white">Notifications</h1>
                  <p className="text-xs text-slate-400">Activity on your posts, profile, and relays</p>
                </div>
                {unreadNotifsCount > 0 && (
                  <button
                    onClick={() => {
                      if (currentUser) {
                        postService.markNotificationsRead(currentUser.id);
                        setNotifications(postService.getNotifications(currentUser.id));
                      }
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (currentUser && !notif.read) {
                          postService.markNotificationRead(currentUser.id, notif.id);
                          setNotifications(postService.getNotifications(currentUser.id));
                        }
                        if (notif.postId) {
                          const p = postService.getPostById(notif.postId);
                          if (p) setSelectedPost(p);
                        } else if (notif.actorUsername) {
                          handleSelectUser(notif.actorUsername);
                        }
                      }}
                      className={`p-4 flex items-start gap-3.5 transition-colors cursor-pointer ${
                        !notif.read ? 'bg-cyan-950/20 hover:bg-cyan-950/30' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="relative">
                        <Avatar src={notif.actorPhotoURL} name={notif.actorName} size="md" />
                        {!notif.read && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-[#06070a]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="text-slate-200">
                          <strong className="text-white hover:underline" onClick={(e) => { e.stopPropagation(); handleSelectUser(notif.actorUsername); }}>
                            {notif.actorName}
                          </strong>{' '}
                          <span className="text-slate-400">@{notif.actorUsername}</span>{' '}
                          {notif.type === 'like' && 'liked your post.'}
                          {notif.type === 'repost' && 'reposted your thought.'}
                          {notif.type === 'reply' && 'replied to your story.'}
                          {notif.type === 'follow' && 'started following you.'}
                          {notif.type === 'quote' && 'quoted your post.'}
                          {notif.type === 'mention' && 'mentioned you in a post.'}
                          {notif.type === 'relay_invite' && 'invited you to collaborate on a living Relay!'}
                          {notif.type === 'relay_activity' && 'added a new contribution to your Relay.'}
                        </p>
                        {notif.text && (
                          <p className="text-slate-300 mt-1 italic line-clamp-2 bg-black/30 p-2 rounded-lg border border-white/5">
                            &ldquo;{notif.text}&rdquo;
                          </p>
                        )}
                        <span className="text-[10px] text-slate-500 mt-1 inline-block">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center px-4 space-y-2">
                  <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-white">No notifications yet</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    When creators like, quote, mention, or collaborate with you on Relays, you will see it here.
                  </p>
                </div>
              )}
            </div>
          ) : currentRoute === '/bookmarks' ? (
            /* F. Bookmarks Route */
            <div>
              <div className="sticky top-0 z-30 bg-[#06070a]/90 backdrop-blur-md border-b border-white/10 px-4 py-3.5 flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-extrabold text-white">Bookmarks</h1>
                  <p className="text-xs text-slate-400">Posts and artifacts you saved for later</p>
                </div>
                {posts.length > 0 && (
                  <span className="text-xs text-slate-400">{posts.length} saved</span>
                )}
              </div>

              {posts.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onSelectPost={(p) => setSelectedPost(p)}
                      onOpenReply={(p) => setReplyModalPost(p)}
                      onOpenQuote={(p) => setQuoteModalPost(p)}
                      onSelectUser={handleSelectUser}
                      onSelectHashtag={handleSelectHashtag}
                      onBookmarkRemoved={(removedPostId) => {
                        setPosts((prev) => prev.filter((p) => p.id !== removedPostId));
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center px-4 space-y-2">
                  <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-white">Save posts for later</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Don’t let good stories slip away! Bookmark posts in your feed to easily revisit them anytime.
                  </p>
                </div>
              )}
            </div>
          ) : currentRoute === '/community' ? (
            /* G. Community Route */
            <div className="p-4 sm:p-5 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
                <div>
                  <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyan-400" />
                    <span>NFT Projects & Guilds</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Decentralized creator collectives, narrative worldbuilders, and living collections
                  </p>
                </div>

                <button
                  onClick={() => setIsCreateProjectModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:opacity-95 text-slate-950 font-bold text-xs transition-opacity shadow-lg shadow-purple-900/30 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>Create NFT Project</span>
                </button>
              </div>

              <div className="space-y-4">
                {projectsList.map((proj) => {
                  const isFollowing = followedProjectIds.includes(proj.id);

                  return (
                    <div
                      key={proj.id}
                      className="rounded-2xl bg-[#090c1a] border border-white/10 hover:border-cyan-500/30 transition-all overflow-hidden group space-y-3"
                    >
                      {/* Project Mini Banner */}
                      <div className="h-24 sm:h-28 bg-slate-900 relative overflow-hidden">
                        <img
                          src={proj.banner}
                          alt={proj.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#090c1a] via-transparent to-black/30" />
                      </div>

                      <div className="p-4 sm:p-5 pt-0 -mt-8 sm:-mt-10 space-y-3 relative">
                        <div className="flex items-end justify-between">
                          <div className="flex items-end gap-3">
                            <img
                              src={proj.logo}
                              alt={proj.name}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-[#090c1a] shadow-xl border border-cyan-500/30"
                            />
                            <div className="pb-1">
                              <h3
                                onClick={() => handleSelectUser(proj.username)}
                                className="text-base sm:text-lg font-bold text-white hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                <span>{proj.name}</span>
                              </h3>
                              <p className="text-xs text-purple-400">@{proj.username}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (currentUser) {
                                  projectService.toggleFollowProject(proj.id, currentUser.id);
                                  setFollowedProjectIds(projectService.getFollowedProjectIds(currentUser.id));
                                }
                              }}
                              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
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

                            <button
                              type="button"
                              onClick={() => handleSelectUser(proj.username)}
                              className="px-3.5 py-1.5 rounded-full border border-white/15 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer hidden sm:inline-block"
                            >
                              Profile →
                            </button>
                          </div>
                        </div>

                        {/* Badges & Category */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                            {proj.category}
                          </span>

                          {proj.collection?.verificationStatus === 'verified' ? (
                            <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              <ShieldCheck className="w-3 h-3" />
                              Verified Collection
                            </span>
                          ) : proj.collection?.verificationStatus === 'pending' ? (
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

                        <p className="text-xs text-slate-300 leading-relaxed pt-1">
                          {proj.description}
                        </p>

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                          <div className="flex items-center gap-4">
                            <span><strong className="text-white">{proj.followersCount.toLocaleString()}</strong> followers</span>
                            <span><strong className="text-white">{proj.relaysCount}</strong> relays co-created</span>
                          </div>

                          {proj.collection?.name && (
                            <span className="text-[11px] text-cyan-400 font-medium truncate max-w-[150px]">
                              {proj.collection.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : currentRoute === '/profile' ? (
            /* H. Dedicated Account Profile View */
            currentUser ? (
              <div>
                {/* Top Sticky Header */}
                <div className="sticky top-0 z-30 bg-[#06070a]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRouteNavigate('/home')}
                      className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Back to Feed"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h1 className="text-lg font-extrabold text-white">Your Profile</h1>
                      <p className="text-xs text-slate-400">@{currentUser.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditName(currentUser.displayName);
                        setEditUsername(currentUser.username);
                        setEditBio(currentUser.bio || '');
                        setEditPhotoURL(currentUser.photoURL || '');
                        setIsEditingProfile(!isEditingProfile);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isEditingProfile ? 'Cancel' : 'Edit Profile'}</span>
                    </button>

                    {/* Prominent Log Out button: Logs out and returns to landing page */}
                    <button
                      type="button"
                      onClick={async () => {
                        await signOut();
                        onNavigateHomeLanding();
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 transition-all cursor-pointer shadow-sm"
                      title="Log out and return to landing page"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>

                {/* Profile Header & Info Card */}
                <div className="relative border-b border-white/10">
                  <div className="h-32 sm:h-44 bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-pink-900/40 border-b border-white/5" />
                  <div className="px-5 pb-5">
                    <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-4">
                      <div className="relative group">
                        <Avatar
                          src={currentUser.photoURL}
                          name={currentUser.displayName}
                          size="xl"
                          className="ring-4 ring-[#06070a] shadow-xl"
                        />
                        <button
                          onClick={() => {
                            setEditName(currentUser.displayName);
                            setEditUsername(currentUser.username);
                            setEditBio(currentUser.bio || '');
                            setEditPhotoURL(currentUser.photoURL || '');
                            setIsEditingProfile(true);
                          }}
                          className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white"
                          title="Change picture"
                        >
                          <Camera className="w-5 h-5" />
                        </button>
                        <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[#06070a]" />
                      </div>
                    </div>

                    {isEditingProfile ? (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const clean = editUsername.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
                          if (!clean || clean.length < 3) return;
                          setIsSavingProfile(true);
                          try {
                            await updateUser({
                              displayName: editName.trim() || currentUser.displayName,
                              username: clean,
                              bio: editBio.trim(),
                              photoURL: editPhotoURL.trim() || currentUser.photoURL,
                            });
                            setIsEditingProfile(false);
                          } finally {
                            setIsSavingProfile(false);
                          }
                        }}
                        className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10 mb-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Display Name</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Username (@)</label>
                            <input
                              type="text"
                              value={editUsername}
                              onChange={(e) => setEditUsername(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Profile Photo URL</label>
                          <input
                            type="url"
                            value={editPhotoURL}
                            onChange={(e) => setEditPhotoURL(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Bio</label>
                          <textarea
                            value={editBio}
                            maxLength={160}
                            onChange={(e) => setEditBio(e.target.value)}
                            rows={2}
                            placeholder="Tell the community about yourself..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white resize-none"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(false)}
                            className="px-3 py-1 rounded-full text-xs text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingProfile}
                            className="px-4 py-1 rounded-full bg-white text-slate-900 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                          >
                            {isSavingProfile ? 'Saving...' : 'Save Details'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl sm:text-2xl font-extrabold text-white">{currentUser.displayName}</h2>
                          <ShieldCheck className="w-5 h-5 text-cyan-400" />
                        </div>
                        <p className="text-xs text-purple-400 font-semibold">@{currentUser.username}</p>
                        <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
                          {currentUser.bio || 'Digital creator on the Mosaic social network.'}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                          <span>Joined {new Date(currentUser.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                          <span>·</span>
                          <span className="text-slate-400">{currentUser.email}</span>
                          <span>·</span>
                          <span className="capitalize px-2 py-0.5 rounded-full bg-white/5 text-purple-300 font-medium">
                            {currentUser.accountType}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profile Section Tabs */}
                  <div className="flex border-t border-white/10 overflow-x-auto">
                    <button
                      onClick={() => setOwnProfileTab('nfts')}
                      className={`flex-1 py-3 text-xs font-bold text-center transition-all cursor-pointer relative shrink-0 min-w-[100px] ${
                        ownProfileTab === 'nfts' ? 'text-cyan-300' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>My NFTs {walletState.address ? `(${hubOwnedNfts.length})` : ''}</span>
                      {ownProfileTab === 'nfts' && (
                        <span className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-cyan-400 rounded-full" />
                      )}
                    </button>
                    <button
                      onClick={() => setOwnProfileTab('posts')}
                      className={`flex-1 py-3 text-xs font-bold text-center transition-all cursor-pointer relative shrink-0 min-w-[100px] ${
                        ownProfileTab === 'posts' ? 'text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Posts ({postService.getUserPosts(currentUser.username).length})</span>
                      {ownProfileTab === 'posts' && (
                        <span className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-purple-500 rounded-full" />
                      )}
                    </button>
                    <button
                      onClick={() => setOwnProfileTab('bookmarks')}
                      className={`flex-1 py-3 text-xs font-bold text-center transition-all cursor-pointer relative shrink-0 min-w-[100px] ${
                        ownProfileTab === 'bookmarks' ? 'text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Bookmarks ({postService.getBookmarkedPosts(currentUser.id).length})</span>
                      {ownProfileTab === 'bookmarks' && (
                        <span className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-cyan-400 rounded-full" />
                      )}
                    </button>
                    <button
                      onClick={() => setOwnProfileTab('projects')}
                      className={`flex-1 py-3 text-xs font-bold text-center transition-all cursor-pointer relative shrink-0 min-w-[100px] ${
                        ownProfileTab === 'projects' ? 'text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>NFT Projects ({projectsList.filter((p) => p.ownerId === currentUser.id).length})</span>
                      {ownProfileTab === 'projects' && (
                        <span className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-pink-500 rounded-full" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Profile Tab: My NFTs Stream */}
                {ownProfileTab === 'nfts' && (
                  <div className="p-4 sm:p-5">
                    {!walletState.address ? (
                      <div className="py-14 text-center space-y-3 max-w-sm mx-auto">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
                          <Wallet className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-white">Connect Wallet to Display NFTs</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Mosaic retrieves real on-chain ownership from Ethereum, Base, Polygon, & Arbitrum. We never hardcode or fabricate owned tokens.
                        </p>
                        <button
                          type="button"
                          onClick={connectWallet}
                          disabled={walletState.status === 'connecting'}
                          className="px-5 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 font-bold text-xs hover:opacity-95 transition-opacity cursor-pointer shadow-md"
                        >
                          {walletState.status === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
                        </button>
                      </div>
                    ) : isLoadingHubNfts ? (
                      <div className="py-14 text-center space-y-2">
                        <div className="w-8 h-8 border-2 border-cyan-400 border-t-purple-500 rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-slate-400">Querying real-time on-chain tokens...</p>
                      </div>
                    ) : hubOwnedNfts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {hubOwnedNfts.map((nft) => (
                          <OwnedNftCard
                            key={nft.id}
                            nft={nft}
                            onSelect={(selected) => setHubNftDetail(selected)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-14 text-center space-y-2 max-w-xs mx-auto">
                        <Wallet className="w-8 h-8 text-slate-600 mx-auto" />
                        <h4 className="text-sm font-bold text-white">No NFTs Found</h4>
                        <p className="text-xs text-slate-400">
                          No verified ERC-721 or ERC-1155 tokens found in connected wallet.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Profile Tab Stream */}
                {ownProfileTab === 'posts' && (
                  <div>
                    {postService.getUserPosts(currentUser.username).length > 0 ? (
                      <div className="divide-y divide-white/5">
                        {postService.getUserPosts(currentUser.username).map((post) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            onSelectPost={(p) => setSelectedPost(p)}
                            onOpenReply={(p) => setReplyModalPost(p)}
                            onOpenQuote={(p) => setQuoteModalPost(p)}
                            onSelectUser={handleSelectUser}
                            onSelectHashtag={handleSelectHashtag}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center space-y-2 px-4">
                        <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-white">No posts yet</h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                          Share your thoughts, join threads, and post artwork updates on Mosaic!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {ownProfileTab === 'bookmarks' && (
                  <div>
                    {postService.getBookmarkedPosts(currentUser.id).length > 0 ? (
                      <div className="divide-y divide-white/5">
                        {postService.getBookmarkedPosts(currentUser.id).map((post) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            onSelectPost={(p) => setSelectedPost(p)}
                            onOpenReply={(p) => setReplyModalPost(p)}
                            onOpenQuote={(p) => setQuoteModalPost(p)}
                            onSelectUser={handleSelectUser}
                            onSelectHashtag={handleSelectHashtag}
                            onBookmarkRemoved={() => {
                              loadFeed();
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center space-y-2 px-4">
                        <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-white">No bookmarks yet</h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                          Click bookmark on any post in your feed to save it for later.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {ownProfileTab === 'projects' && (
                  <div className="p-4 space-y-4">
                    {projectsList.filter((p) => p.ownerId === currentUser.id).length > 0 ? (
                      projectsList
                        .filter((p) => p.ownerId === currentUser.id)
                        .map((proj) => (
                          <div
                            key={proj.id}
                            className="p-4 rounded-2xl bg-[#090c1a] border border-white/10 space-y-3"
                          >
                            <div className="flex items-center gap-3">
                              <img src={proj.logo} alt={proj.name} className="w-10 h-10 rounded-xl object-cover" />
                              <div>
                                <h4 className="text-sm font-bold text-white">{proj.name}</h4>
                                <p className="text-xs text-cyan-400">@{proj.username}</p>
                              </div>
                            </div>
                            <p className="text-xs text-slate-300">{proj.description}</p>
                          </div>
                        ))
                    ) : (
                      <div className="py-16 text-center space-y-3 px-4">
                        <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-white">No NFT projects created</h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                          Launch your own dedicated NFT Project account on Mosaic with living relays and verification.
                        </p>
                        <button
                          onClick={() => setIsCreateProjectModalOpen(true)}
                          className="px-4 py-2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold cursor-pointer hover:bg-cyan-500/30 transition-colors"
                        >
                          Create NFT Project
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center px-4 space-y-4">
                <ShieldCheck className="w-10 h-10 text-cyan-400 mx-auto" />
                <h3 className="text-lg font-bold text-white">Sign In to View Profile</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Sign in with your Google account to access your personal profile, posts, and bookmarks.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => handleRouteNavigate('/login')}
                    className="px-5 py-2.5 rounded-full bg-white text-slate-900 font-bold text-xs cursor-pointer hover:bg-slate-200"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={onNavigateHomeLanding}
                    className="px-5 py-2.5 rounded-full bg-white/5 text-slate-300 font-medium text-xs cursor-pointer hover:bg-white/10"
                  >
                    Back to Landing Page
                  </button>
                </div>
              </div>
            )
          ) : (
            /* Fallback: if route is not specifically matched, render default Home feed */
            <div>
              <div className="sticky top-0 z-30 bg-[#06070a]/90 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center justify-between px-4 py-3">
                  <h1 className="text-lg font-extrabold text-white tracking-tight">Home</h1>
                  <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Mosaic Social</span>
                  </span>
                </div>
              </div>
              <PostComposer onPostCreated={loadFeed} />
              <div className="divide-y divide-white/5">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onSelectPost={(p) => setSelectedPost(p)}
                      onOpenReply={(p) => setReplyModalPost(p)}
                      onOpenQuote={(p) => setQuoteModalPost(p)}
                      onSelectUser={handleSelectUser}
                      onSelectHashtag={handleSelectHashtag}
                    />
                  ))
                ) : (
                  <div className="py-20 text-center px-4 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-white">No posts yet</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Be the first to share your perspective with the community! Use the composer above to publish a post.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* RIGHT COLUMN: Discovery Sidebar */}
        <SocialRightSidebar
          onSearch={(query) => {
            handleRouteNavigate(`/explore?q=${encodeURIComponent(query)}`);
          }}
          onSelectHashtag={handleSelectHashtag}
          onSelectCreator={handleSelectUser}
          onOpenRelay={(rId) => {
            handleRouteNavigate(rId ? `/relay/${rId}` : '/relay/relay-1847');
          }}
        />
      </div>

      {/* MOBILE FLOATING COMPOSE ACTION BUTTON */}
      {!selectedPost && !viewingUsername && (
        <button
          onClick={() => {
            if (!currentUser) {
              handleRouteNavigate('/login');
            } else {
              setIsMobileComposerOpen(true);
            }
          }}
          className="md:hidden fixed bottom-20 right-4 z-40 p-3.5 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-slate-950 shadow-2xl shadow-purple-900/60 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Compose Post"
          aria-label="Compose Post"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* MOBILE COMPOSER MODAL */}
      {isMobileComposerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-[#0b0e1e] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 max-w-lg w-full mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5">
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>New Mosaic Post</span>
              </span>
              <button
                onClick={() => setIsMobileComposerOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <PostComposer
              onPostCreated={() => {
                setIsMobileComposerOpen(false);
                loadFeed();
              }}
            />
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#06070a]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around py-3 z-40">
        <button
          onClick={() => handleRouteNavigate('/home')}
          className={`p-2 ${currentRoute === '/home' ? 'text-cyan-400' : 'text-slate-400'}`}
        >
          <Home className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleRouteNavigate('/explore')}
          className={`p-2 ${currentRoute === '/explore' ? 'text-cyan-400' : 'text-slate-400'}`}
        >
          <Compass className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleRouteNavigate('/notifications')}
          className={`p-2 relative ${currentRoute === '/notifications' ? 'text-cyan-400' : 'text-slate-400'}`}
        >
          <Bell className="w-5 h-5" />
          {unreadNotifsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-pink-500" />
          )}
        </button>
        <button
          onClick={() => handleRouteNavigate('/bookmarks')}
          className={`p-2 ${currentRoute === '/bookmarks' ? 'text-cyan-400' : 'text-slate-400'}`}
        >
          <Bookmark className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleRouteNavigate('/profile')}
          className={`p-2 flex items-center justify-center ${currentRoute === '/profile' ? 'text-cyan-400' : 'text-slate-400'}`}
          title="Account Profile"
        >
          {currentUser ? (
            <Avatar src={currentUser.photoURL} name={currentUser.displayName} size="xs" />
          ) : (
            <User className="w-5 h-5" />
          )}
        </button>
      </nav>

      {/* MODALS */}
      <ReplyModal
        post={replyModalPost}
        isOpen={!!replyModalPost}
        onClose={() => setReplyModalPost(null)}
        onReplySuccess={loadFeed}
      />

      <QuoteModal
        post={quoteModalPost}
        isOpen={!!quoteModalPost}
        onClose={() => setQuoteModalPost(null)}
        onQuoteSuccess={loadFeed}
      />

      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onProjectCreated={(newProj) => {
          setViewingUsername(newProj.username);
        }}
      />

      <OwnedNftDetailModal
        nft={hubNftDetail}
        onClose={() => setHubNftDetail(null)}
      />
    </div>
  );
};
