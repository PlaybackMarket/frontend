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
          nftMint: listing.account.nftMint,
        })
        .signers([loan])
        .rpc();

      toast.success("Successfully borrowed NFT!", { id: toastId });
      // Refresh listings after successful borrow
      fetchListings();
    } catch (error) {
      console.error("Error borrowing NFT:", error);
      toast.error(`Failed to borrow NFT: ${error}`, { id: toastId });
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

export default BorrowNFT;
