"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LendingModal } from "@/components/LendingModal";
import { BorrowingModal } from "@/components/BorrowingModal";
import { fetchActiveListings } from "@/services/lendingService";
import {
  fetchCollectionById,
  fetchNFTsInCollection,
  NFT,
  Collection,
} from "@/services/collectionService";
import { useNetwork } from "@/contexts/NetworkContext";
import { toast } from "react-hot-toast";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import idl from "@/sc/sonic.json";

// Define interfaces for our data
interface CollectionData extends Collection {
  description?: string;
  supply?: number;
}

interface LendingOffer {
  id: string;
  nftId: string;
  nftName: string;
  nftImage: string;
  collection: string;
  lender: string;
  loanDuration: number;
  interestRate: number;
  collateralRequired: number;
  listedAt: number;
  floorPrice: number;
}

export default function CollectionDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const collectionId = params.id as string;
  const action = searchParams.get("action");
  const { network } = useNetwork();

  const [activeTab, setActiveTab] = useState("items");
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [items, setItems] = useState<NFT[]>([]);
  const [lendingOffers, setLendingOffers] = useState<LendingOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<NFT | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<LendingOffer | null>(null);
  const [isLendingModalOpen, setIsLendingModalOpen] = useState(false);
  const [isBorrowingModalOpen, setIsBorrowingModalOpen] = useState(false);

  const { connection } = useConnection();
  const wallet = useWallet();

  useEffect(() => {
    // Handle action from URL parameters
    if (action === "lend") {
      setActiveTab("items");
    } else if (action === "borrow") {
      setActiveTab("lending");
    }

    loadCollectionData();
  }, [collectionId, action, network]);

  const loadCollectionData = async () => {
    setLoading(true);
    try {
      const isMainnet = network.name === "mainnet";

      // Fetch collection data
      const collectionData = await fetchCollectionById(collectionId, isMainnet);
      if (!collectionData) {
        toast.error("Collection not found");
        setLoading(false);
        return;
      }

      // Add a description if not present
      const collectionWithDescription: CollectionData = {
        ...collectionData,
        description:
          collectionData.description ||
          `A collection of NFTs on the Sonic SVM network. Collection ID: ${collectionId}`,
        supply:
          collectionData.availableForLending +
          collectionData.totalLent +
          collectionData.totalBorrowed,
      };

      setCollection(collectionWithDescription);

      // Fetch NFTs in the collection
      const nfts = await fetchNFTsInCollection(collectionId, isMainnet);
      setItems(nfts);
      // Fetch active lending listings from the blockchain
      const activeOffers = await fetchActiveListings(connection);
      setLendingOffers(activeOffers);
    } catch (error) {
      console.error("Error loading collection data:", error);
      toast.error("Failed to load collection data");
    } finally {
      setLoading(false);
    }
  };

  const handleLend = (item: NFT) => {
    setSelectedItem(item);
    setIsLendingModalOpen(true);
  };

  const handleBorrow = (offer: LendingOffer) => {
    setSelectedOffer(offer);
    setIsBorrowingModalOpen(true);
  };

  const isOwner = (item: NFT) => {
    if (!wallet.publicKey) return false;
    return item.owner === wallet.publicKey.toString();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-gray-600 border-t-[#0099FF] rounded-full blur-loading"></div>
        <span className="ml-4 text-gray-400">Loading collection...</span>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          Collection Not Found
        </h2>
        <p className="text-gray-400">
          The collection you're looking for doesn't exist or couldn't be loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-gray-800 mr-6 overflow-hidden flex-shrink-0">
          {collection.image ? (
            <img
              src={collection.image}
              alt={collection.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500 font-bold">
              {collection.symbol || collection.name.substring(0, 2)}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            {collection.name}
            {collection.verified && (
              <svg
                className="ml-2 w-6 h-6 text-blue-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </h1>
          <p className="text-gray-400 mt-2 max-w-2xl">
            {collection.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 blur-card">
          <p className="text-gray-400 text-sm">Floor Price</p>
          <p className="text-xl font-bold text-white">
            {collection.floorPrice.toFixed(2)} SOL
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 blur-card">
          <p className="text-gray-400 text-sm">Avg Lending APY</p>
          <p className="text-xl font-bold text-green-500">
            {collection.lendingAPY.toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 blur-card">
          <p className="text-gray-400 text-sm">Available for Lending</p>
          <p className="text-xl font-bold text-white">
            {collection.availableForLending}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 blur-card">
          <p className="text-gray-400 text-sm">Total Supply</p>
          <p className="text-xl font-bold text-white">
            {collection.supply || "Unknown"}
          </p>
        </div>
      </div>

      <div className="flex border-b border-gray-800 mb-6">
        <button
          className={`px-4 py-2 font-medium blur-tab ${
            activeTab === "items"
              ? "text-[#0099FF] border-b-2 border-[#0099FF] active"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("items")}
        >
          Items
        </button>
        <button
          className={`px-4 py-2 font-medium blur-tab ${
            activeTab === "lending"
              ? "text-[#0099FF] border-b-2 border-[#0099FF] active"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("lending")}
        >
          Lending Offers
        </button>
        <button
          className={`px-4 py-2 font-medium blur-tab ${
            activeTab === "activity"
              ? "text-[#0099FF] border-b-2 border-[#0099FF] active"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("activity")}
        >
          Activity
        </button>
      </div>

      {activeTab === "items" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-400">No items found in this collection</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden blur-card"
              >
                <div className="aspect-square bg-gray-800 relative">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  )}
                  {item.listed && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      Listed
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-white font-medium mb-2">{item.name}</h3>
                  {item.attributes && item.attributes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.attributes.slice(0, 3).map((attr, index) => (
                        <span
                          key={index}
                          className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded"
                        >
                          {attr.trait_type}: {attr.value}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-gray-400 text-sm">
                      {item.price
                        ? `${item.price.toFixed(2)} SOL`
                        : "Not listed"}
                    </div>
                    <button
                      onClick={() => handleLend(item)}
                      className="px-3 py-1 bg-[#0099FF] text-white text-sm rounded hover:bg-[#33ADFF] transition-all blur-button"
                      disabled={!wallet.connected}
                    >
                      Lend
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "lending" && (
        <div className="overflow-x-auto">
          {lendingOffers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No lending offers available</p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm uppercase tracking-wider">
                  <th className="py-3 px-4 font-medium">NFT</th>
                  <th className="py-3 px-4 font-medium">Lender</th>
                  <th className="py-3 px-4 font-medium">Duration</th>
                  <th className="py-3 px-4 font-medium">Interest Rate</th>
                  <th className="py-3 px-4 font-medium">Collateral</th>
                  <th className="py-3 px-4 font-medium">Listed</th>
                  <th className="py-3 px-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {lendingOffers.map((offer) => (
                  <tr
                    key={offer.id}
                    className="border-t border-gray-800 hover:bg-gray-900 blur-card"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded bg-gray-800 mr-3 overflow-hidden flex-shrink-0">
                          {offer.nftImage ? (
                            <img
                              src={offer.nftImage}
                              alt={offer.nftName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-700"></div>
                          )}
                        </div>
                        <div className="text-white">{offer.nftName}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white">
                      {offer.lender.slice(0, 4)}...{offer.lender.slice(-4)}
                    </td>
                    <td className="py-4 px-4 text-white">
                      {offer.loanDuration} days
                    </td>
                    <td className="py-4 px-4 text-green-500">
                      {offer.interestRate.toFixed(1)}%
                    </td>
                    <td className="py-4 px-4 text-white">
                      {offer.collateralRequired.toFixed(2)} SOL
                    </td>
                    <td className="py-4 px-4 text-gray-400">
                      {new Date(offer.listedAt * 1000).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleBorrow(offer)}
                        className="px-3 py-1 bg-[#0099FF] text-white text-sm rounded hover:bg-[#33ADFF] transition-all blur-button"
                        disabled={!wallet.connected}
                      >
                        Borrow
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "activity" && (
        <div className="text-center py-12">
          <p className="text-gray-400">Activity history coming soon</p>
        </div>
      )}

      {selectedItem && (
        <LendingModal
          isOpen={isLendingModalOpen}
          onClose={() => setIsLendingModalOpen(false)}
          nft={{
            id: selectedItem.id,
            name: selectedItem.name,
            image: selectedItem.image || "",
            collection: collection.name,
            floorPrice: collection.floorPrice,
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
