"use client";

import { FC, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";

import {
  Program,
  Idl,
  AnchorProvider,
  setProvider,
  type Provider,
  BN,
} from "@coral-xyz/anchor";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import toast from "react-hot-toast";
import { useConnection } from "@solana/wallet-adapter-react";
import idl from "@/sc/sonic.json";

import type { Sonic } from "@/sc/types/sonic";
import { Transaction } from "@solana/web3.js";
import bs58 from "bs58";

// Import your IDL and set up program ID
const PROGRAM_ID = new PublicKey(
  "BEF3CqKU1Db7FsqHyuugE7xd6YCz7gD3jMi2wA1yeD4x"
);
const VAULT_AUTHORITY_SEED = "vault_authority";

const BorrowNFT: FC = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<any[]>([]);

  const provider = new AnchorProvider(
    connection,
    wallet as any,
    AnchorProvider.defaultOptions()
  );
  const program = new Program<Sonic>(idl, provider as unknown as Provider);

  // Fetch active listings when component mounts
  useEffect(() => {
    fetchListings();
  }, [connection, program]);

  const fetchListings = async () => {
    if (!program) return;

    try {
      // Get all NFTListing accounts
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

      setListings(listings);
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast.error("Failed to fetch listings");
    }
  };

  const handleBorrow = async (listing: any) => {
    if (!wallet.publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    const toastId = toast.loading("Borrowing NFT...");
    setLoading(true);

    try {
      const [vault_authority] = PublicKey.findProgramAddressSync(
        [Buffer.from(VAULT_AUTHORITY_SEED)],
        program.programId
      );

      const loan = Keypair.generate();
      const borrowerNftAccount = await getAssociatedTokenAddress(
        listing.account.nftMint,
        wallet.publicKey
      );
      const vaultNftAccount = await getAssociatedTokenAddress(
        listing.account.nftMint,
        vault_authority,
        true
      );

      // Create borrower's NFT ATA if it doesn't exist
      const borrowerNftAccountInfo = await connection.getAccountInfo(
        borrowerNftAccount
      );
      if (!borrowerNftAccountInfo) {
        const createAtaIx = createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          borrowerNftAccount,
          wallet.publicKey,
          listing.account.nftMint
        );
        const tx = new Transaction().add(createAtaIx);
        await provider.sendAndConfirm(tx);
      }

      await program.methods
        .borrowNft()
        .accounts({
          borrower: wallet.publicKey,
          listing: listing.publicKey,
          loan: loan.publicKey,
          borrowerNftAccount,
          vaultNftAccount,
          vault_authority: vault_authority,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          nftMint: listing.account.nftMint,
        })
        .signers([loan])
        .rpc();

      toast.success("Successfully borrowed NFT!", { id: toastId });
      // Refresh listings after successful borrow
      fetchListings();
    } catch (error) {
      console.error("Error borrowing NFT:", error);
      toast.error(`Failed to borrow NFT: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);

    if (days > 0) return `${days} days`;
    if (hours > 0) return `${hours} hours`;
    return `${minutes} minutes`;
  };

  const formatCollateral = (lamports: number) => {
    return `${(lamports / 1e9).toFixed(2)} SOL`;
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl mb-4">Available NFT Loans</h2>
      <div className="space-y-4">
        {listings.map((listing, index) => (
          <div key={index} className="p-4 border rounded bg-gray-800">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-400">Lender</p>
                <p className="font-mono text-sm">
                  {listing.account.lender.toString().slice(0, 16)}...
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Required Collateral</p>
                <p className="font-bold text-green-400">
                  {formatCollateral(listing.account.collateralAmount)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-400">Duration</p>
                <p>{formatDuration(listing.account.loanDuration)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Interest Rate</p>
                <p>{listing.account.interestRate.toString()}%</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-400">NFT Mint</p>
              <p className="font-mono text-sm break-all">
                {listing.account.nftMint.toString()}
              </p>
            </div>

            <button
              onClick={() => handleBorrow(listing)}
              disabled={
                loading || listing.account.lender.equals(wallet.publicKey)
              }
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Processing..."
                : listing.account.lender.equals(wallet.publicKey)
                ? "Can't borrow your own listing"
                : "Borrow NFT"}
            </button>
          </div>
        ))}
        {listings.length === 0 && (
          <p className="text-gray-400 text-center py-8">
            No active listings available
          </p>
        )}
      </div>
    </div>
  );
};

const CancelListing: FC = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const provider = new AnchorProvider(
    connection,
    wallet as any,
    AnchorProvider.defaultOptions()
  );
  const program = new Program<Sonic>(idl, provider as unknown as Provider);

  // Fetch active listings when component mounts
  useEffect(() => {
    fetchListings();
  }, [connection, program]);

  const fetchListings = async () => {
    if (!program) return;

    try {
      // Get all NFTListing accounts
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

      // Fetch additional NFT metadata for each listing
      const enrichedListings = await Promise.all(
        listings.map(async (listing) => {
          try {
            const metadata = await connection.getTokenAccountsByOwner(
              listing.account.lender,
              { mint: listing.account.nftMint }
            );
            return {
              ...listing,
              metadata,
            };
          } catch (error) {
            console.error("Error fetching metadata:", error);
            return listing;
          }
        })
      );

      setListings(enrichedListings);
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast.error("Failed to fetch listings");
    }
  };

  const handleCancel = async (listing: any) => {
    if (!wallet.publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    const toastId = toast.loading("Canceling listing...");
    setLoading(true);

    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        AnchorProvider.defaultOptions()
      );
      setProvider(provider);
      const program = new Program<Sonic>(idl, provider as unknown as Provider);

      const [vault_authority] = PublicKey.findProgramAddressSync(
        [Buffer.from(VAULT_AUTHORITY_SEED)],
        program.programId
      );

      const lenderNftAccount = await getAssociatedTokenAddress(
        listing.account.nftMint,
        wallet.publicKey
      );
      const vaultNftAccount = await getAssociatedTokenAddress(
        listing.account.nftMint,
        vault_authority,
        true
      );

      await program.methods
        .cancelListing()
        .accounts({
          lender: wallet.publicKey,
          listing: listing.publicKey,
          nftMint: listing.account.nftMint,
          vaultNftAccount,
          lenderNftAccount,
          vault_authority: vault_authority,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      toast.success("Successfully canceled listing!", { id: toastId });
      // Refresh listings after cancellation
      fetchListings();
    } catch (error) {
      console.error("Error canceling listing:", error);
      toast.error(`Failed to cancel listing: ${error.message}`, {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl mb-4">Active Listings</h2>
      <div className="space-y-4">
        {listings.map((listing, index) => (
          <div key={index} className="p-4 border rounded">
            <p>Lender: {listing.account.lender.toString()}</p>
            <p>NFT Mint: {listing.account.nftMint.toString()}</p>
            <p>
              Loan Duration: {listing.account.loanDuration.toString()} seconds
            </p>
            <p>Interest Rate: {listing.account.interestRate.toString()}%</p>
            <p>
              Collateral: {listing.account.collateralAmount.toString()} lamports
            </p>
            {listing.account.lender.equals(wallet.publicKey) && (
              <button
                onClick={() => handleCancel(listing)}
                disabled={loading}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-2 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Cancel Listing"}
              </button>
            )}
          </div>
        ))}
        {listings.length === 0 && (
          <p className="text-gray-400">No active listings found</p>
        )}
      </div>
    </div>
  );
};

const ListNFT: FC = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [nftMint, setNftMint] = useState("");
  const [loanDuration, setLoanDuration] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nftMintPubkey = new PublicKey(nftMint);
      await handleList(
        nftMintPubkey,
        parseInt(loanDuration),
        parseInt(interestRate),
        parseInt(collateralAmount)
      );
    } catch (error) {
      console.error("Invalid input:", error);
    }
  };

  const handleList = async (
    nftMint: PublicKey,
    loanDuration: number,
    interestRate: number,
    collateralAmount: number
  ) => {
    if (!wallet.publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    const toastId = toast.loading("Listing NFT...");
    setLoading(true);

    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        AnchorProvider.defaultOptions()
      );
      setProvider(provider);
      const program = new Program<Sonic>(idl, provider as unknown as Provider);

      const [vault_authority] = PublicKey.findProgramAddressSync(
        [Buffer.from(VAULT_AUTHORITY_SEED)],
        program.programId
      );

      const lenderNftAccount = await getAssociatedTokenAddress(
        nftMint,
        wallet.publicKey
      );
      const vaultNftAccount = await getAssociatedTokenAddress(
        nftMint,
        vault_authority,
        true
      );

      // Create a new keypair for the listing account
      const listing = Keypair.generate();

      // Create the vault_nft_account if it doesn't exist
      const vaultNftAccountInfo = await connection.getAccountInfo(
        vaultNftAccount
      );
      if (!vaultNftAccountInfo) {
        const createAtaIx = createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          vaultNftAccount,
          vault_authority,
          nftMint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        const tx = new Transaction().add(createAtaIx);
        await provider.sendAndConfirm(tx);
      }

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
          vaultAuthority: vault_authority,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([listing])
        .rpc();

      toast.success("Successfully listed NFT!", { id: toastId });
    } catch (error) {
      console.error("Error listing NFT:", error);
      toast.error(`Failed to list NFT: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl mb-4">List NFT</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="NFT Mint Address"
          value={nftMint}
          onChange={(e) => setNftMint(e.target.value)}
          className="w-full p-2 rounded text-white"
        />
        <input
          type="number"
          placeholder="Loan Duration (seconds)"
          value={loanDuration}
          onChange={(e) => setLoanDuration(e.target.value)}
          className="w-full p-2 rounded text-white"
        />
        <input
          type="number"
          placeholder="Interest Rate"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
          className="w-full p-2 rounded text-white"
        />
        <input
          type="number"
          placeholder="Collateral Amount (lamports)"
          value={collateralAmount}
          onChange={(e) => setCollateralAmount(e.target.value)}
          className="w-full p-2 rounded text-white"
        />
        <button
          type="submit"
          disabled={
            loading ||
            !nftMint ||
            !loanDuration ||
            !interestRate ||
            !collateralAmount
          }
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? "Processing..." : "List NFT"}
        </button>
      </form>
    </div>
  );
};

const LiquidateLoan: FC = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [loanAddress, setLoanAddress] = useState("");
  const [listingAddress, setListingAddress] = useState("");
  const [lenderAddress, setLenderAddress] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const loanPubkey = new PublicKey(loanAddress);
      const listingPubkey = new PublicKey(listingAddress);
      const lenderPubkey = new PublicKey(lenderAddress);
      await handleLiquidate(loanPubkey, listingPubkey, lenderPubkey);
    } catch (error) {
      console.error("Invalid public key:", error);
    }
  };

  const handleLiquidate = async (
    loanAddress: PublicKey,
    listingAddress: PublicKey,
    lenderAddress: PublicKey
  ) => {
    if (!wallet.publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    const toastId = toast.loading("Liquidating loan...");
    setLoading(true);

    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        AnchorProvider.defaultOptions()
      );
      setProvider(provider);
      const program = new Program<Sonic>(idl, provider as unknown as Provider);

      const [vault_authority] = PublicKey.findProgramAddressSync(
        [Buffer.from(VAULT_AUTHORITY_SEED)],
        program.programId
      );

      await program.methods
        .liquidateLoan()
        .accounts({
          liquidator: wallet.publicKey,
          lender: lenderAddress,
          loan: loanAddress,
          listing: listingAddress,

          vault_authority: vault_authority,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("Successfully liquidated loan!", { id: toastId });
    } catch (error) {
      console.error("Error liquidating loan:", error);
      toast.error(`Failed to liquidate loan: ${error.message}`, {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl mb-4">Liquidate Loan</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Loan Address"
          value={loanAddress}
          onChange={(e) => setLoanAddress(e.target.value)}
          className="w-full p-2 rounded text-white mb-2"
        />
        <input
          type="text"
          placeholder="Listing Address"
          value={listingAddress}
          onChange={(e) => setListingAddress(e.target.value)}
          className="w-full p-2 rounded text-white mb-2"
        />
        <input
          type="text"
          placeholder="Lender Address"
          value={lenderAddress}
          onChange={(e) => setLenderAddress(e.target.value)}
          className="w-full p-2 rounded text-white mb-2"
        />
        <button
          type="submit"
          disabled={
            loading || !loanAddress || !listingAddress || !lenderAddress
          }
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? "Processing..." : "Liquidate Loan"}
        </button>
      </form>
    </div>
  );
};

const RepayLoan: FC = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [loanAddress, setLoanAddress] = useState("");
  const [listingAddress, setListingAddress] = useState("");
  const [lenderAddress, setLenderAddress] = useState("");
  const [nftMint, setNftMint] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const loanPubkey = new PublicKey(loanAddress);
      const listingPubkey = new PublicKey(listingAddress);
      const lenderPubkey = new PublicKey(lenderAddress);
      const nftMintPubkey = new PublicKey(nftMint);
      await handleRepay(loanPubkey, listingPubkey, lenderPubkey, nftMintPubkey);
    } catch (error) {
      console.error("Invalid public key:", error);
    }
  };

  const handleRepay = async (
    loanAddress: PublicKey,
    listingAddress: PublicKey,
    lenderAddress: PublicKey,
    nftMint: PublicKey
  ) => {
    if (!wallet.publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    const toastId = toast.loading("Repaying loan...");
    setLoading(true);

    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        AnchorProvider.defaultOptions()
      );
      setProvider(provider);
      const program = new Program<Sonic>(idl, provider as unknown as Provider);

      const [vault_authority] = PublicKey.findProgramAddressSync(
        [Buffer.from(VAULT_AUTHORITY_SEED)],
        program.programId
      );

      const borrowerNftAccount = await getAssociatedTokenAddress(
        nftMint,
        wallet.publicKey
      );
      const vaultNftAccount = await getAssociatedTokenAddress(
        nftMint,
        vault_authority,
        true
      );
      const lenderNftAccount = await getAssociatedTokenAddress(
        nftMint,
        lenderAddress
      );

      await program.methods
        .repayLoan()
        .accounts({
          borrower: wallet.publicKey,
          lender: lenderAddress,
          loan: loanAddress,
          listing: listingAddress,
          nftMint,
          borrowerNftAccount,
          vaultNftAccount,
          lenderNftAccount,
          vault_authority: vault_authority,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("Successfully repaid loan!", { id: toastId });
    } catch (error) {
      console.error("Error repaying loan:", error);
      toast.error(`Failed to repay loan: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded text-white">
      <h2 className="text-xl mb-4">Repay Loan</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Loan Address"
          value={loanAddress}
          onChange={(e) => setLoanAddress(e.target.value)}
          className="w-full p-2 rounded text-white mb-2"
        />
        <input
          type="text"
          placeholder="Listing Address"
          value={listingAddress}
          onChange={(e) => setListingAddress(e.target.value)}
          className="w-full p-2 rounded text-white mb-2"
        />
        <input
          type="text"
          placeholder="Lender Address"
          value={lenderAddress}
          onChange={(e) => setLenderAddress(e.target.value)}
          className="w-full p-2 rounded text-white mb-2"
        />
        <input
          type="text"
          placeholder="NFT Mint Address"
          value={nftMint}
          onChange={(e) => setNftMint(e.target.value)}
          className="w-full p-2 rounded text-white mb-2"
        />
        <button
          type="submit"
          disabled={
            loading ||
            !loanAddress ||
            !listingAddress ||
            !lenderAddress ||
            !nftMint
          }
          className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? "Processing..." : "Repay Loan"}
        </button>
      </form>
    </div>
  );
};

export default function Example() {
  const wallet = useWallet();

  if (!wallet.publicKey) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Connect your wallet</h2>
        <p className="text-gray-400 mb-8">
          Please connect your wallet to interact with the protocol
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Sonic Protocol Interface</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ListNFT />
          <BorrowNFT />
          <CancelListing />
          <LiquidateLoan />
          <RepayLoan />
        </div>
      </div>
    </div>
  );
}
