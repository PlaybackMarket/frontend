'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { listNFT } from '@/services/lendingService';
import { toast } from 'react-hot-toast';
import { PublicKey } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

interface NFT {
  id: string;
  name: string;
  image: string;
  collection: string;
  floorPrice: number;
}

interface LendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft?: NFT;
}

export function LendingModal({ isOpen, onClose, nft }: LendingModalProps) {
  const [loanDuration, setLoanDuration] = useState(7); // days
  const [interestRate, setInterestRate] = useState(10); // percentage
  const [collateralAmount, setCollateralAmount] = useState(150); // percentage of floor price
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { connection } = useConnection();
  const wallet = useWallet();

  // Reset form when modal opens with a new NFT
  useEffect(() => {
    if (isOpen && nft) {
      setLoanDuration(7);
      setInterestRate(10);
      setCollateralAmount(150);
    }
  }, [isOpen, nft]);

  if (!isOpen || !nft) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nft || !wallet.publicKey) {
      toast.error('Wallet not connected');
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate collateral in SOL based on floor price and percentage
      const collateralInSOL = (nft.floorPrice * collateralAmount) / 100;

      // Convert string ID to PublicKey
      const nftMint = new PublicKey(nft.id);

      await listNFT(
        connection,
        wallet,
        nftMint,
        loanDuration,
        interestRate,
        collateralInSOL
      );

      toast.success('NFT listed for lending successfully!');
      onClose();
    } catch (error) {
      console.error('Error listing NFT:', error);
      toast.error('Failed to list NFT for lending. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70'>
      <div className='bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md p-6 shadow-xl'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-bold text-white'>Lend Your NFT</h2>
          <button onClick={onClose} className='text-gray-400 hover:text-white'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <line x1='18' y1='6' x2='6' y2='18'></line>
              <line x1='6' y1='6' x2='18' y2='18'></line>
            </svg>
          </button>
        </div>

        <div className='flex items-center mb-6 p-3 bg-gray-800 rounded-lg'>
          <div className='w-16 h-16 rounded-md overflow-hidden mr-4 bg-gray-700 flex-shrink-0'>
            {/* NFT image placeholder */}
            <div className='w-full h-full bg-gray-700'></div>
          </div>
          <div>
            <h3 className='text-white font-medium'>{nft.name}</h3>
            <p className='text-gray-400'>{nft.collection}</p>
            <p className='text-white'>{nft.floorPrice.toFixed(2)} SOL</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='mb-4'>
            <label className='block text-gray-400 mb-2'>
              Loan Duration (days)
            </label>
            <input
              type='range'
              min='1'
              max='30'
              value={loanDuration}
              onChange={(e) => setLoanDuration(parseInt(e.target.value))}
              className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#FF6B00]'
            />
            <div className='flex justify-between text-gray-400 text-sm mt-1'>
              <span>1 day</span>
              <span>{loanDuration} days</span>
              <span>30 days</span>
            </div>
          </div>

          <div className='mb-4'>
            <label className='block text-gray-400 mb-2'>
              Interest Rate (APY %)
            </label>
            <input
              type='range'
              min='1'
              max='50'
              value={interestRate}
              onChange={(e) => setInterestRate(parseInt(e.target.value))}
              className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#FF6B00]'
            />
            <div className='flex justify-between text-gray-400 text-sm mt-1'>
              <span>1%</span>
              <span className='text-green-500'>{interestRate}%</span>
              <span>50%</span>
            </div>
          </div>

          <div className='mb-6'>
            <label className='block text-gray-400 mb-2'>
              Required Collateral (%)
            </label>
            <input
              type='range'
              min='100'
              max='300'
              step='5'
              value={collateralAmount}
              onChange={(e) => setCollateralAmount(parseInt(e.target.value))}
              className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#FF6B00]'
            />
            <div className='flex justify-between text-gray-400 text-sm mt-1'>
              <span>100%</span>
              <span>{collateralAmount}%</span>
              <span>300%</span>
            </div>
            <p className='text-gray-400 text-sm mt-2'>
              Borrower will need to deposit{' '}
              {((nft.floorPrice * collateralAmount) / 100).toFixed(2)} SOL as
              collateral
            </p>
          </div>

          <div className='bg-gray-800 p-3 rounded-lg mb-6'>
            <div className='flex justify-between mb-2'>
              <span className='text-gray-400'>Loan Amount:</span>
              <span className='text-white'>1 NFT</span>
            </div>
            <div className='flex justify-between mb-2'>
              <span className='text-gray-400'>Loan Duration:</span>
              <span className='text-white'>{loanDuration} days</span>
            </div>
            <div className='flex justify-between mb-2'>
              <span className='text-gray-400'>Interest Earned:</span>
              <span className='text-green-500'>
                {(
                  (nft.floorPrice * interestRate * loanDuration) /
                  (365 * 100)
                ).toFixed(4)}{' '}
                SOL
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-400'>Required Collateral:</span>
              <span className='text-white'>
                {((nft.floorPrice * collateralAmount) / 100).toFixed(2)} SOL
              </span>
            </div>
          </div>

          <button
            type='submit'
            disabled={isSubmitting || !wallet.connected}
            className={`w-full py-3 rounded-lg font-medium text-white ${
              isSubmitting || !wallet.connected
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-[#FF6B00] hover:bg-[#FF8C40] transition-colors'
            }`}
          >
            {!wallet.connected
              ? 'Connect Wallet to Continue'
              : isSubmitting
              ? 'Processing...'
              : 'List NFT for Lending'}
          </button>
        </form>
      </div>
    </div>
  );
}
