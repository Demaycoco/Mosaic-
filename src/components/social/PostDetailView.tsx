import React, { useState, useEffect } from 'react';
import { SocialPost } from '../../types';
import { postService } from '../../services/postService';
import { PostCard } from './PostCard';
import { PostComposer } from './PostComposer';
import { ArrowLeft, MessageSquare } from 'lucide-react';

interface PostDetailViewProps {
  post: SocialPost;
  onBack: () => void;
  onOpenReply: (post: SocialPost) => void;
  onOpenQuote: (post: SocialPost) => void;
  onSelectUser: (username: string) => void;
  onSelectHashtag?: (tag: string) => void;
}

export const PostDetailView: React.FC<PostDetailViewProps> = ({
  post,
  onBack,
  onOpenReply,
  onOpenQuote,
  onSelectUser,
  onSelectHashtag,
}) => {
  const [currentPost, setCurrentPost] = useState<SocialPost>(post);
  const [replies, setReplies] = useState<SocialPost[]>([]);
  const [threadAncestors, setThreadAncestors] = useState<SocialPost[]>([]);

  const loadData = () => {
    const updated = postService.getPostById(post.id) || post;
    setCurrentPost(updated);
    setReplies(postService.getRepliesForPost(post.id));

    // If this post is part of a thread, find earlier thread posts
    if (updated.threadId) {
      const allThread = postService.getThreadPosts(updated.threadId);
      const ancestors = allThread.filter((p) => (p.threadOrder || 0) < (updated.threadOrder || 0));
      setThreadAncestors(ancestors);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = postService.subscribe(() => {
      loadData();
    });
    return () => unsub();
  }, [post.id]);

  return (
    <div className="min-h-screen bg-[#06070a] border-x border-white/5 pb-20">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-30 bg-[#06070a]/90 backdrop-blur-md border-b border-white/10 px-4 py-3.5 flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-bold text-white">Post Conversation</h2>
          <p className="text-xs text-slate-400">Thread & Community Discussion</p>
        </div>
      </div>

      {/* Earlier Thread Ancestors */}
      {threadAncestors.length > 0 && (
        <div className="divide-y divide-white/5 bg-white/[0.01]">
          {threadAncestors.map((ancestor) => (
            <PostCard
              key={ancestor.id}
              post={ancestor}
              showThreadConnector
              onOpenReply={onOpenReply}
              onOpenQuote={onOpenQuote}
              onSelectUser={onSelectUser}
              onSelectHashtag={onSelectHashtag}
            />
          ))}
        </div>
      )}

      {/* Main Focus Post */}
      <div className="bg-[#070912]">
        <PostCard
          post={currentPost}
          onOpenReply={onOpenReply}
          onOpenQuote={onOpenQuote}
          onSelectUser={onSelectUser}
          onSelectHashtag={onSelectHashtag}
          onPostDeleted={onBack}
          onPostEdited={(updated) => setCurrentPost(updated)}
        />
      </div>

      {/* Reply Composer directly underneath parent post */}
      <div className="bg-[#060810] border-b border-white/10">
        <PostComposer
          replyToId={currentPost.id}
          replyToUsername={currentPost.authorUsername}
          placeholder="Post your reply..."
          onPostCreated={loadData}
        />
      </div>

      {/* Replies Stream */}
      <div className="p-4 border-b border-white/5 flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
        <MessageSquare className="w-4 h-4 text-cyan-400" />
        <span>Replies ({replies.length})</span>
      </div>

      {replies.length > 0 ? (
        <div className="divide-y divide-white/5">
          {replies.map((reply) => (
            <PostCard
              key={reply.id}
              post={reply}
              onOpenReply={onOpenReply}
              onOpenQuote={onOpenQuote}
              onSelectUser={onSelectUser}
              onSelectHashtag={onSelectHashtag}
              onPostDeleted={loadData}
              onPostEdited={loadData}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-slate-500 text-xs">
          No replies yet. Be the first to add to this story.
        </div>
      )}
    </div>
  );
};
