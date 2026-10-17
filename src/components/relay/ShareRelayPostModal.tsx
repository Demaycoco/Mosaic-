import React, { useState } from 'react';
import {
  X,
  Share2,
  Check,
  Sparkles,
  GitFork,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { postService } from '../../services/postService';
import { RelayExperience, RelayMetrics, NftPersonality } from '../../types';
import { formatRelaySocialPostText } from '../../services/relayStoryService';
import { GoogleAuthButton } from '../common/GoogleAuthButton';
import { Avatar } from '../common/Avatar';

interface ShareRelayPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  relay: RelayExperience;
  metrics: RelayMetrics;
  personality: NftPersonality;
  onPostSuccess?: (postId: string) => void;
}

export const ShareRelayPostModal: React.FC<ShareRelayPostModalProps> = ({
  isOpen,
  onClose,
  relay,
  metrics,
  personality,
  onPostSuccess,
}) => {
  const { currentUser, signInWithGoogle } = useAuth();
  const [postText, setPostText] = useState(() =>
    formatRelaySocialPostText(relay, personality, metrics)
  );
  const [isPosting, setIsPosting] = useState(false);
  const [postedSuccess, setPostedSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !postText.trim()) return;

    setIsPosting(true);
    try {
      const created = await postService.createPost({
        authorId: currentUser.id,
        authorName: currentUser.displayName,
        authorUsername: currentUser.username,
        authorPhotoURL: currentUser.photoURL,
        authorAccountType: currentUser.accountType,
        text: postText.trim(),
        attachedRelay: {
          id: relay.id,
          title: relay.title,
          collection: relay.collection,
          tokenId: relay.tokenId,
          nftImage: relay.nftImage,
          participantsCount: metrics.participantsCount,
          personalityTrait: personality.title,
          question: relay.question,
          creatorHandle: relay.creatorHandle,
        },
      });

      setPostedSuccess(true);
      if (onPostSuccess) onPostSuccess(created.id);
    } catch (err) {
      console.error('Error sharing relay to Mosaic feed:', err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleNavigateToFeed = () => {
    onClose();
    window.history.pushState({}, '', '/home');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#090b16] border border-white/10 shadow-2xl p-6 sm:p-7 text-white space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {postedSuccess ? (
          <div className="text-center py-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
              <Check className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-white">Posted to Mosaic Feed</h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                Your post connecting this NFT Relay to the Mosaic Social Network is now live for curators to discover and join.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleNavigateToFeed}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-slate-950 font-bold text-xs hover:opacity-95 transition-opacity cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <span>View on Social Feed</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePublishPost} className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
              <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300">
                <Share2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Share Relay to Mosaic</h3>
                <p className="text-[11px] text-slate-400">
                  Connect NFT Relay into the real Mosaic Social Hub
                </p>
              </div>
            </div>

            {!currentUser ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-xs text-slate-300">
                  Sign in with Google to post this Relay directly to the Mosaic feed.
                </p>
                <div className="flex justify-center pt-1">
                  <GoogleAuthButton
                    label="Sign In with Google to Post"
                    onClick={async () => {
                      await signInWithGoogle();
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Author Capsule */}
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
                  <Avatar src={currentUser.photoURL} name={currentUser.displayName} size="xs" />
                  <span className="text-xs font-bold text-white">{currentUser.displayName}</span>
                  <span className="text-[11px] text-purple-400 font-mono">@{currentUser.username}</span>
                </div>

                {/* Editable Post Text Area */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Post Message
                  </label>
                  <textarea
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    rows={4}
                    className="w-full bg-[#060810] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400 leading-relaxed font-sans resize-none"
                    placeholder="Write a message about this relay's journey..."
                    required
                  />
                </div>

                {/* Attached Relay Card Preview */}
                <div className="p-3.5 rounded-2xl bg-[#070914] border border-cyan-500/30 space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-cyan-400 font-bold uppercase flex items-center gap-1">
                      <GitFork className="w-3 h-3" />
                      Attached Relay Card
                    </span>
                    <span className="text-purple-300 uppercase font-black">
                      THE {personality.title.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={relay.nftImage}
                      alt={relay.title}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-purple-400">{relay.collection} {relay.tokenId}</p>
                      <h4 className="text-xs font-bold text-white truncate">{relay.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate">&quot;{relay.question}&quot;</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isPosting || !postText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:opacity-95 text-slate-950 font-bold text-xs transition-opacity shadow-md shadow-purple-900/30 cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isPosting ? 'Posting...' : 'Share to Mosaic'}</span>
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
