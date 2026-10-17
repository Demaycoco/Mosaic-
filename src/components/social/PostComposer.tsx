import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { postService } from '../../services/postService';
import {
  Image as ImageIcon,
  BarChart2,
  Smile,
  X,
  Loader2,
  AlertCircle,
  Gem,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PostPoll, NFTReference } from '../../types';
import { NftAttachmentPicker } from './NftAttachmentPicker';

interface PostComposerProps {
  onPostCreated?: () => void;
  replyToId?: string;
  replyToUsername?: string;
  placeholder?: string;
  className?: string;
}

const EMOJI_LIST = ['✨', '🔥', '💜', '💎', '🎨', '🚀', '🔮', '⚡️', '🤝', '🙌', '🌈', '👾', '💯', '🫡'];

export const PostComposer: React.FC<PostComposerProps> = ({
  onPostCreated,
  replyToId,
  replyToUsername,
  placeholder = "What is happening in your creative world?",
  className = '',
}) => {
  const { currentUser } = useAuth();
  const [text, setText] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isPollOpen, setIsPollOpen] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isNftPickerOpen, setIsNftPickerOpen] = useState(false);
  const [attachedNftRef, setAttachedNftRef] = useState<NFTReference | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX_CHARS = 280;

  const currentLength = text.length;
  const remainingChars = MAX_CHARS - currentLength;
  const isOverLimit = remainingChars < 0;
  const isEmpty = !text.trim() && mediaUrls.length === 0 && !isPollOpen && !attachedNftRef;

  // Calculate circular progress for X-style counter
  const progressRatio = Math.min(1, currentLength / MAX_CHARS);
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (errorMessage) setErrorMessage(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage(null);
    const validFiles: File[] = [];

    Array.from(files).forEach((file) => {
      // Validate image type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Only image files (PNG, JPEG, WebP, GIF) are supported.');
        return;
      }
      // Validate 5MB limit
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size exceeds 5MB limit.');
        return;
      }
      validFiles.push(file);
    });

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setMediaUrls((prev) => [...prev, event.target!.result as string].slice(0, 4));
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input value so same file can be re-selected if removed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) return;
    if (isEmpty || isOverLimit || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Build poll if enabled and valid
      let pollPayload: PostPoll | undefined = undefined;
      if (isPollOpen) {
        const validOpts = pollOptions.filter((o) => o.trim().length > 0);
        if (validOpts.length < 2) {
          setErrorMessage('Polls require at least 2 choices.');
          setIsSubmitting(false);
          return;
        }
        pollPayload = {
          question: text.slice(0, 100) || 'Community Poll',
          options: validOpts.map((opt, i) => ({
            id: `opt-${i + 1}`,
            text: opt.trim(),
            votes: 0,
          })),
          totalVotes: 0,
          voters: {},
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        };
      }

      await postService.createPost({
        authorId: currentUser.id,
        authorName: currentUser.displayName,
        authorUsername: currentUser.username,
        authorPhotoURL: currentUser.photoURL,
        text: text.trim(),
        mediaUrls,
        poll: pollPayload,
        nftReference: attachedNftRef || undefined,
        replyToId,
        replyToUsername,
      });

      // Reset form
      setText('');
      setMediaUrls([]);
      setAttachedNftRef(null);
      setIsPollOpen(false);
      setPollOptions(['', '']);
      if (onPostCreated) onPostCreated();
    } catch (err: any) {
      console.error('Failed to publish post:', err);
      setErrorMessage(err.message || 'Failed to publish post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`px-4 pt-3 pb-3 border-b border-white/[0.08] bg-[#06070a] ${className}`}>
      {replyToUsername && (
        <div className="text-xs text-slate-400 mb-2 pl-12 flex items-center gap-1">
          <span>Replying to</span>
          <span className="text-cyan-400 font-semibold">@{replyToUsername}</span>
        </div>
      )}

      <div className="flex gap-3 items-start">
        {/* Author Avatar */}
        <Avatar
          src={currentUser?.photoURL}
          name={currentUser?.displayName || 'User'}
          size="md"
          className="shrink-0 mt-0.5 ring-1 ring-white/10"
        />

        <div className="flex-1 min-w-0">
          {/* Sublime X-style Textarea (No heavy card border, natural text flow) */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            placeholder={placeholder}
            rows={replyToId ? 2 : 3}
            className="w-full bg-transparent text-white placeholder-slate-500 text-base sm:text-lg resize-none focus:outline-none leading-relaxed tracking-normal"
          />

          {/* Attached Images Grid */}
          {mediaUrls.length > 0 && (
            <div
              className={`grid gap-2 rounded-2xl overflow-hidden my-2.5 border border-white/10 ${
                mediaUrls.length === 1 ? 'grid-cols-1 max-h-80' : 'grid-cols-2 max-h-72'
              }`}
            >
              {mediaUrls.map((url, i) => (
                <div key={i} className="relative aspect-video bg-[#0b0e1a] overflow-hidden group">
                  <img
                    src={url}
                    alt={`Attachment preview ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeMedia(i)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white/90 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
                    title="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Attached NFT Reference Preview */}
          {attachedNftRef && (
            <div className="relative p-3 my-2.5 rounded-2xl bg-gradient-to-r from-[#0d1226] to-[#0a0d1e] border border-cyan-500/30 flex items-center gap-3 group animate-in fade-in zoom-in-95 duration-150">
              {attachedNftRef.imageUrl ? (
                <img
                  src={attachedNftRef.imageUrl}
                  alt={attachedNftRef.name}
                  className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0 bg-slate-900"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center shrink-0 text-cyan-300">
                  <Gem className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                    {attachedNftRef.network}
                  </span>
                  {attachedNftRef.ownerVerified ? (
                    <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <ShieldCheck className="w-3 h-3" />
                      Verified Owner
                    </span>
                  ) : attachedNftRef.metadataVerified ? (
                    <span className="text-[10px] font-semibold text-purple-400 flex items-center gap-1 bg-purple-950/40 px-2 py-0.5 rounded-full border border-purple-500/30">
                      <Sparkles className="w-3 h-3" />
                      Verified Token
                    </span>
                  ) : null}
                </div>
                <h5 className="text-xs font-bold text-white truncate mt-1">{attachedNftRef.name}</h5>
                <p className="text-[11px] text-slate-400 truncate font-mono">
                  {attachedNftRef.collectionName || 'EVM Collection'} · #{attachedNftRef.tokenId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAttachedNftRef(null)}
                className="p-1.5 rounded-full bg-black/60 hover:bg-black text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Remove attached NFT"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Poll Builder (Clean, restrained) */}
          {isPollOpen && (
            <div className="p-3 my-2.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold text-slate-300">Poll choices</span>
                <button
                  type="button"
                  onClick={() => setIsPollOpen(false)}
                  className="text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Remove poll
                </button>
              </div>
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const updated = [...pollOptions];
                      updated[idx] = e.target.value;
                      setPollOptions(updated);
                    }}
                    placeholder={`Choice ${idx + 1}`}
                    maxLength={35}
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePollOption(idx)}
                      className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddPollOption}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer pt-1"
                >
                  + Add option
                </button>
              )}
            </div>
          )}

          {/* Error Message Feedback */}
          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 py-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Bottom Toolbar: Media Icons Left | Counter & Post Button Right */}
          <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-white/[0.06]">
            {/* Left Media Actions */}
            <div className="flex items-center gap-1 text-cyan-400">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-cyan-500/10 transition-colors cursor-pointer text-cyan-400"
                title="Add Photos"
                disabled={mediaUrls.length >= 4}
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsPollOpen(!isPollOpen)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isPollOpen ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-cyan-500/10 text-cyan-400'
                }`}
                title="Create a Poll"
              >
                <BarChart2 className="w-4 h-4" />
              </button>

              {/* Attach NFT Button */}
              <button
                type="button"
                onClick={() => setIsNftPickerOpen(true)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  attachedNftRef ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-cyan-500/10 text-cyan-400'
                }`}
                title="Attach NFT (From Wallet or Ecosystem)"
              >
                <Gem className="w-4 h-4" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    showEmojiPicker ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-cyan-500/10 text-cyan-400'
                  }`}
                  title="Add Emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute left-0 bottom-full mb-2 p-2 bg-[#0d1124] border border-white/10 rounded-2xl shadow-2xl flex flex-wrap gap-1.5 w-48 z-40 backdrop-blur-md">
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleEmojiClick(emoji)}
                        className="text-base p-1 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Character Counter Ring & Post Button */}
            <div className="flex items-center gap-3">
              {/* X-style Circular Progress / Character Counter */}
              {currentLength > 0 && (
                <div className="flex items-center gap-2">
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r={radius}
                        className="stroke-white/10"
                        strokeWidth="2"
                        fill="transparent"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r={radius}
                        className={`transition-all duration-150 ${
                          isOverLimit
                            ? 'stroke-rose-500'
                            : remainingChars <= 20
                            ? 'stroke-amber-400'
                            : 'stroke-cyan-400'
                        }`}
                        strokeWidth="2"
                        strokeDasharray={circumference}
                        strokeDashoffset={isOverLimit ? 0 : strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                  </div>
                  {remainingChars <= 20 && (
                    <span
                      className={`text-xs font-mono font-semibold ${
                        isOverLimit ? 'text-rose-400 font-bold' : 'text-amber-400'
                      }`}
                    >
                      {remainingChars}
                    </span>
                  )}
                </div>
              )}

              {/* Sublime Gradient Post Button */}
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isEmpty || isOverLimit || isSubmitting}
                className="px-4 py-1.5 rounded-full font-bold text-xs sm:text-sm bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:opacity-95 text-slate-950 transition-all duration-150 cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed select-none flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{replyToId ? 'Reply' : 'Post'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <NftAttachmentPicker
        isOpen={isNftPickerOpen}
        onClose={() => setIsNftPickerOpen(false)}
        onSelect={(nft) => setAttachedNftRef(nft)}
      />
    </div>
  );
};
