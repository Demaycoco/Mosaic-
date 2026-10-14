import React, { useState } from 'react';
import { X, Heart, Share2, GitFork, MessageSquare, ExternalLink, ShieldCheck } from 'lucide-react';
import { NftItem } from '../../types';
import { NftImage } from '../common/NftImage';
import { Avatar } from '../common/Avatar';
import { relayService } from '../../services/relayService';

interface NftDetailModalProps {
  nft: NftItem | null;
  onClose: () => void;
  onOpenAuth: () => void;
  onOpenRelay?: (relayId?: string) => void;
  onCreateRelay?: (nft: NftItem) => void;
}

export const NftDetailModal: React.FC<NftDetailModalProps> = ({
  nft,
  onClose,
  onOpenAuth,
  onOpenRelay,
  onCreateRelay,
}) => {
  const [likes, setLikes] = useState(nft ? nft.likes : 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<string[]>([
    "The violet gradient transition in Stage 2 gave this token an entirely new emotional weight.",
    "This is what Web3 was supposed to be: shared human authorship rather than speculative flipping.",
  ]);

  if (!nft) return null;

  const handleLike = () => {
    if (hasLiked) {
      setLikes((l) => l - 1);
      setHasLiked(false);
    } else {
      setLikes((l) => l + 1);
      setHasLiked(true);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setComments([commentText.trim(), ...comments]);
    setCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl bg-[#090b14] border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl shadow-purple-950/60 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Artwork & Quick Metrics */}
        <div className="w-full md:w-1/2 bg-[#05060b] flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10">
          <div className="p-4 md:p-8 flex items-center justify-center min-h-[300px]">
            <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <NftImage src={nft.image} alt={nft.name} aspectRatio="square" />
            </div>
          </div>

          <div className="p-4 md:p-6 bg-[#0a0d1a] border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  hasLiked
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'text-slate-400 hover:text-white bg-white/5'
                }`}
              >
                <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{likes}</span>
              </button>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <GitFork className="w-4 h-4 text-purple-400" />
                <span>{nft.relaysCount} Relays</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
              title="Share NFT"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Details, Relay Timeline & Social Commentary */}
        <div className="w-full md:w-1/2 flex flex-col justify-between overflow-y-auto max-h-[85vh] p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            {/* Collection & Verified Tag */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-purple-400 uppercase tracking-wider">
                {nft.collection}
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Mosaic Authenticated</span>
              </span>
            </div>

            <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {nft.name}
            </h3>

            {/* Creator Attribution */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <Avatar src={nft.creator.avatar} name={nft.creator.name} size="md" />
              <div>
                <p className="text-xs text-slate-400">Originator</p>
                <p className="text-sm font-semibold text-white">{nft.creator.name} <span className="text-xs text-purple-400 font-normal">{nft.creator.handle}</span></p>
              </div>
            </div>

            {/* Story Snippet */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                The Living Story
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-[#0c1020] p-3.5 rounded-xl border border-purple-500/15">
                &ldquo;{nft.storySnippet}&rdquo;
              </p>
            </div>

            {/* Relay Provenance Chain */}
            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Relay Path (4 Collaborators)</span>
                <span className="text-cyan-400 text-[11px] lowercase">chronological</span>
              </h4>

              <div className="space-y-2 border-l border-purple-500/20 ml-2 pl-4">
                {(relayService.getActiveRelay()?.steps || []).map((step) => (
                  <div key={step.step} className="relative group text-xs">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-[#090b14]" />
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{step.personName}</span>
                      <span className="text-purple-300">· {step.action}</span>
                      <span className="text-slate-500 ml-auto">{step.timestamp}</span>
                    </div>
                    <p className="text-slate-400 mt-0.5">{step.decisionText}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Discussion Comments */}
            <div className="pt-3 space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
                Community Notes ({comments.length})
              </h4>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {comments.map((comment, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-white/5 text-xs text-slate-300">
                    {comment}
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add your thought to this story..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  Post
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Story Edition</p>
              <p className="text-sm font-bold text-white">Non-fungible & Social</p>
            </div>
            <div className="flex items-center gap-2">
              {onCreateRelay && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCreateRelay(nft);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Start New Relay</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenRelay) {
                    const matching = relayService.getAllRelays().find((r) => r.tokenId === nft.tokenId || r.collection.toLowerCase() === nft.collection.toLowerCase());
                    onOpenRelay(matching?.id || 'relay-1847');
                  } else {
                    onOpenAuth();
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 hover:opacity-90 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Join This Relay</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
