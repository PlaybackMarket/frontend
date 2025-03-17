"use client";

import { Fragment, useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  useWallet,
  Wallet as SolanaWallet,
} from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";

interface WalletModalProps {
  onClose: () => void;
}

export function WalletModal({ onClose }: WalletModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const {
    wallets,
    select,
    connecting,
    connected,
    disconnect,
    wallet: selectedAdapter,
    publicKey,
  } = useWallet();

  // Handle mounting
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleWalletSelect = (wallet: SolanaWallet) => {
    setSelectedWallet(wallet.adapter.name);
    select(wallet.adapter.name);
  };

  const handleClose = () => {
    onClose();
  };

  // Safe check for WalletReadyState
  const isWalletReady = (wallet: SolanaWallet) => {
    try {
      return wallet.readyState === WalletReadyState.Installed;
    } catch (error) {
      console.error("Error checking wallet ready state:", error);
      return false;
    }
  };

  // Use the safe check function
  const installedWallets = wallets.filter(isWalletReady);

  const otherWallets = wallets.filter((wallet) => {
    try {
      return (
        !isWalletReady(wallet) &&
        !(wallet.adapter instanceof UnsafeBurnerWalletAdapter)
      );
    } catch (error) {
      console.error("Error filtering other wallets:", error);
      return false;
    }
  });

  // Format wallet address
  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Only render wallet content if we're mounted on the client
  if (!mounted) return null;

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-[#121C31] shadow-xl transition-all max-w-md w-full">
                <div className="px-6 py-5 border-b border-gray-700">
                  <Dialog.Title className="text-xl font-medium text-white">
                    {connected ? "Wallet Connected" : "Connect a Wallet"}
                  </Dialog.Title>
                </div>

                <div className="p-6">
                  {connected && publicKey ? (
                    <div className="text-center">
                      <div className="bg-[#1F2B47] rounded-lg p-4 mb-4">
                        <div className="text-sm text-gray-400 mb-1">
                          Connected as
                        </div>
                        <div className="font-mono text-white break-all">
                          {formatWalletAddress(publicKey.toString())}
                        </div>
                      </div>
                      <button
                        onClick={disconnect}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-md transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : connecting ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                      <p className="text-white">
                        Connecting to {selectedWallet}...
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Please check your wallet for connection requests
                      </p>
                    </div>
                  ) : (
                    <div>
                      {installedWallets.length > 0 && (
                        <div className="mb-4">
                          <h3 className="text-white font-medium mb-2">
                            Installed Wallets
                          </h3>
                          <div className="space-y-2">
                            {installedWallets.map((wallet) => (
                              <button
                                key={wallet.adapter.name}
                                onClick={() => handleWalletSelect(wallet)}
                                className="flex items-center w-full bg-[#1F2B47] hover:bg-[#263350] text-white p-3 rounded-md transition-colors"
                              >
                                {wallet.adapter.icon && (
                                  <img
                                    src={wallet.adapter.icon}
                                    alt={wallet.adapter.name}
                                    className="h-6 w-6 mr-3"
                                  />
                                )}
                                <span>{wallet.adapter.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {otherWallets.length > 0 && (
                        <div>
                          <h3 className="text-white font-medium mb-2">
                            Other Wallets
                          </h3>
                          <div className="space-y-2">
                            {otherWallets.map((wallet) => (
                              <button
                                key={wallet.adapter.name}
                                onClick={() => handleWalletSelect(wallet)}
                                className="flex items-center w-full bg-[#1F2B47] hover:bg-[#263350] text-white p-3 rounded-md transition-colors"
                              >
                                {wallet.adapter.icon && (
                                  <img
                                    src={wallet.adapter.icon}
                                    alt={wallet.adapter.name}
                                    className="h-6 w-6 mr-3"
                                  />
                                )}
                                <span>{wallet.adapter.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-[#0D1321] px-6 py-4 text-center">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-white transition-colors"
                    onClick={handleClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
