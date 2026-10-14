export interface ChainConfig {
  id: number;
  name: string;
  network: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  blockscoutApiUrl?: string;
  iconColor: string;
}

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  chainId: number | null;
  chainName: string | null;
  ensName: string | null;
  error: string | null;
  providerName: string | null;
}

export interface OwnedNft {
  id: string; // unique key e.g. chain-contract-tokenId
  tokenId: string;
  name: string;
  description?: string;
  collectionName: string;
  image: string;
  chain: string;
  chainId: number;
  contractAddress: string;
  tokenType: 'ERC-721' | 'ERC-1155';
  explorerUrl: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface CollectionVerificationResult {
  verified: boolean;
  contractAddress: string;
  name?: string;
  symbol?: string;
  totalSupply?: string;
  ownerAddress?: string;
  isOwner?: boolean;
  message: string;
}
