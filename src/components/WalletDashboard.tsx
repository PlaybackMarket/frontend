"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import toast from "react-hot-toast";
import { useNetwork } from "@/contexts/NetworkContext";

export function WalletDashboard() {
  const { publicKey, sendTransaction } = useWallet();
  const { network } = useNetwork();
  const [balance, setBalance] = useState<number | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHistory, setTxHistory] = useState<
    Array<{ hash: string; amount: string; date: Date }>
  >([]);

  const connection = new Connection(network.endpoint);

  const fetchBalance = async () => {
    if (!publicKey) return;
    try {
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (e) {
      console.error("Error fetching balance:", e);
      toast.error("Failed to fetch balance");
    }
  };

  useEffect(() => {
    if (publicKey) {
      toast.success("Wallet connected!");
      fetchBalance();
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    } else {
      setBalance(null);
    }
  }, [network, publicKey]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !recipient || !amount) return;

    const toastId = toast.loading("Preparing transaction...");

    try {
      setLoading(true);
      const recipientPubKey = new PublicKey(recipient);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubKey,
          lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
        })
      );

      toast.loading("Waiting for signature...", { id: toastId });
      const signature = await sendTransaction(transaction, connection);

      toast.loading("Confirming transaction...", { id: toastId });
      await connection.confirmTransaction(signature, "confirmed");

      setTxHistory((prev) => [
        { hash: signature, amount: amount, date: new Date() },
        ...prev.slice(0, 4),
      ]);

      toast.success(`${amount} SOL sent successfully!`, { id: toastId });
      await fetchBalance();

      setRecipient("");
      setAmount("");
    } catch (e) {
      console.error("Error sending transaction:", e);
      toast.error("Transaction failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 glitch-text">
        SuperSonic Wallet
        <span className="text-sm ml-2 font-normal bg-black/50 px-2 py-1 rounded-md border border-cyan-800/50">
          {network.label}
        </span>
      </h1>

      <div className="space-y-8">
        {!publicKey ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] border border-cyan-800 rounded-lg bg-black/50 backdrop-blur relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/sonic-pattern.svg')] opacity-5"></div>
            <div className="relative z-10">
              <h2 className="text-2xl mb-4 text-cyan-400">
                Connect your wallet to begin
              </h2>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="p-6 border border-cyan-800 rounded-lg bg-black/50 backdrop-blur relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/sonic-pattern.svg')] opacity-5"></div>
                <div className="relative z-10">
                  <h2 className="text-xl mb-2 text-cyan-400">Your Balance</h2>
                  <div className="text-4xl font-mono mb-2">
                    {balance === null ? (
                      <span className="text-cyan-500">Loading...</span>
                    ) : (
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                        {balance.toFixed(4)} SOL
                      </span>
                    )}
                  </div>
                  <div className="mt-4 text-sm text-cyan-600 font-mono break-all bg-black/30 p-2 rounded">
                    {publicKey.toBase58()}
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleSend}
                className="p-6 border border-cyan-800 rounded-lg bg-black/50 backdrop-blur relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[url('/sonic-pattern.svg')] opacity-5"></div>
                <div className="relative z-10">
                  <h2 className="text-xl mb-4 text-cyan-400">Send SOL</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2 text-cyan-500">
                        Recipient Address
                      </label>
                      <input
                        type="text"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                        placeholder="Enter recipient's address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-2 text-cyan-500">
                        Amount (SOL)
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                        placeholder="0.0"
                        step="0.001"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 font-mono relative overflow-hidden group"
                    >
                      <span className="relative z-10">
                        {loading ? "Processing..." : "Send SOL"}
                      </span>
                      <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity"></span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {txHistory.length > 0 && (
              <div className="p-6 border border-cyan-800 rounded-lg bg-black/50 backdrop-blur relative overflow-hidden mt-8">
                <div className="absolute inset-0 bg-[url('/sonic-pattern.svg')] opacity-5"></div>
                <div className="relative z-10">
                  <h2 className="text-xl mb-4 text-cyan-400">
                    Recent Transactions
                  </h2>
                  <div className="space-y-3">
                    {txHistory.map((tx, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b border-cyan-800/30 pb-2"
                      >
                        <div>
                          <div className="text-sm text-cyan-500">
                            {tx.hash.slice(0, 8)}...{tx.hash.slice(-8)}
                          </div>
                          <div className="text-xs text-cyan-700">
                            {tx.date.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-purple-400">
                            -{tx.amount} SOL
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
