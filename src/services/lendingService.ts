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
import bs58 from 'bs58';

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

    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    const program = new Program<Sonic>(idl as any, provider);

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
      true
    );

    // Create the transaction
    const transaction = new Transaction();

    // Add instruction to create the listing account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: listingKeypair.publicKey,
        space: 1000,
        lamports: await connection.getMinimumBalanceForRentExemption(1000),
        programId: PROGRAM_ID,
      })
    );

    // Check if the vault NFT account exists, if not create it
    const vaultNftAccountInfo = await connection.getAccountInfo(vaultNftAccount);
    if (!vaultNftAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          vaultNftAccount,
          vaultAuthority,
          nftMint
        )
      );
    }
    const listing = Keypair.generate();
    // Add instruction to list the NFT
    transaction.add(
      await program.methods
        .listNft(
          new BN(loanDuration),
          new BN(interestRate),
          new BN(collateralAmount)
        )
        .accounts({
          lender: wallet.publicKey,
          listing: listing.publicKey,
          nftMint,
          lenderNftAccount,
          vaultNftAccount,
        })
        .signers([listingKeypair])
        .instruction()
    );

    // Sign and send the transaction
    const signature = await wallet.sendTransaction(transaction, connection, {
      signers: [listingKeypair],
    });

    await connection.confirmTransaction(signature);
    return signature;

  } catch (error) {
    console.error('Error listing NFT:', error);
    throw error;
  }
};

/**
 * Cancel a listing
 */
export const cancelListing = async (
  connection: Connection,
  wallet: any,
  listing: PublicKey,
  nftMint: PublicKey
): Promise<string> => {
  try {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    const program = new Program<Sonic>(idl as any, provider);

    const [vaultAuthority] = await getVaultAuthority();
    const lenderNftAccount = await getAssociatedTokenAddress(
      nftMint,
      wallet.publicKey
    );
    const vaultNftAccount = await getAssociatedTokenAddress(
      nftMint,
      vaultAuthority,
      true
    );

    const transaction = new Transaction();
    transaction.add(
      await program.methods
        .cancelListing()
        .accounts({
          lender: wallet.publicKey,
          listing: listing,
          nftMint: nftMint,
          vaultNftAccount: vaultNftAccount,
          lenderNftAccount: lenderNftAccount,
        })
        .instruction()
    );

    const signature = await wallet.sendTransaction(transaction, connection);
    await connection.confirmTransaction(signature);
    return signature;

  } catch (error) {
    console.error('Error canceling listing:', error);
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
  nftMint: PublicKey
): Promise<string> => {
  try {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    const program = new Program<Sonic>(idl as any, provider);

    const loanKeypair = Keypair.generate();
    const [vaultAuthority] = await getVaultAuthority();
    const borrowerNftAccount = await getAssociatedTokenAddress(
      nftMint,
      wallet.publicKey
    );
    const vaultNftAccount = await getAssociatedTokenAddress(
      nftMint,
      vaultAuthority,
      true
    );

    const transaction = new Transaction();

    // Create loan account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: loanKeypair.publicKey,
        space: 1000,
        lamports: await connection.getMinimumBalanceForRentExemption(1000),
        programId: PROGRAM_ID,
      })
    );

    // Create borrower's NFT account if it doesn't exist
    const borrowerNftAccountInfo = await connection.getAccountInfo(borrowerNftAccount);
    if (!borrowerNftAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          borrowerNftAccount,
          wallet.publicKey,
          nftMint
        )
      );
    }

    transaction.add(
      await program.methods
        .borrowNft()
        .accounts({
          borrower: wallet.publicKey,
          listing: listing,
          loan: loanKeypair.publicKey,
          borrowerNftAccount: borrowerNftAccount,
          vaultNftAccount: vaultNftAccount,
          nftMint: nftMint,
        })
        .signers([loanKeypair])
        .instruction()
    );

    const signature = await wallet.sendTransaction(transaction, connection, {
      signers: [loanKeypair],
    });

    await connection.confirmTransaction(signature);
    return signature;

  } catch (error) {
    console.error('Error borrowing NFT:', error);
    throw error;
  }
};

/**
 * Repay a loan
 */
export const repayLoan = async (
  connection: Connection,
  wallet: any,
  loan: any,
  listing: PublicKey,
  nftMint: PublicKey,
  lender: PublicKey
): Promise<string> => {
  try {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    const program = new Program<Sonic>(idl as any,  provider);

    const [vaultAuthority] = await getVaultAuthority();
    const borrowerNftAccount = await getAssociatedTokenAddress(
      nftMint,
      wallet.publicKey
    );
    const vaultNftAccount = await getAssociatedTokenAddress(
      nftMint,
      vaultAuthority,
      true
    );
    const lenderNftAccount = await getAssociatedTokenAddress(
      nftMint,
      lender
    );

    const transaction = new Transaction();

    // Create lender's NFT account if it doesn't exist
    const lenderNftAccountInfo = await connection.getAccountInfo(lenderNftAccount);
    if (!lenderNftAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          lenderNftAccount,
          lender,
          nftMint
        )
      );
    }

    transaction.add(
      await program.methods
        .repayLoan()
        .accounts({
          borrower: wallet.publicKey,
          lender: loan.listing.lender,
          loan: loan.publicKey,
          listing: loan.account.listing,
          nftMint: loan.listing.nftMint,
          borrowerNftAccount,
          vaultNftAccount,
          lenderNftAccount,
        })
        .instruction()
    );

    const signature = await wallet.sendTransaction(transaction, connection);
    await connection.confirmTransaction(signature);
    return signature;

  } catch (error) {
    console.error('Error repaying loan:', error);
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
  lender: PublicKey
): Promise<string> => {
  try {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    const program = new Program<Sonic>(idl as any, provider);

    const [vaultAuthority] = await getVaultAuthority();

    const transaction = new Transaction();

    transaction.add(
      await program.methods
        .liquidateLoan()
        .accounts({
          liquidator: wallet.publicKey,
          lender: lender,
          loan: loan,
          listing: listing,
        })
        .instruction()
    );

    const signature = await wallet.sendTransaction(transaction, connection);
    await connection.confirmTransaction(signature);
    return signature;

  } catch (error) {
    console.error('Error liquidating loan:', error);
    throw error;
  }
};

/**
 * Fetch all active listings
 */
export const fetchActiveListings = async (
  connection: Connection,
  program: Program<Sonic>
): Promise<any[]> => {
  try {
    const listings = await program.account.nftListing.all([
      {
        memcmp: {
          offset:
            8 + // discriminator
            32 + // lender pubkey
            32 + // nft_mint
            8 + // loan_duration
            8 + // interest_rate
            8, // collateral_amount
          bytes: bs58.encode(Buffer.from([1])), // is_active = true
        },
      },
    ]);
    return listings;
  } catch (error) {
    console.error('Error fetching active listings:', error);
    return [];
  }
};

/**
 * Fetch user's active loans
 */
export const fetchUserLoans = async (
  program: Program<Sonic>,
  walletPublicKey: PublicKey
): Promise<any[]> => {
  try {
    const loans = await program.account.loan.all([
      {
        memcmp: {
          offset: 8, // discriminator
          bytes: walletPublicKey.toBase58(), // borrower
        },
      },
      {
        memcmp: {
          offset:
            8 + // discriminator
            32 + // borrower
            32 + // listing
            8 + // start_time
            8 + // end_time
            8 + // collateral_amount
            8, // interest_rate
          bytes: bs58.encode(Buffer.from([1])), // is_active = true
        },
      },
    ]);
    return loans;
  } catch (error) {
    console.error('Error fetching user loans:', error);
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