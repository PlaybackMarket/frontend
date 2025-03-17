import { FC, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
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
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

const RepayLoan: FC = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [activeLoans, setActiveLoans] = useState<any[]>([]);

  const provider = new AnchorProvider(
    connection,
    wallet as any,
    AnchorProvider.defaultOptions()
  );
  const program = new Program<Sonic>(idl, provider as unknown as Provider);

  // Fetch active loans when component mounts
  useEffect(() => {
    fetchActiveLoans();
  }, [connection, program, wallet.publicKey]);

  const fetchActiveLoans = async () => {
    if (!program || !wallet.publicKey) return;

    try {
      // Get all Loan accounts for the connected wallet
      const loans = await program.account.loan.all([
        {
          memcmp: {
            offset: 8, // discriminator
            bytes: wallet.publicKey.toBase58(), // borrower
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

      // Fetch listing details for each loan and filter out invalid ones
      const enrichedLoans = (
        await Promise.all(
          loans.map(async (loan) => {
            try {
              const listing = await program.account.nftListing.fetch(
                loan.account.listing
              );
              return {
                ...loan,
                listing,
              };
            } catch (error) {
              console.log(
                `Skipping loan ${loan.publicKey.toString()} - listing not found`
              );
              return null;
            }
          })
        )
      ).filter((loan): loan is NonNullable<typeof loan> => loan !== null);

      setActiveLoans(enrichedLoans);
    } catch (error) {
      console.error("Error fetching loans:", error);
      toast.error("Failed to fetch active loans");
    }
  };

  const handleRepay = async (loan: any) => {
    if (!wallet.publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    const toastId = toast.loading("Repaying loan...");
    setLoading(true);

    try {
      const [vault_authority] = PublicKey.findProgramAddressSync(
        [Buffer.from(VAULT_AUTHORITY_SEED)],
        program.programId
      );

      const borrowerNftAccount = await getAssociatedTokenAddress(
        loan.listing.nftMint,
        wallet.publicKey
      );
      const vaultNftAccount = await getAssociatedTokenAddress(
        loan.listing.nftMint,
        vault_authority,
        true
      );
      const lenderNftAccount = await getAssociatedTokenAddress(
        loan.listing.nftMint,
        loan.listing.lender
      );

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
          vault_authority: vault_authority,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("Successfully repaid loan!", { id: toastId });
      // Refresh loans after successful repayment
      fetchActiveLoans();
    } catch (error) {
      console.error("Error repaying loan:", error);
      toast.error(`Failed to repay loan: ${error.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl mb-4">Your Active Loans</h2>
      <div className="space-y-4">
        {activeLoans.map((loan, index) => (
          <div key={index} className="p-4 border rounded bg-gray-800">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-400">NFT</p>
                <p className="font-mono text-sm">
                  {loan.listing.nftMint.toString().slice(0, 16)}...
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Time Remaining</p>
                <p className="font-bold text-yellow-400">
                  {formatTimeLeft(loan.account.endTime)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-400">Collateral</p>
                <p className="font-bold text-green-400">
                  {(loan.account.collateralAmount / 1e9).toFixed(2)} SOL
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Interest Rate</p>
                <p>{loan.account.interestRate.toString()}%</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-400">Lender</p>
              <p className="font-mono text-sm">
                {loan.listing.lender.toString().slice(0, 16)}...
              </p>
            </div>

            <button
              onClick={() => handleRepay(loan)}
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? "Processing..." : "Repay Loan"}
            </button>
          </div>
        ))}
        {activeLoans.length === 0 && (
          <p className="text-gray-400 text-center py-8">
            You have no active loans
          </p>
        )}
      </div>
    </div>
  );
};

export default RepayLoan;
