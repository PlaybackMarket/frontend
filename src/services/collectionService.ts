import { Connection, PublicKey } from '@solana/web3.js';
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fetchDigitalAsset, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey, createSignerFromKeypair, generateSigner, signerIdentity } from "@metaplex-foundation/umi";
import { toast } from 'react-hot-toast';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { clusterApiUrl } from '@solana/web3.js';

// Define the collection interface
export interface Collection {
  id: string;
  name: string;
  symbol: string;
  image?: string;
  logo?: string;
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

// Add interface for NFTListing from smart contract
export interface NFTListing {
  lender: PublicKey;
  nftMint: PublicKey;
  loanDuration: number;
  interestRate: number;
  collateralAmount: number;
  isActive: boolean;
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
          // Get lending stats for the collection (to be implemented with Sonic SVM APIs)
          const lendingStats = {
            floorPrice: 1.5, // Example value
            lendingAPY: 12.5, // Example value
            collateralRequired: 100,
            availableForLending: 10,
            totalLent: 5,
            totalBorrowed: 3,
          };

          const collection: Collection = {
            id: mintAddress,
            name: metadata.onChain.name || 'Unknown Collection',
            symbol: metadata.onChain.symbol || '',
            logo: metadata.offChain?.image,
            image: metadata.offChain?.image,
            description: metadata.offChain?.description,
            ...lendingStats,
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
    const metadata = await fetchMetadata(collectionId, rpcUrl);
    
    if (!metadata) {
      toast.error('Collection not found on Sonic SVM');
      return [];
    }

    // For now, return example NFTs based on the collection metadata
    const nfts: NFT[] = [];
    const numNFTs = 10; // Example: 10 NFTs per collection

    for (let i = 0; i < numNFTs; i++) {
      const nft: NFT = {
        id: `${collectionId}-${i + 1}`,
        name: `${metadata.onChain.name} #${i + 1}`,
        image: metadata.offChain?.image || '',
        attributes: [
          { trait_type: 'Power', value: Math.floor(Math.random() * 100) },
          { trait_type: 'Level', value: Math.floor(Math.random() * 10) + 1 },
        ],
        owner: `${Math.random().toString(36).substring(2, 8)}...${Math.random().toString(36).substring(2, 8)}`,
        listed: Math.random() > 0.5,
        price: Math.random() * 2 + 0.1, // Random price between 0.1 and 2.1
      };
      nfts.push(nft);
    }

    return nfts;
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
    
    // Get token info for common tokens on Sonic SVM
    const tokenAddresses = [
      // TODO: Replace with actual Sonic SVM token addresses
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Example address
    ];
    
    const tokensPromises = tokenAddresses.map(async (address) => {
      try {
        const tokenInfo = await connection.getTokenSupply(new PublicKey(address));
        return {
          symbol: 'SONIC', // TODO: Get actual token symbol
          name: 'Sonic Token', // TODO: Get actual token name
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
      toast.error('No tokens found on Sonic SVM');
      return [];
    }
    
    return tokens;
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
 * Fetch active NFT listings from the smart contract
 * @param collectionId Optional collection ID to filter listings
 * @param isMainnet Whether to fetch from mainnet or testnet
 * @returns Array of active lending offers
 */
// export async function fetchActiveListings(
//   collectionId?: string,
//   isMainnet: boolean = true
// ): Promise<LendingOffer[]> {
//   try {
//     const rpcUrl = isMainnet ? MAINNET_RPC_URL : TESTNET_RPC_URL;
//     const connection = new Connection(rpcUrl);

//     // Initialize Anchor provider and program
//     const provider = new AnchorProvider(
//       connection,
//       // Use a dummy wallet since we're only reading data
//       {
//         publicKey: PublicKey.default,
//         signTransaction: async () => { throw new Error('Not implemented'); },
//         signAllTransactions: async () => { throw new Error('Not implemented'); },
//       },
//       { commitment: 'confirmed' }
//     );

//     const program = new Program(idl as any, new PublicKey(idl.address), provider);

//     // Fetch all NFT listings from the program
//     const listings = await program.account.nftListing.all();

//     // Filter active listings
//     const activeListings = listings.filter(
//       (listing) => listing.account.isActive
//     );

//     // Convert listings to LendingOffers
//     const offers = await Promise.all(
//       activeListings.map(async (listing) => {
//         const nftMint = listing.account.nftMint.toString();
        
//         // If collectionId is provided, filter listings for that collection
//         if (collectionId && !nftMint.startsWith(collectionId)) {
//           return null;
//         }

//         // Fetch NFT metadata
//         const metadata = await fetchMetadata(nftMint, rpcUrl);
//         if (!metadata) return null;

//         return {
//           id: listing.publicKey.toString(),
//           nftId: nftMint,
//           nftName: metadata.onChain.name,
//           nftImage: metadata.offChain?.image || `https://via.placeholder.com/150?text=${metadata.onChain.name}`,
//           collection: metadata.onChain.symbol,
//           lender: listing.account.lender.toString(),
//           loanDuration: listing.account.loanDuration / (24 * 60 * 60), // Convert seconds to days
//           interestRate: listing.account.interestRate / 100, // Convert basis points to percentage
//           collateralRequired: listing.account.collateralAmount / 1e9, // Convert lamports to SOL
//           listedAt: Math.floor(Date.now() / 1000), // Current timestamp as listing time
//           floorPrice: 0, // This should be updated with actual floor price
//         };
//       })
//     );

//     // Filter out null values
//     return offers.filter((offer): offer is LendingOffer => offer !== null);
//   } catch (error) {
//     console.error('Error fetching active listings:', error);
//     toast.error('Failed to fetch active listings');
//     return [];
//   }
// } 