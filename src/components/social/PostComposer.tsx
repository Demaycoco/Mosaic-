import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { postService } from '../../services/postService';
import {
  Image,
  BarChart2,
  Smile,
  Hash,
  AtSign,
  Plus,
  Trash2,
  X,
  FileText,
  Sparkles,
  Send,
  Loader2,
} from 'lucide-react';
import { PostPoll, NftProjectAccount } from '../../types';
import { projectService } from '../../services/projectService';
import { userService } from '../../services/userService';
import { Layers } from 'lucide-react';

interface PostComposerProps {
  onPostCreated?: () => void;
  replyToId?: string;
  replyToUsername?: string;
  placeholder?: string;
  className?: string;
}

const SAMPLE_GIFS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80',
];

const EMOJI_LIST = ['✨', '🔥', '💜', '💎', '🎨', '🚀', '🔮', '⚡️', '🤝', '🙌', '🌈', '👾'];

export const PostComposer: React.FC<PostComposerProps> = ({
  onPostCreated,
  replyToId,
  replyToUsername,
  placeholder = 'What is happening in your creative world?',
  className = '',
}) => {
  const { currentUser } = useAuth();
  const [text, setText] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isPollOpen, setIsPollOpen] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState('24h');

  // Project posting persona state
  const [availableProjects, setAvailableProjects] = useState<NftProjectAccount[]>(() => projectService.getAllProjects());
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('personal');

  // Keep projects updated in real time
  React.useEffect(() => {
    const unsub = projectService.subscribe((projects) => {
      setAvailableProjects(projects);
    });
    return () => unsub();
  }, []);

  const activeProject =
    selectedPersonaId !== 'personal'
      ? availableProjects.find((p) => p.id === selectedPersonaId)
      : null;
  const composerAvatar = activeProject ? activeProject.logo : currentUser?.photoURL;
  const composerName = activeProject ? activeProject.name : currentUser?.displayName;

  // Thread mode
  const [isThreadMode, setIsThreadMode] = useState(false);
  const [threadPosts, setThreadPosts] = useState<string[]>(['']);

  // Modals & Popovers
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartIndex, setMentionStartIndex] = useState<number>(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_CHARS = 280;

  const currentLength = text.length;
  const remainingChars = MAX_CHARS - currentLength;
  const isOverLimit = remainingChars < 0;

  // Handle typing to detect @mention query
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setText(val);

    // Look back from cursor to see if we're typing @username
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      // Check if preceded by start of line or space
      const isStartOrSpace = lastAtIndex === 0 || /\s/.test(textBeforeCursor[lastAtIndex - 1]);
      const queryCandidate = textBeforeCursor.slice(lastAtIndex + 1);

      if (isStartOrSpace && !/\s/.test(queryCandidate)) {
        setMentionQuery(queryCandidate);
        setMentionStartIndex(lastAtIndex);
        return;
      }
    }
    setMentionQuery(null);
    setMentionStartIndex(-1);
  };

  const handleSelectMention = (handleToInsert: string) => {
    if (mentionStartIndex === -1) return;
    const cleanHandle = handleToInsert.replace(/^@/, '');
    const beforeMention = text.slice(0, mentionStartIndex);
    const afterMention = text.slice(mentionStartIndex + 1 + (mentionQuery?.length || 0));
    const newText = `${beforeMention}@${cleanHandle} ${afterMention}`;
    setText(newText);
    setMentionQuery(null);
    setMentionStartIndex(-1);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursor = beforeMention.length + cleanHandle.length + 2;
        textareaRef.current.setSelectionRange(newCursor, newCursor);
      }
    }, 10);
  };

  const matchingUsers = mentionQuery !== null
    ? userService.searchUsers(mentionQuery).slice(0, 5)
    : [];
  const matchingProjects = mentionQuery !== null
    ? projectService.searchProjects(mentionQuery).slice(0, 3)
    : [];
  const hasMentionSuggestions = mentionQuery !== null && (matchingUsers.length > 0 || matchingProjects.length > 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setMediaUrls((prev) => [...prev, event.target!.result as string].slice(0, 4));
        }
      };
      reader.readAsDataURL(file);
    });
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

  const handleSaveDraft = () => {
    if (!text.trim()) return;
    localStorage.setItem('mosaic_composer_draft', text);
    alert('Draft saved to your browser session.');
  };

  const handleLoadDraft = () => {
    const draft = localStorage.getItem('mosaic_composer_draft');
    if (draft) {
      setText(draft);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) return;
    if (!text.trim() && mediaUrls.length === 0) return;
    if (isOverLimit) return;

    setIsSubmitting(true);
    try {
      const targetProject =
        selectedPersonaId !== 'personal'
          ? availableProjects.find((p) => p.id === selectedPersonaId)
          : null;

      const authorId = targetProject ? targetProject.id : currentUser.id;
      const authorName = targetProject ? targetProject.name : currentUser.displayName;
      const authorUsername = targetProject ? targetProject.username : currentUser.username;
      const authorPhotoURL = targetProject ? targetProject.logo : currentUser.photoURL;
      const authorBadge = targetProject ? 'Project' : undefined;
      const authorAccountType = targetProject ? 'project' : 'user';
      const isProjectPost = !!targetProject;
      const projectCategory = targetProject ? targetProject.category : undefined;

      if (isThreadMode && threadPosts.some((t) => t.trim())) {
        // Publish thread
        const allPostsInThread = [
          { text: text.trim(), mediaUrls },
          ...threadPosts.filter((t) => t.trim()).map((t) => ({ text: t.trim() })),
        ];

        await postService.createThread({
          authorId,
          authorName,
          authorUsername,
          authorPhotoURL,
          authorBadge,
          posts: allPostsInThread,
        });
      } else {
        // Build poll if enabled
        let pollPayload: PostPoll | undefined = undefined;
        if (isPollOpen && pollOptions.filter((o) => o.trim()).length >= 2) {
          pollPayload = {
            question: text.slice(0, 80),
            options: pollOptions
              .filter((o) => o.trim())
              .map((opt, i) => ({
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
          authorId,
          authorName,
          authorUsername,
          authorPhotoURL,
          authorBadge,
          text: text.trim(),
          mediaUrls,
          poll: pollPayload,
          replyToId,
          replyToUsername,
        });
      }

      // Reset
      setText('');
      setMediaUrls([]);
      setIsPollOpen(false);
      setPollOptions(['', '']);
      setIsThreadMode(false);
      setThreadPosts(['']);
      localStorage.removeItem('mosaic_composer_draft');

      if (onPostCreated) {
        onPostCreated();
      }
    } catch (err) {
      console.error('Error creating post', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`p-4 border-b border-white/10 bg-[#06070a]/40 ${className}`}>
      {replyToUsername && (
        <div className="text-xs text-slate-400 mb-2 pl-12 flex items-center gap-1">
          <span>Replying to</span>
          <span className="text-cyan-400 font-semibold">@{replyToUsername}</span>
        </div>
      )}

      <div className="flex gap-3 items-start">
        <Avatar
          src={composerAvatar}
          name={composerName || 'User'}
          size="md"
          className="shrink-0 mt-1 ring-1 ring-white/10"
        />

        <div className="flex-1 min-w-0 space-y-2">
          {/* Identity Persona Selector */}
          <div className="flex items-center gap-2 pb-1">
            <span className="text-[11px] text-slate-400 font-medium">Post as:</span>
            <select
              value={selectedPersonaId}
              onChange={(e) => setSelectedPersonaId(e.target.value)}
              className="bg-[#0b0e1e] border border-white/10 hover:border-cyan-500/40 text-xs text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-400 cursor-pointer transition-colors max-w-[240px] truncate"
            >
              <option value="personal">👤 @{currentUser?.username || 'You'} (Personal)</option>
              {availableProjects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  ✦ {proj.name} (@{proj.username})
                </option>
              ))}
            </select>
            {activeProject && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                NFT Project
              </span>
            )}
          </div>

          {/* Main Post Text Area */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              placeholder={
                activeProject
                  ? `What is happening with ${activeProject.name}?`
                  : placeholder
              }
              rows={replyToId ? 2 : 3}
              className="w-full bg-transparent text-white placeholder-slate-500 text-base md:text-lg resize-none focus:outline-none leading-relaxed"
            />

            {/* Mention Autocomplete Suggestions Dropdown */}
            {hasMentionSuggestions && (
              <div className="absolute left-0 top-full mt-1 w-72 bg-[#0d1124] border border-cyan-500/30 rounded-xl shadow-2xl p-1 z-50 overflow-hidden backdrop-blur-md">
                <div className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-white/5 flex items-center justify-between">
                  <span>Mention suggestion</span>
                  <span className="text-cyan-400">@{mentionQuery}</span>
                </div>
                <div className="max-h-48 overflow-y-auto py-1">
                  {matchingUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectMention(user.handle)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer group"
                    >
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-7 h-7 rounded-full object-cover border border-white/10"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-white group-hover:text-cyan-300 truncate">
                          {user.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {user.handle}
                        </div>
                      </div>
                    </button>
                  ))}
                  {matchingProjects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => handleSelectMention(project.username)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer group"
                    >
                      <img
                        src={project.logo}
                        alt={project.name}
                        className="w-7 h-7 rounded-lg object-cover border border-cyan-500/30"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-white group-hover:text-cyan-300 truncate flex items-center gap-1">
                          {project.name}
                          <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40">NFT</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          @{project.username}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Media Previews Grid */}
          {mediaUrls.length > 0 && (
            <div
              className={`grid gap-2 rounded-2xl overflow-hidden mb-3 ${
                mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
              }`}
            >
              {mediaUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden group">
                  <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeMedia(idx)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Poll Builder View */}
          {isPollOpen && (
            <div className="p-4 rounded-2xl bg-[#0a0d1a] border border-purple-500/30 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5" />
                  Community Poll
                </span>
                <button
                  type="button"
                  onClick={() => setIsPollOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const next = [...pollOptions];
                        next[i] = e.target.value;
                        setPollOptions(next);
                      }}
                      placeholder={`Option ${i + 1}`}
                      maxLength={40}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePollOption(i)}
                        className="p-1.5 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                {pollOptions.length < 4 ? (
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add option</span>
                  </button>
                ) : <span />}

                <select
                  value={pollDuration}
                  onChange={(e) => setPollDuration(e.target.value)}
                  className="bg-white/5 border border-white/10 text-xs text-slate-300 rounded-lg px-2 py-1 focus:outline-none"
                >
                  <option value="24h">1 Day</option>
                  <option value="3d">3 Days</option>
                  <option value="7d">7 Days</option>
                </select>
              </div>
            </div>
          )}

          {/* Thread Mode Sequential Inputs */}
          {isThreadMode && (
            <div className="space-y-3 pt-2 border-t border-white/5">
              <span className="text-xs text-purple-400 font-bold tracking-wide">
                THREAD CONTINUATION
              </span>
              {threadPosts.map((tText, i) => (
                <div key={i} className="relative flex items-start gap-2 pl-4 border-l-2 border-purple-500/30">
                  <textarea
                    value={tText}
                    onChange={(e) => {
                      const next = [...threadPosts];
                      next[i] = e.target.value;
                      setThreadPosts(next);
                    }}
                    placeholder={`Post ${i + 2}/${threadPosts.length + 1}`}
                    rows={2}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-purple-400"
                  />
                  {threadPosts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setThreadPosts(threadPosts.filter((_, idx) => idx !== i))}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => setThreadPosts([...threadPosts, ''])}
                className="text-xs text-cyan-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add another thread post</span>
              </button>
            </div>
          )}

          {/* GIF Picker Popover */}
          {showGifPicker && (
            <div className="p-3 rounded-2xl bg-[#0a0d1a] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-white">Creative GIF Architecture</span>
                <button onClick={() => setShowGifPicker(false)} className="hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SAMPLE_GIFS.map((gif, i) => (
                  <img
                    key={i}
                    src={gif}
                    alt="GIF option"
                    onClick={() => {
                      setMediaUrls([...mediaUrls, gif].slice(0, 4));
                      setShowGifPicker(false);
                    }}
                    className="w-full aspect-video object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Emoji Quick Picker */}
          {showEmojiPicker && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-[#0a0d1a] border border-white/10 flex-wrap">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setText((prev) => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Bottom Actions Bar */}
          <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
            {/* Toolbar Icons */}
            <div className="flex items-center gap-1 text-slate-400">
              {/* Media File Upload */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload Image"
                className="p-2 rounded-full hover:bg-purple-500/10 hover:text-purple-300 transition-colors cursor-pointer"
              >
                <Image className="w-4.5 h-4.5 text-purple-400" />
              </button>

              {/* GIF Selector */}
              <button
                type="button"
                onClick={() => setShowGifPicker(!showGifPicker)}
                title="Add GIF"
                className="p-2 rounded-full hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4.5 h-4.5 text-cyan-400" />
              </button>

              {/* Poll Tool */}
              <button
                type="button"
                onClick={() => setIsPollOpen(!isPollOpen)}
                title="Create Poll"
                className={`p-2 rounded-full hover:bg-pink-500/10 hover:text-pink-300 transition-colors cursor-pointer ${
                  isPollOpen ? 'text-pink-400 bg-pink-500/10' : ''
                }`}
              >
                <BarChart2 className="w-4.5 h-4.5 text-pink-400" />
              </button>

              {/* Emoji Picker */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Add Emoji"
                className="p-2 rounded-full hover:bg-amber-500/10 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <Smile className="w-4.5 h-4.5 text-amber-400" />
              </button>

              {/* Hashtag Shortcut */}
              <button
                type="button"
                onClick={() => setText((t) => t + ' #')}
                title="Add Hashtag"
                className="p-2 rounded-full hover:bg-white/5 hover:text-white transition-colors cursor-pointer hidden sm:inline-flex"
              >
                <Hash className="w-4 h-4 text-slate-400" />
              </button>

              {/* Mention Shortcut */}
              <button
                type="button"
                onClick={() => setText((t) => t + ' @')}
                title="Mention Creator"
                className="p-2 rounded-full hover:bg-white/5 hover:text-white transition-colors cursor-pointer hidden sm:inline-flex"
              >
                <AtSign className="w-4 h-4 text-slate-400" />
              </button>

              {/* Thread Builder Toggle */}
              {!replyToId && (
                <button
                  type="button"
                  onClick={() => setIsThreadMode(!isThreadMode)}
                  title="Create Thread"
                  className={`text-xs font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer ml-1 ${
                    isThreadMode
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Thread
                </button>
              )}
            </div>

            {/* Right: Character Counter, Drafts, and Post Button */}
            <div className="flex items-center gap-3">
              {/* Draft trigger */}
              <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  title="Save Draft"
                  className="hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Save Draft
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={handleLoadDraft}
                  title="Restore Draft"
                  className="hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Load
                </button>
              </div>

              {/* Real-time Character Counter SVG Progress Ring */}
              <div className="relative flex items-center justify-center">
                <svg className="w-6 h-6 transform -rotate-90">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="#1e2238"
                    strokeWidth="2.5"
                    fill="none"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke={
                      isOverLimit
                        ? '#f43f5e'
                        : remainingChars < 20
                        ? '#f59e0b'
                        : '#a855f7'
                    }
                    strokeWidth="2.5"
                    strokeDasharray={56.5}
                    strokeDashoffset={
                      56.5 - (Math.min(currentLength, MAX_CHARS) / MAX_CHARS) * 56.5
                    }
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
                {remainingChars <= 20 && (
                  <span
                    className={`absolute text-[9px] font-bold ${
                      isOverLimit ? 'text-rose-500' : 'text-amber-400'
                    }`}
                  >
                    {remainingChars}
                  </span>
                )}
              </div>

              {/* Primary Post Action Button */}
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={
                  isSubmitting ||
                  (!text.trim() && mediaUrls.length === 0) ||
                  isOverLimit
                }
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:opacity-95 disabled:opacity-40 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-purple-900/40 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-slate-950" />
                )}
                <span>
                  {replyToId
                    ? 'Reply'
                    : isThreadMode
                    ? `Post Thread (${threadPosts.length + 1})`
                    : 'Post'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
