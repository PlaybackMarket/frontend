'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { WalletModal } from './WalletModal';

export function WalletButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { publicKey, disconnect } = useWallet();

  if (publicKey) {
    return (
      <div className='relative group'>
        <button className='px-4 py-2 bg-black text-white rounded-md border border-gray-700 hover:border-[#FF6B00] transition-all font-mono flex items-center gap-2 blur-button'>
          <span className='text-sm'>
            {publicKey.toBase58().slice(0, 4)}...
            {publicKey.toBase58().slice(-4)}
          </span>
          <svg
            className='h-4 w-4 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 9l-7 7-7-7'
            />
          </svg>
        </button>
        <div className='absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-md shadow-lg hidden group-hover:block z-10 blur-card'>
          <button
            onClick={() => disconnect()}
            className='w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 blur-text-hover'
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className='px-4 py-2 bg-[#FF6B00] text-white rounded-md hover:bg-[#FF8C40] transition-all font-medium uppercase tracking-wider blur-button'
      >
        CONNECT WALLET
      </button>
      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
