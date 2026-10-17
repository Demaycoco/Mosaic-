import React, { useState } from 'react';
import { ExternalLink, Copy, Check, ShieldCheck, Sparkles, Image as ImageIcon, GitFork } from 'lucide-react';
import { OwnedNft } from '../../types/wallet';
import { formatAddress } from '../../constants/chains';

interface OwnedNftCardProps {
  nft: OwnedNft;
  onSelect?: (nft: OwnedNft) => void;
  onCreateRelay?: (nft: OwnedNft) => void;
}

export const OwnedNftCard: React.FC<OwnedNftCardProps> = ({ nft, onSelect, onCreateRelay }) => {
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(nft.contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => onSelect && onSelect(nft)}
      className="group relative rounded-2xl bg-[#0b0f1e] border border-white/10 hover:border-cyan-500/40 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col shadow-lg hover:shadow-cyan-950/30"
    >
      {/* Media Container */}
      <div className="relative aspect-square w-full bg-[#060810] overflow-hidden flex items-center justify-center">
        {/* Chain and Standard Badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-md text-cyan-300 border border-cyan-500/30">
            {nft.chain}
          </span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-black/60 backdrop-blur-md text-slate-300 border border-white/10">
            {nft.tokenType}
          </span>
        </div>

        {/* Verified On-Chain Badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span
            className="p-1.5 rounded-full bg-black/70 backdrop-blur-md text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-sm"
            title="Verified On-Chain Ownership"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
          </span>
        </div>

        {nft.image && !imageError ? (
          <img
            src={nft.image}
            alt={nft.name}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div className="p-6 text-center text-slate-600 flex flex-col items-center gap-2">
            <ImageIcon className="w-8 h-8 text-slate-700" />
            <span className="text-[10px] text-slate-500 font-mono">No Preview Available</span>
          </div>
        )}
      </div>

      {/* Details Container */}
      <div className="p-3.5 flex flex-col justify-between flex-1 space-y-2.5">
        <div>
          {/* Collection Name */}
          <p className="text-[11px] font-semibold text-purple-400 truncate">
            {nft.collectionName}
          </p>

          {/* Token Name and Token ID */}
          <div className="flex items-baseline justify-between gap-2 mt-0.5">
            <h4 className="text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
              {nft.name}
            </h4>
            <span className="text-[11px] font-mono font-semibold text-slate-400 shrink-0">
              #{nft.tokenId.length > 8 ? `${nft.tokenId.slice(0, 4)}...${nft.tokenId.slice(-3)}` : nft.tokenId}
            </span>
          </div>
        </div>

        {/* Contract Address & Explorer Action */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono">
            <span className="text-slate-500 text-[10px]">Contract:</span>
            <span>{formatAddress(nft.contractAddress, 3)}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-slate-500 hover:text-white p-0.5 transition-colors cursor-pointer"
              title="Copy Contract Address"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          <a
            href={nft.explorerUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px] font-semibold transition-colors"
            title="View on Block Explorer"
          >
            <span>Scan</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Create Relay Button */}
        {onCreateRelay && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCreateRelay(nft);
            }}
            className="w-full mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:opacity-95 text-slate-950 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-purple-900/30 cursor-pointer"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Create Relay</span>
          </button>
        )}
      </div>
    </div>
  );
};
