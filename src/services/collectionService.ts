import { Connection, PublicKey } from '@solana/web3.js';
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
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

// Metaplex Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

/**
 * Fetch metadata for a given mint address
 * @param mintAddress The mint address
 * @param connection The Solana connection
 * @returns The metadata or null if not found
 */
async function fetchMetadata(mintAddress: string, connection: Connection): Promise<any> {
  try {
    const mintPublicKey = new PublicKey(mintAddress);
    
    // Find the PDA for the metadata account
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintPublicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    
    // Fetch the metadata account
    const metadataAccount = await connection.getAccountInfo(metadataPDA);
    
    if (!metadataAccount) {
      return null;
    }
    
    // Decode the metadata
    const metadata = Metadata.deserialize(metadataAccount.data)[0];
    
    // Fetch the off-chain metadata if URI is available
    let offChainMetadata = null;
    if (metadata.data.uri) {
      try {
        const response = await fetch(metadata.data.uri);
        offChainMetadata = await response.json();
      } catch (error) {
        console.error('Error fetching off-chain metadata:', error);
      }
    }
    
    return {
      onChain: metadata,
      offChain: offChainMetadata,
    };
  } catch (error) {
    console.error('Error fetching metadata:', error);
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
    const connection = new Connection(rpcUrl);
    
    // In a real implementation, you would query for collections
    // For now, we'll create some sample collections based on known NFT collections
    const collectionMints = [
      'J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w', // Example collection 1
      '7KqpRwzkkeweW5jQiYs3DYHPy3qzpx4rQQgpNtkNcW9q', // Example collection 2
      '2rCAFFRvXKXrPBvHpvYbP8NyJKN6VyJmZABDxcARWKfG', // Example collection 3
      '9uBX3ASjxWvNBAD1xjbVaKA74mWGZys3RGSF7DdeDD3F', // Example collection 4
      'A4FM6h8z1eTcnHPZcXr8gJ6NkKEXibzz4wSYNTBXQgEX', // Example collection 5
    ];
    
    // Fetch metadata for each collection
    const collections: Collection[] = await Promise.all(
      collectionMints.map(async (mintAddress, index) => {
        try {
          const metadata = await fetchMetadata(mintAddress, connection);
          
          if (!metadata) {
            // If metadata not found, create a placeholder
            return {
              id: mintAddress,
              name: `Collection ${index + 1}`,
              symbol: `COL${index + 1}`,
              image: `https://via.placeholder.com/150?text=COL${index + 1}`,
              description: `A collection on the Sonic SVM network with ID: ${mintAddress}`,
              floorPrice: Math.random() * 5 + 0.1,
              lendingAPY: Math.random() * 20,
              collateralRequired: Math.floor(Math.random() * 50) + 100, // 100-150%
              availableForLending: Math.floor(Math.random() * 100),
              totalLent: Math.floor(Math.random() * 50),
              totalBorrowed: Math.floor(Math.random() * 30),
              verified: Math.random() > 0.3, // 70% chance of being verified
            };
          }
          
          // Extract data from metadata
          const name = metadata.onChain.data.name || `Collection ${index + 1}`;
          const symbol = metadata.onChain.data.symbol || `COL${index + 1}`;
          const image = metadata.offChain?.image || `https://via.placeholder.com/150?text=${name}`;
          const description = metadata.offChain?.description || `A collection on the Sonic SVM network with ID: ${mintAddress}`;
          
          // Generate random lending stats for now (these would come from your lending protocol in a real implementation)
          const lendingAPY = Math.random() * 20;
          const collateralRequired = Math.floor(Math.random() * 50) + 100; // 100-150%
          const availableForLending = Math.floor(Math.random() * 100);
          const totalLent = Math.floor(Math.random() * 50);
          const totalBorrowed = Math.floor(Math.random() * 30);
          
          return {
            id: mintAddress,
            name,
            symbol,
            image,
            description,
            floorPrice: Math.random() * 5 + 0.1, // Random floor price for now
            lendingAPY,
            collateralRequired,
            availableForLending,
            totalLent,
            totalBorrowed,
            verified: true, // Assume verified for now
          };
        } catch (error) {
          console.error(`Error processing collection ${mintAddress}:`, error);
          
          // Return a placeholder on error
          return {
            id: mintAddress,
            name: `Collection ${index + 1}`,
            symbol: `COL${index + 1}`,
            image: `https://via.placeholder.com/150?text=COL${index + 1}`,
            description: `A collection on the Sonic SVM network with ID: ${mintAddress}`,
            floorPrice: Math.random() * 5 + 0.1,
            lendingAPY: Math.random() * 20,
            collateralRequired: Math.floor(Math.random() * 50) + 100, // 100-150%
            availableForLending: Math.floor(Math.random() * 100),
            totalLent: Math.floor(Math.random() * 50),
            totalBorrowed: Math.floor(Math.random() * 30),
            verified: Math.random() > 0.3, // 70% chance of being verified
          };
        }
      })
    );
    
    return collections;
  } catch (error) {
    console.error('Error fetching collections:', error);
    toast.error('Failed to fetch collections from Sonic SVM');
    
    // Return empty array on error
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
    const connection = new Connection(rpcUrl);
    
    // Fetch metadata for the collection
    const metadata = await fetchMetadata(collectionId, connection);
    
    if (!metadata) {
      // If metadata not found, try to find in the list of collections
      const collections = await fetchAllCollections(isMainnet);
      const collection = collections.find(c => c.id === collectionId);
      
      if (!collection) {
        toast.error('Collection not found');
        return null;
      }
      
      return collection;
    }
    
    // Extract data from metadata
    const name = metadata.onChain.data.name || `Collection ${collectionId.slice(0, 8)}`;
    const symbol = metadata.onChain.data.symbol || `COL${collectionId.slice(0, 4)}`;
    const image = metadata.offChain?.image || `https://via.placeholder.com/150?text=${name}`;
    const description = metadata.offChain?.description || `A collection on the Sonic SVM network with ID: ${collectionId}`;
    
    // Generate random lending stats for now (these would come from your lending protocol in a real implementation)
    const lendingAPY = Math.random() * 20;
    const collateralRequired = Math.floor(Math.random() * 50) + 100; // 100-150%
    const availableForLending = Math.floor(Math.random() * 100);
    const totalLent = Math.floor(Math.random() * 50);
    const totalBorrowed = Math.floor(Math.random() * 30);
    
    return {
      id: collectionId,
      name,
      symbol,
      image,
      description,
      floorPrice: Math.random() * 5 + 0.1, // Random floor price for now
      lendingAPY,
      collateralRequired,
      availableForLending,
      totalLent,
      totalBorrowed,
      verified: true, // Assume verified for now
    };
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
    
    // In a real implementation, you would query for NFTs belonging to this collection
    // For now, we'll create sample NFTs
    const nfts: NFT[] = Array.from({ length: 20 }, (_, i) => {
      const nftId = `${collectionId}-${i+1}`;
      const rarity = Math.random() > 0.8 ? 'Legendary' : Math.random() > 0.5 ? 'Rare' : 'Common';
      const level = Math.floor(Math.random() * 100);
      
      return {
        id: nftId,
        name: `NFT #${i+1}`,
        image: `https://via.placeholder.com/300?text=NFT${i+1}`,
        attributes: [
          { trait_type: 'Rarity', value: rarity },
          { trait_type: 'Level', value: level },
          { trait_type: 'Collection', value: collectionId.slice(0, 8) }
        ],
        owner: `owner${Math.floor(Math.random() * 1000)}`,
        listed: Math.random() > 0.7,
        price: Math.random() * 5 + 0.1,
      };
    });
    
    return nfts;
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
    const connection = new Connection(rpcUrl);
    
    // Get token info for common tokens
    const tokenAddresses = [
      'So11111111111111111111111111111111111111112', // SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
    ];
    
    const tokens = await Promise.all(
      tokenAddresses.map(async (address) => {
        try {
          const tokenInfo = await connection.getTokenSupply(new PublicKey(address));
          return {
            symbol: address === 'So11111111111111111111111111111111111111112' ? 'SOL' : 
                   address === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 'USDC' : 'BONK',
            name: address === 'So11111111111111111111111111111111111111112' ? 'Solana' : 
                 address === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 'USD Coin' : 'Bonk',
            price: address === 'So11111111111111111111111111111111111111112' ? 20.45 : 
                  address === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 1.00 : 0.000012,
            change24h: Math.random() * 10 - 5, // Random change between -5% and 5%
            supply: Number(tokenInfo.value.uiAmount),
            address,
          };
        } catch (e) {
          console.error(`Error fetching token info for ${address}:`, e);
          return {
            symbol: address === 'So11111111111111111111111111111111111111112' ? 'SOL' : 
                   address === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 'USDC' : 'BONK',
            name: address === 'So11111111111111111111111111111111111111112' ? 'Solana' : 
                 address === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 'USD Coin' : 'Bonk',
            price: address === 'So11111111111111111111111111111111111111112' ? 20.45 : 
                  address === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 1.00 : 0.000012,
            change24h: Math.random() * 10 - 5, // Random change between -5% and 5%
            address,
          };
        }
      })
    );
    
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