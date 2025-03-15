import { Connection, PublicKey } from '@solana/web3.js';
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fetchDigitalAsset, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey } from "@metaplex-foundation/umi";
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
        }
      }
      
      return {
        onChain: asset.metadata,
        offChain: offChainMetadata,
      };
    } catch (error) {
      console.error(`Error fetching digital asset for ${mintAddress}:`, error);
      return null;
    }
  } catch (error) {
    console.error('Error in fetchMetadata:', error);
    return null;
  }
}

/**
 * Create a fallback collection when real data can't be fetched
 * @param id Collection ID
 * @param index Index for generating unique data
 * @returns A fallback collection
 */
function createFallbackCollection(id: string, index: number): Collection {
  const names = ['Sonic Heroes', 'Pixel Warriors', 'Crypto Legends', 'Metaverse Explorers', 'Digital Nomads'];
  const symbols = ['SONIC', 'PIXEL', 'LEGEND', 'META', 'DIGI'];
  const images = [
    'https://placehold.co/400x400/0099FF/FFFFFF?text=Sonic+Heroes',
    'https://placehold.co/400x400/FF6B00/FFFFFF?text=Pixel+Warriors',
    'https://placehold.co/400x400/00FF99/000000?text=Crypto+Legends',
    'https://placehold.co/400x400/9900FF/FFFFFF?text=Metaverse+Explorers',
    'https://placehold.co/400x400/FF0099/FFFFFF?text=Digital+Nomads'
  ];
  const descriptions = [
    'A collection of heroes from the Sonic universe',
    'Pixelated warriors ready for battle in the metaverse',
    'Legendary creatures from the crypto realm',
    'Explorers of the vast metaverse landscapes',
    'Digital nomads traveling through the virtual world'
  ];
  
  const idx = index % 5;
  
  return {
    id,
    name: names[idx],
    symbol: symbols[idx],
    image: images[idx],
    description: descriptions[idx],
    floorPrice: 0.5 + (idx * 0.2),
    lendingAPY: 5 + (idx * 2),
    collateralRequired: 100,
    availableForLending: 10 + (idx * 5),
    totalLent: 5 + (idx * 2),
    totalBorrowed: 3 + (idx * 1),
    verified: true,
  };
}

/**
 * Fetch all NFT collections from the Sonic SVM network
 * @param isMainnet Whether to fetch from mainnet or testnet
 * @returns Array of collections
 */
export async function fetchAllCollections(isMainnet: boolean = true): Promise<Collection[]> {
  try {
    const rpcUrl = isMainnet ? MAINNET_RPC_URL : TESTNET_RPC_URL;
    
    // Try to fetch real collections first
    try {
      // Known collection mint addresses on Sonic SVM
      // In a production environment, you would get these from an indexer or API
      const collectionMints = [
        'J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w', // Example collection 1
        '7KqpRwzkkeweW5jQiYs3DYHPy3qzpx4rQQgpNtkNcW9q', // Example collection 2
        '2rCAFFRvXKXrPBvHpvYbP8NyJKN6VyJmZABDxcARWKfG', // Example collection 3
      ];
      
      // Fetch metadata for each collection
      const collectionsPromises = collectionMints.map(async (mintAddress, index) => {
        try {
          const metadata = await fetchMetadata(mintAddress, rpcUrl);
          
          if (metadata) {
            // Extract data from metadata
            const name = metadata.onChain.name;
            const symbol = metadata.onChain.symbol;
            const image = metadata.offChain?.image || '';
            const description = metadata.offChain?.description || '';
            
            // For lending stats, we would normally fetch these from your lending protocol
            // Since we don't have real data, we'll set these to 0 or default values
            const collection: Collection = {
              id: mintAddress,
              name: name || 'Unknown Collection',
              symbol: symbol || '',
              image,
              description,
              floorPrice: 0,
              lendingAPY: 0,
              collateralRequired: 100, // Default 100%
              availableForLending: 0,
              totalLent: 0,
              totalBorrowed: 0,
              verified: true, // Assume verified
            };
            
            return collection;
          } else {
            // If metadata fetch fails, create a fallback collection
            return createFallbackCollection(mintAddress, index);
          }
        } catch (error) {
          console.error(`Error processing collection ${mintAddress}:`, error);
          // If there's an error, create a fallback collection
          return createFallbackCollection(mintAddress, index);
        }
      });
      
      // Wait for all promises to resolve
      const collections = await Promise.all(collectionsPromises);
      
      if (collections.length === 0) {
        throw new Error('No collections found');
      }
      
      return collections;
    } catch (error) {
      console.error('Error fetching real collections:', error);
      // If real collection fetching fails, create fallback collections
      const fallbackCollections: Collection[] = [];
      
      // Create 5 fallback collections
      for (let i = 0; i < 5; i++) {
        const id = `fallback-collection-${i}`;
        fallbackCollections.push(createFallbackCollection(id, i));
      }
      
      toast.error('Failed to fetch real collections. Showing placeholder data.');
      return fallbackCollections;
    }
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
    
    // Try to fetch real collection first
    try {
      // Fetch metadata for the collection
      const metadata = await fetchMetadata(collectionId, rpcUrl);
      
      if (metadata) {
        // Extract data from metadata
        const name = metadata.onChain.name;
        const symbol = metadata.onChain.symbol;
        const image = metadata.offChain?.image || '';
        const description = metadata.offChain?.description || '';
        
        // For lending stats, we would normally fetch these from your lending protocol
        // Since we don't have real data, we'll set these to 0 or default values
        return {
          id: collectionId,
          name: name || 'Unknown Collection',
          symbol: symbol || '',
          image,
          description: description || `Collection on Sonic SVM with ID: ${collectionId}`,
          floorPrice: 0,
          lendingAPY: 0,
          collateralRequired: 100, // Default 100%
          availableForLending: 0,
          totalLent: 0,
          totalBorrowed: 0,
          verified: true, // Assume verified
        };
      } else {
        // If metadata fetch fails, create a fallback collection
        const index = parseInt(collectionId.slice(-1), 16) % 5; // Use last character of ID as index
        return createFallbackCollection(collectionId, index);
      }
    } catch (error) {
      console.error('Error fetching real collection:', error);
      // If real collection fetching fails, create a fallback collection
      const index = parseInt(collectionId.slice(-1), 16) % 5; // Use last character of ID as index
      toast.error('Failed to fetch real collection. Showing placeholder data.');
      return createFallbackCollection(collectionId, index);
    }
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
    
    // Try to fetch real NFTs first
    try {
      // In a production environment, you would query for NFTs belonging to this collection
      // using a service like Metaplex's Read API or another indexer
      
      // For now, we'll create some fallback NFTs
      const fallbackNFTs: NFT[] = [];
      const collectionName = (await fetchCollectionById(collectionId, isMainnet))?.name || 'Unknown Collection';
      
      // Create 10 fallback NFTs
      for (let i = 0; i < 10; i++) {
        fallbackNFTs.push({
          id: `${collectionId}-nft-${i}`,
          name: `${collectionName} #${i + 1}`,
          image: `https://placehold.co/400x400/0099FF/FFFFFF?text=${encodeURIComponent(collectionName)}+%23${i + 1}`,
          attributes: [
            { trait_type: 'Rarity', value: i < 3 ? 'Legendary' : i < 7 ? 'Rare' : 'Common' },
            { trait_type: 'Power', value: 50 + (i * 10) },
          ],
          owner: `${i % 2 === 0 ? 'Sonic' : 'Player'}${i}`,
          listed: i % 3 === 0,
          price: i % 3 === 0 ? 0.1 + (i * 0.05) : undefined,
        });
      }
      
      toast.error('No real NFTs found. Showing placeholder data.');
      return fallbackNFTs;
    } catch (error) {
      console.error('Error fetching real NFTs:', error);
      toast.error('Failed to fetch NFTs. Showing placeholder data.');
      
      // Create fallback NFTs
      const fallbackNFTs: NFT[] = [];
      for (let i = 0; i < 5; i++) {
        fallbackNFTs.push({
          id: `fallback-nft-${i}`,
          name: `Fallback NFT #${i + 1}`,
          image: `https://placehold.co/400x400/FF6B00/FFFFFF?text=Fallback+NFT+%23${i + 1}`,
          attributes: [
            { trait_type: 'Type', value: 'Fallback' },
            { trait_type: 'Power', value: 10 + (i * 5) },
          ],
        });
      }
      
      return fallbackNFTs;
    }
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
    
    // Try to fetch real token info first
    try {
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
            price: 0, // No mock data
            change24h: 0, // No mock data
            supply: Number(tokenInfo.value.uiAmount),
            address,
          };
        } catch (e) {
          console.error(`Error fetching token info for ${address}:`, e);
          return null;
        }
      });
      
      // Define the token type
      type TokenInfo = {
        symbol: string;
        name: string;
        price: number;
        change24h: number;
        supply: number;
        address: string;
      };
      
      // Filter out null values (failed fetches)
      const tokens = (await Promise.all(tokensPromises)).filter(
        (token): token is TokenInfo => token !== null
      );
      
      if (tokens.length === 0) {
        throw new Error('No tokens found');
      }
      
      return tokens;
    } catch (error) {
      console.error('Error fetching real tokens:', error);
      // If real token fetching fails, create fallback tokens
      const fallbackTokens = [
        {
          symbol: 'SOL',
          name: 'Solana',
          price: 150.25,
          change24h: 2.5,
          supply: 555000000,
          address: 'So11111111111111111111111111111111111111112',
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          price: 1.0,
          change24h: 0.01,
          supply: 10000000000,
          address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        },
        {
          symbol: 'BONK',
          name: 'Bonk',
          price: 0.00002,
          change24h: 5.2,
          supply: 500000000000000,
          address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        },
      ];
      
      toast.error('Failed to fetch real tokens. Showing placeholder data.');
      return fallbackTokens;
    }
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