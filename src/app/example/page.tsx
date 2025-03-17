"use client";

import { FC, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import {
  Program,
  Idl,
  AnchorProvider,
  setProvider,
  type Provider,
} from "@coral-xyz/anchor";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import toast from "react-hot-toast";
import { useConnection } from "@solana/wallet-adapter-react";
import idl from "@/sc/sonic.json";

import type { Sonic } from "@/sc/types/sonic";

// Import your IDL and set up program ID
const PROGRAM_ID = new PublicKey(
  "BEF3CqKU1Db7FsqHyuugE7xd6YCz7gD3jMi2wA1yeD4x"
);
const VAULT_AUTHORITY_SEED = "vault_authority";

const BorrowNFT: FC = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [listingAddress, setListingAddress] = useState("");
  const [nftMint, setNftMint] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const listingPubkey = new PublicKey(listingAddress);
      const nftMintPubkey = new PublicKey(nftMint);
      await handleBorrow(listingPubkey, nftMintPubkey);
    } catch (error) {
      console.error("Invalid public key:", error);
    }
  };

  const handleBorrow = async (
    listingAddress: PublicKey,
    nftMint: PublicKey
  ) => {
    if (!wallet.publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    const toastId = toast.loading("Borrowing NFT...");
    setLoading(true);

    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        AnchorProvider.defaultOptions()
      );
      const program = new Program<Sonic>(idl, {} as Provider);

      const [vaultAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from(VAULT_AUTHORITY_SEED)],
        program.programId
      );

      const loan = web3.Keypair.generate();
      const borrowerNftAccount = await getAssociatedTokenAddress(
        nftMint,
        wallet.publicKey
      );
      const vaultNftAccount = await getAssociatedTokenAddress(
        nftMint,
        vaultAuthority,
        true
      );

      await program.methods
        .borrowNft()
        .accounts({
          borrower: wallet.publicKey,
          listing: listingAddress,
          loan: loan.publicKey,
          borrowerNftAccount,
          vaultNftAccount,
          vaultAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          nftMint,
        })
        .signers([loan])
        .rpc();

      toast.success("Successfully borrowed NFT!", { id: toastId });
    } catch (error) {
      console.error("Error borrowing NFT:", error);
      toast.error(`Failed to borrow NFT: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl mb-4">Borrow NFT</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Listing Address"
          value={listingAddress}
          onChange={(e) => setListingAddress(e.target.value)}
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
          disabled={loading || !listingAddress || !nftMint}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? "Processing..." : "Borrow NFT"}
        </button>
      </form>
    </div>
  );
};

const CancelListing: FC = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [listingAddress, setListingAddress] = useState("");
  const [nftMint, setNftMint] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const listingPubkey = new PublicKey(listingAddress);
      const nftMintPubkey = new PublicKey(nftMint);
      await handleCancel(listingPubkey, nftMintPubkey);
    } catch (error) {
      console.error("Invalid public key:", error);
    }
  };

  const handleCancel = async (
    listingAddress: PublicKey,
    nftMint: PublicKey
  ) => {
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
      const program = new Program<Sonic>(idl, {} as Provider);

      const [vaultAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from(VAULT_AUTHORITY_SEED)],
        program.programId
      );

      const lenderNftAccount = await getAssociatedTokenAddress(
        nftMint,
        wallet.publicKey
      );
      const vaultNftAccount = await getAssociatedTokenAddress(
        nftMint,
        vaultAuthority,
        true
      );

      await program.methods
        .cancelListing()
        .accounts({
          lender: wallet.publicKey,
          listing: listingAddress,
          nftMint,
          vaultNftAccount,
          lenderNftAccount,
          vaultAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      toast.success("Successfully canceled listing!", { id: toastId });
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
      <h2 className="text-xl mb-4">Cancel Listing</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Listing Address"
          value={listingAddress}
          onChange={(e) => setListingAddress(e.target.value)}
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
          disabled={loading || !listingAddress || !nftMint}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? "Processing..." : "Cancel Listing"}
        </button>
      </form>
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
      const program = new Program<Sonic>(idl, {} as Provider);

      const listing = web3.Keypair.generate();
      const [vaultAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from(VAULT_AUTHORITY_SEED)],
        program.programId
      );

      const lenderNftAccount = await getAssociatedTokenAddress(
        nftMint,
        wallet.publicKey
      );
      const vaultNftAccount = await getAssociatedTokenAddress(
        nftMint,
        vaultAuthority,
        true
      );

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
          vaultAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
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
      const program = new Program<Sonic>(idl, {} as Provider);

      const [vaultAuthority] = PublicKey.findProgramAddressSync(
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
          vaultAuthority,
          systemProgram: web3.SystemProgram.programId,
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
      const program = new Program<Sonic>(idl, {} as Provider);

      const [vaultAuthority] = PublicKey.findProgramAddressSync(
        [Buffer.from(VAULT_AUTHORITY_SEED)],
        program.programId
      );

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
          vaultAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
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
