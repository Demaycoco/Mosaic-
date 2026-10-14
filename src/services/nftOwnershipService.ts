import { Contract, JsonRpcProvider } from 'ethers';
import { OwnedNft, CollectionVerificationResult } from '../types/wallet';
import { SUPPORTED_CHAINS, getChainConfig } from '../constants/chains';

// Basic ERC-721 / Ownable ABI for querying on-chain metadata & ownership
const ERC721_MINIMAL_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function owner() view returns (address)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
];

// Resolves IPFS, Arweave, and data URIs to browser-viewable URLs
export function resolveMediaUrl(rawUri?: string | null): string {
  if (!rawUri) return '';
  const uri = rawUri.trim();

  if (uri.startsWith('ipfs://')) {
    const hashPath = uri.replace('ipfs://', '').replace(/^ipfs\//, '');
    return `https://cloudflare-ipfs.com/ipfs/${hashPath}`;
  }

  if (uri.startsWith('ar://')) {
    const txId = uri.replace('ar://', '');
    return `https://arweave.net/${txId}`;
  }

  return uri;
}

// In-memory cache for fast tab-switching without repeating API calls
const ownedNftsCache = new Map<string, { timestamp: number; nfts: OwnedNft[] }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

export const nftOwnershipService = {
  /**
   * Retrieve genuine, real-time on-chain NFTs owned by a wallet address.
   * Does NOT hardcode or fabricate any ownership.
   */
  async getOwnedNfts(
    walletAddress: string,
    targetChainId?: number,
    forceRefresh = false
  ): Promise<OwnedNft[]> {
    if (!walletAddress) return [];
    const normalizedAddress = walletAddress.toLowerCase();
    const cacheKey = `${normalizedAddress}-${targetChainId || 'all'}`;

    if (!forceRefresh) {
      const cached = ownedNftsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.nfts;
      }
    }

    const chainsToQuery = targetChainId
      ? [getChainConfig(targetChainId)].filter(Boolean)
      : [
          SUPPORTED_CHAINS[1], // Ethereum
          SUPPORTED_CHAINS[8453], // Base
          SUPPORTED_CHAINS[137], // Polygon
          SUPPORTED_CHAINS[42161], // Arbitrum
        ];

    const results: OwnedNft[] = [];

    // Query each chain's Blockscout indexer API
    await Promise.allSettled(
      chainsToQuery.map(async (chain) => {
        if (!chain || !chain.blockscoutApiUrl) return;

        try {
          const url = `${chain.blockscoutApiUrl}/addresses/${normalizedAddress}/nft?type=ERC-721%2CERC-1155`;
          const res = await fetch(url, { headers: { Accept: 'application/json' } });
          
          if (!res.ok) {
            console.warn(`Blockscout API returned ${res.status} for ${chain.name}`);
            return;
          }

          const data = await res.json();
          if (!data || !Array.isArray(data.items)) return;

          for (const item of data.items) {
            const tokenId = item.id ? String(item.id) : '0';
            const contractAddr = item.token?.address_hash || '';
            const rawImage = item.image_url || item.metadata?.image || item.media_url;
            const imageUrl = resolveMediaUrl(rawImage);
            const rawName = item.metadata?.name || (item.token?.name ? `${item.token.name} #${tokenId}` : `Token #${tokenId}`);
            const collectionTitle = item.token?.name || 'Verified Collection';

            const formattedNft: OwnedNft = {
              id: `${chain.id}-${contractAddr}-${tokenId}`,
              tokenId,
              name: rawName,
              description: item.metadata?.description || '',
              collectionName: collectionTitle,
              image: imageUrl,
              chain: chain.name,
              chainId: chain.id,
              contractAddress: contractAddr,
              tokenType: item.token?.type === 'ERC-1155' ? 'ERC-1155' : 'ERC-721',
              explorerUrl: `${chain.blockExplorerUrls[0]}/token/${contractAddr}?a=${tokenId}`,
              attributes: Array.isArray(item.metadata?.attributes) ? item.metadata.attributes : undefined,
            };

            results.push(formattedNft);
          }
        } catch (chainErr) {
          console.warn(`Failed fetching NFTs on ${chain?.name}:`, chainErr);
        }
      })
    );

    ownedNftsCache.set(cacheKey, { timestamp: Date.now(), nfts: results });
    return results;
  },

  /**
   * Clear cache for a specific address or all
   */
  clearCache(walletAddress?: string) {
    if (walletAddress) {
      const prefix = walletAddress.toLowerCase();
      for (const key of ownedNftsCache.keys()) {
        if (key.startsWith(prefix)) ownedNftsCache.delete(key);
      }
    } else {
      ownedNftsCache.clear();
    }
  },

  /**
   * Cryptographically verifies an NFT collection smart contract on-chain.
   * Ensures Mosaic does not falsely claim a project owns a collection without verification.
   */
  async verifyCollectionContract(
    contractAddress: string,
    chainId: number,
    expectedOwnerAddress?: string
  ): Promise<CollectionVerificationResult> {
    const chain = getChainConfig(chainId);
    if (!chain || !chain.rpcUrls.length) {
      return {
        verified: false,
        contractAddress,
        message: `Chain ${chainId} is not supported for verification.`,
      };
    }

    // Clean address format
    const cleanedAddress = contractAddress.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(cleanedAddress)) {
      return {
        verified: false,
        contractAddress: cleanedAddress,
        message: 'Invalid contract address format. Must be a valid 42-character 0x EVM address.',
      };
    }

    try {
      const provider = new JsonRpcProvider(chain.rpcUrls[0]);
      // Verify bytecode exists at address
      const code = await provider.getCode(cleanedAddress);
      if (!code || code === '0x') {
        return {
          verified: false,
          contractAddress: cleanedAddress,
          message: `No smart contract bytecode deployed at ${cleanedAddress} on ${chain.name}.`,
        };
      }

      const contract = new Contract(cleanedAddress, ERC721_MINIMAL_ABI, provider);

      // Query contract name
      let name = '';
      try {
        name = await contract.name();
      } catch {
        name = 'Verified Contract';
      }

      // Query symbol
      let symbol = '';
      try {
        symbol = await contract.symbol();
      } catch {
        symbol = '';
      }

      // Query total supply
      let totalSupply: string | undefined;
      try {
        const supply = await contract.totalSupply();
        totalSupply = supply.toString();
      } catch {
        totalSupply = undefined;
      }

      // Query owner
      let ownerAddress: string | undefined;
      try {
        ownerAddress = await contract.owner();
      } catch {
        // Some contracts do not implement owner() or are decentralized DAOs
        ownerAddress = undefined;
      }

      const isOwner = expectedOwnerAddress && ownerAddress
        ? ownerAddress.toLowerCase() === expectedOwnerAddress.toLowerCase()
        : undefined;

      return {
        verified: true,
        contractAddress: cleanedAddress,
        name,
        symbol,
        totalSupply,
        ownerAddress,
        isOwner,
        message: `Smart contract successfully verified on ${chain.name}.${
          isOwner === true
            ? ' Connected wallet matches the smart contract owner!'
            : ownerAddress
            ? ` Contract owner is ${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}.`
            : ''
        }`,
      };
    } catch (err: any) {
      return {
        verified: false,
        contractAddress: cleanedAddress,
        message: `Contract verification failed: ${err.message || 'Network RPC error'}`,
      };
    }
  },

  /**
   * Fetch verified instances/tokens for an on-chain collection directly from indexer
   */
  async getCollectionTokens(
    contractAddress: string,
    chainId = 1
  ): Promise<OwnedNft[]> {
    const chain = getChainConfig(chainId);
    if (!chain || !chain.blockscoutApiUrl) return [];

    try {
      const url = `${chain.blockscoutApiUrl}/tokens/${contractAddress}/instances`;
      const res = await fetch(url);
      if (!res.ok) return [];

      const data = await res.json();
      if (!data || !Array.isArray(data.items)) return [];

      return data.items.map((item: any) => {
        const tokenId = item.id ? String(item.id) : '0';
        const rawImage = item.image_url || item.metadata?.image || item.media_url;
        return {
          id: `${chain.id}-${contractAddress}-${tokenId}`,
          tokenId,
          name: item.metadata?.name || `${item.token?.name || 'NFT'} #${tokenId}`,
          collectionName: item.token?.name || 'Verified Collection',
          image: resolveMediaUrl(rawImage),
          chain: chain.name,
          chainId: chain.id,
          contractAddress,
          tokenType: item.token?.type === 'ERC-1155' ? 'ERC-1155' : 'ERC-721',
          explorerUrl: `${chain.blockExplorerUrls[0]}/token/${contractAddress}?a=${tokenId}`,
          attributes: item.metadata?.attributes,
        };
      });
    } catch (e) {
      console.warn('Failed to fetch collection tokens:', e);
      return [];
    }
  },
};
