'use client';

import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletModal } from './WalletModal';

export function WalletButton() {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { connected, publicKey, disconnect } = useWallet();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (connected) {
      setShowDropdown(!showDropdown);
    } else {
      setShowWalletModal(true);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Gradient background effect */}
      <div 
        className="fixed -z-10" 
        style={{
          width: '600px',
          height: '600px',
          borderRadius: '640px',
          opacity: 0.5,
          background: 'linear-gradient(180deg, #1A00FF 0%, #00A5FE 100%)',
          filter: 'blur(111.25px)',
          top: '-400px',
          right: '-300px',
          pointerEvents: 'none'
        }}
      />
      
      <div className="w-[232px] h-[48px] relative">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="233" 
          height="48" 
          viewBox="0 0 233 48" 
          fill="none"
          className="absolute left-0 top-0 w-full h-full pointer-events-none"
        >
          <path 
            d="M5.19131 14.1954L0.5 9.88564V9.60526V2C0.5 1.17157 1.17157 0.5 2 0.5H97H116.5H151H171H231C231.828 0.5 232.5 1.17157 232.5 2V28.538C232.5 28.9085 232.363 29.2658 232.115 29.5412L228.224 33.8664C227.94 34.1826 227.534 34.3632 227.109 34.3632H215.892C213.857 34.3632 212.675 36.6642 213.859 38.3186L215.495 40.6035C215.965 41.2592 216.721 41.6481 217.528 41.6481H231C231.828 41.6481 232.5 42.3197 232.5 43.1481V46C232.5 46.8284 231.828 47.5 231 47.5H2C1.17157 47.5 0.5 46.8284 0.5 46V43.7193C0.5 43.3467 0.638667 42.9875 0.888999 42.7115L5.35167 37.7919C5.76889 37.332 6 36.7332 6 36.1122V16.0364C6 15.3366 5.70667 14.6688 5.19131 14.1954Z" 
            fill="#3477FF" 
            fillOpacity="0.3" 
            stroke="#5C89E1"
          />
        </svg>
        <button
          onClick={handleButtonClick}
          className="w-full h-full flex items-center justify-center relative z-20"
        >
          <span className="font-jost text-white text-center text-base tracking-[0.32px] uppercase">
            {connected && publicKey
              ? formatWalletAddress(publicKey.toString())
              : 'CONNECT WALLET'}
          </span>
        </button>
      </div>

      {/* Dropdown menu */}
      {showDropdown && connected && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[#1F2B47] ring-1 ring-black ring-opacity-5 z-30">
          <div className="py-1">
            <button
              className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[#263350]"
              onClick={() => {
                // Profile action
                setShowDropdown(false);
              }}
            >
              Profile
            </button>
            <button
              className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[#263350]"
              onClick={() => {
                // Settings action
                setShowDropdown(false);
              }}
            >
              Settings
            </button>
            <button
              className="flex items-center w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#263350]"
              onClick={() => {
                disconnect();
                setShowDropdown(false);
              }}
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {showWalletModal && (
        <WalletModal onClose={() => setShowWalletModal(false)} />
      )}
    </div>
  );
}
