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
        })
        .rpc();

      toast.success("Successfully canceled listing!", { id: toastId });
      // Refresh listings after cancellation
      fetchListings();
    } catch (error) {
      console.error("Error canceling listing:", error);
      toast.error(`Failed to cancel listing: ${error}`, {
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

export default CancelListing;
