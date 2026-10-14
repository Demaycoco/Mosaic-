import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  GitFork,
  Image as ImageIcon,
  Share2,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Info,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { relayService } from '../../services/relayService';
import { RelayExperience } from '../../types';

interface CreateRelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialNft?: {
    name?: string;
    image?: string;
    collection?: string;
    tokenId?: string;
    contractAddress?: string;
    chain?: string;
  };
  onRelayCreated?: (relay: RelayExperience) => void;
}

export const CreateRelayModal: React.FC<CreateRelayModalProps> = ({
  isOpen,
  onClose,
  initialNft,
  onRelayCreated,
}) => {
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('Would you create or change?');
  const [description, setDescription] = useState('');
  const [nftImage, setNftImage] = useState('');
  const [tokenId, setTokenId] = useState('#1');
  const [collection, setCollection] = useState('Mosaic Collective');
  const [options, setOptions] = useState<string[]>(['CREATE', 'CHANGE']);
  const [newOptionText, setNewOptionText] = useState('');
  const [initialDecisionText, setInitialDecisionText] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRelay, setCreatedRelay] = useState<RelayExperience | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync initial NFT if passed
  useEffect(() => {
    if (initialNft) {
      if (initialNft.name) setTitle(`${initialNft.name}: Living Journey`);
      if (initialNft.image) setNftImage(initialNft.image);
      if (initialNft.collection) setCollection(initialNft.collection);
      if (initialNft.tokenId) setTokenId(initialNft.tokenId);
    } else {
      setNftImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80');
      setTitle('The Genesis Codex: Living Artifact');
    }
  }, [initialNft, isOpen]);

  if (!isOpen) return null;

  const handleAddOption = () => {
    const clean = newOptionText.trim().toUpperCase();
    if (clean && !options.includes(clean) && options.length < 4) {
      setOptions([...options, clean]);
      setNewOptionText('');
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!title.trim() || !question.trim()) return;

    setIsSubmitting(true);
    try {
      const relay = await relayService.createRelay({
        title,
        question,
        description: description.trim() || 'A living community story turning this NFT into an evolving collaborative artifact.',
        options: options.length >= 2 ? options : ['CREATE', 'CHANGE'],
        nftImage: nftImage.trim(),
        tokenId,
        collection,
        contractAddress: initialNft?.contractAddress,
        chain: initialNft?.chain || 'Ethereum',
        initialDecisionText: initialDecisionText.trim(),
        creator: {
          id: currentUser.id,
          displayName: currentUser.displayName,
          username: currentUser.username,
          photoURL: currentUser.photoURL,
        },
      });

      setCreatedRelay(relay);
      if (onRelayCreated) {
        onRelayCreated(relay);
      }
    } catch (err) {
      console.error('Error creating relay:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const shareUrl = createdRelay
    ? `${window.location.origin}/relay/${createdRelay.id}`
    : '';

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#090b16] border border-white/10 shadow-2xl p-6 sm:p-8 text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {createdRelay ? (
          /* SUCCESS STATE: Shareable URL generated */
          <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto shadow-xl shadow-cyan-950/50">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                Relay Published
              </span>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                {createdRelay.title}
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Your NFT Relay is live. Share this unique URL with participants to begin weaving the shared story.
              </p>
            </div>

            {/* Preview Box */}
            <div className="p-4 rounded-2xl bg-[#060810] border border-white/10 flex items-center gap-4 text-left">
              <img
                src={createdRelay.nftImage}
                alt={createdRelay.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-purple-400 font-semibold">{createdRelay.collection}</p>
                <p className="text-sm font-bold text-white truncate">{createdRelay.title}</p>
                <p className="text-[11px] text-cyan-300 mt-0.5 font-medium">Question: &quot;{createdRelay.question}&quot;</p>
              </div>
            </div>

            {/* Share Link Card */}
            <div className="space-y-2 text-left">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase">
                Shareable Relay URL
              </label>
              <div className="flex items-center gap-2 bg-[#060810] p-2.5 rounded-xl border border-cyan-500/30">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="bg-transparent text-xs font-mono text-cyan-300 flex-1 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.history.pushState({}, '', `/relay/${createdRelay.id}`);
                  window.dispatchEvent(new PopStateEvent('popstate'));
                  onClose();
                }}
                className="w-full sm:flex-1 py-3 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-200 transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <span>View Relay Experience</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* FORM STATE: Input Relay Parameters */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400">
                <GitFork className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Create NFT Relay</span>
                  <Sparkles className="w-4 h-4 text-pink-400" />
                </h3>
                <p className="text-xs text-slate-400">
                  Turn your NFT into an evolving, shared community story
                </p>
              </div>
            </div>

            {/* Crucial Concept Callout */}
            <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-2.5 text-xs text-purple-200 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <p className="text-[11px]">
                <strong>Ownership Preserved:</strong> The NFT owner does <em>NOT</em> transfer the NFT to participants. You remain the sole owner. Participants interact by appending chapters to its living provenance.
              </p>
            </div>

            {/* Relay Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Relay Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., The Contrarian: Codex of Divergence"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            {/* Question */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>The Guiding Question</span>
                <span className="text-[10px] text-cyan-400 font-normal">What participants answer</span>
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., Would you create or change?"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            {/* Response Options */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Response Options (2 - 4 Choices)
              </label>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {options.map((opt, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold"
                  >
                    <span>{opt}</span>
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(i)}
                        className="text-cyan-400 hover:text-rose-400 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {options.length < 4 && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    placeholder="Add custom option (e.g., FORK)"
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Description & Narrative Prompt */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Description & Story Prompt
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Give participants context. What choices have been made, and where is this artifact traveling next?"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white resize-none focus:outline-none focus:border-cyan-400 leading-relaxed"
              />
            </div>

            {/* Optional Image URL & Preview */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                NFT Artwork Image URL
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="url"
                  value={nftImage}
                  onChange={(e) => setNftImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  required
                />
                {nftImage && (
                  <img
                    src={nftImage}
                    alt="Preview"
                    className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                  />
                )}
              </div>
            </div>

            {/* Genesis Chapter Inscription */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Genesis Inscription (Chapter 1)</span>
                <span className="text-[10px] text-slate-400">Your initial contribution</span>
              </label>
              <input
                type="text"
                value={initialDecisionText}
                onChange={(e) => setInitialDecisionText(e.target.value)}
                placeholder={`I chose ${options[0]} and opened this living lore to the world.`}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-slate-950 font-bold text-xs hover:opacity-95 transition-opacity shadow-lg shadow-purple-900/30 cursor-pointer"
              >
                {isSubmitting ? 'Publishing Relay...' : 'Publish Relay'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
