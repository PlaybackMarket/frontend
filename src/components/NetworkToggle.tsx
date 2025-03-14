'use client';

import { useNetwork, NETWORKS } from '@/contexts/NetworkContext';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function NetworkToggle() {
  const { network, setNetwork } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);

  const handleNetworkChange = (newNetwork: typeof NETWORKS.MAINNET) => {
    setNetwork(newNetwork);
    setIsOpen(false);
    toast.success(`Switched to ${newNetwork.label}`);
  };

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-gray-700 bg-black hover:border-[#FF6B00] transition-all blur-button'
      >
        <span
          className={`w-2 h-2 rounded-full ${
            network.name === 'mainnet' ? 'bg-green-500' : 'bg-purple-500'
          }`}
        ></span>
        <span className='text-white'>{network.label}</span>
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

      {isOpen && (
        <div className='absolute top-full mt-2 right-0 bg-gray-900 border border-gray-700 rounded-md shadow-lg p-1 z-10 w-40 blur-card'>
          <button
            onClick={() => handleNetworkChange(NETWORKS.MAINNET)}
            className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 blur-text-hover ${
              network.name === 'mainnet'
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                network.name === 'mainnet' ? 'bg-green-500' : 'bg-gray-600'
              }`}
            ></span>
            {NETWORKS.MAINNET.label}
          </button>
          <button
            onClick={() => handleNetworkChange(NETWORKS.TESTNET)}
            className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 blur-text-hover ${
              network.name === 'testnet'
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                network.name === 'testnet' ? 'bg-purple-500' : 'bg-gray-600'
              }`}
            ></span>
            {NETWORKS.TESTNET.label}
          </button>
        </div>
      )}
    </div>
  );
}
