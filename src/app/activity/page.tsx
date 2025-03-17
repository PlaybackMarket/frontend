'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';

// Mock data for transaction history
const mockTransactions = [
  {
    id: '1',
    type: 'Lend',
    asset: 'PudgyPenguins #1234',
    date: new Date(2023, 5, 15, 10, 30),
    value: '2.5 SOL',
    status: 'Completed',
    txHash: '5Vq...7Gh',
  },
  {
    id: '2',
    type: 'Borrow',
    asset: 'BoredApeYachtClub #5678',
    date: new Date(2023, 5, 14, 14, 45),
    value: '13.2 SOL',
    status: 'Completed',
    txHash: '8Kj...2Lp',
  },
  {
    id: '3',
    type: 'Repay',
    asset: 'BoredApeYachtClub #5678',
    date: new Date(2023, 5, 20, 9, 15),
    value: '14.1 SOL',
    status: 'Completed',
    txHash: '3Mn...9Qr',
  },
];

export default function Activity() {
  const { publicKey } = useWallet();
  const [transactions, setTransactions] = useState(mockTransactions);
  const [filter, setFilter] = useState<string | null>(null);

  if (!publicKey) {
    return (
      <div className='min-h-screen bg-black text-white flex flex-col items-center justify-center'>
        <h2 className='text-2xl font-bold mb-4'>Connect your wallet</h2>
        <p className='text-gray-400 mb-8'>
          Please connect your wallet to view your activity
        </p>
      </div>
    );
  }

  const filteredTransactions = filter
    ? transactions.filter((tx) => tx.type === filter)
    : transactions;

  return (
    <div className='min-h-screen bg-black text-white'>
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-2xl font-bold mb-6'>Activity</h1>

        <div className='flex justify-between items-center mb-6'>
          <div className='flex space-x-4'>
            <button
              className={`px-4 py-2 rounded-md ${
                !filter
                  ? 'bg-[#FF6B00] text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setFilter(null)}
            >
              All
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                filter === 'Lend'
                  ? 'bg-[#FF6B00] text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setFilter('Lend')}
            >
              Lending
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                filter === 'Borrow'
                  ? 'bg-[#FF6B00] text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setFilter('Borrow')}
            >
              Borrowing
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                filter === 'Repay'
                  ? 'bg-[#FF6B00] text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setFilter('Repay')}
            >
              Repayments
            </button>
          </div>
        </div>

        <div className='bg-gray-900 rounded-lg overflow-hidden'>
          <table className='min-w-full'>
            <thead>
              <tr className='bg-gray-800 text-left text-gray-400 text-sm'>
                <th className='py-3 px-4 font-medium'>Type</th>
                <th className='py-3 px-4 font-medium'>Asset</th>
                <th className='py-3 px-4 font-medium'>Date</th>
                <th className='py-3 px-4 font-medium'>Value</th>
                <th className='py-3 px-4 font-medium'>Status</th>
                <th className='py-3 px-4 font-medium'>Transaction</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className='border-t border-gray-800 hover:bg-gray-800'
                  >
                    <td className='py-4 px-4'>
                      <span
                        className={`
                        px-2 py-1 rounded text-xs font-medium
                        ${
                          tx.type === 'Lend'
                            ? 'bg-green-900 text-green-300'
                            : tx.type === 'Borrow'
                            ? 'bg-blue-900 text-blue-300'
                            : 'bg-orange-900 text-orange-300'
                        }
                      `}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className='py-4 px-4 text-white'>{tx.asset}</td>
                    <td className='py-4 px-4 text-gray-300'>
                      {tx.date.toLocaleDateString()}{' '}
                      {tx.date.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className='py-4 px-4 text-white'>{tx.value}</td>
                    <td className='py-4 px-4'>
                      <span className='px-2 py-1 bg-green-900 text-green-300 rounded text-xs font-medium'>
                        {tx.status}
                      </span>
                    </td>
                    <td className='py-4 px-4'>
                      <a
                        href={`https://explorer.solana.com/tx/${tx.txHash}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-[#FF6B00] hover:underline'
                      >
                        {tx.txHash}
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className='py-8 text-center text-gray-400'>
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
