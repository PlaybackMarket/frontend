'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useNetwork } from '@/contexts/NetworkContext';
import { Collection, fetchAllCollections } from '@/services/collectionService';
import { toast } from 'react-hot-toast';

export function CollectionsTable() {
  const { network } = useNetwork();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState('collections');

  // Fetch collections when the network changes
  useEffect(() => {
    const loadCollections = async () => {
      setLoading(true);
      try {
        const isMainnet = network.name === 'mainnet';
        const fetchedCollections = await fetchAllCollections(isMainnet);
        setCollections(fetchedCollections);
      } catch (error) {
        console.error('Error loading collections:', error);
        toast.error('Failed to load collections');
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, [network]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }

    // Sort the collections based on the selected field and direction
    const sortedCollections = [...collections].sort((a, b) => {
      const aValue = a[field as keyof typeof a];
      const bValue = b[field as keyof typeof b];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setCollections(sortedCollections);
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;

    return <span className='ml-1'>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className='w-full overflow-x-auto'>
      <div className='flex space-x-4 mb-4 border-b border-gray-800'>
        <button
          onClick={() => setActiveTab('collections')}
          className={`font-medium py-2 uppercase tracking-wider blur-tab ${
            activeTab === 'collections'
              ? 'text-[#FF6B00] border-b-2 border-[#FF6B00] active'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          COLLECTIONS
        </button>
        <button
          onClick={() => setActiveTab('lending')}
          className={`font-medium py-2 uppercase tracking-wider blur-tab ${
            activeTab === 'lending'
              ? 'text-[#FF6B00] border-b-2 border-[#FF6B00] active'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          LENDING OFFERS
        </button>
        <button
          onClick={() => setActiveTab('borrowing')}
          className={`font-medium py-2 uppercase tracking-wider blur-tab ${
            activeTab === 'borrowing'
              ? 'text-[#FF6B00] border-b-2 border-[#FF6B00] active'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          BORROWING OFFERS
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`font-medium py-2 uppercase tracking-wider blur-tab ${
            activeTab === 'assets'
              ? 'text-[#FF6B00] border-b-2 border-[#FF6B00] active'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          MY ASSETS
        </button>
      </div>

      {loading ? (
        <div className='flex justify-center items-center py-20'>
          <div className='w-10 h-10 border-4 border-gray-600 border-t-[#FF6B00] rounded-full blur-loading'></div>
          <span className='ml-3 text-gray-400'>Loading collections...</span>
        </div>
      ) : collections.length === 0 ? (
        <div className='bg-gray-900 border border-gray-800 rounded-lg p-8 text-center'>
          <h3 className='text-lg text-white mb-2'>No collections found</h3>
          <p className='text-gray-400 mb-4'>
            {network.name === 'mainnet'
              ? 'No collections found on mainnet.'
              : 'No collections found on testnet. Try switching to mainnet.'}
          </p>
        </div>
      ) : (
        <table className='min-w-full'>
          <thead>
            <tr className='text-left text-gray-400 text-sm uppercase tracking-wider'>
              <th
                className='py-3 px-4 font-medium cursor-pointer hover:text-white transition-colors'
                onClick={() => handleSort('name')}
              >
                COLLECTION {renderSortIcon('name')}
              </th>
              <th
                className='py-3 px-4 font-medium cursor-pointer hover:text-white transition-colors'
                onClick={() => handleSort('floorPrice')}
              >
                FLOOR PRICE {renderSortIcon('floorPrice')}
              </th>
              <th
                className='py-3 px-4 font-medium cursor-pointer hover:text-white transition-colors'
                onClick={() => handleSort('lendingAPY')}
              >
                LENDING APY {renderSortIcon('lendingAPY')}
              </th>
              <th
                className='py-3 px-4 font-medium cursor-pointer hover:text-white transition-colors'
                onClick={() => handleSort('collateralRequired')}
              >
                COLLATERAL {renderSortIcon('collateralRequired')}
              </th>
              <th
                className='py-3 px-4 font-medium cursor-pointer hover:text-white transition-colors'
                onClick={() => handleSort('availableForLending')}
              >
                AVAILABLE {renderSortIcon('availableForLending')}
              </th>
              <th
                className='py-3 px-4 font-medium cursor-pointer hover:text-white transition-colors'
                onClick={() => handleSort('totalLent')}
              >
                TOTAL LENT {renderSortIcon('totalLent')}
              </th>
              <th
                className='py-3 px-4 font-medium cursor-pointer hover:text-white transition-colors'
                onClick={() => handleSort('totalBorrowed')}
              >
                TOTAL BORROWED {renderSortIcon('totalBorrowed')}
              </th>
              <th className='py-3 px-4 font-medium'>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((collection) => (
              <tr
                key={collection.id}
                className='border-t border-gray-800 hover:bg-gray-900 blur-card'
              >
                <td className='py-4 px-4'>
                  <div className='flex items-center'>
                    <div className='w-10 h-10 rounded-full bg-gray-800 mr-3 overflow-hidden flex-shrink-0'>
                      {collection.image ? (
                        <img
                          src={collection.image}
                          alt={collection.name}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <div className='w-full h-full bg-gray-700'></div>
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/collection/${collection.id}`}
                        className='text-white hover:text-[#FF6B00] blur-text-hover flex items-center'
                      >
                        {collection.name}
                        {collection.verified && (
                          <svg
                            className='ml-1 w-4 h-4 text-blue-500'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path
                              fillRule='evenodd'
                              d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                              clipRule='evenodd'
                            />
                          </svg>
                        )}
                      </Link>
                      {collection.symbol && (
                        <div className='text-gray-400 text-xs'>
                          {collection.symbol}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className='py-4 px-4 text-white'>
                  {collection.floorPrice > 0
                    ? `${collection.floorPrice.toFixed(2)} SOL`
                    : 'N/A'}
                </td>
                <td className='py-4 px-4 text-green-500'>
                  {collection.lendingAPY.toFixed(1)}%
                </td>
                <td className='py-4 px-4 text-white'>
                  {collection.collateralRequired}%
                </td>
                <td className='py-4 px-4 text-white'>
                  {collection.availableForLending}
                </td>
                <td className='py-4 px-4 text-white'>{collection.totalLent}</td>
                <td className='py-4 px-4 text-white'>
                  {collection.totalBorrowed}
                </td>
                <td className='py-4 px-4'>
                  <div className='flex space-x-2'>
                    <Link
                      href={`/collection/${collection.id}?action=lend`}
                      className='px-3 py-1 bg-[#FF6B00] text-white text-sm rounded hover:bg-[#FF8C40] transition-all blur-button'
                    >
                      Lend
                    </Link>
                    <Link
                      href={`/collection/${collection.id}?action=borrow`}
                      className='px-3 py-1 bg-[#FF6B00] text-white text-sm rounded hover:bg-[#FF8C40] transition-all blur-button'
                    >
                      Borrow
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
