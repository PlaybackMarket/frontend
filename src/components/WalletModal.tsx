'use client';

import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useRef } from 'react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { select, wallets } = useWallet();
  const modalRef = useRef<HTMLDivElement>(null);

  const supportedWalletNames = ['Phantom', 'Solflare', 'Backpack', 'Nightly'];
  const filteredWallets = wallets.filter(
    (wallet) =>
      supportedWalletNames.includes(wallet.adapter.name) &&
      wallet.readyState === WalletReadyState.Installed
  );

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close modal with ESC key
  useEffect(() => {
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isOpen ? 'visible' : 'invisible'
      }`}
    >
      <div
        className='absolute inset-0 bg-black bg-opacity-70'
        onClick={onClose}
      ></div>
      <div className='relative bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md p-6 shadow-xl blur-card'>
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-xl font-bold text-white'>Connect Wallet</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-white blur-text-hover'
          >
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

        {filteredWallets.length > 0 ? (
          <div className='space-y-4'>
            {filteredWallets.map((wallet) => (
              <button
                key={wallet.adapter.name}
                onClick={() => {
                  select(wallet.adapter.name);
                  onClose();
                }}
                className='w-full py-3 px-4 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-all flex items-center gap-3 border border-gray-700 blur-button'
              >
                <img
                  src={wallet.adapter.icon}
                  alt={wallet.adapter.name}
                  className='w-6 h-6'
                />
                <span className='font-medium'>
                  Connect with {wallet.adapter.name}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className='text-center'>
            <p className='text-gray-300 mb-4'>No supported wallets found</p>
            <div className='flex flex-col gap-4'>
              <a
                href='https://phantom.app/'
                target='_blank'
                rel='noopener noreferrer'
                className='py-3 px-4 bg-[#FF6B00] text-white rounded-md hover:bg-[#FF8C40] transition-all font-medium blur-button'
              >
                Install Phantom
              </a>
              <a
                href='https://solflare.com/'
                target='_blank'
                rel='noopener noreferrer'
                className='py-3 px-4 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-all font-medium blur-button'
              >
                Install Solflare
              </a>
              <a
                href='https://www.backpack.app/'
                target='_blank'
                rel='noopener noreferrer'
                className='py-3 px-4 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-all font-medium blur-button'
              >
                Install Backpack
              </a>
              <a
                href='https://nightly.app/'
                target='_blank'
                rel='noopener noreferrer'
                className='py-3 px-4 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-all font-medium blur-button'
              >
                Install Nightly
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
