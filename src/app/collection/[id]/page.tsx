'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LendingModal } from '@/components/LendingModal';
import { BorrowingModal } from '@/components/BorrowingModal';
import { fetchActiveListings } from '@/services/lendingService';
import { toast } from 'react-hot-toast';

// Mock data for the collection
const mockCollection = {
  id: '1',
  name: 'PudgyPenguins',
  image: '/collections/pudgy.png',
  description:
    'Pudgy Penguins is a collection of 8,888 NFTs, waddling through Web3. Embodying empathy & compassion, Pudgy Penguins are a beacon of positivity in the NFT Space.',
  floorPrice: 8.8,
  lendingAPY: 12.5,
  collateralRequired: 150,
  availableForLending: 45,
  totalLent: 23,
  totalBorrowed: 18,
  owners: '5088 (57%)',
  supply: 8888,
};

// Mock data for the collection items
const mockItems = [
  {
    id: 'item1',
    name: 'Pudgy Penguin #1234',
    image: '/collections/pudgy.png',
    collection: 'PudgyPenguins',
    floorPrice: 8.8,
    rarity: 'Rare',
    owner: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    status: 'available',
  },
  {
    id: 'item2',
    name: 'Pudgy Penguin #2345',
    image: '/collections/pudgy.png',
    collection: 'PudgyPenguins',
    floorPrice: 8.8,
    rarity: 'Common',
    owner: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    status: 'lending',
    lendingDetails: {
      id: 'listing1',
      lender: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      loanDuration: 7,
      interestRate: 12.5,
      collateralRequired: 15.0,
      listedAt: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
    },
  },
  {
    id: 'item3',
    name: 'Pudgy Penguin #3456',
    image: '/collections/pudgy.png',
    collection: 'PudgyPenguins',
    floorPrice: 8.8,
    rarity: 'Legendary',
    owner: '3xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    status: 'borrowed',
    borrowingDetails: {
      id: 'loan1',
      lender: '3xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      borrower: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      loanDuration: 7,
      interestRate: 12.5,
      collateralAmount: 15.0,
      borrowedAt: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
      dueDate: Math.floor(Date.now() / 1000) + 432000, // 5 days from now
    },
  },
];

// Mock data for lending offers
const mockLendingOffers = [
  {
    id: 'listing1',
    nftId: 'item2',
    nftName: 'Pudgy Penguin #2345',
    nftImage: '/collections/pudgy.png',
    collection: 'PudgyPenguins',
    lender: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    loanDuration: 7,
    interestRate: 12.5,
    collateralRequired: 15.0,
    listedAt: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
    floorPrice: 8.8,
  },
  {
    id: 'listing2',
    nftId: 'item4',
    nftName: 'Pudgy Penguin #4567',
    nftImage: '/collections/pudgy.png',
    collection: 'PudgyPenguins',
    lender: '3xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    loanDuration: 14,
    interestRate: 10.0,
    collateralRequired: 12.0,
    listedAt: Math.floor(Date.now() / 1000) - 172800, // 2 days ago
    floorPrice: 8.8,
  },
];

export default function CollectionDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const collectionId = params.id as string;
  const action = searchParams.get('action');

  const [activeTab, setActiveTab] = useState('items');
  const [collection, setCollection] = useState(mockCollection);
  const [items, setItems] = useState(mockItems);
  const [lendingOffers, setLendingOffers] = useState(mockLendingOffers);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [isLendingModalOpen, setIsLendingModalOpen] = useState(false);
  const [isBorrowingModalOpen, setIsBorrowingModalOpen] = useState(false);

  const { connection } = useConnection();
  const wallet = useWallet();

  useEffect(() => {
    // Handle action from URL parameters
    if (action === 'lend') {
      setActiveTab('items');
    } else if (action === 'borrow') {
      setActiveTab('lending');
    }

    loadCollectionData();
  }, [collectionId, action]);

  const loadCollectionData = async () => {
    try {
      // In a real app, these would fetch data from the blockchain
      // const collectionData = await fetchCollection(collectionId);
      // const collectionItems = await fetchCollectionItems(collectionId);
      // const activeListings = await fetchActiveListings(connection);

      // For now, we'll use mock data
      setCollection(mockCollection);
      setItems(mockItems);
      setLendingOffers(mockLendingOffers);
    } catch (error) {
      console.error('Error loading collection data:', error);
      toast.error('Failed to load collection data');
    }
  };

  const handleLend = (item: any) => {
    setSelectedItem(item);
    setIsLendingModalOpen(true);
  };

  const handleBorrow = (offer: any) => {
    setSelectedOffer(offer);
    setIsBorrowingModalOpen(true);
  };

  const isOwner = (item: any) => {
    if (!wallet.publicKey) return false;
    return item.owner === wallet.publicKey.toString();
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='flex items-center mb-8'>
        <div className='w-20 h-20 rounded-full bg-gray-800 mr-6 overflow-hidden flex-shrink-0'>
          {/* Collection image placeholder */}
          <div className='w-full h-full bg-gray-700'></div>
        </div>
        <div>
          <h1 className='text-3xl font-bold text-white'>{collection.name}</h1>
          <p className='text-gray-400 mt-2 max-w-2xl'>
            {collection.description}
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
        <div className='bg-gray-900 border border-gray-800 rounded-lg p-4'>
          <p className='text-gray-400 text-sm'>Floor Price</p>
          <p className='text-xl font-bold text-white'>
            {collection.floorPrice.toFixed(2)} SOL
          </p>
        </div>
        <div className='bg-gray-900 border border-gray-800 rounded-lg p-4'>
          <p className='text-gray-400 text-sm'>Avg Lending APY</p>
          <p className='text-xl font-bold text-green-500'>
            {collection.lendingAPY.toFixed(1)}%
          </p>
        </div>
        <div className='bg-gray-900 border border-gray-800 rounded-lg p-4'>
          <p className='text-gray-400 text-sm'>Available for Lending</p>
          <p className='text-xl font-bold text-white'>
            {collection.availableForLending}
          </p>
        </div>
        <div className='bg-gray-900 border border-gray-800 rounded-lg p-4'>
          <p className='text-gray-400 text-sm'>Total Supply</p>
          <p className='text-xl font-bold text-white'>{collection.supply}</p>
        </div>
      </div>

      <div className='flex border-b border-gray-800 mb-6'>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'items'
              ? 'text-[#FF6B00] border-b-2 border-[#FF6B00]'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('items')}
        >
          Items
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'lending'
              ? 'text-[#FF6B00] border-b-2 border-[#FF6B00]'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('lending')}
        >
          Lending Offers
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'activity'
              ? 'text-[#FF6B00] border-b-2 border-[#FF6B00]'
              : 'text-gray-400 hover:text-white'
          }`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
      </div>

      {activeTab === 'items' && (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
          {items.map((item) => (
            <div
              key={item.id}
              className='bg-gray-900 border border-gray-800 rounded-lg overflow-hidden'
            >
              <div className='h-48 bg-gray-800 relative'>
                {/* Item image placeholder */}
                <div className='w-full h-full bg-gray-700'></div>

                {item.status === 'lending' && (
                  <div className='absolute top-2 left-2 px-2 py-1 bg-green-900 text-green-400 text-xs rounded'>
                    Listed for Lending
                  </div>
                )}

                {item.status === 'borrowed' && (
                  <div className='absolute top-2 left-2 px-2 py-1 bg-blue-900 text-blue-400 text-xs rounded'>
                    Borrowed
                  </div>
                )}

                <div className='absolute top-2 right-2 px-2 py-1 bg-gray-800 text-white text-xs rounded'>
                  {item.rarity}
                </div>
              </div>

              <div className='p-4'>
                <h3 className='text-white font-medium'>{item.name}</h3>

                <div className='flex justify-between items-center mt-2'>
                  <span className='text-gray-400 text-sm'>Floor</span>
                  <span className='text-white'>
                    {item.floorPrice.toFixed(2)} SOL
                  </span>
                </div>

                {item.status === 'lending' && item.lendingDetails && (
                  <div className='mt-2 pt-2 border-t border-gray-800'>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-400 text-sm'>APY</span>
                      <span className='text-green-500'>
                        {item.lendingDetails.interestRate}%
                      </span>
                    </div>
                    <div className='flex justify-between items-center mt-1'>
                      <span className='text-gray-400 text-sm'>Duration</span>
                      <span className='text-white'>
                        {item.lendingDetails.loanDuration} days
                      </span>
                    </div>
                  </div>
                )}

                <div className='mt-4'>
                  {item.status === 'available' && isOwner(item) && (
                    <button
                      className='w-full py-2 bg-[#FF6B00] text-white rounded hover:bg-[#FF8C40] transition-all'
                      onClick={() => handleLend(item)}
                    >
                      Lend
                    </button>
                  )}

                  {item.status === 'lending' && !isOwner(item) && (
                    <button
                      className='w-full py-2 bg-[#FF6B00] text-white rounded hover:bg-[#FF8C40] transition-all'
                      onClick={() => handleBorrow(item.lendingDetails)}
                    >
                      Borrow
                    </button>
                  )}

                  {item.status === 'lending' && isOwner(item) && (
                    <button
                      className='w-full py-2 bg-[#FF6B00] text-white rounded hover:bg-[#FF8C40] transition-all'
                      onClick={() => handleLend(item)}
                    >
                      Edit Listing
                    </button>
                  )}

                  {item.status === 'borrowed' && (
                    <button
                      className='w-full py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-all'
                      disabled
                    >
                      Currently Borrowed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'lending' && (
        <div className='overflow-x-auto'>
          <table className='min-w-full'>
            <thead>
              <tr className='text-left text-gray-400 text-sm'>
                <th className='py-3 px-4 font-medium'>NFT</th>
                <th className='py-3 px-4 font-medium'>DURATION</th>
                <th className='py-3 px-4 font-medium'>INTEREST</th>
                <th className='py-3 px-4 font-medium'>COLLATERAL</th>
                <th className='py-3 px-4 font-medium'>LISTED</th>
                <th className='py-3 px-4 font-medium'>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {lendingOffers.map((offer) => (
                <tr
                  key={offer.id}
                  className='border-t border-gray-800 hover:bg-gray-900'
                >
                  <td className='py-4 px-4'>
                    <div className='flex items-center'>
                      <div className='w-10 h-10 rounded-md bg-gray-800 mr-3 overflow-hidden flex-shrink-0'>
                        {/* NFT image placeholder */}
                        <div className='w-full h-full bg-gray-700'></div>
                      </div>
                      <div>
                        <div className='text-white'>{offer.nftName}</div>
                        <div className='text-gray-400 text-sm'>
                          {offer.collection}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className='py-4 px-4 text-white'>
                    {offer.loanDuration} days
                  </td>
                  <td className='py-4 px-4 text-green-500'>
                    {offer.interestRate}%
                  </td>
                  <td className='py-4 px-4 text-white'>
                    {offer.collateralRequired.toFixed(2)} SOL
                  </td>
                  <td className='py-4 px-4 text-white'>
                    {new Date(offer.listedAt * 1000).toLocaleDateString()}
                  </td>
                  <td className='py-4 px-4'>
                    {!isOwner({ owner: offer.lender }) && (
                      <button
                        className='px-3 py-1 bg-[#FF6B00] text-white text-sm rounded hover:bg-[#FF8C40]'
                        onClick={() => handleBorrow(offer)}
                      >
                        Borrow
                      </button>
                    )}
                    {isOwner({ owner: offer.lender }) && (
                      <button className='px-3 py-1 bg-gray-700 text-white text-sm rounded hover:bg-gray-600'>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className='bg-gray-900 border border-gray-800 rounded-lg p-8 text-center'>
          <h3 className='text-lg text-white mb-2'>Activity coming soon</h3>
          <p className='text-gray-400'>
            Transaction history for this collection will be available soon.
          </p>
        </div>
      )}

      {/* Modals */}
      {selectedItem && (
        <LendingModal
          isOpen={isLendingModalOpen}
          onClose={() => setIsLendingModalOpen(false)}
          nft={{
            id: selectedItem.id,
            name: selectedItem.name,
            image: selectedItem.image,
            collection: selectedItem.collection,
            floorPrice: selectedItem.floorPrice,
          }}
        />
      )}

      {selectedOffer && (
        <BorrowingModal
          isOpen={isBorrowingModalOpen}
          onClose={() => setIsBorrowingModalOpen(false)}
          offer={selectedOffer}
        />
      )}
    </div>
  );
}
