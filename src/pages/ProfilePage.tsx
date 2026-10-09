import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/common/Avatar';
import { sanitizeUsername } from '../services/authService';
import { postService } from '../services/postService';
import { projectService } from '../services/projectService';
import { SocialPost, NftProjectAccount } from '../types';
import { PostCard } from '../components/social/PostCard';
import {
  ArrowLeft,
  Edit3,
  Check,
  X,
  ShieldCheck,
  Sparkles,
  Settings,
  LogOut,
  MessageSquare,
  Bookmark,
  Layers,
  Camera,
} from 'lucide-react';

interface ProfilePageProps {
  onBack: () => void;
  onNavigateSettings?: () => void;
  onNavigateLogin?: () => void;
  onSignOut?: () => void;
  onNavigateLanding?: () => void;
  onSelectPost?: (post: SocialPost) => void;
  onSelectUser?: (username: string) => void;
  onSelectHashtag?: (tag: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onBack,
  onNavigateSettings,
  onNavigateLogin,
  onSignOut,
  onNavigateLanding,
  onSelectPost,
  onSelectUser,
  onSelectHashtag,
}) => {
  const { currentUser, updateUser, signOut, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'bookmarks' | 'projects'>('posts');

  const [userPosts, setUserPosts] = useState<SocialPost[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<SocialPost[]>([]);
  const [userProjects, setUserProjects] = useState<NftProjectAccount[]>([]);

  useEffect(() => {
    if (currentUser) {
      setUserPosts(postService.getUserPosts(currentUser.username));
      setBookmarkedPosts(postService.getBookmarkedPosts(currentUser.id));
      setUserProjects(
        projectService.getAllProjects().filter((p) => p.ownerId === currentUser.id)
      );
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06070a]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-cyan-400 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06070a] p-4">
        <div className="p-8 rounded-3xl bg-[#090b16] border border-white/10 text-center max-w-sm space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-cyan-950/50 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Sign In Required</h3>
          <p className="text-slate-400 text-xs">Please sign in to view and manage your Mosaic profile.</p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={onNavigateLogin}
              className="w-full py-2.5 rounded-full bg-white text-slate-900 font-bold text-xs cursor-pointer hover:bg-slate-200 transition-colors"
            >
              Sign In with Google
            </button>
            <button
              onClick={onNavigateLanding || onBack}
              className="w-full py-2.5 rounded-full bg-white/5 text-slate-400 hover:text-white font-semibold text-xs cursor-pointer transition-colors"
            >
              Back to Landing Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    if (onSignOut) {
      onSignOut();
    } else if (onNavigateLanding) {
      onNavigateLanding();
    } else {
      onBack();
    }
  };

  const startEditing = () => {
    setEditDisplayName(currentUser.displayName);
    setEditUsername(currentUser.username);
    setEditBio(currentUser.bio || '');
    setEditPhotoURL(currentUser.photoURL || '');
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = sanitizeUsername(editUsername);
    if (!cleanUsername || cleanUsername.length < 3) return;

    setIsSaving(true);
    try {
      await updateUser({
        displayName: editDisplayName.trim() || currentUser.displayName,
        username: cleanUsername,
        bio: editBio.trim(),
        photoURL: editPhotoURL.trim() || currentUser.photoURL,
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Oct 2026';

  return (
    <div className="min-h-screen pt-20 pb-20 px-4 sm:px-6 lg:px-8 bg-[#06070a] relative overflow-hidden">
      {/* Background illumination */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[170px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onNavigateLanding || onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Landing Page</span>
          </button>

          <div className="flex items-center gap-3">
            {onNavigateSettings && (
              <button
                type="button"
                onClick={onNavigateSettings}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white bg-white/5 border border-white/10 transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </button>
            )}

            {/* Prominent Log Out Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer shadow-sm"
              title="Log out of account and return to landing page"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="relative rounded-3xl bg-[#090b16] border border-white/10 shadow-2xl p-6 sm:p-10 overflow-hidden">
          {/* Banner backdrop */}
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-r from-blue-900/30 via-purple-900/40 to-pink-900/30 opacity-70" />

          <div className="relative z-10 pt-8 sm:pt-10">
            {isEditing ? (
              /* Inline Edit Mode */
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                    <span>Edit Profile Details</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-slate-900 text-xs font-bold cursor-pointer hover:bg-slate-200"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                      Username (@)
                    </label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Profile Picture URL
                  </label>
                  <input
                    type="url"
                    value={editPhotoURL}
                    onChange={(e) => setEditPhotoURL(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Bio
                  </label>
                  <textarea
                    value={editBio}
                    maxLength={160}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={2}
                    placeholder="Tell the community about your work and creative taste..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </form>
            ) : (
              /* View Mode */
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-6 border-b border-white/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="relative group">
                    <Avatar
                      src={currentUser.photoURL}
                      name={currentUser.displayName}
                      size="xl"
                      className="ring-4 ring-[#090b16] shadow-xl"
                    />
                    <button
                      onClick={startEditing}
                      className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white"
                      title="Update profile picture"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                    <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[#090b16]" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        {currentUser.displayName}
                      </h2>
                      <span title="Verified Member">
                        <ShieldCheck className="w-5 h-5 text-cyan-400" />
                      </span>
                    </div>
                    <p className="text-sm text-purple-400 font-semibold">@{currentUser.username}</p>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-lg pt-1 leading-relaxed">
                      {currentUser.bio || 'Digital creator & collector on Mosaic.'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-2">
                      <span>Joined {formattedDate}</span>
                      <span>·</span>
                      <span className="text-slate-400">{currentUser.email}</span>
                      <span>·</span>
                      <span className="capitalize px-2 py-0.5 rounded-full bg-white/5 text-purple-300 font-medium">
                        {currentUser.accountType} Account
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={startEditing}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Edit Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}

            {/* Profile Tabs */}
            <div className="pt-6">
              <div className="flex items-center gap-6 border-b border-white/5 pb-3">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`text-xs font-bold uppercase tracking-wider transition-colors pb-1 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'posts'
                      ? 'text-white border-b-2 border-purple-500'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>My Posts ({userPosts.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('bookmarks')}
                  className={`text-xs font-bold uppercase tracking-wider transition-colors pb-1 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'bookmarks'
                      ? 'text-white border-b-2 border-purple-500'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Bookmarks ({bookmarkedPosts.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('projects')}
                  className={`text-xs font-bold uppercase tracking-wider transition-colors pb-1 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'projects'
                      ? 'text-white border-b-2 border-purple-500'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>My Projects ({userProjects.length})</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="pt-6">
                {activeTab === 'posts' && (
                  <div>
                    {userPosts.length > 0 ? (
                      <div className="divide-y divide-white/5">
                        {userPosts.map((post) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            onSelectPost={onSelectPost}
                            onSelectUser={onSelectUser}
                            onSelectHashtag={onSelectHashtag}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center space-y-2">
                        <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-white">No posts yet</h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                          You haven&apos;t published any posts yet. Head over to the Social Hub to start sharing!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'bookmarks' && (
                  <div>
                    {bookmarkedPosts.length > 0 ? (
                      <div className="divide-y divide-white/5">
                        {bookmarkedPosts.map((post) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            onSelectPost={onSelectPost}
                            onSelectUser={onSelectUser}
                            onSelectHashtag={onSelectHashtag}
                            onBookmarkRemoved={(removedId) => {
                              setBookmarkedPosts((prev) => prev.filter((p) => p.id !== removedId));
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center space-y-2">
                        <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-white">No bookmarks yet</h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                          Bookmark interesting posts in your feed to view them here later.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'projects' && (
                  <div>
                    {userProjects.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {userProjects.map((proj) => (
                          <div
                            key={proj.id}
                            className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3"
                          >
                            <div className="flex items-center gap-3">
                              <img src={proj.logo} alt={proj.name} className="w-10 h-10 rounded-xl object-cover" />
                              <div>
                                <h4 className="text-sm font-bold text-white">{proj.name}</h4>
                                <p className="text-xs text-cyan-400">@{proj.username}</p>
                              </div>
                            </div>
                            <p className="text-xs text-slate-300 line-clamp-2">{proj.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center space-y-2">
                        <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <h4 className="text-sm font-bold text-white">No NFT Projects created yet</h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                          Launch a dedicated NFT project account to publish posts and create living artifact collections.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
