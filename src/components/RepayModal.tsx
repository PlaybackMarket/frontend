"use client";

import { useState } from "react";
import Image from "next/image";
import { repayLoan } from "@/services/lendingService";
import { toast } from "react-hot-toast";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

interface Loan {
  id: string;
  listingId: string;
  nftId: string;
  nftName: string;
  nftImage: string;
  collection: string;
  lender: string;
  borrower: string;
  loanDuration: number;
  interestRate: number;
  collateralAmount: number;
  borrowedAt: number;
  dueDate: number;
  floorPrice: number;
}

interface RepayModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan?: Loan;
}

export function RepayModal({ isOpen, onClose, loan }: RepayModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { connection } = useConnection();
  const wallet = useWallet();

  if (!isOpen || !loan) return null;

  // Calculate time remaining
  const now = Math.floor(Date.now() / 1000);
  const timeRemaining = Math.max(0, loan.dueDate - now);
  const daysRemaining = Math.floor(timeRemaining / (24 * 60 * 60));
  const hoursRemaining = Math.floor(
    (timeRemaining % (24 * 60 * 60)) / (60 * 60)
  );

  // Calculate interest accrued
  const secondsElapsed = now - loan.borrowedAt;
  const daysElapsed = secondsElapsed / (24 * 60 * 60);
  const interestAccrued =
    (loan.floorPrice * loan.interestRate * daysElapsed) / (365 * 100);

  // Calculate total repayment amount
  const totalRepayment = loan.floorPrice + interestAccrued;

  const handleRepay = async () => {
    if (!wallet.publicKey) {
      toast.error("Wallet not connected");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert string IDs to PublicKeys
      const loanPublicKey = new PublicKey(loan.id);
      const listingPublicKey = new PublicKey(loan.listingId);
      const nftMintPublicKey = new PublicKey(loan.nftId);
      const lenderPublicKey = new PublicKey(loan.lender);

      // For this example, we'll use SOL as collateral
      const collateralMint = new PublicKey(
        "So11111111111111111111111111111111111111112"
      ); // Native SOL mint address

      await repayLoan(
        connection,
        wallet,
        loanPublicKey,
        listingPublicKey,
        nftMintPublicKey,
        collateralMint
      );

      toast.success(
        "Loan repaid successfully! Your collateral has been returned."
      );
      onClose();
    } catch (error) {
      console.error("Error repaying loan:", error);
      toast.error("Failed to repay loan. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Repay Loan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="flex items-center mb-6 p-3 bg-gray-800 rounded-lg">
          <div className="w-16 h-16 rounded-md overflow-hidden mr-4 bg-gray-700 flex-shrink-0">
            {/* NFT image placeholder */}
            <div className="w-full h-full bg-gray-700"></div>
          </div>
          <div>
            <h3 className="text-white font-medium">{loan.nftName}</h3>
            <p className="text-gray-400">{loan.collection}</p>
            <p className="text-white">{loan.floorPrice.toFixed(2)} SOL</p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h3 className="text-white font-medium mb-3">Loan Details</h3>

          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Time Remaining:</span>
            <span
              className={
                timeRemaining < 24 * 60 * 60 ? "text-red-500" : "text-white"
              }
            >
              {daysRemaining}d {hoursRemaining}h
            </span>
          </div>

          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Interest Rate (APY):</span>
            <span className="text-white">{loan.interestRate}%</span>
          </div>

          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Interest Accrued:</span>
            <span className="text-white">{interestAccrued.toFixed(4)} SOL</span>
          </div>

          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Collateral Amount:</span>
            <span className="text-white">
              {loan.collateralAmount.toFixed(2)} SOL
            </span>
          </div>

          <div className="flex justify-between pt-2 border-t border-gray-700">
            <span className="text-gray-400 font-medium">Repayment Amount:</span>
            <span className="text-white font-medium">
              {totalRepayment.toFixed(4)} SOL
            </span>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h3 className="text-white font-medium mb-3">Repayment Information</h3>
          <ul className="text-gray-400 text-sm space-y-2">
            <li>
              • You must repay {totalRepayment.toFixed(4)} SOL to retrieve your
              collateral of {loan.collateralAmount.toFixed(2)} SOL.
            </li>
            <li>• The NFT will be returned to the lender upon repayment.</li>
            <li>
              • Your collateral will be returned to your wallet immediately
              after repayment.
            </li>
            {timeRemaining < 24 * 60 * 60 && (
              <li className="text-red-500">
                • Warning: Your loan is due soon. Failure to repay will result
                in loss of collateral.
              </li>
            )}
          </ul>
        </div>

        <button
          onClick={handleRepay}
          disabled={isSubmitting || !wallet.connected}
          className={`w-full py-3 rounded-lg font-medium text-white ${
            isSubmitting || !wallet.connected
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-[#FF6B00] hover:bg-[#FF8C40] transition-colors"
          }`}
        >
          {!wallet.connected
            ? "Connect Wallet to Continue"
            : isSubmitting
            ? "Processing..."
            : "Repay Loan"}
        </button>
      </div>
    </div>
  );
}
