import React, { useState } from 'react';
import {
  X,
  Wallet,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  LogOut,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { formatAddress } from '../../constants/chains';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const {
    walletState,
    chainConfig,
    isWrongNetwork,
    supportedChains,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    clearWalletError,
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [switchingChainId, setSwitchingChainId] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (walletState.address) {
      navigator.clipboard.writeText(walletState.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSwitchNetwork = async (chainId: number) => {
    setSwitchingChainId(chainId);
    await switchNetwork(chainId);
    setSwitchingChainId(null);
  };

  const explorerUrl =
    walletState.address && chainConfig
      ? `${chainConfig.blockExplorerUrls[0]}/address/${walletState.address}`
      : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#090b16] border border-white/10 shadow-2xl p-6 sm:p-7 text-white overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {walletState.status === 'connected' ? 'Wallet Connected' : 'Connect Web3 Wallet'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {walletState.status === 'connected'
                  ? 'Manage your optional blockchain connection'
                  : 'Optional connection for NFT verification'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              clearWalletError();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notification */}
        {walletState.error && (
          <div className="relative z-10 mt-4 p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-200">Wallet Notice</p>
              <p className="text-[11px] text-rose-300/90 leading-relaxed mt-0.5">
                {walletState.error}
              </p>
            </div>
            <button
              onClick={clearWalletError}
              className="text-rose-400 hover:text-white text-xs cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="relative z-10 pt-5 space-y-5">
          {walletState.status === 'connected' ? (
            /* Connected State */
            <div className="space-y-4">
              {/* Address & Status Pill */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Connected Account</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 bg-[#060810] p-3 rounded-xl border border-white/5">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-white truncate">
                      {walletState.ensName || walletState.address}
                    </p>
                    {walletState.ensName && (
                      <p className="font-mono text-[11px] text-slate-400">
                        {formatAddress(walletState.address, 6)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Copy Address"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {explorerUrl && (
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="View on Explorer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Network Status & Switcher */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Network Status</span>
                  {isWrongNetwork ? (
                    <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Unsupported Network
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-cyan-400">
                      {chainConfig?.name} (Chain {walletState.chainId})
                    </span>
                  )}
                </div>

                {isWrongNetwork && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-300 leading-relaxed">
                    You are connected to an unsupported chain. Please select one of the verified networks below to display your NFTs accurately.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {supportedChains.map((c) => {
                    const isCurrent = walletState.chainId === c.id;
                    const isSwitching = switchingChainId === c.id;

                    return (
                      <button
                        key={c.id}
                        onClick={() => handleSwitchNetwork(c.id)}
                        disabled={isCurrent || isSwitching}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
                            : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: c.iconColor }}
                          />
                          <span>{c.name}</span>
                        </span>
                        {isCurrent ? (
                          <Check className="w-3.5 h-3.5 text-cyan-400" />
                        ) : isSwitching ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Disconnect Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    disconnectWallet();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            </div>
          ) : (
            /* Disconnected State */
            <div className="space-y-4">
              {/* Optional Wallet Explanation */}
              <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex items-start gap-2.5 text-xs text-purple-200/90 leading-relaxed">
                <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <p className="text-[11px]">
                  <strong>Wallets are completely optional.</strong> You can explore, create, follow, and post on Mosaic using just your Google account. Connect a wallet only to verify ownership and showcase your genuine on-chain NFTs.
                </p>
              </div>

              {/* Connect Button */}
              <button
                type="button"
                onClick={connectWallet}
                disabled={walletState.status === 'connecting'}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#0e162e] to-[#151c36] hover:from-[#131d3d] hover:to-[#1b2447] border border-cyan-500/30 hover:border-cyan-400/60 transition-all cursor-pointer shadow-lg group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 group-hover:scale-105 transition-transform">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Browser Web3 Wallet</p>
                    <p className="text-[11px] text-slate-400">
                      MetaMask, Coinbase Wallet, Rabby, Brave
                    </p>
                  </div>
                </div>

                {walletState.status === 'connecting' ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
                )}
              </button>

              <div className="pt-2 text-center text-[11px] text-slate-500 space-y-1">
                <p>Never silently requests signatures or transactions.</p>
                <p>Compatible with Ethereum, Base, Polygon, & Arbitrum.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
