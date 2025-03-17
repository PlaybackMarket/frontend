import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/components/WalletProvider';
import { WalletButton } from '@/components/WalletButton';
import { ToastProvider } from '@/components/ToastProvider';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { NetworkToggle } from '@/components/NetworkToggle';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Playback - Gaming Asset Lending Protocol',
  description:
    'Peer-to-peer lending platform for gaming assets on Solana L1 (Sonic SVM)',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className='antialiased bg-black text-white'>
        <NetworkProvider>
          <WalletProvider>
            <ToastProvider />
            <header className='px-6 py-4 flex justify-between items-center border-b border-gray-800 bg-black'>
              <div className='flex items-center'>
                <div className='flex items-center mr-8'>
                  <div className='w-8 h-8 mr-2 flex items-center justify-center'>
                    <svg
                      width='32'
                      height='32'
                      viewBox='0 0 32 32'
                      fill='none'
                      xmlns='http://www.w3.org/2000/svg'
                      className='transform -rotate-90'
                    >
                      <path d='M6 8L16 16L26 8' fill='#FF6B00' />
                      <path d='M6 16L16 24L26 16' fill='#FFB380' />
                    </svg>
                  </div>
                  <h1 className='text-xl font-bold text-white uppercase tracking-tight'>
                    Playback
                  </h1>
                </div>
                <nav className='hidden md:flex space-x-6'>
                  <Link
                    href='/'
                    className='text-[#FF6B00] font-medium uppercase tracking-wider hover:opacity-80 transition-opacity'
                  >
                    Collections
                  </Link>
                  <Link
                    href='/portfolio'
                    className='text-gray-400 hover:text-white font-medium uppercase tracking-wider hover:opacity-80 transition-opacity'
                  >
                    Portfolio
                  </Link>
                  <Link
                    href='/activity'
                    className='text-gray-400 hover:text-white font-medium uppercase tracking-wider hover:opacity-80 transition-opacity'
                  >
                    Activity
                  </Link>
                  <Link
                    href='/airdrop'
                    className='text-gray-400 hover:text-white font-medium uppercase tracking-wider hover:opacity-80 transition-opacity'
                  >
                    Airdrop
                  </Link>
                </nav>
              </div>
              <div className='flex items-center gap-4'>
                <div className='relative'>
                  <input
                    type='text'
                    placeholder='Collections, wallets, or ENS'
                    className='bg-gray-900 border border-gray-700 rounded-md py-2 px-4 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-[#FF6B00] transition-all'
                  />
                  <svg
                    className='absolute right-3 top-2.5 h-4 w-4 text-gray-400'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                    />
                  </svg>
                </div>
                <NetworkToggle />
                <WalletButton />
              </div>
            </header>
            <main className='min-h-screen'>{children}</main>
            <footer className='bg-black border-t border-gray-800 py-6 px-6'>
              <div className='container mx-auto'>
                <div className='flex flex-col md:flex-row justify-between items-center'>
                  <div className='flex items-center mb-4 md:mb-0'>
                    <div className='w-6 h-6 mr-2 flex items-center justify-center'>
                      <svg
                        width='24'
                        height='24'
                        viewBox='0 0 32 32'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                        className='transform -rotate-90'
                      >
                        <path d='M6 8L16 16L26 8' fill='#FF6B00' />
                        <path d='M6 16L16 24L26 16' fill='#FFB380' />
                      </svg>
                    </div>
                    <span className='text-white font-bold uppercase tracking-tight'>
                      Playback
                    </span>
                  </div>
                  <div className='text-gray-400 text-sm'>
                    © 2023 Playback. All rights reserved. Built on Solana.
                  </div>
                </div>
              </div>
            </footer>
          </WalletProvider>
        </NetworkProvider>
      </body>
    </html>
  );
}
