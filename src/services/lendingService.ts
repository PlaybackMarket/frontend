'use client';

import { Connection, PublicKey } from '@solana/web3.js';
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey } from "@metaplex-foundation/umi";
import { toast } from 'react-hot-toast';

export interface LendingOffer {
  id: string;
  nftMint: string;
  lender: string;
  loanDuration: number; // in days
  interestRate: number; // in percentage
  collateralRequired: number; // in SOL
  status: 'active' | 'borrowed' | 'completed' | 'cancelled';
  createdAt: Date;
}

// Sonic SVM RPC URLs
const MAINNET_RPC_URL = process.env.NEXT_PUBLIC_SONIC_MAINNET_RPC || 'https://rpc.mainnet-alpha.sonic.game';
const TESTNET_RPC_URL = process.env.NEXT_PUBLIC_SONIC_TESTNET_RPC || 'https://api.testnet.sonic.game';

/**
 * Check if a wallet owns a specific NFT
 */
export async function checkNFTOwnership(
  nftMint: string,
  walletAddress: string,
  isMainnet: boolean = true
): Promise<boolean> {
  try {
    console.log('Checking ownership for NFT:', nftMint, 'Wallet:', walletAddress);
    const rpcUrl = isMainnet ? MAINNET_RPC_URL : TESTNET_RPC_URL;
    const umi = createUmi(rpcUrl).use(mplTokenMetadata());
    
    // TODO: Implement actual ownership check using Sonic SVM APIs
    // For now, return true for testing
    return true;
  } catch (error) {
    console.error('Error checking NFT ownership:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    toast.error('Failed to verify NFT ownership');
    return false;
  }
}

/**
 * Create a lending offer for an NFT
 */
export async function createLendingOffer(
  nftMint: string,
  lender: string,
  loanDuration: number,
  interestRate: number,
  collateralRequired: number,
  isMainnet: boolean = true
): Promise<string> {
  try {
    console.log('Creating lending offer:', {
      nftMint,
      lender,
      loanDuration,
      interestRate,
      collateralRequired
    });

    // Verify NFT ownership
    const ownsNFT = await checkNFTOwnership(nftMint, lender, isMainnet);
    if (!ownsNFT) {
      throw new Error('You do not own this NFT');
    }

    // TODO: Implement actual lending offer creation using Sonic SVM APIs
    // For now, return a mock offer ID
    const offerId = `${Math.random().toString(36).substring(2)}`;
    
    toast.success('Lending offer created successfully!');
    return offerId;
  } catch (error) {
    console.error('Error creating lending offer:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      toast.error(error.message);
    } else {
      toast.error('Failed to create lending offer');
    }
    throw error;
  }
}

/**
 * Get all lending offers for a specific NFT
 */
export async function getLendingOffers(
  nftMint: string,
  isMainnet: boolean = true
): Promise<LendingOffer[]> {
  try {
    console.log('Fetching lending offers for NFT:', nftMint);
    
    // TODO: Implement actual offer fetching using Sonic SVM APIs
    // For now, return an empty array
    return [];
  } catch (error) {
    console.error('Error fetching lending offers:', error);
    toast.error('Failed to fetch lending offers');
    return [];
  }
}

/**
 * Cancel a lending offer
 */
export async function cancelLendingOffer(
  offerId: string,
  lender: string,
  isMainnet: boolean = true
): Promise<boolean> {
  try {
    console.log('Cancelling lending offer:', offerId);
    
    // TODO: Implement actual offer cancellation using Sonic SVM APIs
    // For now, return success
    toast.success('Lending offer cancelled successfully!');
    return true;
  } catch (error) {
    console.error('Error cancelling lending offer:', error);
    toast.error('Failed to cancel lending offer');
    return false;
  }
}