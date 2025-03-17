'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useNetwork } from '@/contexts/NetworkContext';
import { Collection, fetchAllCollections } from '@/services/collectionService';
import { toast } from 'react-hot-toast';
import { useWallet } from '@solana/wallet-adapter-react';

export default function BorrowPage() {
  const { network } = useNetwork();
  const wallet = useWallet();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNft, setSelectedNft] = useState<Collection | null>(null);
  const [activeTab, setActiveTab] = useState('borrow'); // 'borrow' or 'repay'

  // Fetch collections when the network changes
  useEffect(() => {
    const loadCollections = async () => {
      setIsLoading(true);
      try {
        const isMainnet = network.name === 'mainnet';
        const fetchedCollections = await fetchAllCollections(isMainnet);
        setCollections(fetchedCollections);
      } catch (error) {
        console.error('Error loading collections:', error);
        toast.error('Failed to load collections');
      } finally {
        setIsLoading(false);
      }
    };

    loadCollections();
  }, [network]);

  const handleCollectionSelect = (collection: Collection) => {
    setSelectedNft(collection);
  };

  // Column headers for the collections table
  const renderTableHeaders = () => {
    return (
      <div className="flex items-center px-6 py-3 mb-2 text-[#a0a0a0]">
        <div className="w-[270px] text-left font-medium uppercase font-jost text-sm tracking-tight">Collection</div>
        <div className="w-[125px] text-left font-medium uppercase font-jost text-sm tracking-tight">Floor Price</div>
        <div className="w-[125px] text-left font-medium uppercase font-jost text-sm tracking-tight">Collateral</div>
        <div className="w-[125px] text-left font-medium uppercase font-jost text-sm tracking-tight">Lending APY</div>
        <div className="w-[110px] text-left font-medium uppercase font-jost text-sm tracking-tight">Available</div>
        <div className="w-[110px] text-left font-medium uppercase font-jost text-sm tracking-tight">Total Lent</div>
        <div className="w-[160px] text-left font-medium uppercase font-jost text-sm tracking-tight">Total Borrowed</div>
        <div className="w-[100px] text-left font-medium uppercase font-jost text-sm tracking-tight">Status</div>
      </div>
    );
  };

  // Individual collection row
  const renderCollectionRow = (collection: Collection, index: number) => {
    return (
      <div 
        key={index} 
        className="relative mb-2 cursor-pointer group"
        onClick={() => handleCollectionSelect(collection)}
      >
        {/* SVG Container with Angled Corners */}
        <div className="relative w-full h-[99px] transition-all duration-200">
          {/* Default state SVG - visible by default, hidden on hover */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="100%" 
            height="99" 
            viewBox="0 0 1280 99" 
            fill="none"
            className="absolute top-0 left-0 w-full group-hover:opacity-0 transition-opacity duration-200"
            preserveAspectRatio="none"
          >
            <path 
              d="M1238.04 0.737442L1278.81 26.8772C1279.24 27.153 1279.5 27.6289 1279.5 28.1399V68.8918V97.0001C1279.5 97.8285 1278.83 98.5001 1278 98.5001L25.9246 98.5001C25.5875 98.5001 25.2603 98.3865 24.9957 98.1778L1.07102 79.306C0.710416 79.0215 0.5 78.5876 0.5 78.1283L0.5 2.25481C0.5 1.4265 1.17138 0.754974 1.99969 0.754807L1237.23 0.500183C1237.52 0.500122 1237.8 0.582458 1238.04 0.737442Z" 
              stroke="#5C89E1" 
              strokeOpacity="0.2"
            />
          </svg>
          
          {/* Hover state SVG - hidden by default, visible on hover */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="100%" 
            height="99" 
            viewBox="0 0 1280 99" 
            fill="none"
            className="absolute top-0 left-0 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            preserveAspectRatio="none"
          >
            <path 
              d="M1238.04 0.737442L1278.81 26.8772C1279.24 27.153 1279.5 27.6289 1279.5 28.1399V68.8918V97.0001C1279.5 97.8285 1278.83 98.5001 1278 98.5001L25.9246 98.5001C25.5875 98.5001 25.2603 98.3865 24.9957 98.1778L1.07102 79.306C0.710416 79.0215 0.5 78.5876 0.5 78.1283L0.5 2.25481C0.5 1.4265 1.17138 0.754974 1.99969 0.754807L1237.23 0.500183C1237.52 0.500122 1237.8 0.582458 1238.04 0.737442Z" 
              stroke="#5C89E1" 
              strokeOpacity="1"
            />
          </svg>
          
          {/* Collection Content */}
          <div className="absolute inset-0 flex items-center z-10">
            {/* Collection Image and Name */}
            <div className="flex items-center ml-6">
              <Image 
                src={collection.logo || 'https://placehold.co/40x40'} 
                alt={collection.name || 'Collection'} 
                width={40}
                height={40}
                className="w-10 h-10 rounded-[91px] mr-4"
              />
              <div className="text-[#f8f8f8] text-base font-normal font-jost tracking-tight">
                {collection.name || 'Collection Name/COIN'}
              </div>
            </div>
            
            {/* Collection Details - Using absolute positioning as in the original design */}
            <div className="absolute left-[305px] text-[#f8f8f8] text-base font-normal font-jost tracking-tight">
              1.5 Sonic
            </div>
            
            <div className="absolute left-[438px] text-[#f8f8f8] text-base font-normal font-jost tracking-tight">
              100%
            </div>
            
            <div className="absolute left-[568px] text-[#5bff9c] text-base font-normal font-jost tracking-tight">
              {Math.random() > 0.5 ? '12.5%' : '4.5%'}
            </div>
            
            <div className="absolute left-[700px] text-white text-base font-normal font-jost tracking-tight">
              {Math.floor(Math.random() * 20) || 10}
            </div>
            
            <div className="absolute left-[786px] text-[#f8f8f8] text-base font-normal font-jost tracking-tight">
              Total Lent
            </div>
            
            <div className="absolute left-[900px] text-[#f8f8f8] text-base font-normal font-jost tracking-tight">
              Total Borrowed
            </div>
            
            {/* Status Badge */}
            <div className="absolute left-[1032px] w-[98px] h-[34px] bg-[#cbea08]/10 rounded-full flex items-center">
              <div className="w-1.5 h-1.5 ml-3 bg-[#eae208] rounded-full"></div>
              <div className="ml-2 text-[#eae208] text-base font-normal font-jost leading-tight">
                Ongoing
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen  px-6" style={{ background: 'transparent' }}>
      <div className="relative">
        {/* Main Container with Angular Design */}
        <div className="relative">
          <Image
            src="/outer-div-main.svg"
            alt="Container Background"
            width={1200}
            height={800}
            className="w-full h-auto"
          />

          <div className="absolute top-0 left-0 w-full h-full p-4">
            {/* Content wrapper */}
            <div className="flex h-full">
              {/* Left side - Table section */}
              <div className="flex-grow pr-6">
                <div className="mb-6 pt-6 pl-12">
                  <h1 className="text-3xl font-bold text-white mb-1">Borrow</h1>
                  <p className="text-gray-400">
                    Get instant liquidity using your NFTs as collateral
                  </p>
                </div>

                {/* Collections List */}
                <div className="pl-8">
                  {isLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="text-white">Loading collections...</div>
                    </div>
                  ) : (
                    <>
                      {/* Table Headers */}
                      {renderTableHeaders()}
                      
                      {/* Collection Rows */}
                      <div className="mt-2">
                        {collections.map((collection, index) => (
                          renderCollectionRow(collection, index)
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right side - NFT details */}
              <div className="w-[350px] relative">
                <Image
                  src="/nft-panel.svg"
                  alt="NFT Panel Background"
                  width={350}
                  height={600}
                  className="w-full h-auto absolute top-0 left-0 z-0"
                />
                <div className="relative z-10 p-2">
                  {/* Tabs */}
                  <div className="flex mb-4 relative h-[42px]">
                    {/* Borrow Button */}
                    <button
                      className={`flex-1 py-2 px-4 relative flex items-center justify-center z-10 ${
                        activeTab === 'borrow' ? 'text-white' : 'text-gray-400 hover:text-white'
                      }`}
                      onClick={() => setActiveTab('borrow')}
                    >
                      {activeTab === 'borrow' ? (
                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                          <rect width="100%" height="100%" fill="#3477FF" fillOpacity="0.3" stroke="#5C89E1" />
                        </svg>
                      ) : null}
                      <span className="relative z-10 font-regular text-[16px]">BORROW</span>
                    </button>
                    
                    {/* Repay Button */}
                    <button
                      className={`flex-1 py-2 px-4 relative flex items-center justify-center z-10 ${
                        activeTab === 'repay' ? 'text-white' : 'text-gray-400 hover:text-white'
                      }`}
                      onClick={() => setActiveTab('repay')}
                    >
                      {activeTab === 'repay' ? (
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="absolute inset-0 w-full h-full"
                          viewBox="0 0 162 42" 
                          fill="none"
                          preserveAspectRatio="none"
                        >
                          <path d="M0.5 0.5H109.824L160.083 41H0.5V0.5Z" fill="#3477FF" fillOpacity="0.3" stroke="#5C89E1"/>
                        </svg>
                      ) : null}
                      <span className="relative z-10 font-regular text-[16px] pr-3">REPAY</span>
                    </button>
                  </div>

                  {/* NFT Display */}
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-white mb-2 pl-2">NFT Name</h3>
                    <div className="bg-[#0A031F] h-64 rounded-lg mb-4 flex items-center justify-center">
                      {selectedNft ? (
                        <Image 
                          src={selectedNft.logo || '/collections/numbers.png'} 
                          alt={selectedNft.name} 
                          width={200}
                          height={200}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="text-gray-500">Select an NFT from the table</div>
                      )}
                    </div>
                  </div>

                  {/* APY Circle */}
                  <div className="flex justify-center mb-6">
                    <div className="relative w-36 h-36">
                      <svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144" fill="none" className="absolute top-0 left-0">
                        <circle cx="72" cy="72" r="68.5" fill="#5CFF9D" fillOpacity="0.2" stroke="#5CFF9D" strokeWidth="7"/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-sm text-white mb-1">Borrow APY</div>
                          <div className="text-2xl font-bold text-white">4.5%</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Traits */}
                  <div className="mb-2 px-2">
                    <div className="border border-[#5C89E1]/20 bg-[#162A67]/30">
                      {/* Fixed header */}
                      <div className="px-4 py-3 border-b border-gray-800/30">
                    <h3 className="text-lg font-medium text-white mb-2">Traits - 12</h3>
                        <div className="flex w-full text-sm">
                          <div className="w-1/3 text-left font-medium uppercase text-gray-400">ATTRIBUTE</div>
                          <div className="w-1/3 text-left font-medium uppercase text-gray-400">TRAIT</div>
                          <div className="w-1/3 text-left font-medium uppercase text-gray-400">STAT</div>
                        </div>
                      </div>
                      
                      {/* Scrollable content */}
                      <div className="max-h-60 overflow-y-auto px-4 py-2">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="flex py-2 border-b border-gray-800/10 text-sm">
                            <div className="w-1/3 text-white">Attribute</div>
                            <div className="w-1/3 text-white">Trait</div>
                            <div className="w-1/3 text-white">Stat</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Borrow Button */}
                  <div className="flex justify-center">
                    <button 
                      className="w-[95.5%] bg-blue-600 hover:bg-blue-700 text-white py-3 font-medium"
                      disabled={!wallet.connected || !selectedNft}
                    >
                      {activeTab === 'borrow' ? 'BORROW' : 'REPAY'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 