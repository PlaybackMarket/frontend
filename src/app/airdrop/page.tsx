'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { useNetwork } from '@/contexts/NetworkContext';
import toast from 'react-hot-toast';

export default function Airdrop() {
  const { publicKey } = useWallet();
  const { network } = useNetwork();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(1);

  const handleAirdrop = async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const connection = new Connection(network.endpoint);
      const signature = await connection.requestAirdrop(
        publicKey,
        amount * LAMPORTS_PER_SOL
      );

      await connection.confirmTransaction(signature);
      toast.success(`Successfully airdropped ${amount} SOL to your wallet!`);
    } catch (error) {
      console.error('Airdrop failed:', error);
      toast.error('Failed to airdrop SOL. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className='min-h-screen bg-black text-white flex flex-col items-center justify-center'>
        <h2 className='text-2xl font-bold mb-4'>Connect your wallet</h2>
        <p className='text-gray-400 mb-8'>
          Please connect your wallet to request an airdrop
        </p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-black text-white'>
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-2xl font-bold mb-6'>Airdrop</h1>

        <div className='max-w-md mx-auto bg-gray-900 rounded-lg p-6'>
          <h2 className='text-xl font-medium mb-4'>Request Test SOL</h2>
          <p className='text-gray-400 mb-6'>
            Request an airdrop of SOL tokens to your wallet for testing
            purposes. This only works on testnet.
          </p>

          <div className='mb-4'>
            <label className='block text-gray-400 mb-2'>Amount (SOL)</label>
            <input
              type='number'
              min='0.1'
              max='5'
              step='0.1'
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className='w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-1 focus:ring-[#FF6B00]'
            />
          </div>

          <div className='mb-4'>
            <label className='block text-gray-400 mb-2'>Wallet Address</label>
            <div className='w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-4 text-gray-300 font-mono text-sm break-all'>
              {publicKey.toString()}
            </div>
          </div>

          <button
            onClick={handleAirdrop}
            disabled={loading || network.name !== 'testnet'}
            className={`w-full py-3 rounded-md font-medium ${
              network.name !== 'testnet'
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : loading
                ? 'bg-[#FF8C40] text-white cursor-wait'
                : 'bg-[#FF6B00] text-white hover:bg-[#FF8C40]'
            } transition-all`}
          >
            {loading
              ? 'Processing...'
              : network.name !== 'testnet'
              ? 'Switch to Testnet'
              : 'Request Airdrop'}
          </button>

          {network.name !== 'testnet' && (
            <p className='mt-4 text-red-400 text-sm'>
              Airdrops are only available on testnet. Please switch to testnet
              using the network toggle.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
