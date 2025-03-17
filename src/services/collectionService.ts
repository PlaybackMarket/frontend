import { Connection, PublicKey } from '@solana/web3.js';
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fetchDigitalAsset, mplTokenMetadata, fetchAllDigitalAssetWithTokenByOwner } from "@metaplex-foundation/mpl-token-metadata";
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
const MAINNET_RPC_URL = process.env.NEXT_PUBLIC_SONIC_MAINNET_RPC || 'https://rpc.mainnet-alpha.sonic.game';
const TESTNET_RPC_URL = process.env.NEXT_PUBLIC_SONIC_TESTNET_RPC || 'https://api.testnet.sonic.game';

// Define interfaces for NFT data from UMI
interface UMINFT {
  publicKey: string;
  metadata: {
    name: string;
    symbol: string;
    uri: string;
  };
}

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
    const umi = createUmi(rpcUrl);
    umi.use(mplTokenMetadata());

    const keypair = generateSigner(umi);
    umi.use(signerIdentity(createSignerFromKeypair(umi, keypair)));

    const mintPublicKey = publicKey(mintAddress);
    const asset = await fetchDigitalAsset(umi, mintPublicKey);

    let offChainMetadata = null;
    if (asset.metadata.uri) {
      try {
        const response = await fetch(asset.metadata.uri);
        offChainMetadata = await response.json();
      } catch (error) {
        console.error('Error fetching off-chain metadata:', error);
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
    console.error('Error in fetchMetadata:', error);
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
    
    // Known collection mint address
    const collectionMints = [
      '6516ETJzXYgRjuy9V6UFszdghSfPa578jw2przR2H8ob', // Main collection
    ];
    
    // Fetch metadata for each collection
    const collectionsPromises = collectionMints.map(async (mintAddress) => {
      try {
        const metadata = await fetchMetadata(mintAddress, rpcUrl);
        
        if (metadata) {
          const collection: Collection = {
            id: mintAddress,
            name: metadata.onChain.name || 'Unknown Collection',
            symbol: metadata.onChain.symbol || '',
            image: metadata.offChain?.image,
            description: metadata.offChain?.description,
            floorPrice: 0,
            lendingAPY: 0,
            collateralRequired: 0,
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
      toast.error('No collections found on Sonic SVM');
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
    const connection = new Connection(rpcUrl);
    
    // Initialize UMI for metadata fetching
    const umi = createUmi(rpcUrl).use(mplTokenMetadata());
    const keypair = generateSigner(umi);
    umi.use(signerIdentity(createSignerFromKeypair(umi, keypair)));

    // Get the collection's metadata
    const collectionMetadata = await fetchMetadata(collectionId, rpcUrl);
    if (!collectionMetadata) {
      toast.error('Collection not found on Sonic SVM');
      return [];
    }

    // Get all token accounts for this collection
    // TODO: Replace with actual Sonic SVM API call to get collection NFTs
    // For now, return empty array until we have the proper API
    return [];
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    toast.error('Failed to fetch NFTs from Sonic SVM');
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
    
    // TODO: Replace with actual Sonic SVM API call to get token collections
    // For now, return empty array until we have the proper API
    return [];
  } catch (error) {
    console.error('Error fetching token collections:', error);
    toast.error('Failed to fetch token collections from Sonic SVM');
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

/**
 * Fetch NFTs owned by a specific wallet
 * @param walletAddress The wallet address
 * @param isMainnet Whether to fetch from mainnet or testnet
 * @returns Array of NFTs owned by the wallet
 */
export async function fetchWalletNFTs(walletAddress: string, isMainnet: boolean = false): Promise<NFT[]> {
  try {
    console.log('Fetching NFTs for wallet:', walletAddress);
    const rpcUrl = isMainnet ? MAINNET_RPC_URL : TESTNET_RPC_URL;
    console.log('RPC URL:', rpcUrl);
    
    // Create UMI instance
    const umi = createUmi(rpcUrl).use(mplTokenMetadata());
    const walletPubkey = publicKey(walletAddress);

    console.log('Fetching all digital assets...');
    const allNFTs = await fetchAllDigitalAssetWithTokenByOwner(
      umi,
      walletPubkey,
    ) as UMINFT[];

    console.log(`Found ${allNFTs.length} NFTs for the owner`);

    // Process each NFT
    const nftsPromises = allNFTs.map(async (nft: UMINFT) => {
      try {
        console.log('Processing NFT:', nft.publicKey);
        
        // Fetch off-chain metadata if URI exists
        let offChainMetadata = null;
        if (nft.metadata.uri) {
          try {
            console.log('Fetching off-chain metadata from:', nft.metadata.uri);
            const response = await fetch(nft.metadata.uri);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            offChainMetadata = await response.json();
            console.log('Successfully fetched off-chain metadata');
          } catch (error) {
            console.error('Error fetching off-chain metadata:', error);
            // Continue without off-chain metadata
          }
        }

        const nftData: NFT = {
          id: nft.publicKey,
          name: nft.metadata.name || 'Unknown NFT',
          image: offChainMetadata?.image,
          attributes: offChainMetadata?.attributes,
          owner: walletAddress,
          listed: false // This will be updated when we check lending status
        };

        console.log('Successfully processed NFT:', nftData.name);
        return nftData;
      } catch (error) {
        console.error('Error processing NFT:', nft.publicKey, error);
        return null;
      }
    });

    // Wait for all promises to resolve and filter out nulls
    const nfts = (await Promise.all(nftsPromises)).filter((nft): nft is NFT => nft !== null);

    console.log('Successfully fetched NFTs:', nfts.length);
    if (nfts.length === 0) {
      console.log('No NFTs found in wallet');
    }
    return nfts;
  } catch (error) {
    console.error('Error fetching wallet NFTs:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    toast.error('Failed to fetch your NFTs');
    return [];
  }
} 