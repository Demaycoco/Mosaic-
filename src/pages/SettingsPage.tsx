import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/common/Avatar';
import { sanitizeUsername } from '../services/authService';
import { AccountType } from '../types';
import {
  ArrowLeft,
  Save,
  LogOut,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  User,
  Users,
} from 'lucide-react';

interface SettingsPageProps {
  onBack: () => void;
  onNavigateLogin: () => void;
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

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onBack,
  onNavigateLogin,
}) => {
  const { user, updateUser, signOut, loading } = useAuth();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('user');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setAccountType(user.accountType || 'user');
      setSelectedInterests(user.interests || []);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06070a]">
        <p className="text-sm text-slate-400">Loading settings...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06070a] p-4">
        <div className="p-8 rounded-2xl bg-[#090b16] border border-white/10 text-center max-w-sm space-y-4">
          <p className="text-slate-300 text-sm">Please sign in to access your Mosaic settings.</p>
          <button
            onClick={onNavigateLogin}
            className="px-5 py-2.5 rounded-full bg-white text-slate-900 font-semibold text-xs cursor-pointer"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const toggleInterest = (tag: string) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter((t) => t !== tag));
    } else {
      setSelectedInterests([...selectedInterests, tag]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const cleaned = sanitizeUsername(username);
    if (!cleaned || cleaned.length < 3) {
      setErrorMessage('Username must be at least 3 alphanumeric characters.');
      return;
    }

    setIsSaving(true);
    try {
      await updateUser({
        username: cleaned,
        displayName: displayName.trim() || user.displayName,
        bio: bio.trim(),
        interests: selectedInterests,
        accountType: accountType,
      });
      setSuccessMessage('Your Mosaic profile was updated successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onBack();
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-[#06070a] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        {/* Navigation back bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Mosaic</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/20 border border-rose-500/20 hover:border-rose-500/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Account & Profile Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage your authenticated Mosaic identity, display preferences, and profile details.
          </p>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Account Info Card (Google Linked) */}
        <div className="p-6 rounded-2xl bg-[#090b16] border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar src={user.photoURL} name={user.displayName} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{user.displayName}</h3>
                  <span className="text-xs text-purple-400">@{user.username}</span>
                </div>
                <p className="text-xs text-slate-400">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Google Account
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-[10px] text-slate-500">Joined {formattedDate}</span>
                </div>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {user.accountType === 'project' ? 'NFT Project' : 'Creator Profile'}
            </span>
          </div>
        </div>

        {/* Profile Settings Form */}
        <form onSubmit={handleSave} className="p-6 sm:p-8 rounded-3xl bg-[#090b16] border border-white/10 space-y-6">
          <div className="space-y-4">
            {/* Account Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Account Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType('user')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    accountType === 'user'
                      ? 'bg-purple-950/40 border-purple-400 text-white'
                      : 'bg-white/5 border-white/5 text-slate-400'
                  }`}
                >
                  <User className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="text-xs font-bold">Individual Creator / Collector</p>
                    <p className="text-[10px] text-slate-400">Personal showcase and relay participant</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAccountType('project')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    accountType === 'project'
                      ? 'bg-cyan-950/40 border-cyan-400 text-white'
                      : 'bg-white/5 border-white/5 text-slate-400'
                  }`}
                >
                  <Users className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-xs font-bold">NFT Project Hub</p>
                    <p className="text-[10px] text-slate-400">Collective, drop studio, or guild</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Username & Display Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Bio Statement
                </label>
                <span className="text-[10px] text-slate-500">{bio.length}/160</span>
              </div>
              <textarea
                value={bio}
                maxLength={160}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your creative philosophy, favorite relays, or artistic perspective..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none"
              />
            </div>

            {/* Interests */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Artistic Interests & Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_TAGS.map((tag) => {
                  const isSelected = selectedInterests.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleInterest(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600/40 text-white border border-purple-400/60 shadow-sm'
                          : 'bg-white/5 text-slate-400 border border-white/5 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-slate-200 text-slate-900 font-bold text-xs transition-colors cursor-pointer shadow-md"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
