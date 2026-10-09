import React from 'react';
import { SocialPost } from '../../types';
import { Avatar } from '../common/Avatar';
import { PostComposer } from './PostComposer';
import { X } from 'lucide-react';

interface ReplyModalProps {
  post: SocialPost | null;
  isOpen: boolean;
  onClose: () => void;
  onReplySuccess?: () => void;
}

export const ReplyModal: React.FC<ReplyModalProps> = ({
  post,
  isOpen,
  onClose,
  onReplySuccess,
}) => {
  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[#090b16] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Reply to Post
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Parent Post Preview */}
        <div className="p-4 pb-2 flex gap-3 items-start">
          <div className="flex flex-col items-center">
            <Avatar src={post.authorPhotoURL} name={post.authorName} size="md" />
            <div className="w-0.5 grow min-h-8 bg-white/10 my-1" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{post.authorName}</span>
              <span className="text-xs text-slate-400">@{post.authorUsername}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line line-clamp-3">
              {post.text}
            </p>
          </div>
        </div>

        {/* Reply Composer */}
        <PostComposer
          replyToId={post.id}
          replyToUsername={post.authorUsername}
          placeholder="Post your reply..."
          onPostCreated={() => {
            onClose();
            if (onReplySuccess) onReplySuccess();
          }}
        />
      </div>
    </div>
  );
};
