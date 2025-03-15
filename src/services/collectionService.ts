import { Connection, PublicKey } from '@solana/web3.js';
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fetchDigitalAsset, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey, createSignerFromKeypair, generateSigner, signerIdentity } from "@metaplex-foundation/umi";
import { toast } from 'react-hot-toast';

// Define the collection interface
export interface Collection {
  id: string;
  name: string;
  symbol: string;
  image?: string;
  description?: string;
  floorPrice: number;
  lendingAPY: number;
  collateralRequired: number;
  availableForLending: number;
  totalLent: number;
  totalBorrowed: number;
  verified: boolean;
}

// Define the NFT interface
export interface NFT {
  id: string;
  name: string;
  image?: string;
  attributes?: Array<{trait_type: string, value: string | number}>;
  owner?: string;
  listed?: boolean;
  price?: number;
}

// Sonic SVM RPC URLs
const MAINNET_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC || 'https://api.mainnet-alpha.sonic.game';
const TESTNET_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_TESTNET_RPC || 'https://devnet.sonic.game';

/**
 * Fetch metadata for a given mint address using UMI
 * @param mintAddress The mint address
 * @param rpcUrl The RPC URL to use
 * @returns The metadata or null if not found
 */
async function fetchMetadata(mintAddress: string, rpcUrl: string): Promise<{
  onChain: {
    name: string;
    symbol: string;
    uri: string;
  };
  offChain: {
    image?: string;
    description?: string;
    attributes?: Array<{trait_type: string, value: string | number}>;
  } | null;
} | null> {
  try {
    // Create a UMI instance with the provided RPC URL
    const umi = createUmi(rpcUrl);
    
    // Use the mplTokenMetadata plugin
    umi.use(mplTokenMetadata());

    // Generate a signer and set up identity
    const keypair = generateSigner(umi);
    umi.use(signerIdentity(createSignerFromKeypair(umi, keypair)));
    
    // Convert the mint address to a UMI PublicKey
    const mintPublicKey = publicKey(mintAddress);
    
    try {
      // Fetch the digital asset
      const asset = await fetchDigitalAsset(umi, mintPublicKey);
      
      // Fetch the off-chain metadata if URI is available
      let offChainMetadata = null;
      if (asset.metadata.uri) {
        try {
          const response = await fetch(asset.metadata.uri);
          offChainMetadata = await response.json();
        } catch (error) {
          console.error('Error fetching off-chain metadata:', error);
          toast.error('Failed to fetch collection metadata');
        }
      }
      
      return {
        onChain: {
          name: asset.metadata.name,
          symbol: asset.metadata.symbol,
          uri: asset.metadata.uri,
        },
        offChain: offChainMetadata,
      };
    } catch (error) {
      console.error(`Error fetching digital asset for ${mintAddress}:`, error);
      if (error instanceof Error) {
        toast.error(`Failed to fetch collection: ${error.message}`);
      }
      return null;
    }
  } catch (error) {
    console.error('Error in fetchMetadata:', error);
    if (error instanceof Error) {
      toast.error(`Failed to initialize collection reader: ${error.message}`);
    }
    return null;
  }
}

/**
 * Fetch all NFT collections from the Sonic SVM network
 * @param isMainnet Whether to fetch from mainnet or testnet
 * @returns Array of collections
 */
export async function fetchAllCollections(isMainnet: boolean = true): Promise<Collection[]> {
  try {
    const rpcUrl = isMainnet ? MAINNET_RPC_URL : TESTNET_RPC_URL;
    
    // Known collection mint addresses on Sonic SVM
    const collectionMints = [
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'So11111111111111111111111111111111111111112', // SOL
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
    ];
    
    // Fetch metadata for each collection
    const collectionsPromises = collectionMints.map(async (mintAddress) => {
      try {
        const metadata = await fetchMetadata(mintAddress, rpcUrl);
        
        if (metadata) {
          // Extract data from metadata
          const name = metadata.onChain.name;
          const symbol = metadata.onChain.symbol;
          const image = metadata.offChain?.image || '';
          const description = metadata.offChain?.description || '';
          
          const collection: Collection = {
            id: mintAddress,
            name: name || 'Unknown Collection',
            symbol: symbol || '',
            image,
            description,
            floorPrice: 0,
            lendingAPY: 0,
            collateralRequired: 100,
            availableForLending: 0,
            totalLent: 0,
            totalBorrowed: 0,
            verified: true,
          };
          
          return collection;
        }
        return null;
      } catch (error) {
        console.error(`Error processing collection ${mintAddress}:`, error);
        return null;
      }
    });
    
    // Wait for all promises to resolve and filter out nulls
    const collections = (await Promise.all(collectionsPromises)).filter((c): c is Collection => c !== null);
    
    if (collections.length === 0) {
      toast.error('No collections found');
      return [];
    }
    
    return collections;
  } catch (error) {
    console.error('Error fetching collections:', error);
    toast.error('Failed to fetch collections from Sonic SVM');
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
    const metadata = await fetchMetadata(collectionId, rpcUrl);
    
    if (metadata) {
      const name = metadata.onChain.name;
      const symbol = metadata.onChain.symbol;
      const image = metadata.offChain?.image || '';
      const description = metadata.offChain?.description || '';
      
      return {
        id: collectionId,
        name: name || 'Unknown Collection',
        symbol: symbol || '',
        image,
        description,
        floorPrice: 0,
        lendingAPY: 0,
        collateralRequired: 100,
        availableForLending: 0,
        totalLent: 0,
        totalBorrowed: 0,
        verified: true,
      };
    }
    
    toast.error('Collection not found');
    return null;
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
export async function fetchNFTsInCollection(collectionId: string, isMainnet: boolean = true): Promise<NFT[]> {
  try {
    const rpcUrl = isMainnet ? MAINNET_RPC_URL : TESTNET_RPC_URL;
    const metadata = await fetchMetadata(collectionId, rpcUrl);
    
    if (!metadata) {
      toast.error('Collection not found');
      return [];
    }
    
    // For now, return an empty array since we don't have access to NFTs in the collection
    return [];
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
export async function fetchTokenCollections(isMainnet: boolean = true): Promise<{
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  supply: number;
  address: string;
}[]> {
  try {
    const rpcUrl = isMainnet ? MAINNET_RPC_URL : TESTNET_RPC_URL;
    const connection = new Connection(rpcUrl);
    
    // Get token info for common tokens
    const tokenAddresses = [
      'So11111111111111111111111111111111111111112', // SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
    ];
    
    const tokensPromises = tokenAddresses.map(async (address) => {
      try {
        const tokenInfo = await connection.getTokenSupply(new PublicKey(address));
        return {
          symbol: address === 'So11111111111111111111111111111111111111112' ? 'SOL' : 
                 address === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 'USDC' : 'BONK',
          name: address === 'So11111111111111111111111111111111111111112' ? 'Solana' : 
               address === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 'USD Coin' : 'Bonk',
          price: 0,
          change24h: 0,
          supply: Number(tokenInfo.value.uiAmount),
          address,
        };
      } catch (e) {
        console.error(`Error fetching token info for ${address}:`, e);
        return null;
      }
    });
    
    // Filter out null values (failed fetches)
    const tokens = (await Promise.all(tokensPromises)).filter((token): token is {
      symbol: string;
      name: string;
      price: number;
      change24h: number;
      supply: number;
      address: string;
    } => token !== null);
    
    if (tokens.length === 0) {
      toast.error('No tokens found');
      return [];
    }
    
    return tokens;
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