import type { Metadata } from 'next';
import './globals.css';
import { WalletProvider } from '@/components/WalletProvider';
import { ToastProvider } from '@/components/ToastProvider';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { AppHeader } from '@/components/AppHeader';

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
      <body 
        className='antialiased text-white min-h-screen font-jost'
        style={{ 
          background: 'linear-gradient(180deg, #0C0427 49.35%, #020007 100%)',
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover'
        }}
      >
        {/* Blue gradient circle at top right - positioned behind all content */}
        <div 
          className="bg-gradient-circle fixed top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full opacity-30 pointer-events-none"
          style={{ 
            background: 'radial-gradient(circle, rgba(52,119,255,0.6) 0%, rgba(52,119,255,0) 70%)',
            zIndex: -10
          }}
        />
        
        <NetworkProvider>
          <WalletProvider>
            <ToastProvider />
            <AppHeader />
            <main className='min-h-screen relative z-1'>{children}</main>
          </WalletProvider>
        </NetworkProvider>
      </body>
    </html>
  );
}
