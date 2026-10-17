import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { AccountType } from '../../types';
import {
  Settings,
  ShieldCheck,
  Check,
  User,
  Users,
  Layers,
  Sparkles,
  Camera,
  Save,
  ExternalLink,
} from 'lucide-react';
import { projectService } from '../../services/projectService';

interface SettingsViewProps {
  onSaved?: () => void;
}

const INTEREST_TAGS = [
  'Generative Art',
  'Cyberpunk & Sci-Fi',
  'Pixel Art',
  '3D Sculpture',
  'Worldbuilding',
  'Narrative Lore',
  'Curating',
  'Streetwear',
  'Music & Soundscapes',
  'Interactive Stories',
];

export const SettingsView: React.FC<SettingsViewProps> = ({ onSaved }) => {
  const { currentUser, updateUser } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [bannerURL, setBannerURL] = useState('');
  const [xLink, setXLink] = useState('');
  const [instagramLink, setInstagramLink] = useState('');
  const [tiktokLink, setTiktokLink] = useState('');
  const [nftCommunities, setNftCommunities] = useState<string[]>([]);
  const [accountType, setAccountType] = useState<AccountType>('user');
  const [interests, setInterests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setUsername(currentUser.username || '');
      setBio(currentUser.bio || '');
      setPhotoURL(currentUser.photoURL || '');
      setBannerURL(currentUser.bannerURL || '');
      setXLink(currentUser.xLink || '');
      setInstagramLink(currentUser.instagramLink || '');
      setTiktokLink(currentUser.tiktokLink || '');
      setNftCommunities(currentUser.nftCommunities || []);
      setAccountType(currentUser.accountType || 'user');
      setInterests(currentUser.interests || []);
    }
  }, [currentUser]);

  const toggleInterest = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter((t) => t !== tag));
    } else {
      setInterests([...interests, tag]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMsg('Username must be between 3 and 24 characters.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      await updateUser({
        displayName: displayName.trim() || currentUser.displayName,
        username: cleanUsername,
        bio: bio.trim(),
        photoURL: photoURL.trim() || currentUser.photoURL,
        bannerURL: bannerURL.trim(),
        xLink: xLink.trim(),
        instagramLink: instagramLink.trim(),
        tiktokLink: tiktokLink.trim(),
        nftCommunities,
        accountType,
        interests,
      });

      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
      if (onSaved) onSaved();
    } catch (err) {
      console.error('Error saving settings', err);
      setErrorMsg('Failed to update settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-30 bg-[#06070a]/90 backdrop-blur-md border-b border-white/10 px-4 py-3.5 flex items-center justify-between">
        <h1 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <span>Settings</span>
        </h1>

        {successToast && (
          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            Saved successfully
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="px-4 space-y-6 max-w-xl">
        {/* Profile Details Card */}
        <div className="p-5 rounded-2xl bg-[#080a14] border border-white/5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Profile Details
          </h3>

          {/* Header Banner Picture */}
          <div className="space-y-2 pb-2 border-b border-white/5">
            <label className="block text-[11px] font-semibold text-slate-300 uppercase">
              Header Banner Image URL
            </label>
            <div className="relative h-24 rounded-xl overflow-hidden bg-slate-900 border border-white/10 mb-2">
              {bannerURL ? (
                <img src={bannerURL} alt="Banner Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-pink-900/40 flex items-center justify-center text-xs text-slate-500">
                  No custom header banner
                </div>
              )}
            </div>
            <input
              type="url"
              value={bannerURL}
              onChange={(e) => setBannerURL(e.target.value)}
              placeholder="https://... (Header banner picture URL)"
              className="w-full bg-[#05060b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-4 pb-2">
            <Avatar src={photoURL || currentUser?.photoURL} name={displayName || 'User'} size="lg" />
            <div className="min-w-0 flex-1">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                Profile Picture URL (PFP)
              </label>
              <input
                type="url"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#05060b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full bg-[#05060b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                Username (@)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-[#05060b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
              Bio (Max 160 characters)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={3}
              placeholder="Tell the community about your collection, artwork, and curation..."
              className="w-full bg-[#05060b] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Social Media Links Card */}
        <div className="p-5 rounded-2xl bg-[#080a14] border border-white/5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Social Media Links</span>
            <span className="text-[10px] text-slate-500">Displayed on your profile</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-black border border-white/20 flex items-center justify-center text-[10px] text-white font-bold">𝕏</span>
                <span>X (Twitter) Link or Handle</span>
              </label>
              <input
                type="text"
                value={xLink}
                onChange={(e) => setXLink(e.target.value)}
                placeholder="https://x.com/yourhandle or @yourhandle"
                className="w-full bg-[#05060b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <span className="text-xs">📸</span>
                <span>Instagram Link or Handle</span>
              </label>
              <input
                type="text"
                value={instagramLink}
                onChange={(e) => setInstagramLink(e.target.value)}
                placeholder="https://instagram.com/yourhandle or @yourhandle"
                className="w-full bg-[#05060b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <span className="text-xs">🎵</span>
                <span>TikTok Link or Handle</span>
              </label>
              <input
                type="text"
                value={tiktokLink}
                onChange={(e) => setTiktokLink(e.target.value)}
                placeholder="https://tiktok.com/@yourhandle or @yourhandle"
                className="w-full bg-[#05060b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* NFT Communities on Mosaic Card */}
        <div className="p-5 rounded-2xl bg-[#080a14] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>NFT Communities on Mosaic</span>
            </h3>
            <span className="text-[10px] text-cyan-400 font-semibold">
              {nftCommunities.length} added
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Select the NFT community channels you are part of on Mosaic to feature them on your bio and profile.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {projectService.getAllProjects().map((proj) => {
              const isJoined = nftCommunities.includes(proj.id);
              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    setNftCommunities((prev) =>
                      prev.includes(proj.id) ? prev.filter((id) => id !== proj.id) : [...prev, proj.id]
                    );
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isJoined
                      ? 'bg-cyan-950/30 border-cyan-400 text-white'
                      : 'bg-[#05060b] border-white/5 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={proj.logo} alt={proj.name} className="w-6 h-6 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{proj.name}</p>
                      <p className="text-[10px] text-purple-400 truncate">@{proj.username}</p>
                    </div>
                  </div>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    isJoined ? 'bg-cyan-400 text-slate-950 font-bold' : 'border border-white/20'
                  }`}>
                    {isJoined && '✓'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Account Role / Identity Type */}
        <div className="p-5 rounded-2xl bg-[#080a14] border border-white/5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Account Type
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { type: 'user' as AccountType, label: 'Collector', desc: 'Curates & collects' },
              { type: 'creator' as AccountType, label: 'Creator', desc: 'Authors original art' },
              { type: 'project' as AccountType, label: 'NFT Project', desc: 'Decentralized guild' },
            ].map((role) => (
              <button
                key={role.type}
                type="button"
                onClick={() => setAccountType(role.type)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  accountType === role.type
                    ? 'border-cyan-400 bg-cyan-950/30'
                    : 'border-white/5 bg-[#05060b] hover:border-white/20'
                }`}
              >
                <div className="text-xs font-bold text-white">{role.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{role.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Creative Interests */}
        <div className="p-5 rounded-2xl bg-[#080a14] border border-white/5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Creative Interests
          </h3>

          <div className="flex flex-wrap gap-2">
            {INTEREST_TAGS.map((tag) => {
              const selected = interests.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleInterest(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selected
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-400 font-semibold px-2">{errorMsg}</p>
        )}

        {/* Submit Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="h-10 px-6 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-slate-950 font-bold text-xs hover:opacity-95 transition-opacity cursor-pointer shadow-md flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5 text-slate-950" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
