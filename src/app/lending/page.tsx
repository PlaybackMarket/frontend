"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useNetwork } from "@/contexts/NetworkContext";
import { Collection, fetchAllCollections } from "@/services/collectionService";
import { toast } from "react-hot-toast";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

import { PublicKey } from "@solana/web3.js";

export default function LendingPage() {
  const { network } = useNetwork();
  const wallet = useWallet();
  const { connection } = useConnection();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNft, setSelectedNft] = useState<Collection | null>(null);
  const [activeTab, setActiveTab] = useState("deposit"); // 'deposit' or 'withdraw'
  const [lendingParams, setLendingParams] = useState({
    loanDuration: "",
    interestRate: "",
    collateralAmount: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch collections when the network changes
  useEffect(() => {
    const loadCollections = async () => {
      setIsLoading(true);
      try {
        const isMainnet = network.name === "mainnet";
        const fetchedCollections = await fetchAllCollections(isMainnet);
        setCollections(fetchedCollections);
      } catch (error) {
        console.error("Error loading collections:", error);
        toast.error("Failed to load collections");
      } finally {
        setIsLoading(false);
      }
    };

    loadCollections();
  }, [network]);

  const handleCollectionSelect = (collection: Collection) => {
    setSelectedNft(collection);
  };

  const handleLendingParamsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setLendingParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitLending = async () => {
    if (!selectedNft || !wallet.publicKey) {
      toast.error("Please select an NFT and connect your wallet");
      return;
    }

    try {
      setIsSubmitting(true);

      // Validate inputs
      const loanDuration = Number(lendingParams.loanDuration);
      const interestRate = Number(lendingParams.interestRate);
      const collateralAmount = Number(lendingParams.collateralAmount);

      if (
        isNaN(loanDuration) ||
        isNaN(interestRate) ||
        isNaN(collateralAmount)
      ) {
        toast.error("Please enter valid numbers for all fields");
        return;
      }

      // Call the lending service
      // const signature = await listNFT(
      //   connection,
      //   wallet,
      //   new PublicKey(selectedNft.id),
      //   loanDuration,
      //   interestRate,
      //   collateralAmount
      // );

      // toast.success('NFT listed successfully!');
      // console.log('Transaction signature:', signature);

      // // Reset form
      // setLendingParams({
      //   loanDuration: '',
      //   interestRate: '',
      //   collateralAmount: '',
      // });
    } catch (error) {
      console.error("Error listing NFT:", error);
      toast.error("Failed to list NFT. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Column headers for the collections table
  const renderTableHeaders = () => {
    return (
      <div className="flex items-center px-6 py-3 mb-2 text-[#a0a0a0]">
        <div className="w-[270px] text-left font-medium uppercase font-jost text-sm tracking-tight">
          Collection
        </div>
        <div className="w-[125px] text-left font-medium uppercase font-jost text-sm tracking-tight">
          Floor Price
        </div>
        <div className="w-[125px] text-left font-medium uppercase font-jost text-sm tracking-tight">
          Collateral
        </div>
        <div className="w-[125px] text-left font-medium uppercase font-jost text-sm tracking-tight">
          Lending APY
        </div>
        <div className="w-[110px] text-left font-medium uppercase font-jost text-sm tracking-tight">
          Available
        </div>
        <div className="w-[110px] text-left font-medium uppercase font-jost text-sm tracking-tight">
          Total Lent
        </div>
        <div className="w-[160px] text-left font-medium uppercase font-jost text-sm tracking-tight">
          Total Borrowed
        </div>
        <div className="w-[100px] text-left font-medium uppercase font-jost text-sm tracking-tight">
          Status
        </div>
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
                src={collection.logo || "https://placehold.co/40x40"}
                alt={collection.name || "Collection"}
                width={40}
                height={40}
                className="w-10 h-10 rounded-[91px] mr-4"
              />
              <div className="text-[#f8f8f8] text-base font-normal font-jost tracking-tight">
                {collection.name || "Collection Name/COIN"}
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
              {Math.random() > 0.5 ? "12.5%" : "4.5%"}
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
    <div className="min-h-screen px-6" style={{ background: "transparent" }}>
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
                  <h1 className="text-3xl font-bold text-white mb-1">
                    Lending
                  </h1>
                  <p className="text-gray-400">
                    Lend to borrowers and earn interest on your assets
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
                        {collections.map((collection, index) =>
                          renderCollectionRow(collection, index)
                        )}
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
                  height={990}
                  className="w-full"
                  style={{ height: "990px" }}
                />
                <div className="absolute top-0 left-0 w-full h-full flex flex-col pt-[8px] px-[8px]">
                  {/* Tabs - Positioned at the same spot as borrow page */}
                  <div className="flex relative h-[42px] mb-5 px-3">
                    {/* Deposit Button */}
                    <button
                      className={`flex-1 py-2 px-2 relative flex items-center justify-center z-10 ${
                        activeTab === "deposit"
                          ? "text-white"
                          : "text-gray-400 hover:text-white"
                      }`}
                      onClick={() => setActiveTab("deposit")}
                    >
                      {activeTab === "deposit" ? (
                        <svg
                          className="absolute inset-0 w-full h-full"
                          preserveAspectRatio="none"
                        >
                          <rect
                            width="100%"
                            height="100%"
                            fill="#3477FF"
                            fillOpacity="0.3"
                            stroke="#5C89E1"
                          />
                        </svg>
                      ) : null}
                      <span className="relative z-10 font-regular text-[16px]">
                        DEPOSIT
                      </span>
                    </button>

                    {/* Withdraw Button */}
                    <button
                      className={`flex-1 py-2 px-2 relative flex items-center justify-center z-10 ${
                        activeTab === "withdraw"
                          ? "text-white"
                          : "text-gray-400 hover:text-white"
                      }`}
                      onClick={() => setActiveTab("withdraw")}
                    >
                      {activeTab === "withdraw" ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="absolute inset-0 w-full h-full"
                          viewBox="0 0 162 42"
                          fill="none"
                          preserveAspectRatio="none"
                        >
                          <path
                            d="M0.5 0.5H109.824L160.083 41H0.5V0.5Z"
                            fill="#3477FF"
                            fillOpacity="0.3"
                            stroke="#5C89E1"
                          />
                        </svg>
                      ) : null}
                      <span className="relative z-10 font-regular text-[16px] pr-5">
                        WITHDRAW
                      </span>
                    </button>
                  </div>

                  {/* NFT Details Form */}
                  {selectedNft && activeTab === "deposit" && (
                    <div className="flex-1 p-4">
                      <div className="mb-4">
                        <h3 className="text-white text-lg font-semibold mb-2">
                          {selectedNft.name}
                        </h3>
                        {selectedNft.logo && (
                          <Image
                            src={selectedNft.logo}
                            alt={selectedNft.name}
                            width={200}
                            height={200}
                            className="w-full rounded-lg mb-4"
                          />
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Loan Duration (days)
                          </label>
                          <input
                            type="number"
                            name="loanDuration"
                            value={lendingParams.loanDuration}
                            onChange={handleLendingParamsChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            placeholder="Enter duration in days"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Interest Rate (%)
                          </label>
                          <input
                            type="number"
                            name="interestRate"
                            value={lendingParams.interestRate}
                            onChange={handleLendingParamsChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            placeholder="Enter interest rate"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Collateral Amount (SOL)
                          </label>
                          <input
                            type="number"
                            name="collateralAmount"
                            value={lendingParams.collateralAmount}
                            onChange={handleLendingParamsChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            placeholder="Enter collateral amount"
                          />
                        </div>

                        <button
                          onClick={handleSubmitLending}
                          disabled={isSubmitting}
                          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? "Listing..." : "List NFT for Lending"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Withdraw Form */}
                  {activeTab === "withdraw" && (
                    <div className="flex-1 p-4">
                      <h3 className="text-white text-lg font-semibold mb-4">
                        Withdraw NFT
                      </h3>
                      <p className="text-gray-400">
                        Select an NFT from your listings to withdraw it from
                        lending.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
