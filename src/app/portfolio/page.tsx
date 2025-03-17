'use client';

import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { fetchWalletNFTs } from '@/services/collectionService';
import { LendingModal } from '@/components/LendingModal';
import { RepayModal } from '@/components/RepayModal';
import { toast } from 'react-hot-toast';
import { NFT } from '@/services/collectionService';

interface NFTDisplay {
  id: string;
  name: string;
  image: string;
  collection: string;
  floorPrice: number;
}

interface LendingOffer {
  id: string;
  nftId: string;
  nftName: string;
  nftImage: string;
  collection: string;
  loanDuration: number;
  interestRate: number;
  collateralRequired: number;
  listedAt: number;
  status: 'active' | 'borrowed';
  borrower?: string;
  borrowedAt?: number;
  dueDate?: number;
  floorPrice: number;
}

interface Loan {
  id: string;
  listingId: string;
  nftId: string;
  nftName: string;
  nftImage: string;
  collection: string;
  lender: string;
  borrower: string;
  loanDuration: number;
  interestRate: number;
  collateralAmount: number;
  borrowedAt: number;
  dueDate: number;
  floorPrice: number;
}

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('lending');
  const [listings, setListings] = useState<LendingOffer[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState<LendingOffer | null>(
    null
  );
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [isLendingModalOpen, setIsLendingModalOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);

  const { connection } = useConnection();
  const wallet = useWallet();

  useEffect(() => {
    if (wallet.publicKey) {
      loadUserData();
    } else {
      // Clear data when wallet disconnects
      setListings([]);
      setLoans([]);
      setNfts([]);
    }
  }, [wallet.publicKey, connection]);

  const loadUserData = async () => {
    if (!wallet.publicKey) return;

    setLoading(true);
    try {
      // Fetch NFTs owned by the wallet
      console.log('Fetching wallet NFTs...');
      const walletNFTs = await fetchWalletNFTs(wallet.publicKey.toString());
      console.log('Fetched wallet NFTs:', walletNFTs);
      setNfts(walletNFTs);

      // TODO: Fetch active lending offers and loans from Sonic SVM
      // For now, we'll show empty arrays until the lending service is implemented
      setListings([]);
      setLoans([]);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (dueDate: number | undefined) => {
    if (!dueDate) return '-';

    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = Math.max(0, dueDate - now);
    const days = Math.floor(timeRemaining / (24 * 60 * 60));
    const hours = Math.floor((timeRemaining % (24 * 60 * 60)) / (60 * 60));

    return `${days}d ${hours}h`;
  };

  const handleRepay = (loan: Loan) => {
    setSelectedLoan(loan);
    setIsRepayModalOpen(true);
  };

  if (!wallet.connected) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-2xl font-bold text-white mb-6'>Portfolio</h1>
        <div className='bg-gray-900 border border-gray-800 rounded-lg p-8 text-center'>
          <h2 className='text-xl text-white mb-4'>
            Connect your wallet to view your portfolio
          </h2>
          <p className='text-gray-400 mb-6'>
            You need to connect your wallet to see your lending and borrowing
            activities.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-2xl font-bold text-white mb-6'>Portfolio</h1>
        <div className='bg-gray-900 border border-gray-800 rounded-lg p-8 text-center'>
          <h2 className='text-xl text-white mb-4'>Loading your portfolio...</h2>
          <p className='text-gray-400'>Please wait while we fetch your data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-2xl font-bold text-white mb-6'>Portfolio</h1>

      <div className='flex border-b border-gray-800 mb-6'>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'lending'
              ? 'text-[#FF6B00] border-b-2 border-[#FF6B00]'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('lending')}
        >
          My NFTs
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'borrowing'
              ? 'text-[#FF6B00] border-b-2 border-[#FF6B00]'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('borrowing')}
        >
          My Borrowing
        </button>
      </div>

      {activeTab === 'lending' && (
        <div>
          <h2 className='text-xl font-bold text-white mb-4'>
            My NFTs Available for Lending
          </h2>

          {nfts.length === 0 ? (
            <div className='bg-gray-900 border border-gray-800 rounded-lg p-8 text-center'>
              <h3 className='text-lg text-white mb-2'>No NFTs found</h3>
              <p className='text-gray-400 mb-4'>
                You don't have any NFTs in your wallet that can be listed for
                lending.
              </p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {nfts.map((nft) => (
                <div
                  key={nft.id}
                  className='bg-gray-900 border border-gray-800 rounded-lg p-4'
                >
                  {nft.image && (
                    <div className='relative w-full h-48 mb-4'>
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className='w-full h-full object-cover rounded-lg'
                      />
                    </div>
                  )}
                  <h3 className='text-lg font-semibold text-white mb-2'>
                    {nft.name}
                  </h3>
                  {nft.attributes && (
                    <div className='mb-4'>
                      {nft.attributes.map((attr, index) => (
                        <div key={index} className='text-sm text-gray-400'>
                          <span className='font-medium'>
                            {attr.trait_type}:
                          </span>{' '}
                          <span>{attr.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (!nft.image) {
                        toast.error('Cannot list NFT without image');
                        return;
                      }
                      setSelectedListing({
                        id: crypto.randomUUID(), // Generate a temporary ID for the listing
                        nftId: nft.id,
                        nftName: nft.name,
                        nftImage: nft.image,
                        collection: 'Sonic SVM Collection', // Default collection name
                        loanDuration: 7,
                        interestRate: 10,
                        collateralRequired: 100,
                        listedAt: Math.floor(Date.now() / 1000),
                        status: 'active',
                        floorPrice: 0, // This will be set by the lending service
                      });
                      setIsLendingModalOpen(true);
                    }}
                    className='w-full px-4 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#FF8C40] transition-colors'
                    disabled={nft.listed}
                  >
                    {nft.listed ? 'Already Listed' : 'List for Lending'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'borrowing' && (
        <div>
          <h2 className='text-xl font-bold text-white mb-4'>
            My Borrowing Activity
          </h2>

          {loans.length === 0 ? (
            <div className='bg-gray-900 border border-gray-800 rounded-lg p-8 text-center'>
              <h3 className='text-lg text-white mb-2'>
                No borrowing activity yet
              </h3>
              <p className='text-gray-400 mb-4'>
                You haven't borrowed any NFTs.
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full'>
                <thead>
                  <tr className='text-left text-gray-400 text-sm'>
                    <th className='py-3 px-4 font-medium'>NFT</th>
                    <th className='py-3 px-4 font-medium'>DURATION</th>
                    <th className='py-3 px-4 font-medium'>INTEREST</th>
                    <th className='py-3 px-4 font-medium'>COLLATERAL</th>
                    <th className='py-3 px-4 font-medium'>BORROWED</th>
                    <th className='py-3 px-4 font-medium'>TIME REMAINING</th>
                    <th className='py-3 px-4 font-medium'>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => {
                    const now = Math.floor(Date.now() / 1000);
                    const isExpiringSoon = loan.dueDate - now < 24 * 60 * 60; // Less than 1 day

                    return (
                      <tr
                        key={loan.id}
                        className='border-t border-gray-800 hover:bg-gray-900'
                      >
                        <td className='py-4 px-4'>
                          <div className='flex items-center'>
                            {loan.nftImage && (
                              <img
                                src={loan.nftImage}
                                alt={loan.nftName}
                                className='w-10 h-10 rounded-md object-cover mr-3'
                              />
                            )}
                            <div>
                              <div className='text-white'>{loan.nftName}</div>
                              {loan.collection && (
                                <div className='text-gray-400 text-sm'>
                                  {loan.collection}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className='py-4 px-4 text-white'>
                          {loan.loanDuration} days
                        </td>
                        <td className='py-4 px-4 text-white'>
                          {loan.interestRate}%
                        </td>
                        <td className='py-4 px-4 text-white'>
                          {loan.collateralAmount.toFixed(2)} SOL
                        </td>
                        <td className='py-4 px-4 text-white'>
                          {new Date(
                            loan.borrowedAt * 1000
                          ).toLocaleDateString()}
                        </td>
                        <td
                          className={`py-4 px-4 ${
                            isExpiringSoon ? 'text-red-500' : 'text-white'
                          }`}
                        >
                          {formatTimeRemaining(loan.dueDate)}
                        </td>
                        <td className='py-4 px-4'>
                          <button
                            className='px-3 py-1 bg-[#FF6B00] text-white text-sm rounded hover:bg-[#FF8C40]'
                            onClick={() => handleRepay(loan)}
                          >
                            Repay
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedListing && (
        <LendingModal
          isOpen={isLendingModalOpen}
          onClose={() => setIsLendingModalOpen(false)}
          nft={{
            id: selectedListing.nftId,
            name: selectedListing.nftName,
            image: selectedListing.nftImage,
            collection: selectedListing.collection,
            floorPrice: selectedListing.floorPrice,
          }}
        />
      )}

      {selectedLoan && (
        <RepayModal
          isOpen={isRepayModalOpen}
          onClose={() => setIsRepayModalOpen(false)}
          loan={selectedLoan}
        />
      )}
    </div>
  );
}
