import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';
import { NftProjectAccount } from '../../types';
import {
  X,
  Layers,
  Sparkles,
  Upload,
  Globe,
  Share2,
  Users,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: NftProjectAccount) => void;
}

const CATEGORIES = [
  'Generative & Lore',
  'Visual Arts & Light',
  'Cyberpunk Worldbuilding',
  '3D Sculptures',
  'Streetwear Syndicate',
  'Music & Audio Synthesis',
  'Gaming & Metaverse',
];

const PRESET_LOGOS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&auto=format&fit=crop&q=80',
];

const PRESET_BANNERS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80',
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const { currentUser } = useAuth();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [website, setWebsite] = useState('');
  const [xLink, setXLink] = useState('');
  const [communityLink, setCommunityLink] = useState('');
  const [collectionName, setCollectionName] = useState('');
  const [contractAddress, setContractAddress] = useState('');

  const [logo, setLogo] = useState(PRESET_LOGOS[0]);
  const [banner, setBanner] = useState(PRESET_BANNERS[0]);
  const [customLogoUrl, setCustomLogoUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }

    const cleanHandle = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanHandle || cleanHandle.length < 3) {
      setError('Project username handle must be at least 3 alphanumeric characters.');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a project description or mission statement.');
      return;
    }

    if (!currentUser) {
      setError('You must be signed in to create an NFT Project.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await projectService.createProject({
        name: name.trim(),
        username: cleanHandle,
        logo: customLogoUrl.trim() || logo,
        banner,
        description: description.trim(),
        website: website.trim() || undefined,
        xLink: xLink.trim() || undefined,
        communityLink: communityLink.trim() || undefined,
        category,
        ownerId: currentUser.id,
        collectionName: collectionName.trim() || undefined,
        contractAddress: contractAddress.trim() || undefined,
      });

      onProjectCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create project account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-[#090b16] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create NFT Project</h2>
              <p className="text-xs text-slate-400">Launch a dedicated social identity for your collection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Project Name <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. The Chog Collective"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username Handle <span className="text-cyan-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="projecthandle"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Project Description & Story <span className="text-cyan-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is the story, lore, or creative mission behind this project?"
              rows={3}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#0a0e20] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Visual Identity: Logo & Banner */}
          <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Visual Identity
            </span>

            {/* Logo Presets */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-2">Project Avatar / Logo</label>
              <div className="flex items-center gap-3">
                {PRESET_LOGOS.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt="Logo preset"
                    onClick={() => {
                      setLogo(img);
                      setCustomLogoUrl('');
                    }}
                    className={`w-12 h-12 rounded-xl object-cover cursor-pointer border-2 transition-all ${
                      logo === img && !customLogoUrl ? 'border-cyan-400 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Banner Presets */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-2">Project Banner</label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_BANNERS.map((bg, i) => (
                  <img
                    key={i}
                    src={bg}
                    alt="Banner preset"
                    onClick={() => setBanner(bg)}
                    className={`w-full h-16 rounded-xl object-cover cursor-pointer border-2 transition-all ${
                      banner === bg ? 'border-purple-400 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* External Links */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Links & Community
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="Website URL"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="relative">
                <Share2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  value={xLink}
                  onChange={(e) => setXLink(e.target.value)}
                  placeholder="X / Twitter"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  value={communityLink}
                  onChange={(e) => setCommunityLink(e.target.value)}
                  placeholder="Community link"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* Collection Association (Verification-Ready Architecture) */}
          <div className="p-4 rounded-2xl bg-[#0a0e20] border border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                NFT Collection Association
              </span>
              <span className="text-[10px] text-slate-400">Optional · Verification-Ready</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Link your NFT collection name. Mosaic validates ownership securely without requiring private keys or premature claims.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="Collection Name (e.g. Nomad Spires)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />

              <input
                type="text"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                placeholder="Contract Address (e.g. 0x...)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-7 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:opacity-95 text-slate-950 font-bold text-xs transition-opacity shadow-lg shadow-purple-900/40 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Layers className="w-3.5 h-3.5" />
              )}
              <span>Create Project Identity</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
