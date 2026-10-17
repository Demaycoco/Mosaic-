import React, { useState, useRef } from 'react';
import { MosaicUser, NftProjectAccount } from '../../types';
import { projectService } from '../../services/projectService';
import { Avatar } from '../common/Avatar';
import { compressImageFile } from '../../utils/imageUtils';
import {
  X,
  Camera,
  Upload,
  Link as LinkIcon,
  Layers,
  Sparkles,
  Check,
  Search,
  CheckCircle2,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface EditProfileModalProps {
  user: MosaicUser;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: {
    displayName: string;
    username: string;
    bio: string;
    photoURL: string;
    bannerURL: string;
    xLink: string;
    instagramLink: string;
    tiktokLink: string;
    nftCommunities: string[];
  }) => Promise<void>;
}

// Curated banner and PFP presets inspired by Mosaic Web3 aesthetics
const BANNER_PRESETS = [
  {
    name: 'Cyber Horizon',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Prism Horizons',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
  },
  {
    name: 'NeoTokyo Spire',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Deep Ultraviolet',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cosmic Shards',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1200&auto=format&fit=crop&q=80',
  },
];

const PFP_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&auto=format&fit=crop&q=80',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [bannerURL, setBannerURL] = useState(user.bannerURL || '');
  const [xLink, setXLink] = useState(user.xLink || '');
  const [instagramLink, setInstagramLink] = useState(user.instagramLink || '');
  const [tiktokLink, setTiktokLink] = useState(user.tiktokLink || '');
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>(
    user.nftCommunities || []
  );
  const [communitySearch, setCommunitySearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'socials' | 'communities'>('profile');

  const pfpInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const [isOptimizingImage, setIsOptimizingImage] = useState(false);

  // Retrieve all existing NFT projects on Mosaic
  const allProjects = projectService.getAllProjects();
  const filteredProjects = allProjects.filter((p) => {
    if (!communitySearch.trim()) return true;
    const q = communitySearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const handlePfpFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (JPEG, PNG, WebP).');
        return;
      }
      setIsOptimizingImage(true);
      try {
        // Compress avatar to 300x300 JPEG (~20KB) so it saves reliably in localStorage & Firestore
        const compressed = await compressImageFile(file, 300, 300, 0.85);
        setPhotoURL(compressed);
      } catch (err) {
        console.warn('Image compression fallback:', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) setPhotoURL(event.target.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsOptimizingImage(false);
      }
    }
  };

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (JPEG, PNG, WebP).');
        return;
      }
      setIsOptimizingImage(true);
      try {
        // Compress banner to 1200x400 (~50KB) so it saves reliably without quota issues
        const compressed = await compressImageFile(file, 1200, 400, 0.82);
        setBannerURL(compressed);
      } catch (err) {
        console.warn('Banner compression fallback:', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) setBannerURL(event.target.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsOptimizingImage(false);
      }
    }
  };

  const toggleCommunity = (projectId: string) => {
    setSelectedCommunities((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const cleanHandleOrUrl = (input: string, platform: 'x' | 'instagram' | 'tiktok'): string => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    const cleanHandle = trimmed.replace(/^@/, '');
    if (platform === 'x') {
      return `https://x.com/${cleanHandle}`;
    }
    if (platform === 'instagram') {
      return `https://instagram.com/${cleanHandle}`;
    }
    if (platform === 'tiktok') {
      return `https://tiktok.com/@${cleanHandle}`;
    }
    return trimmed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 24);

    if (!cleanUsername || cleanUsername.length < 3) {
      alert('Username must be at least 3 alphanumeric characters or underscores.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        displayName: displayName.trim() || user.displayName,
        username: cleanUsername,
        bio: bio.trim(),
        photoURL: photoURL.trim() || user.photoURL,
        bannerURL: bannerURL.trim(),
        xLink: cleanHandleOrUrl(xLink, 'x'),
        instagramLink: cleanHandleOrUrl(instagramLink, 'instagram'),
        tiktokLink: cleanHandleOrUrl(tiktokLink, 'tiktok'),
        nftCommunities: selectedCommunities,
      });
      onClose();
    } catch (err: any) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#090b16] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#06070a]">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white">Edit Profile</h2>
            <span className="text-xs text-purple-400 font-mono">@{user.username}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-[#090c1a] px-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 transition-colors cursor-pointer relative ${
              activeTab === 'profile' ? 'text-cyan-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>General & Pictures</span>
            {activeTab === 'profile' && (
              <span className="absolute bottom-0 inset-x-3 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('socials')}
            className={`py-3 px-3 transition-colors cursor-pointer relative ${
              activeTab === 'socials' ? 'text-cyan-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Social Media Links</span>
            {activeTab === 'socials' && (
              <span className="absolute bottom-0 inset-x-3 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('communities')}
            className={`py-3 px-3 transition-colors cursor-pointer relative ${
              activeTab === 'communities' ? 'text-cyan-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>Mosaic Communities</span>
              {selectedCommunities.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px]">
                  {selectedCommunities.length}
                </span>
              )}
            </span>
            {activeTab === 'communities' && (
              <span className="absolute bottom-0 inset-x-3 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto scrollbar-thin">
          {/* TAB 1: General & Pictures */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Header Picture (Banner) Editing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Header Banner Picture</span>
                  </label>
                  <span className="text-[11px] text-slate-400">File upload or URL</span>
                </div>

                {/* Banner Preview & Action */}
                <div className="relative h-32 sm:h-40 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 group">
                  {bannerURL ? (
                    <img
                      src={bannerURL}
                      alt="Profile Header"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-pink-900/50 flex items-center justify-center">
                      <span className="text-xs text-slate-400 font-medium">No custom header set</span>
                    </div>
                  )}

                  {/* Banner Overlay Controls */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => bannerInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-full bg-white text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-200 cursor-pointer shadow-lg"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Banner</span>
                    </button>
                    {bannerURL && (
                      <button
                        type="button"
                        onClick={() => setBannerURL('')}
                        className="px-3 py-1.5 rounded-full bg-rose-500/80 text-white font-medium text-xs hover:bg-rose-600 cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerFileChange}
                    className="hidden"
                  />
                </div>

                {/* Banner URL Input & Presets */}
                <div className="space-y-2 pt-1">
                  <input
                    type="url"
                    value={bannerURL}
                    onChange={(e) => setBannerURL(e.target.value)}
                    placeholder="Or paste banner image URL (https://...)"
                    className="w-full bg-[#05060b] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />

                  {/* Presets */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] text-slate-400">
                    <span className="shrink-0 text-[10px] uppercase font-semibold text-slate-500">Presets:</span>
                    {BANNER_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setBannerURL(preset.url)}
                        className={`shrink-0 px-2.5 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer ${
                          bannerURL === preset.url
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Profile Picture (PFP) Editing */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Profile Picture (PFP)</span>
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group shrink-0">
                    <Avatar
                      src={photoURL}
                      name={displayName || user.displayName}
                      size="xl"
                      className="ring-4 ring-[#05060b] shadow-xl"
                    />
                    <button
                      type="button"
                      onClick={() => pfpInputRef.current?.click()}
                      className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                      title="Upload photo from disk"
                    >
                      <Upload className="w-5 h-5" />
                    </button>
                    <input
                      ref={pfpInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePfpFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => pfpInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload PFP from Device</span>
                      </button>
                    </div>

                    <input
                      type="url"
                      value={photoURL}
                      onChange={(e) => setPhotoURL(e.target.value)}
                      placeholder="Or enter direct image URL (https://...)"
                      className="w-full bg-[#05060b] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />

                    {/* Quick PFP preset buttons */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Aesthetic PFP:</span>
                      {PFP_PRESETS.map((pfp, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPhotoURL(pfp)}
                          className={`w-6 h-6 rounded-full overflow-hidden border-2 cursor-pointer transition-transform hover:scale-110 ${
                            photoURL === pfp ? 'border-cyan-400 scale-105' : 'border-white/20'
                          }`}
                        >
                          <img src={pfp} alt="preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Names & Bio */}
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="w-full bg-[#05060b] border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
                      Username (@)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 text-xs font-bold">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        required
                        className="w-full bg-[#05060b] border border-white/10 rounded-xl pl-8 pr-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Bio
                    </label>
                    <span className="text-[11px] text-slate-500">{bio.length}/240</span>
                  </div>
                  <textarea
                    value={bio}
                    maxLength={240}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Tell the Mosaic community about your digital identity, NFT passions, and creative lore..."
                    className="w-full bg-[#05060b] border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-cyan-400 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Social Media Links (X, Instagram, TikTok) */}
          {activeTab === 'socials' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/20 to-blue-950/20 border border-white/10">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Connect Your Social Media Presence</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Add your handles or profile links. These will appear as verified badges on your profile and bio.
                </p>
              </div>

              {/* X (formerly Twitter) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-black border border-white/20 flex items-center justify-center font-extrabold text-[11px] text-white">
                      𝕏
                    </span>
                    <span>X (Twitter) Profile</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">e.g. @yourhandle or x.com/handle</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={xLink}
                    onChange={(e) => setXLink(e.target.value)}
                    placeholder="https://x.com/username or @username"
                    className="w-full bg-[#05060b] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  {xLink && (
                    <a
                      href={cleanHandleOrUrl(xLink, 'x')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      title="Test Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Instagram */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-bold">
                      📸
                    </span>
                    <span>Instagram Profile</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">e.g. @yourhandle or instagram.com/handle</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={instagramLink}
                    onChange={(e) => setInstagramLink(e.target.value)}
                    placeholder="https://instagram.com/username or @username"
                    className="w-full bg-[#05060b] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  {instagramLink && (
                    <a
                      href={cleanHandleOrUrl(instagramLink, 'instagram')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      title="Test Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* TikTok */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-black border border-cyan-400/50 flex items-center justify-center text-[10px] text-cyan-300 font-bold">
                      🎵
                    </span>
                    <span>TikTok Profile</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">e.g. @yourhandle or tiktok.com/@handle</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={tiktokLink}
                    onChange={(e) => setTiktokLink(e.target.value)}
                    placeholder="https://tiktok.com/@username or @username"
                    className="w-full bg-[#05060b] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  {tiktokLink && (
                    <a
                      href={cleanHandleOrUrl(tiktokLink, 'tiktok')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      title="Test Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Mosaic NFT Communities Channels */}
          {activeTab === 'communities' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/20 to-purple-950/20 border border-white/10">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>NFT Communities on Mosaic</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Select the NFT community channels and guilds you belong to on Mosaic. They will be pinned directly to your profile and bio for members to discover.
                </p>
              </div>

              {/* Search community */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={communitySearch}
                  onChange={(e) => setCommunitySearch(e.target.value)}
                  placeholder="Filter Mosaic NFT communities..."
                  className="w-full bg-[#05060b] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Community List */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project: NftProjectAccount) => {
                    const isSelected = selectedCommunities.includes(project.id);

                    return (
                      <div
                        key={project.id}
                        onClick={() => toggleCommunity(project.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/30 border-cyan-500/50 shadow-sm shadow-cyan-950/50'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={project.logo}
                            alt={project.name}
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h5 className="text-xs font-bold text-white truncate">{project.name}</h5>
                              <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-medium">
                                {project.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-purple-400 truncate">@{project.username}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-cyan-400 text-slate-950'
                                : 'border border-white/30 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No matching NFT communities found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:opacity-95 text-slate-950 font-bold text-xs transition-opacity shadow-lg shadow-purple-900/40 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>{isSubmitting ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
