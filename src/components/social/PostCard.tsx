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
  ChevronRight,
  Layers,
  MoreHorizontal,
  Pencil,
  Trash2,
  Link,
  UserPlus,
  UserMinus,
  Loader2,
  Gem,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  EyeOff,
  UserX,
  Users,
} from 'lucide-react';
import { moderationService } from '../../services/moderationService';
import { ReportModal } from './ReportModal';


interface PostCardProps {
  post: SocialPost;
  onOpenReply?: (post: SocialPost) => void;
  onOpenQuote?: (post: SocialPost) => void;
  onSelectPost?: (post: SocialPost) => void;
  onSelectUser?: (username: string) => void;
  onSelectHashtag?: (tag: string) => void;
  onBookmarkRemoved?: (postId: string) => void;
  onPostDeleted?: (postId: string) => void;
  onPostEdited?: (post: SocialPost) => void;
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
  onPostDeleted,
  onPostEdited,
  showThreadConnector = false,
}) => {
  const { currentUser } = useAuth();
  const [showRepostMenu, setShowRepostMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Edit post state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete post modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Moderation state
  const [showReportModal, setShowReportModal] = useState(false);
  const [isHiddenLocally, setIsHiddenLocally] = useState(false);

  const currentUserId = currentUser?.id || 'guest';
  const isAuthor = currentUser ? currentUser.id === post.authorId || currentUser.username === post.authorUsername : false;
  const displayAvatar = (isAuthor && currentUser?.photoURL) ? currentUser.photoURL : post.authorPhotoURL;
  const displayName = (isAuthor && currentUser?.displayName) ? currentUser.displayName : post.authorName;
  const displayUsername = (isAuthor && currentUser?.username) ? currentUser.username : post.authorUsername;
  const hasLiked = post.likedBy?.includes(currentUserId) ?? false;
  const hasReposted = post.repostedBy?.includes(currentUserId) ?? false;
  const hasBookmarked = post.bookmarkedBy?.includes(currentUserId) ?? false;


  // Following author state
  const isFollowingAuthor = currentUser
    ? postService.getFollowingIds(currentUser.id).includes(post.authorId)
    : false;

  // Poll state
  const userVotedOptionId = post.poll?.voters?.[currentUserId];

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
    const wasBookmarked = post.bookmarkedBy?.includes(currentUser.id);
    await postService.toggleBookmark(post.id, currentUser.id);
    if (wasBookmarked && onBookmarkRemoved) {
      onBookmarkRemoved(post.id);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMoreMenu(false);
    if (navigator.clipboard) {
      const shareUrl = `${window.location.origin}/post/${post.id}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  };

  const handleBookmarkFromMenu = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMoreMenu(false);
    await handleBookmark(e);
  };

  const handleToggleFollowAuthor = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMoreMenu(false);
    if (!currentUser) return;
    postService.toggleFollow(post.authorId, currentUser.id);
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMoreMenu(false);
    setEditText(post.text);
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser || !editText.trim()) return;
    setIsSavingEdit(true);
    try {
      const updated = await postService.editPost(post.id, editText.trim(), currentUser.id);
      setIsEditing(false);
      if (onPostEdited) onPostEdited(updated);
    } catch (err) {
      console.error('Failed to edit post:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    setIsDeleting(true);
    try {
      await postService.deletePost(post.id, currentUser.id);
      setShowDeleteModal(false);
      if (onPostDeleted) onPostDeleted(post.id);
    } catch (err) {
      console.error('Failed to delete post:', err);
    } finally {
      setIsDeleting(false);
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
            className="text-purple-400 font-semibold hover:underline cursor-pointer font-mono"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (isHiddenLocally) {
    return (
      <div className="p-3.5 text-xs text-slate-500 bg-white/[0.01] border-b border-white/5 flex items-center justify-between">
        <span>Post hidden from your timeline</span>
        <button
          onClick={() => setIsHiddenLocally(false)}
          className="text-cyan-400 hover:underline cursor-pointer"
        >
          Undo
        </button>
      </div>
    );
  }

  return (
    <article
      onClick={() => onSelectPost && onSelectPost(post)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onSelectPost) {
          onSelectPost(post);
        }
      }}
      tabIndex={0}
      className="post-card group focus-visible:outline-none focus-visible:bg-white/[0.03]"
    >
      {/* Toast notification for link copying */}
      {copiedToast && (
        <div
          role="status"
          aria-live="polite"
          className="absolute top-2 right-4 z-20 px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-semibold shadow-lg shadow-purple-950/50"
        >
          Link copied to clipboard
        </div>
      )}

      {/* Repost Header indicator if viewer reposted */}
      {hasReposted && (
        <div className="text-[11px] font-semibold text-slate-400 mb-2 pl-12 flex items-center gap-1.5">
          <Repeat2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>You reposted</span>
        </div>
      )}

      {/* Thread order indicator if in multi-post thread */}
      {post.threadOrder && (
        <div className="text-[11px] font-semibold text-purple-400 mb-2 pl-12 flex items-center gap-1.5">
          <span>Thread {post.threadOrder}/{post.totalInThread || 3}</span>
        </div>
      )}

      <div className="flex items-start gap-3 sm:gap-3.5">
        {/* Post Avatar (Consistent alignment with thread line support) */}
        <div className="post-avatar">
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectUser) onSelectUser(displayUsername);
            }}
            className="cursor-pointer"
          >
            {displayAvatar ? (
              <Avatar
                src={displayAvatar}
                name={displayName}
                size="md"
                className="ring-1 ring-white/10 hover:ring-cyan-400/60 transition-all"
              />
            ) : (
              <div
                aria-hidden="true"
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-700 to-cyan-500 text-white flex items-center justify-center font-bold text-sm ring-1 ring-white/10"
              >
                {displayName?.charAt(0) || 'M'}
              </div>
            )}
          </div>

          {showThreadConnector && (
            <div
              aria-hidden="true"
              className="w-0.5 grow min-h-8 bg-purple-500/20 mx-auto my-1 rounded-full"
            />
          )}
        </div>

        {/* Post Body (Semantic Header, Content, Attachments, Actions) */}
        <div className="post-body min-w-0 flex-1">
          {/* Post Header: authorName, @username, timestamp, More Menu (X-style) */}
          <header className="post-header flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 truncate min-w-0 flex-wrap">
              <strong
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectUser) onSelectUser(displayUsername);
                }}
                className="font-bold text-sm text-white hover:underline cursor-pointer truncate"
              >
                {displayName}
              </strong>

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

              {post.communityHandle && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    window.history.pushState({}, '', `/community/${post.communityHandle}`);
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full hover:bg-cyan-900/60 transition-colors cursor-pointer shrink-0"
                  title={`Community: ${post.communityName || post.communityHandle}`}
                >
                  <Users className="w-2.5 h-2.5 text-cyan-400" />
                  <span>c/{post.communityHandle}</span>
                </span>
              )}

              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectUser) onSelectUser(displayUsername);
                }}
                className="text-xs text-slate-400 hover:text-slate-300 truncate cursor-pointer font-mono"
              >
                @{displayUsername}
              </span>

              <span className="text-slate-600 text-xs shrink-0">·</span>
              <time
                dateTime={post.createdAt}
                title={new Date(post.createdAt).toLocaleString()}
                className="text-xs text-slate-500 shrink-0 font-normal"
              >
                {formatTimestamp(post.createdAt)}
              </time>

              {post.updatedAt && (
                <>
                  <span className="text-slate-600 text-xs shrink-0">·</span>
                  <span
                    className="text-[11px] text-slate-400 font-medium shrink-0"
                    title={`Edited on ${new Date(post.updatedAt).toLocaleString()}`}
                  >
                    Edited
                  </span>
                </>
              )}
            </div>

            {/* Three Dots More Menu Button */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoreMenu(!showMoreMenu);
                }}
                className="p-1 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="More options"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMoreMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1 w-44 rounded-2xl bg-[#0d1124] border border-white/10 shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md"
                >
                  {isAuthor ? (
                    <>
                      <button
                        type="button"
                        onClick={handleStartEdit}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-white/10 rounded-xl text-left cursor-pointer transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Edit post</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          setShowDeleteModal(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-left cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete post</span>
                      </button>
                      <div className="h-px bg-white/5 my-1" />
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleToggleFollowAuthor}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-white/10 rounded-xl text-left cursor-pointer transition-colors"
                      >
                        {isFollowingAuthor ? (
                          <>
                            <UserMinus className="w-3.5 h-3.5 text-slate-400" />
                            <span>Unfollow @{post.authorUsername}</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Follow @{post.authorUsername}</span>
                          </>
                        )}
                      </button>
                      <div className="h-px bg-white/5 my-1" />
                    </>
                  )}

                  <button
                    type="button"
                    onClick={handleBookmarkFromMenu}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-white/10 rounded-xl text-left cursor-pointer transition-colors"
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${hasBookmarked ? 'fill-purple-400 text-purple-400' : 'text-slate-400'}`} />
                    <span>{hasBookmarked ? 'Remove Bookmark' : 'Bookmark post'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:text-white hover:bg-white/10 rounded-xl text-left cursor-pointer transition-colors"
                  >
                    <Link className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy link</span>
                  </button>

                  {!isAuthor && (
                    <>
                      <div className="h-px bg-white/5 my-1" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (currentUser) {
                            moderationService.hidePost(currentUser.id, post.id);
                            setIsHiddenLocally(true);
                            setShowMoreMenu(false);
                          }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/10 rounded-xl text-left cursor-pointer transition-colors"
                      >
                        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        <span>Hide post</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (currentUser && confirm(`Block @${post.authorUsername}? Their posts and notifications will be hidden.`)) {
                            moderationService.blockUser(currentUser.id, post.authorUsername);
                            setIsHiddenLocally(true);
                            setShowMoreMenu(false);
                          }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 rounded-xl text-left cursor-pointer transition-colors"
                      >
                        <UserX className="w-3.5 h-3.5 text-rose-400" />
                        <span>Block @{post.authorUsername}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMoreMenu(false);
                          setShowReportModal(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-left cursor-pointer transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Report post</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </header>

          {/* Post Content or Inline Edit Form */}
          {isEditing ? (
            <div className="space-y-2.5 pt-1.5" onClick={(e) => e.stopPropagation()}>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                maxLength={280}
                className="w-full bg-[#080b18] border border-cyan-500/40 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-400 leading-relaxed resize-none"
                autoFocus
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">
                  {280 - editText.length} chars left
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={!editText.trim() || isSavingEdit}
                    className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 font-bold hover:opacity-95 disabled:opacity-40 cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {isSavingEdit && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="post-content">
              {renderFormattedText(post.text)}
            </p>
          )}

          {/* Attached Media Grid */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div
              className={`grid gap-2 rounded-2xl overflow-hidden mt-2 border border-white/10 ${
                post.mediaUrls.length === 1 ? 'grid-cols-1 max-h-96' : 'grid-cols-2 max-h-80'
              }`}
            >
              {post.mediaUrls.map((url, i) => (
                <div key={i} className="relative aspect-video bg-[#0b0e1a] overflow-hidden">
                  <img
                    className="post-image h-full w-full object-cover"
                    src={url}
                    alt={`Attached post media ${i + 1}`}
                    loading="lazy"
                  />
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
                      {/* Background progress bar */}
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

          {/* Attached NFT Card (Legacy/Ecosystem) */}
          {post.attachedNft && !post.nftReference && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#0a0d1c] border border-white/10 hover:border-purple-500/30 transition-all mt-2">
              <img
                src={post.attachedNft.image}
                alt={post.attachedNft.name}
                loading="lazy"
                className="w-12 h-12 rounded-xl object-cover bg-slate-900 shrink-0 border border-white/5"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{post.attachedNft.name}</p>
                <p className="text-[11px] text-purple-400 truncate font-mono">{post.attachedNft.collection}</p>
              </div>
              <span className="text-[10px] font-bold text-cyan-400 px-2.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/20">
                {post.attachedNft.relaysCount || 38} Relays
              </span>
            </div>
          )}

          {/* Web3 Integrated NFT Reference Card (Prompt 5/6) */}
          {post.nftReference && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (post.nftReference?.externalUrl) {
                  window.open(post.nftReference.externalUrl, '_blank', 'noopener,noreferrer');
                }
              }}
              className="rounded-2xl bg-gradient-to-tr from-[#0a0d1c] via-[#0d1226] to-[#120f26] border border-cyan-500/25 hover:border-cyan-400/60 transition-all p-3.5 mt-2.5 space-y-2.5 cursor-pointer group/nft shadow-lg shadow-black/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                    {post.nftReference.network || 'Ethereum'}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                    #{post.nftReference.tokenId}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {post.nftReference.ownerVerified ? (
                    <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <ShieldCheck className="w-3 h-3" />
                      Verified Owner
                    </span>
                  ) : post.nftReference.metadataVerified ? (
                    <span className="text-[10px] font-semibold text-purple-300 flex items-center gap-1 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-500/30">
                      <Sparkles className="w-3 h-3" />
                      Verified Token
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                      On-Chain Token
                    </span>
                  )}

                  {post.nftReference.externalUrl && (
                    <span
                      className="text-slate-400 group-hover/nft:text-cyan-400 transition-colors p-1"
                      title="View on explorer or marketplace"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 relative flex items-center justify-center">
                  {post.nftReference.imageUrl ? (
                    <img
                      src={post.nftReference.imageUrl}
                      alt={post.nftReference.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover/nft:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Gem className="w-8 h-8 text-cyan-400/60" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-[11px] font-mono font-medium text-purple-400 truncate">
                    {post.nftReference.collectionName || 'Verified Collection'}
                  </p>
                  <h5 className="text-sm font-bold text-white truncate group-hover/nft:text-cyan-300 transition-colors">
                    {post.nftReference.name}
                  </h5>
                  {post.nftReference.contractAddress && (
                    <p className="text-[10px] text-slate-500 truncate font-mono">
                      {post.nftReference.contractAddress.slice(0, 8)}...{post.nftReference.contractAddress.slice(-6)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Attached Living NFT Relay Card */}
          {post.attachedRelay && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                window.history.pushState({}, '', `/relay/${post.attachedRelay!.id}`);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-[#0a0e20] to-cyan-950/20 border border-purple-500/30 hover:border-cyan-400/50 transition-all mt-2 space-y-2.5 cursor-pointer group/relay shadow-lg shadow-purple-950/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Interactive NFT Living Lore</span>
                </div>
                <span className="text-[10px] font-semibold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  {post.attachedRelay.personalityTrait}
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <img
                  src={post.attachedRelay.nftImage}
                  alt={post.attachedRelay.title}
                  loading="lazy"
                  className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0 group-hover/relay:scale-105 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-purple-400">{post.attachedRelay.collection}</p>
                  <h5 className="text-sm font-bold text-white truncate group-hover/relay:text-cyan-300 transition-colors">
                    {post.attachedRelay.title}
                  </h5>
                  <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                    &quot;{post.attachedRelay.question}&quot;
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[11px] text-slate-400 font-medium">
                  {post.attachedRelay.participantsCount} co-authors in provenance
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.history.pushState({}, '', `/relay/${post.attachedRelay!.id}`);
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 font-bold text-xs hover:opacity-95 transition-opacity shadow-sm cursor-pointer"
                >
                  <span>View Relay</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
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
                <span className="text-[11px] text-slate-500 font-mono">@{post.quotePost.authorUsername}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                {post.quotePost.text}
              </p>
            </div>
          )}

          {/* Post Actions: Evenly distributed, accessible labels, clear interaction states (X-style) */}
          <div className="post-actions flex items-center justify-between max-w-md pt-2 mt-1" aria-label="Post actions">
            {/* 1. Reply Action */}
            <button
              type="button"
              aria-label={`Reply to post (${post.repliesCount || 0} replies)`}
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenReply) onOpenReply(post);
              }}
              className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer group/btn focus-visible:outline-none"
              title="Reply"
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-cyan-500/10 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-xs">{post.repliesCount || ''}</span>
            </button>

            {/* 2. Repost / Quote Menu Action */}
            <div className="relative">
              <button
                type="button"
                aria-label={`Repost or quote (${post.repostsCount || 0} reposts)`}
                aria-expanded={showRepostMenu}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRepostMenu(!showRepostMenu);
                }}
                className={`flex items-center gap-1.5 transition-colors cursor-pointer group/btn focus-visible:outline-none ${
                  hasReposted
                    ? 'text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
                title="Repost or Quote"
              >
                <div className="p-1.5 rounded-full group-hover/btn:bg-emerald-500/10 transition-colors">
                  <Repeat2 className="w-4 h-4" />
                </div>
                <span className="text-xs">{post.repostsCount || ''}</span>
              </button>

              {showRepostMenu && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 bottom-full mb-1 w-36 rounded-2xl bg-[#0c1020] border border-white/10 shadow-2xl p-1.5 z-30 animate-in fade-in duration-100 backdrop-blur-md"
                >
                  <button
                    type="button"
                    onClick={handleRepost}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-xl text-left cursor-pointer transition-colors"
                  >
                    <Repeat2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{hasReposted ? 'Undo Repost' : 'Repost'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleQuoteClick}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-xl text-left cursor-pointer transition-colors"
                  >
                    <Quote className="w-3.5 h-3.5 text-purple-400" />
                    <span>Quote Post</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Like Action */}
            <button
              type="button"
              aria-label={hasLiked ? `Unlike post (${post.likesCount || 0} likes)` : `Like post (${post.likesCount || 0} likes)`}
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer group/btn focus-visible:outline-none ${
                hasLiked
                  ? 'text-rose-500 font-bold'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
              title="Like"
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-rose-500/10 transition-colors">
                <Heart className={`w-4 h-4 transition-transform active:scale-125 ${hasLiked ? 'fill-rose-500' : ''}`} />
              </div>
              <span className="text-xs">{post.likesCount || ''}</span>
            </button>

            {/* 4. Bookmark Action */}
            <button
              type="button"
              aria-label={hasBookmarked ? 'Remove bookmark' : 'Bookmark post'}
              onClick={handleBookmark}
              className={`flex items-center gap-1.5 transition-colors cursor-pointer group/btn focus-visible:outline-none ${
                hasBookmarked
                  ? 'text-purple-400 font-bold'
                  : 'text-slate-400 hover:text-purple-400'
              }`}
              title="Bookmark"
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-purple-500/10 transition-colors">
                <Bookmark className={`w-4 h-4 transition-transform active:scale-125 ${hasBookmarked ? 'fill-purple-500' : ''}`} />
              </div>
              <span className="text-xs">{post.bookmarksCount || ''}</span>
            </button>

            {/* 5. Share Action */}
            <button
              type="button"
              aria-label="Share post link"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer group/btn focus-visible:outline-none"
              title="Share"
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-cyan-500/10 transition-colors">
                <Share2 className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteModal(false);
          }}
        >
          <div
            className="bg-[#090b16] border border-white/10 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Delete post?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This can’t be undone and it will be removed from your profile, the timeline of any accounts that follow you, and from Mosaic search.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="w-full py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer border border-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Content Report Dialog */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="post"
        targetId={post.id}
        targetAuthorName={post.authorName}
        targetAuthorUsername={post.authorUsername}
      />
    </article>
  );
};
