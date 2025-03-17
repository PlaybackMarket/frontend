import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  Keypair,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import { 
  Program, 
  AnchorProvider, 
  BN 
} from '@coral-xyz/anchor';
import { 
  ASSOCIATED_TOKEN_PROGRAM_ID, 
  TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction 
} from '@solana/spl-token';
import idl from '@/sc/sonic.json';
import type { Sonic } from '@/sc/types/sonic';
import toast from 'react-hot-toast';

// Program ID from the IDL
const PROGRAM_ID = new PublicKey(idl.address);

// PDA seed for vault authority
const VAULT_AUTHORITY_SEED = Buffer.from('vault_authority');

/**
 * Get the vault authority PDA
 */
export const getVaultAuthority = async (): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddressSync(
    [VAULT_AUTHORITY_SEED],
    PROGRAM_ID
  );
};

/**
 * List an NFT for lending
 */
export const listNFT = async (
  connection: Connection,
  wallet: any,
  nftMint: PublicKey,
  loanDuration: number,
  interestRate: number,
  collateralAmount: number
): Promise<string> => {
  try {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    // Create a new keypair for the listing account
    const listingKeypair = Keypair.generate();

    // Get the lender's NFT token account
    const lenderNftAccount = await getAssociatedTokenAddress(
      nftMint,
      wallet.publicKey
    );

    // Get the vault authority PDA
    const [vaultAuthority] = await getVaultAuthority();

    // Get the vault NFT token account
    const vaultNftAccount = await getAssociatedTokenAddress(
      nftMint,
      vaultAuthority,
      true // allowOwnerOffCurve
    );

    // Create the transaction
    const transaction = new Transaction();

    // Add instruction to create the listing account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: listingKeypair.publicKey,
        space: 1000, // Enough space for the listing data
        lamports: await connection.getMinimumBalanceForRentExemption(1000),
        programId: PROGRAM_ID,
      })
    );

    // Check if the vault NFT account exists, if not create it
    const vaultNftAccountInfo = await connection.getAccountInfo(vaultNftAccount);
    if (!vaultNftAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey, // payer
          vaultNftAccount, // associated token account
          vaultAuthority, // owner
          nftMint // mint
        )
      );
    }

    // Add instruction to list the NFT
    transaction.add(
      Program.programId(PROGRAM_ID).instruction.listNft(
        new BN(loanDuration * 24 * 60 * 60), // Convert days to seconds
        new BN(interestRate * 100), // Convert percentage to basis points
        new BN(collateralAmount * 1e9), // Convert SOL to lamports
        {
          accounts: {
            lender: wallet.publicKey,
            listing: listingKeypair.publicKey,
            nftMint: nftMint,
            lenderNftAccount: lenderNftAccount,
            vaultNftAccount: vaultNftAccount,
            vaultAuthority: vaultAuthority,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
          signers: [listingKeypair],
        }
      )
    );

    // Sign and send the transaction
    const signature = await wallet.sendTransaction(transaction, connection, {
      signers: [listingKeypair],
    });

    // Confirm the transaction
    await connection.confirmTransaction(signature);

    toast.success('NFT listed successfully!');
    return signature;
  } catch (error) {
    console.error('Error listing NFT:', error);
    toast.error('Failed to list NFT. Please try again.');
    throw error;
  }
};

/**
 * Borrow an NFT
 */
export const borrowNFT = async (
  connection: Connection,
  wallet: any,
  listing: PublicKey,
  nftMint: PublicKey,
  collateralMint: PublicKey
): Promise<string> => {
  try {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    // Create a new keypair for the loan account
    const loanKeypair = Keypair.generate();

    // Get the vault authority PDA
    const [vaultAuthority] = await getVaultAuthority();

    // Get the borrower's NFT token account
    const borrowerNftAccount = await getAssociatedTokenAddress(
      nftMint,
      wallet.publicKey
    );

    // Get the vault NFT token account
    const vaultNftAccount = await getAssociatedTokenAddress(
      nftMint,
      vaultAuthority,
      true // allowOwnerOffCurve
    );

    // Get the borrower's collateral token account
    const borrowerCollateralAccount = await getAssociatedTokenAddress(
      collateralMint,
      wallet.publicKey
    );

    // Get the vault collateral token account
    const vaultCollateralAccount = await getAssociatedTokenAddress(
      collateralMint,
      vaultAuthority,
      true // allowOwnerOffCurve
    );

    // Create the transaction
    const transaction = new Transaction();

    // Add instruction to create the loan account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: loanKeypair.publicKey,
        space: 1000, // Enough space for the loan data
        lamports: await connection.getMinimumBalanceForRentExemption(1000),
        programId: PROGRAM_ID,
      })
    );

    // Check if the borrower's NFT account exists, if not create it
    const borrowerNftAccountInfo = await connection.getAccountInfo(borrowerNftAccount);
    if (!borrowerNftAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey, // payer
          borrowerNftAccount, // associated token account
          wallet.publicKey, // owner
          nftMint // mint
        )
      );
    }

    // Check if the vault collateral account exists, if not create it
    const vaultCollateralAccountInfo = await connection.getAccountInfo(vaultCollateralAccount);
    if (!vaultCollateralAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey, // payer
          vaultCollateralAccount, // associated token account
          vaultAuthority, // owner
          collateralMint // mint
        )
      );
    }

    // Add instruction to borrow the NFT
    transaction.add(
      Program.programId(PROGRAM_ID).instruction.borrowNft({
        accounts: {
          borrower: wallet.publicKey,
          listing: listing,
          loan: loanKeypair.publicKey,
          collateralMint: collateralMint,
          borrowerCollateralAccount: borrowerCollateralAccount,
          vaultCollateralAccount: vaultCollateralAccount,
          borrowerNftAccount: borrowerNftAccount,
          vaultNftAccount: vaultNftAccount,
          vaultAuthority: vaultAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          nftMint: nftMint,
        },
        signers: [loanKeypair],
      })
    );

    // Sign and send the transaction
    const signature = await wallet.sendTransaction(transaction, connection, {
      signers: [loanKeypair],
    });

    // Confirm the transaction
    await connection.confirmTransaction(signature);

    toast.success('NFT borrowed successfully!');
    return signature;
  } catch (error) {
    console.error('Error borrowing NFT:', error);
    toast.error('Failed to borrow NFT. Please try again.');
    throw error;
  }
};

/**
 * Repay a loan
 */
export const repayLoan = async (
  connection: Connection,
  wallet: any,
  loan: PublicKey,
  listing: PublicKey,
  nftMint: PublicKey,
  collateralMint: PublicKey,
  lender: PublicKey
): Promise<string> => {
  try {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    // Get the vault authority PDA
    const [vaultAuthority] = await getVaultAuthority();

    // Get the borrower's NFT token account
    const borrowerNftAccount = await getAssociatedTokenAddress(
      nftMint,
      wallet.publicKey
    );

    // Get the vault NFT token account
    const vaultNftAccount = await getAssociatedTokenAddress(
      nftMint,
      vaultAuthority,
      true // allowOwnerOffCurve
    );

    // Get the lender's NFT token account
    const lenderNftAccount = await getAssociatedTokenAddress(
      nftMint,
      lender
    );

    // Get the borrower's collateral token account
    const borrowerCollateralAccount = await getAssociatedTokenAddress(
      collateralMint,
      wallet.publicKey
    );

    // Get the vault collateral token account
    const vaultCollateralAccount = await getAssociatedTokenAddress(
      collateralMint,
      vaultAuthority,
      true // allowOwnerOffCurve
    );

    // Get the lender's collateral token account
    const lenderCollateralAccount = await getAssociatedTokenAddress(
      collateralMint,
      lender
    );

    // Create the transaction
    const transaction = new Transaction();

    // Check if the lender's NFT account exists, if not create it
    const lenderNftAccountInfo = await connection.getAccountInfo(lenderNftAccount);
    if (!lenderNftAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey, // payer
          lenderNftAccount, // associated token account
          lender, // owner
          nftMint // mint
        )
      );
    }

    // Check if the lender's collateral account exists, if not create it
    const lenderCollateralAccountInfo = await connection.getAccountInfo(lenderCollateralAccount);
    if (!lenderCollateralAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey, // payer
          lenderCollateralAccount, // associated token account
          lender, // owner
          collateralMint // mint
        )
      );
    }

    // Add instruction to repay the loan
    transaction.add(
      Program.programId(PROGRAM_ID).instruction.repayLoan({
        accounts: {
          borrower: wallet.publicKey,
          loan: loan,
          listing: listing,
          collateralMint: collateralMint,
          borrowerCollateralAccount: borrowerCollateralAccount,
          vaultCollateralAccount: vaultCollateralAccount,
          lenderCollateralAccount: lenderCollateralAccount,
          borrowerNftAccount: borrowerNftAccount,
          vaultNftAccount: vaultNftAccount,
          lenderNftAccount: lenderNftAccount,
          vaultAuthority: vaultAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
          nftMint: nftMint,
        },
      })
    );

    // Sign and send the transaction
    const signature = await wallet.sendTransaction(transaction, connection);

    // Confirm the transaction
    await connection.confirmTransaction(signature);

    toast.success('Loan repaid successfully!');
    return signature;
  } catch (error) {
    console.error('Error repaying loan:', error);
    toast.error('Failed to repay loan. Please try again.');
    throw error;
  }
};

/**
 * Liquidate a loan
 */
export const liquidateLoan = async (
  connection: Connection,
  wallet: any,
  loan: PublicKey,
  listing: PublicKey,
  collateralMint: PublicKey,
  lender: PublicKey
): Promise<string> => {
  try {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    // Get the vault authority PDA
    const [vaultAuthority] = await getVaultAuthority();

    // Get the vault collateral token account
    const vaultCollateralAccount = await getAssociatedTokenAddress(
      collateralMint,
      vaultAuthority,
      true // allowOwnerOffCurve
    );

    // Get the lender's collateral token account
    const lenderCollateralAccount = await getAssociatedTokenAddress(
      collateralMint,
      lender
    );

    // Create the transaction
    const transaction = new Transaction();

    // Check if the lender's collateral account exists, if not create it
    const lenderCollateralAccountInfo = await connection.getAccountInfo(lenderCollateralAccount);
    if (!lenderCollateralAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey, // payer
          lenderCollateralAccount, // associated token account
          lender, // owner
          collateralMint // mint
        )
      );
    }

    // Add instruction to liquidate the loan
    transaction.add(
      Program.programId(PROGRAM_ID).instruction.liquidateLoan({
        accounts: {
          liquidator: wallet.publicKey,
          loan: loan,
          listing: listing,
          collateralMint: collateralMint,
          vaultCollateralAccount: vaultCollateralAccount,
          lenderCollateralAccount: lenderCollateralAccount,
          vaultAuthority: vaultAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      })
    );

    // Sign and send the transaction
    const signature = await wallet.sendTransaction(transaction, connection);

    // Confirm the transaction
    await connection.confirmTransaction(signature);

    toast.success('Loan liquidated successfully!');
    return signature;
  } catch (error) {
    console.error('Error liquidating loan:', error);
    toast.error('Failed to liquidate loan. Please try again.');
    throw error;
  }
};

/**
 * Fetch all active listings
 */
export const fetchActiveListings = async (
  connection: Connection
): Promise<any[]> => {
  try {
    // This is a placeholder - in a real implementation, you would query the program
    // for all accounts of type NFTListing and filter for active ones
    // For now, we'll return mock data
    return [];
  } catch (error) {
    console.error('Error fetching active listings:', error);
    toast.error('Failed to fetch active listings.');
    return [];
  }
};

/**
 * Fetch user's active loans
 */
export const fetchUserLoans = async (
  connection: Connection,
  walletPublicKey: PublicKey
): Promise<any[]> => {
  try {
    // This is a placeholder - in a real implementation, you would query the program
    // for all accounts of type Loan where borrower is the wallet public key
    // For now, we'll return mock data
    return [];
  } catch (error) {
    console.error('Error fetching user loans:', error);
    toast.error('Failed to fetch your loans.');
    return [];
  }
};

/**
 * Fetch user's active listings
 */
export const fetchUserListings = async (
  connection: Connection,
  walletPublicKey: PublicKey
): Promise<any[]> => {
  try {
    // This is a placeholder - in a real implementation, you would query the program
    // for all accounts of type NFTListing where lender is the wallet public key
    // For now, we'll return mock data
    return [];
  } catch (error) {
    console.error('Error fetching user listings:', error);
    toast.error('Failed to fetch your listings.');
    return [];
  }
}; 