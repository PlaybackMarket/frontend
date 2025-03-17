import { Program } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { Sonic } from '../sc/types/sonic';

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

export async function getLoanData(
  program: Program<Sonic>,
  loanAddress: PublicKey
): Promise<Loan> {
  try {
    const loanAccount = await program.account.loan.fetch(loanAddress);
    return loanAccount as unknown as Loan;
  } catch (error) {
    console.error('Error fetching loan data:', error);
    throw error;
  }
} 