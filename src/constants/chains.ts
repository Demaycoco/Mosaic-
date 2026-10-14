import { ChainConfig } from '../types/wallet';

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  1: {
    id: 1,
    name: 'Ethereum',
    network: 'homestead',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://cloudflare-eth.com', 'https://eth.public-rpc.com'],
    blockExplorerUrls: ['https://etherscan.io'],
    blockscoutApiUrl: 'https://eth.blockscout.com/api/v2',
    iconColor: '#627EEA',
  },
  8453: {
    id: 8453,
    name: 'Base',
    network: 'base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org'],
    blockscoutApiUrl: 'https://base.blockscout.com/api/v2',
    iconColor: '#0052FF',
  },
  137: {
    id: 137,
    name: 'Polygon',
    network: 'matic',
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
    blockscoutApiUrl: 'https://polygon.blockscout.com/api/v2',
    iconColor: '#8247E5',
  },
  42161: {
    id: 42161,
    name: 'Arbitrum One',
    network: 'arbitrum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
    blockscoutApiUrl: 'https://arbitrum.blockscout.com/api/v2',
    iconColor: '#28A0F0',
  },
  11155111: {
    id: 11155111,
    name: 'Sepolia Testnet',
    network: 'sepolia',
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://rpc.sepolia.org'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    blockscoutApiUrl: 'https://eth-sepolia.blockscout.com/api/v2',
    iconColor: '#A855F7',
  },
};

export const DEFAULT_CHAIN_ID = 1;

export function getChainConfig(chainId: number | null): ChainConfig | undefined {
  if (!chainId) return undefined;
  return SUPPORTED_CHAINS[chainId];
}

export function formatAddress(address: string | null | undefined, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}
