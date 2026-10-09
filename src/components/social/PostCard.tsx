import React, { useState } from 'react';
import { SocialPost } from '../../types';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { postService } from '../../services/postService';
import {
  MessageCircle,
  Repeat2,
  Heart,
  Bookmark,
  Share2,
  Quote,
  Check,
  BarChart2,
  ExternalLink,
  ChevronRight,
  Layers,
} from 'lucide-react';

interface PostCardProps {
  post: SocialPost;
  onOpenReply?: (post: SocialPost) => void;
  onOpenQuote?: (post: SocialPost) => void;
  onSelectPost?: (post: SocialPost) => void;
  onSelectUser?: (username: string) => void;
  onSelectHashtag?: (tag: string) => void;
  onBookmarkRemoved?: (postId: string) => void;
  showThreadConnector?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onOpenReply,
  onOpenQuote,
  onSelectPost,
  onSelectUser,
  onSelectHashtag,
  onBookmarkRemoved,
  showThreadConnector = false,
}) => {
  const { currentUser } = useAuth();
  const [showRepostMenu, setShowRepostMenu] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const currentUserId = currentUser?.id || 'guest';
  const hasLiked = post.likedBy.includes(currentUserId);
  const hasReposted = post.repostedBy.includes(currentUserId);
  const hasBookmarked = post.bookmarkedBy.includes(currentUserId);

  // Poll state
  const userVotedOptionId = post.poll?.voters[currentUserId];

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    await postService.toggleLike(post.id, currentUser.id, {
      name: currentUser.displayName,
      username: currentUser.username,
      photoURL: currentUser.photoURL,
    });
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    setShowRepostMenu(false);
    await postService.toggleRepost(post.id, currentUser.id, {
      name: currentUser.displayName,
      username: currentUser.username,
      photoURL: currentUser.photoURL,
    });
  };

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRepostMenu(false);
    if (onOpenQuote) {
      onOpenQuote(post);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    const wasBookmarked = post.bookmarkedBy.includes(currentUser.id);
    await postService.toggleBookmark(post.id, currentUser.id);
    if (wasBookmarked && onBookmarkRemoved) {
      onBookmarkRemoved(post.id);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      const shareUrl = `${window.location.origin}/post/${post.id}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  };

  const handleVote = async (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    await postService.votePoll(post.id, optionId, currentUser.id);
  };

  // Format relative timestamp
  const formatTimestamp = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h`;
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'recently';
    }
  };

  // Render text with clickable #hashtags and @mentions
  const renderFormattedText = (content: string) => {
    // Regex splits text preserving exact hashtags (#word) and mentions (@word)
    const tokenRegex = /(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g;
    const parts = content.split(tokenRegex);
    return parts.map((part, index) => {
      if (part.startsWith('#') && part.length > 1) {
        const cleanTag = part.slice(1);
        return (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectHashtag) onSelectHashtag(cleanTag);
            }}
            className="text-cyan-400 font-semibold hover:underline cursor-pointer"
          >
            {part}
          </span>
        );
      }
      if (part.startsWith('@') && part.length > 1) {
        const username = part.slice(1);
        return (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectUser) onSelectUser(username);
            }}
            className="text-purple-400 font-semibold hover:underline cursor-pointer"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <article
      onClick={() => onSelectPost && onSelectPost(post)}
      className="p-4 sm:p-5 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer relative group"
    >
      {/* Toast notification */}
      {copiedToast && (
        <div className="absolute top-2 right-4 z-20 px-3 py-1.5 rounded-full bg-purple-600 text-white text-xs font-semibold shadow-lg animate-in fade-in">
          Link copied to clipboard
        </div>
      )}

      {/* Repost Header indicator if reposted */}
      {hasReposted && (
        <div className="text-[11px] font-semibold text-slate-500 mb-2 pl-9 flex items-center gap-1.5">
          <Repeat2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>You reposted</span>
        </div>
      )}

      {/* Thread order indicator if in thread */}
      {post.threadOrder && (
        <div className="text-[11px] font-semibold text-purple-400 mb-2 pl-9 flex items-center gap-1.5">
          <span>Thread {post.threadOrder}/{post.totalInThread || 3}</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Left Avatar with Thread Connector */}
        <div className="relative flex flex-col items-center shrink-0">
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectUser) onSelectUser(post.authorUsername);
            }}
          >
            <Avatar
              src={post.authorPhotoURL}
              name={post.authorName}
              size="md"
              className="ring-1 ring-white/10 hover:ring-purple-400 transition-all cursor-pointer"
            />
          </div>

          {showThreadConnector && (
            <div className="w-0.5 grow min-h-8 bg-purple-500/20 my-1 rounded-full" />
          )}
        </div>

        {/* Right Post Body */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Header row: Name, @username, time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectUser) onSelectUser(post.authorUsername);
                }}
                className="font-bold text-sm text-white hover:underline cursor-pointer truncate"
              >
                {post.authorName}
              </span>

              {(post.isProjectPost || post.authorAccountType === 'project') ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 shrink-0">
                  <Layers className="w-2.5 h-2.5 text-cyan-400" />
                  <span>Project</span>
                </span>
              ) : post.authorBadge ? (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                  {post.authorBadge}
                </span>
              ) : null}

              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectUser) onSelectUser(post.authorUsername);
                }}
                className="text-xs text-slate-400 hover:text-slate-300 truncate cursor-pointer"
              >
                @{post.authorUsername}
              </span>

              <span className="text-slate-600 text-xs">·</span>
              <span className="text-xs text-slate-500 shrink-0">{formatTimestamp(post.createdAt)}</span>
            </div>
          </div>

          {/* Post Text */}
          <div className="text-sm text-slate-200 leading-relaxed break-words whitespace-pre-line font-normal">
            {renderFormattedText(post.text)}
          </div>

          {/* Attached Media Grid */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div
              className={`grid gap-2 rounded-2xl overflow-hidden mt-3 border border-white/5 ${
                post.mediaUrls.length === 1 ? 'grid-cols-1 max-h-96' : 'grid-cols-2 max-h-80'
              }`}
            >
              {post.mediaUrls.map((url, i) => (
                <div key={i} className="relative aspect-video bg-[#0b0e1a] overflow-hidden">
                  <img src={url} alt={`Post media ${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Attached Poll */}
          {post.poll && (
            <div className="p-3.5 rounded-2xl bg-[#090d1c] border border-purple-500/20 space-y-2 mt-2">
              <div className="space-y-2">
                {post.poll.options.map((opt) => {
                  const percentage =
                    post.poll!.totalVotes > 0
                      ? Math.round((opt.votes / post.poll!.totalVotes) * 100)
                      : 0;
                  const isUserSelection = userVotedOptionId === opt.id;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={(e) => handleVote(opt.id, e)}
                      className={`relative w-full text-left p-2.5 rounded-xl border text-xs font-medium transition-all overflow-hidden flex items-center justify-between cursor-pointer ${
                        isUserSelection
                          ? 'border-purple-400 bg-purple-950/40 text-white font-bold'
                          : 'border-white/10 hover:border-white/20 bg-white/5 text-slate-300'
                      }`}
                    >
                      {/* Background progress percentage bar */}
                      <div
                        className="absolute inset-y-0 left-0 bg-purple-500/20 transition-all duration-500 pointer-events-none"
                        style={{ width: `${percentage}%` }}
                      />

                      <span className="relative z-10 flex items-center gap-2">
                        {isUserSelection && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                        <span>{opt.text}</span>
                      </span>

                      <span className="relative z-10 text-slate-400 font-semibold">
                        {percentage}%
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>{post.poll.totalVotes} votes total</span>
                <span>Active poll</span>
              </div>
            </div>
          )}

          {/* Attached NFT Card */}
          {post.attachedNft && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0a0d1c] border border-white/10 hover:border-purple-500/30 transition-all mt-2">
              <img
                src={post.attachedNft.image}
                alt={post.attachedNft.name}
                className="w-12 h-12 rounded-xl object-cover bg-slate-900 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{post.attachedNft.name}</p>
                <p className="text-[11px] text-purple-400 truncate">{post.attachedNft.collection}</p>
              </div>
              <span className="text-[10px] font-bold text-cyan-400 px-2 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/20">
                {post.attachedNft.relaysCount || 38} Relays
              </span>
            </div>
          )}

          {/* Quoted Post Box */}
          {post.quotePost && (
            <div className="p-3.5 rounded-2xl bg-[#080b18] border border-white/10 hover:border-purple-500/30 transition-colors mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <Avatar
                  src={post.quotePost.authorPhotoURL}
                  name={post.quotePost.authorName}
                  size="xs"
                />
                <span className="text-xs font-bold text-white">{post.quotePost.authorName}</span>
                <span className="text-[11px] text-slate-500">@{post.quotePost.authorUsername}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                {post.quotePost.text}
              </p>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 max-w-md">
            {/* 1. Reply */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenReply) onOpenReply(post);
              }}
              className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors cursor-pointer group/btn"
              title="Reply"
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-cyan-500/10">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span>{post.repliesCount || ''}</span>
            </button>

            {/* 2. Repost / Quote Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRepostMenu(!showRepostMenu);
                }}
                className={`flex items-center gap-1.5 transition-colors cursor-pointer group/btn ${
                  hasReposted ? 'text-emerald-400 font-bold' : 'hover:text-emerald-400'
                }`}
                title="Repost or Quote"
              >
                <div className="p-1.5 rounded-full group-hover/btn:bg-emerald-500/10">
                  <Repeat2 className="w-4 h-4" />
                </div>
                <span>{post.repostsCount || ''}</span>
              </button>

              {showRepostMenu && (
                <div className="absolute left-0 bottom-full mb-1 w-36 rounded-xl bg-[#0c1020] border border-white/10 shadow-2xl p-1.5 z-30 animate-in fade-in duration-100">
                  <button
                    onClick={handleRepost}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg text-left"
                  >
                    <Repeat2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{hasReposted ? 'Undo Repost' : 'Repost'}</span>
                  </button>
                  <button
                    onClick={handleQuoteClick}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg text-left"
                  >
                    <Quote className="w-3.5 h-3.5 text-purple-400" />
                    <span>Quote Post</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Like */}
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer group/btn ${
                hasLiked ? 'text-rose-500 font-bold' : 'hover:text-rose-400'
              }`}
              title="Like"
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-rose-500/10">
                <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500' : ''}`} />
              </div>
              <span>{post.likesCount || ''}</span>
            </button>

            {/* 4. Bookmark */}
            <button
              type="button"
              onClick={handleBookmark}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer group/btn ${
                hasBookmarked ? 'text-purple-400 font-bold' : 'hover:text-purple-400'
              }`}
              title="Bookmark"
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-purple-500/10">
                <Bookmark className={`w-4 h-4 ${hasBookmarked ? 'fill-purple-500' : ''}`} />
              </div>
            </button>

            {/* 5. Share */}
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors cursor-pointer group/btn"
              title="Share"
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-cyan-500/10">
                <Share2 className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
