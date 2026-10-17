import React, { useState } from 'react';
import { SocialPost } from '../../types';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { postService } from '../../services/postService';
import { X, Send, Loader2 } from 'lucide-react';

interface QuoteModalProps {
  post: SocialPost | null;
  isOpen: boolean;
  onClose: () => void;
  onQuoteSuccess?: () => void;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({
  post,
  isOpen,
  onClose,
  onQuoteSuccess,
}) => {
  const { currentUser } = useAuth();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !post) return null;

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !text.trim()) return;

    setIsSubmitting(true);
    try {
      await postService.createPost({
        authorId: currentUser.id,
        authorName: currentUser.displayName,
        authorUsername: currentUser.username,
        authorPhotoURL: currentUser.photoURL,
        text: text.trim(),
        quotePostId: post.id,
        quotePost: {
          id: post.id,
          authorName: post.authorName,
          authorUsername: post.authorUsername,
          authorPhotoURL: post.authorPhotoURL,
          text: post.text,
          mediaUrls: post.mediaUrls,
          createdAt: post.createdAt,
        },
      });

      setText('');
      onClose();
      if (onQuoteSuccess) onQuoteSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 p-4">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-[#090b16] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Quote Post
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Input */}
        <div className="flex items-start gap-3">
          <Avatar src={currentUser?.photoURL} name={currentUser?.displayName || 'User'} size="md" />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment to this thought..."
            rows={3}
            autoFocus
            className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Embedded Post Preview */}
        <div className="p-3.5 rounded-2xl bg-[#0a0e1e] border border-white/10 space-y-2">
          <div className="flex items-center gap-2">
            <Avatar src={post.authorPhotoURL} name={post.authorName} size="xs" />
            <span className="text-xs font-bold text-white">{post.authorName}</span>
            <span className="text-[11px] text-slate-500 font-mono">@{post.authorUsername}</span>
          </div>
          <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-line">
            {post.text}
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={handleQuoteSubmit}
            disabled={!text.trim() || isSubmitting}
            className="inline-flex items-center gap-1.5 px-6 py-2 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:opacity-95 disabled:opacity-40 text-slate-950 font-bold text-xs transition-opacity cursor-pointer shadow-md"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Quote Post</span>
          </button>
        </div>
      </div>
    </div>
  );
};
