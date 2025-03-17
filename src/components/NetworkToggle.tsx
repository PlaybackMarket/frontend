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

  const getNetworkColor = (networkName: string) => {
    switch (networkName) {
      case 'mainnet':
        return 'bg-[#FF6B00]';
      case 'testnet':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-gray-700 bg-black hover:border-[#FF6B00] transition-all blur-button'
      >
        <span
          className={`w-2 h-2 rounded-full ${getNetworkColor(network.name)}`}
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
          {Object.values(NETWORKS).map((networkOption) => (
            <button
              key={networkOption.name}
              onClick={() => handleNetworkChange(networkOption)}
              className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 blur-text-hover ${
                network.name === networkOption.name
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${getNetworkColor(
                  networkOption.name
                )}`}
              ></span>
              {networkOption.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
