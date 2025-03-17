import { PublicKey } from '@solana/web3.js';

export interface LendingOffer {
  id: string;
  nftId: string;
  nftName: string;
  nftImage: string;
  collection: string;
  lender: string;
  loanDuration: number;
  interestRate: number;
  collateralRequired: number;
  listedAt: number;
  floorPrice: number;
}

export interface Loan {
  borrower: PublicKey;
  listing: PublicKey;
  start_time: number;
  end_time: number;
  collateral_amount: number;
  is_active: boolean;
  nft_mint: PublicKey;
  lender: PublicKey;
} 