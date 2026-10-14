import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, ShieldCheck, Tag, Info, Layers, GitFork } from 'lucide-react';
import { OwnedNft } from '../../types/wallet';
import { formatAddress } from '../../constants/chains';

interface OwnedNftDetailModalProps {
  nft: OwnedNft | null;
  onClose: () => void;
  onCreateRelay?: (nft: OwnedNft) => void;
}

export const OwnedNftDetailModal: React.FC<OwnedNftDetailModalProps> = ({ nft, onClose, onCreateRelay }) => {
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState(false);

  if (!nft) return null;

  const handleCopyContract = () => {
    navigator.clipboard.writeText(nft.contractAddress);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const handleCopyTokenId = () => {
    navigator.clipboard.writeText(nft.tokenId);
    setCopiedTokenId(true);
    setTimeout(() => setCopiedTokenId(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#090b16] border border-white/10 shadow-2xl p-6 sm:p-8 text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Media Preview */}
          <div className="space-y-3">
            <div className="rounded-2xl bg-[#060810] border border-white/10 overflow-hidden aspect-square flex items-center justify-center relative">
              {nft.image ? (
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-slate-600 font-mono text-xs">No media preview available</span>
              )}

              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-black/80 backdrop-blur-md text-cyan-300 border border-cyan-500/30">
                  {nft.chain}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-black/70 backdrop-blur-md text-slate-300 border border-white/10">
                  {nft.tokenType}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Verified On-Chain Ownership</span>
            </div>
          </div>

          {/* Metadata & Provenance Details */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                {nft.collectionName}
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                {nft.name}
              </h3>
            </div>

            {nft.description && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 leading-relaxed max-h-32 overflow-y-auto">
                {nft.description}
              </div>
            )}

            {/* On-Chain Specs */}
            <div className="space-y-2 text-xs bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Token ID</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-white truncate max-w-[140px]">{nft.tokenId}</span>
                  <button
                    onClick={handleCopyTokenId}
                    className="text-slate-500 hover:text-white cursor-pointer"
                  >
                    {copiedTokenId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Contract</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-white">{formatAddress(nft.contractAddress, 4)}</span>
                  <button
                    onClick={handleCopyContract}
                    className="text-slate-500 hover:text-white cursor-pointer"
                  >
                    {copiedContract ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Blockchain</span>
                <span className="font-semibold text-cyan-300">{nft.chain} (ID: {nft.chainId})</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Token Standard</span>
                <span className="font-semibold text-slate-200">{nft.tokenType}</span>
              </div>
            </div>

            {/* Attributes & Traits */}
            {nft.attributes && nft.attributes.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Attributes ({nft.attributes.length})</span>
                </h5>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {nft.attributes.map((attr, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl bg-white/5 border border-white/5 text-[11px]"
                    >
                      <p className="text-slate-500 font-medium uppercase text-[9px]">
                        {attr.trait_type}
                      </p>
                      <p className="text-white font-bold truncate mt-0.5">{String(attr.value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions: Start Relay & Block Explorer */}
            <div className="pt-2 space-y-2">
              {onCreateRelay && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCreateRelay(nft);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-slate-950 font-extrabold text-xs hover:opacity-95 transition-opacity shadow-md cursor-pointer"
                >
                  <GitFork className="w-4 h-4 text-slate-950" />
                  <span>Create NFT Relay Experience</span>
                </button>
              )}

              <a
                href={nft.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors shadow-sm"
              >
                <span>View on Block Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
