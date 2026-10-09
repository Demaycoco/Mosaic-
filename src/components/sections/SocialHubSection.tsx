import React, { useState, useEffect } from 'react';
import { postService } from '../../services/postService';
import { SocialPost } from '../../types';
import { Avatar } from '../common/Avatar';
import { Heart, MessageSquare, Share2, Sparkles, Send } from 'lucide-react';

interface SocialHubSectionProps {
  onOpenAuth: () => void;
  onExploreRelays: () => void;
}

export const SocialHubSection: React.FC<SocialHubSectionProps> = ({
  onOpenAuth,
  onExploreRelays,
}) => {
  const [livePosts, setLivePosts] = useState<SocialPost[]>(() => postService.getAllPosts());
  const [draftPost, setDraftPost] = useState('');

  useEffect(() => {
    const unsub = postService.subscribe(() => {
      setLivePosts(postService.getAllPosts());
    });
    return () => unsub();
  }, []);

  const toggleLike = (postId: string) => {
    postService.toggleLike(postId, 'guest-user');
    setLivePosts(postService.getAllPosts());
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftPost.trim()) return;
    postService.createPost({
      authorId: 'guest-collector',
      authorName: 'Guest Collector',
      authorUsername: 'collector',
      authorPhotoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      text: draftPost.trim(),
    });
    setDraftPost('');
  };

  return (
    <section id="social" className="relative py-24 md:py-32 border-t border-white/5 bg-[#05060c] overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 right-1/4 w-[450px] h-[450px] bg-pink-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Social Hub Editorial */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs md:text-sm font-bold tracking-[0.2em] text-cyan-400 uppercase">
              SOCIAL HUB
            </span>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Where dialogue shapes{' '}
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                digital art
              </span>
              .
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              NFTs on Mosaic are not silent tokens sitting idle. Follow creators you admire, discuss creative forks, react to Relay transitions, and be part of what you love.
            </p>

            {/* Micro Highlights */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#090c18] border border-white/5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Provenance Notes</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Leave public thoughts on artwork chapters that follow the token across owners forever.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#090c18] border border-white/5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Direct Creator Discourse</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Artists post work-in-progress forks, prompt their communities, and solicit real-time feedback.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Social Feed */}
          <div className="lg:col-span-7 space-y-4">
            {/* Quick Post Creator */}
            <form
              onSubmit={handleCreatePost}
              className="p-4 sm:p-5 rounded-2xl bg-[#090c18] border border-white/10 shadow-lg space-y-3"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
                  name="You"
                  size="sm"
                />
                <input
                  type="text"
                  value={draftPost}
                  onChange={(e) => setDraftPost(e.target.value)}
                  placeholder="Share a perspective on a collection or ongoing Relay..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Posting as verified community member
                </span>
                <button
                  type="submit"
                  disabled={!draftPost.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 disabled:opacity-40 text-white font-semibold text-xs transition-opacity cursor-pointer shadow-md shadow-purple-900/30"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </form>

            {/* Feed Items */}
            <div className="space-y-4">
              {livePosts.length > 0 ? (
                livePosts.slice(0, 4).map((post) => (
                  <div
                    key={post.id}
                    className="p-5 sm:p-6 rounded-2xl bg-[#080b16] border border-white/10 hover:border-purple-500/30 transition-all duration-200 space-y-3"
                  >
                    {/* Author Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar src={post.authorPhotoURL} name={post.authorName} size="sm" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{post.authorName}</h4>
                            <span className="text-xs text-slate-400">@{post.authorUsername}</span>
                          </div>
                          {post.authorBadge && (
                            <span className="text-[10px] text-purple-400 font-medium">
                              {post.authorBadge}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Post Content */}
                    <p className="text-sm text-slate-300 leading-relaxed">{post.text}</p>

                    {/* Media Previews */}
                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                      <div className="rounded-xl overflow-hidden aspect-video bg-black/40">
                        <img src={post.mediaUrls[0]} alt="Media" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Feed Interaction Buttons */}
                    <div className="pt-2 flex items-center gap-6 text-xs text-slate-400 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => toggleLike(post.id)}
                        className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                          post.likesCount > 0 ? 'text-rose-400' : 'hover:text-white'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${post.likesCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`}
                        />
                        <span>{post.likesCount}</span>
                      </button>

                      <button
                        type="button"
                        onClick={onOpenAuth}
                        className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.repliesCount}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(window.location.href);
                          }
                        }}
                        className="flex items-center gap-1.5 hover:text-white transition-colors ml-auto cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>{post.repostsCount}</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 rounded-2xl bg-[#080b16] border border-white/10 text-center space-y-2">
                  <Sparkles className="w-6 h-6 text-purple-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No community posts yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Share a perspective above to spark the conversation on Mosaic!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
