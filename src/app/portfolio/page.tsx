'use client';

import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { fetchUserListings, fetchUserLoans } from '@/services/lendingService';
import { LendingModal } from '@/components/LendingModal';
import { BorrowingModal } from '@/components/BorrowingModal';
import { RepayModal } from '@/components/RepayModal';
import { toast } from 'react-hot-toast';

// Mock data for the portfolio
const mockListings = [
  {
    id: '1',
    nftId: 'NFT1',
    nftName: 'Pudgy Penguin #1234',
    nftImage: '/collections/pudgy.png',
    collection: 'PudgyPenguins',
    loanDuration: 7,
    interestRate: 12.5,
    collateralRequired: 15.0,
    listedAt: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
    status: 'active',
    floorPrice: 8.8,
  },
  {
    id: '2',
    nftId: 'NFT2',
    nftName: 'Azuki #5678',
    nftImage: '/collections/azuki.png',
    collection: 'Azuki',
    loanDuration: 14,
    interestRate: 10.5,
    collateralRequired: 4.0,
    listedAt: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
    status: 'borrowed',
    borrower: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    borrowedAt: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
    dueDate: Math.floor(Date.now() / 1000) + 1123200, // 13 days from now
    floorPrice: 2.42,
  },
];

const mockLoans = [
  {
    id: '1',
    listingId: 'L1',
    nftId: 'NFT3',
    nftName: 'BAYC #9876',
    nftImage: '/collections/bayc.png',
    collection: 'BoredApeYachtClub',
    lender: '3xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    borrower: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    loanDuration: 7,
    interestRate: 18.7,
    collateralAmount: 25.0,
    borrowedAt: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
    dueDate: Math.floor(Date.now() / 1000) + 432000, // 5 days from now
    floorPrice: 13.29,
  },
];

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('lending');
  const [listings, setListings] = useState(mockListings);
  const [loans, setLoans] = useState(mockLoans);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [isLendingModalOpen, setIsLendingModalOpen] = useState(false);
  const [isBorrowingModalOpen, setIsBorrowingModalOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);

  const { connection } = useConnection();
  const wallet = useWallet();

  useEffect(() => {
    if (wallet.publicKey) {
      loadUserData();
    }
  }, [wallet.publicKey, connection]);

  const loadUserData = async () => {
    try {
      if (!wallet.publicKey) return;

      // In a real app, these would fetch data from the blockchain
      // const userListings = await fetchUserListings(connection, wallet.publicKey);
      // const userLoans = await fetchUserLoans(connection, wallet.publicKey);

      // For now, we'll use mock data
      setListings(mockListings);
      setLoans(mockLoans);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load portfolio data');
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

  const handleRepay = (loan: any) => {
    setSelectedLoan(loan);
    setIsRepayModalOpen(true);
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-2xl font-bold text-white mb-6'>Portfolio</h1>

      {!wallet.connected ? (
        <div className='bg-gray-900 border border-gray-800 rounded-lg p-8 text-center'>
          <h2 className='text-xl text-white mb-4'>
            Connect your wallet to view your portfolio
          </h2>
          <p className='text-gray-400 mb-6'>
            You need to connect your wallet to see your lending and borrowing
            activities.
          </p>
        </div>
      ) : (
        <>
          <div className='flex border-b border-gray-800 mb-6'>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'lending'
                  ? 'text-[#FF6B00] border-b-2 border-[#FF6B00]'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('lending')}
            >
              My Lending
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
                My Lending Activity
              </h2>

              {listings.length === 0 ? (
                <div className='bg-gray-900 border border-gray-800 rounded-lg p-8 text-center'>
                  <h3 className='text-lg text-white mb-2'>
                    No lending activity yet
                  </h3>
                  <p className='text-gray-400 mb-4'>
                    You haven't listed any NFTs for lending.
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
                        <th className='py-3 px-4 font-medium'>STATUS</th>
                        <th className='py-3 px-4 font-medium'>
                          TIME REMAINING
                        </th>
                        <th className='py-3 px-4 font-medium'>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listings.map((listing) => (
                        <tr
                          key={listing.id}
                          className='border-t border-gray-800 hover:bg-gray-900'
                        >
                          <td className='py-4 px-4'>
                            <div className='flex items-center'>
                              <div className='w-10 h-10 rounded-md bg-gray-800 mr-3 overflow-hidden flex-shrink-0'>
                                {/* Placeholder for NFT image */}
                                <div className='w-full h-full bg-gray-700'></div>
                              </div>
                              <div>
                                <div className='text-white'>
                                  {listing.nftName}
                                </div>
                                <div className='text-gray-400 text-sm'>
                                  {listing.collection}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className='py-4 px-4 text-white'>
                            {listing.loanDuration} days
                          </td>
                          <td className='py-4 px-4 text-green-500'>
                            {listing.interestRate}%
                          </td>
                          <td className='py-4 px-4 text-white'>
                            {listing.collateralRequired.toFixed(2)} SOL
                          </td>
                          <td className='py-4 px-4'>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                listing.status === 'active'
                                  ? 'bg-green-900 text-green-400'
                                  : 'bg-blue-900 text-blue-400'
                              }`}
                            >
                              {listing.status === 'active'
                                ? 'Available'
                                : 'Borrowed'}
                            </span>
                          </td>
                          <td className='py-4 px-4 text-white'>
                            {listing.status === 'borrowed'
                              ? formatTimeRemaining(listing.dueDate)
                              : '-'}
                          </td>
                          <td className='py-4 px-4'>
                            {listing.status === 'active' && (
                              <button
                                className='px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600'
                                onClick={() => {
                                  setSelectedListing(listing);
                                  setIsLendingModalOpen(true);
                                }}
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                        <th className='py-3 px-4 font-medium'>
                          TIME REMAINING
                        </th>
                        <th className='py-3 px-4 font-medium'>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.map((loan) => {
                        const now = Math.floor(Date.now() / 1000);
                        const isExpiringSoon =
                          loan.dueDate - now < 24 * 60 * 60; // Less than 1 day

                        return (
                          <tr
                            key={loan.id}
                            className='border-t border-gray-800 hover:bg-gray-900'
                          >
                            <td className='py-4 px-4'>
                              <div className='flex items-center'>
                                <div className='w-10 h-10 rounded-md bg-gray-800 mr-3 overflow-hidden flex-shrink-0'>
                                  {/* Placeholder for NFT image */}
                                  <div className='w-full h-full bg-gray-700'></div>
                                </div>
                                <div>
                                  <div className='text-white'>
                                    {loan.nftName}
                                  </div>
                                  <div className='text-gray-400 text-sm'>
                                    {loan.collection}
                                  </div>
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
        </>
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
