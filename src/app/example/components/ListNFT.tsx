// @ts-nocheck

import { FC, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";

import {
  Program,
  AnchorProvider,
  setProvider,
  BN,
  type Provider,
} from "@coral-xyz/anchor";
import toast from "react-hot-toast";
import type { Sonic } from "@/sc/types/sonic";
import idl from "@/sc/sonic.json";
import { PROGRAM_ID, VAULT_AUTHORITY_SEED } from "@/lib/constants";
import {
  formatOverdueTime,
  formatCollateral,
  formatTimeLeft,
} from "@/lib/format";
import bs58 from "bs58";

import {
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

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
        })
        .signers([listing])
        .rpc();

      toast.success("Successfully listed NFT!", { id: toastId });
    } catch (error) {
      console.error("Error listing NFT:", error);
      toast.error(`Failed to list NFT: ${error}`, { id: toastId });
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

export default ListNFT;
