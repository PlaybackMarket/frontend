'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { NFT } from '@/services/collectionService';
import { fetchWalletNFTs } from '@/services/collectionService';
import { createLendingOffer } from '@/services/lendingService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

export function Portfolio() {
  const { publicKey } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [lendingParams, setLendingParams] = useState({
    duration: '',
    interestRate: '',
    collateralRequired: '',
  });

  const loadNFTs = async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching NFTs for wallet:', publicKey.toString());
      const walletNFTs = await fetchWalletNFTs(publicKey.toString());
      console.log('Fetched NFTs:', walletNFTs);

      if (walletNFTs.length === 0) {
        setError('No NFTs found in your wallet on Sonic SVM');
      } else {
        setNfts(walletNFTs);
      }
    } catch (error) {
      console.error('Error loading NFTs:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load your NFTs. Please try again.'
      );
      toast.error('Failed to load your NFTs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (publicKey) {
      loadNFTs();
    } else {
      setNfts([]);
      setError(null);
    }
  }, [publicKey]);

  const handleRetry = () => {
    if (publicKey) {
      setError(null);
      setNfts([]);
      loadNFTs();
    }
  };

  const handleLendClick = (nft: NFT) => {
    setSelectedNFT(nft);
    setLendingParams({
      duration: '',
      interestRate: '',
      collateralRequired: '',
    });
  };

  const handleLendSubmit = async () => {
    if (!selectedNFT || !publicKey) return;

    try {
      const duration = parseInt(lendingParams.duration);
      const interestRate = parseFloat(lendingParams.interestRate);
      const collateralRequired = parseFloat(lendingParams.collateralRequired);

      if (isNaN(duration) || isNaN(interestRate) || isNaN(collateralRequired)) {
        throw new Error('Please enter valid numbers for all fields');
      }

      if (duration <= 0 || interestRate <= 0 || collateralRequired <= 0) {
        throw new Error('All values must be greater than 0');
      }

      await createLendingOffer(
        selectedNFT.id,
        publicKey.toString(),
        duration,
        interestRate,
        collateralRequired
      );

      // Update the NFT's status in the list
      setNfts((prevNfts) =>
        prevNfts.map((nft) =>
          nft.id === selectedNFT.id ? { ...nft, listed: true } : nft
        )
      );

      setSelectedNFT(null);
    } catch (error) {
      console.error('Error creating lending offer:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create lending offer');
      }
    }
  };

  if (!publicKey) {
    return (
      <div className='flex flex-col items-center justify-center p-8'>
        <h2 className='text-2xl font-bold mb-4'>Portfolio</h2>
        <p>Please connect your wallet to view your NFTs</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center p-8'>
        <h2 className='text-2xl font-bold mb-4'>Portfolio</h2>
        <p>Loading your NFTs...</p>
        <p className='text-sm text-gray-500 mt-2'>
          This may take a few moments
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center p-8'>
        <h2 className='text-2xl font-bold mb-4'>Your NFTs</h2>
        <p className='text-red-500'>{error}</p>
        <button
          onClick={handleRetry}
          className='mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-8'>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-2xl font-bold'>Your NFTs</h2>
        <p className='text-sm text-gray-500'>
          {nfts.length} NFT{nfts.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {nfts.length === 0 ? (
        <div className='text-center py-8'>
          <p>No NFTs found in your wallet</p>
          <p className='text-sm text-gray-500 mt-2'>
            NFTs that you own will appear here
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {nfts.map((nft) => (
            <div
              key={nft.id}
              className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4'
            >
              {nft.image && (
                <div className='relative w-full h-48 mb-4'>
                  <Image
                    src={nft.image}
                    alt={nft.name}
                    fill
                    className='rounded-lg object-cover'
                  />
                </div>
              )}
              <h3 className='text-lg font-semibold mb-2'>{nft.name}</h3>
              {nft.attributes && (
                <div className='mb-4'>
                  {nft.attributes.map((attr, index) => (
                    <div key={index} className='text-sm'>
                      <span className='font-medium'>{attr.trait_type}:</span>{' '}
                      <span>{attr.value}</span>
                    </div>
                  ))}
                </div>
              )}
              <Button
                onClick={() => handleLendClick(nft)}
                className='w-full'
                variant='default'
                disabled={nft.listed}
              >
                {nft.listed ? 'Listed for Lending' : 'Lend'}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedNFT} onOpenChange={() => setSelectedNFT(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>List NFT for Lending</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='duration'>Loan Duration (days)</Label>
              <Input
                id='duration'
                type='number'
                value={lendingParams.duration}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLendingParams({
                    ...lendingParams,
                    duration: e.target.value,
                  })
                }
                placeholder='Enter loan duration in days'
                min='1'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='interestRate'>Interest Rate (% APR)</Label>
              <Input
                id='interestRate'
                type='number'
                value={lendingParams.interestRate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLendingParams({
                    ...lendingParams,
                    interestRate: e.target.value,
                  })
                }
                placeholder='Enter interest rate'
                min='0.1'
                step='0.1'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='collateral'>Required Collateral (SOL)</Label>
              <Input
                id='collateral'
                type='number'
                value={lendingParams.collateralRequired}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLendingParams({
                    ...lendingParams,
                    collateralRequired: e.target.value,
                  })
                }
                placeholder='Enter required collateral'
                min='0.1'
                step='0.1'
              />
            </div>
            <Button onClick={handleLendSubmit} className='w-full'>
              List for Lending
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
