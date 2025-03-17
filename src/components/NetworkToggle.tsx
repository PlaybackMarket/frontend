'use client';

import { useState, useRef, useEffect } from 'react';
import { useNetwork, NETWORKS } from '@/contexts/NetworkContext';

export function NetworkToggle() {
  const { network, setNetwork } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleNetwork = (networkName: string) => {
    setNetwork(networkName === 'mainnet' 
      ? NETWORKS.MAINNET
      : NETWORKS.TESTNET
    );
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center bg-[#1F2B47] text-white px-4 py-2 rounded-md hover:bg-[#263350] transition-colors"
      >
        <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
        <span>{network.label}</span>
        <svg
          className={`ml-2 h-5 w-5 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute mt-2  right-0 w-48 rounded-md shadow-lg bg-[#1F2B47] ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            <button
              onClick={() => toggleNetwork('mainnet')}
              className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                network.name === 'mainnet' ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-[#263350]'
              }`}
            >
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Sonic Mainnet
            </button>
            <button
              onClick={() => toggleNetwork('testnet')}
              className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                network.name === 'testnet' ? 'bg-blue-600 text-white' : 'text-gray-200 hover:bg-[#263350]'
              }`}
            >
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
              Sonic Testnet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
