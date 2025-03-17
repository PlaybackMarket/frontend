'use client';

import Link from 'next/link';
import Image from 'next/image';
import { NetworkToggle } from './NetworkToggle';
import { WalletButton } from './WalletButton';
import { usePathname } from 'next/navigation';

export function AppHeader() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <header className='backdrop-blur-sm bg-transparent py-4 px-6 flex justify-between items-center font-jost'>
      {/* Left side - Logo and Navigation */}
      <div className='flex items-center'>
        <Link href='/borrow' className='flex items-center mr-8'>
          <Image
            src='/playback-logo.svg'
            alt='Playback Logo'
            width={32}
            height={32}
            className='mr-2'
          />
          <h1 className='text-xl font-bold text-white tracking-tight font-jost'>PLAYBACK</h1>
        </Link>
        
        <nav className='flex space-x-6 pt-1'>
          {/* Borrowing Button */}
          <div className="inline-flex flex-col justify-start items-start gap-2 w-[141px]">
            <Link
              href='/borrow'
              className="self-stretch inline-flex justify-start items-center gap-3"
            >
              <div className={`w-[29px] h-[29px] relative ${isActive('/borrow') ? 'bg-[#16337c]' : 'bg-transparent'} rounded-lg flex items-center justify-center`}>
                <Image
                  src='/borrow.svg'
                  alt='Borrowing'
                  width={13}
                  height={13}
                  className='text-[#dddddd]'
                />
              </div>
              <div className={`justify-center ${isActive('/borrow') ? 'text-white' : 'text-gray-400'} text-base font-medium font-jost uppercase leading-normal`}>
                borrowing
              </div>
            </Link>
            {isActive('/borrow') && (
              <div className="w-[141px] h-0 outline-1 outline-offset-[-0.50px] outline-[#5c88e1]" />
            )}
          </div>
          
          {/* Lending Button */}
          <div className="inline-flex flex-col justify-start items-start gap-2 w-[141px]">
            <Link
              href='/lending'
              className="self-stretch inline-flex justify-start items-center gap-3"
            >
              <div className={`w-[29px] h-[29px] relative ${isActive('/lending') ? 'bg-[#16337c]' : 'bg-transparent'} rounded-lg flex items-center justify-center`}>
                <Image
                  src='/lend.svg'
                  alt='Lending'
                  width={13}
                  height={13}
                  className='text-[#dddddd]'
                />
              </div>
              <div className={`justify-center ${isActive('/lending') ? 'text-white' : 'text-gray-400'} text-base font-medium font-jost uppercase leading-normal`}>
                lending
              </div>
            </Link>
            {isActive('/lending') && (
              <div className="w-[141px] h-0 outline-1 outline-offset-[-0.50px] outline-[#5c88e1]" />
            )}
          </div>
        </nav>
      </div>

      {/* Right side - Network Toggle, Search and Wallet */}
      <div className='flex items-center gap-1 '>
        <NetworkToggle />
        <div className='relative h-[48px] ml-2'>
          <div className='relative h-full'>
            <Image
              src='/header-input.svg'
              alt='Search background'
              width={550}
              height={48}
              className='absolute top-0 left-0 z-0 h-full w-full object-cover'
            />
            <input
              type='text'
              placeholder='Search by name'
              className='bg-transparent border-none h-[48px] px-10 w-[455px] text-sm focus:outline-none z-10 relative text-white font-jost'
            />
          
          </div>
        </div>
        <WalletButton />
      </div>
    </header>
  );
} 