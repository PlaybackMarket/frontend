"use client";

import { useState } from "react";
import { borrowNFT } from "@/services/lendingService";
import { toast } from "react-hot-toast";
import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

interface LendingOffer {
  id: string;
  nftId: string;
  nftName: string;
  nftImage: string;
  collection: string;
  lender: string;
  loanDuration: number;
  interestRate: number;
  collateralRequired: number;
  floorPrice: number;
}

interface BorrowingModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  offer?: LendingOffer;
}

export function BorrowingModal({
  isOpen,
  onCloseAction,
  offer,
}: BorrowingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { connection } = useConnection();
  const wallet = useWallet();

  if (!isOpen || !offer) return null;

  const handleBorrow = async () => {
    if (!wallet.publicKey) {
      toast.error("Wallet not connected");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert string IDs to PublicKeys
      const listingPublicKey = new PublicKey(offer.id);
      const nftMintPublicKey = new PublicKey(offer.nftId);

      // For this example, we'll use SOL as collateral
      const collateralMint = new PublicKey(
        "So11111111111111111111111111111111111111112"
      ); // Native SOL mint address

      await borrowNFT(connection, wallet, listingPublicKey, nftMintPublicKey);

      toast.success("NFT borrowed successfully!");
      onCloseAction();
    } catch (error) {
      console.error("Error borrowing NFT:", error);
      toast.error("Failed to borrow NFT. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate daily interest
  const dailyInterest = (offer.floorPrice * offer.interestRate) / (365 * 100);

  // Calculate total interest for the loan duration
  const totalInterest = dailyInterest * offer.loanDuration;

  // Calculate total repayment amount
  const totalRepayment = offer.floorPrice + totalInterest;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Borrow NFT</h2>
          <button
            onClick={onCloseAction}
            className="text-gray-400 hover:text-white"
          >
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
            <h3 className="text-white font-medium">{offer.nftName}</h3>
            <p className="text-gray-400">{offer.collection}</p>
            <p className="text-white">{offer.floorPrice.toFixed(2)} SOL</p>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h3 className="text-white font-medium mb-3">Loan Terms</h3>

          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Loan Duration:</span>
            <span className="text-white">{offer.loanDuration} days</span>
          </div>

          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Interest Rate (APY):</span>
            <span className="text-white">{offer.interestRate}%</span>
          </div>

          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Daily Interest:</span>
            <span className="text-white">{dailyInterest.toFixed(4)} SOL</span>
          </div>

          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Total Interest:</span>
            <span className="text-white">{totalInterest.toFixed(4)} SOL</span>
          </div>

          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Required Collateral:</span>
            <span className="text-white">
              {offer.collateralRequired.toFixed(2)} SOL
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
          <h3 className="text-white font-medium mb-3">Important Information</h3>
          <ul className="text-gray-400 text-sm space-y-2">
            <li>
              • You must deposit {offer.collateralRequired.toFixed(2)} SOL as
              collateral to borrow this NFT.
            </li>
            <li>
              • You must repay the loan within {offer.loanDuration} days to
              retrieve your collateral.
            </li>
            <li>
              • If you fail to repay the loan, your collateral will be forfeited
              to the lender.
            </li>
            <li>
              • The NFT will be transferred to your wallet immediately after
              borrowing.
            </li>
          </ul>
        </div>

        <button
          onClick={handleBorrow}
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
            : "Borrow NFT"}
        </button>
      </div>
    </div>
  );
}
