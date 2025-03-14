import { Connection, PublicKey } from '@solana/web3.js';
import { toast } from 'react-hot-toast';

// Define the collection interface
export interface Collection {
  id: string;
  name: string;
  symbol: string;
  image?: string;
  floorPrice: number;
  lendingAPY: number;
  collateralRequired: number;
  availableForLending: number;
  totalLent: number;
  totalBorrowed: number;
  verified: boolean;
}

// Helius API endpoint for NFT collections
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || 'your-helius-api-key';
const MAINNET_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const TESTNET_RPC_URL = `https://testnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

/**
 * Fetch all NFT collections from the Sonic SVM network
 * @param isMainnet Whether to fetch from mainnet or testnet
 * @returns Array of collections
 */
export async function fetchAllCollections(isMainnet: boolean = true): Promise<Collection[]> {
  try {
    const rpcUrl = isMainnet ? MAINNET_RPC_URL : TESTNET_RPC_URL;
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'my-id',
        method: 'getAssetsByGroup',
        params: {
          groupKey: 'collection',
          groupValue: 'all',
          page: 1,
          limit: 100,
        },
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Error fetching collections:', data.error);
      toast.error('Failed to fetch collections');
      return [];
    }

    // Transform the response into our Collection interface
    const collections: Collection[] = data.result.items.map((item: any) => {
      // Extract collection data from the response
      const collection = {
        id: item.id || item.mint || '',
        name: item.content?.metadata?.name || 'Unknown Collection',
        symbol: item.content?.metadata?.symbol || '',
        image: item.content?.links?.image || '',
        floorPrice: item.marketData?.floorPrice ? item.marketData.floorPrice / 1e9 : 0, // Convert lamports to SOL
        lendingAPY: Math.random() * 20, // Placeholder - would come from lending protocol
        collateralRequired: 150, // Placeholder - would come from lending protocol
        availableForLending: Math.floor(Math.random() * 100), // Placeholder
        totalLent: Math.floor(Math.random() * 50), // Placeholder
        totalBorrowed: Math.floor(Math.random() * 30), // Placeholder
        verified: item.grouping?.some((g: any) => g.group_key === 'verified') || false,
      };
      
      return collection;
    });

    return collections;
  } catch (error) {
    console.error('Error fetching collections:', error);
    toast.error('Failed to fetch collections');
    return [];
  }
}

/**
 * Fetch a specific collection by ID
 * @param collectionId The collection ID
 * @param isMainnet Whether to fetch from mainnet or testnet
 * @returns The collection or null if not found
 */
export async function fetchCollectionById(collectionId: string, isMainnet: boolean = true): Promise<Collection | null> {
  try {
    const rpcUrl = isMainnet ? MAINNET_RPC_URL : TESTNET_RPC_URL;
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'my-id',
        method: 'getAsset',
        params: {
          id: collectionId,
        },
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Error fetching collection:', data.error);
      toast.error('Failed to fetch collection');
      return null;
    }

    const item = data.result;
    
    // Transform the response into our Collection interface
    const collection: Collection = {
      id: item.id || item.mint || '',
      name: item.content?.metadata?.name || 'Unknown Collection',
      symbol: item.content?.metadata?.symbol || '',
      image: item.content?.links?.image || '',
      floorPrice: item.marketData?.floorPrice ? item.marketData.floorPrice / 1e9 : 0, // Convert lamports to SOL
      lendingAPY: Math.random() * 20, // Placeholder - would come from lending protocol
      collateralRequired: 150, // Placeholder - would come from lending protocol
      availableForLending: Math.floor(Math.random() * 100), // Placeholder
      totalLent: Math.floor(Math.random() * 50), // Placeholder
      totalBorrowed: Math.floor(Math.random() * 30), // Placeholder
      verified: item.grouping?.some((g: any) => g.group_key === 'verified') || false,
    };

    return collection;
  } catch (error) {
    console.error('Error fetching collection:', error);
    toast.error('Failed to fetch collection');
    return null;
  }
}

/**
 * Fetch NFTs from a specific collection
 * @param collectionId The collection ID
 * @param isMainnet Whether to fetch from mainnet or testnet
 * @returns Array of NFTs in the collection
 */
export async function fetchNFTsInCollection(collectionId: string, isMainnet: boolean = true): Promise<any[]> {
  try {
    const rpcUrl = isMainnet ? MAINNET_RPC_URL : TESTNET_RPC_URL;
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'my-id',
        method: 'getAssetsByGroup',
        params: {
          groupKey: 'collection',
          groupValue: collectionId,
          page: 1,
          limit: 100,
        },
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Error fetching NFTs:', data.error);
      toast.error('Failed to fetch NFTs');
      return [];
    }

    return data.result.items;
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    toast.error('Failed to fetch NFTs');
    return [];
  }
}

/**
 * Fetch token collections from the Sonic SVM network
 * @param isMainnet Whether to fetch from mainnet or testnet
 * @returns Array of token collections
 */
export async function fetchTokenCollections(isMainnet: boolean = true): Promise<any[]> {
  try {
    const rpcUrl = isMainnet ? MAINNET_RPC_URL : TESTNET_RPC_URL;
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'my-id',
        method: 'getTokenAccounts',
        params: {
          limit: 100,
        },
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Error fetching token collections:', data.error);
      toast.error('Failed to fetch token collections');
      return [];
    }

    return data.result.items;
  } catch (error) {
    console.error('Error fetching token collections:', error);
    toast.error('Failed to fetch token collections');
    return [];
  }
}

/**
 * Fetch all collections from both mainnet and testnet
 * @returns Object containing mainnet and testnet collections
 */
export async function fetchAllNetworkCollections(): Promise<{ mainnet: Collection[], testnet: Collection[] }> {
  try {
    const [mainnetCollections, testnetCollections] = await Promise.all([
      fetchAllCollections(true),
      fetchAllCollections(false),
    ]);

    return {
      mainnet: mainnetCollections,
      testnet: testnetCollections,
    };
  } catch (error) {
    console.error('Error fetching all network collections:', error);
    toast.error('Failed to fetch collections from all networks');
    return {
      mainnet: [],
      testnet: [],
    };
  }
} 