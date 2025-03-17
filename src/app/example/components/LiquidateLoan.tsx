// @ts-nocheck

import { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import {
  Program,
  AnchorProvider,
  setProvider,
  BN,
  type Provider,
} from '@coral-xyz/anchor';
import toast from 'react-hot-toast';
import type { Sonic } from '@/sc/types/sonic';
import idl from '@/sc/sonic.json';
import { PROGRAM_ID, VAULT_AUTHORITY_SEED } from '@/lib/constants';
import { formatOverdueTime, formatCollateral } from '@/lib/format';
import bs58 from 'bs58';

const LiquidateLoan: FC = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [liquidatableLoans, setLiquidatableLoans] = useState<any[]>([]);

  const provider = new AnchorProvider(
    connection,
    wallet as any,
    AnchorProvider.defaultOptions()
  );
  const program = new Program<Sonic>(idl, provider as unknown as Provider);

  // Fetch liquidatable loans when component mounts
  useEffect(() => {
    fetchLiquidatableLoans();
    // Set up an interval to refresh the loans every minute
    const interval = setInterval(fetchLiquidatableLoans, 60000);
    return () => clearInterval(interval);
  }, [connection, program]);

  const fetchLiquidatableLoans = async () => {
    if (!program) return;

    try {
      // Get all active Loan accounts
      const loans = await program.account.loan.all([
        {
          memcmp: {
            offset:
              8 + // discriminator
              32 + // borrower
              32 + // listing
              8 + // start_time
              8 + // end_time
              8 + // collateral_amount
              8, // interest_rate
            bytes: bs58.encode(Buffer.from([1])), // is_active = true
          },
        },
      ]);

      // Filter loans that are past their end time
      const currentTime = Math.floor(Date.now() / 1000);
      const expiredLoans = loans.filter(
        (loan) => loan.account.endTime < currentTime
      );

      // Fetch listing details for each expired loan and filter out invalid ones
      const enrichedLoans = (
        await Promise.all(
          expiredLoans.map(async (loan) => {
            try {
              const listing = await program.account.nftListing.fetch(
                loan.account.listing
              );
              return {
                ...loan,
                listing,
                timeOverdue: currentTime - loan.account.endTime,
              };
            } catch (error) {
              // If we can't fetch the listing, the loan has likely been liquidated
              // Return null to filter it out
              return null;
            }
          })
        )
      ).filter((loan): loan is NonNullable<typeof loan> => loan !== null);

      setLiquidatableLoans(enrichedLoans);
    } catch (error) {
      console.error('Error fetching liquidatable loans:', error);
      toast.error('Failed to fetch liquidatable loans');
    }
  };

  const handleLiquidate = async (loan: any) => {
    if (!wallet.publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    const toastId = toast.loading('Liquidating loan...');
    setLoading(true);

    try {
      const [vault_authority] = PublicKey.findProgramAddressSync(
        [Buffer.from(VAULT_AUTHORITY_SEED)],
        program.programId
      );

      await program.methods
        .liquidateLoan()
        .accounts({
          liquidator: wallet.publicKey,
          lender: loan.listing.lender,
          loan: loan.publicKey,
          listing: loan.account.listing,
          vault_authority: vault_authority,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success('Successfully liquidated loan!', { id: toastId });
      // Refresh the list after successful liquidation
      fetchLiquidatableLoans();
    } catch (error) {
      console.error('Error liquidating loan:', error);
      toast.error(`Failed to liquidate loan: ${error.message}`, {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='p-4 border rounded'>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-xl'>Liquidatable Loans</h2>
        <button
          onClick={fetchLiquidatableLoans}
          className='text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded'
        >
          Refresh
        </button>
      </div>

      <div className='space-y-4'>
        {liquidatableLoans.map((loan, index) => (
          <div key={index} className='p-4 border rounded bg-gray-800'>
            <div className='flex justify-between items-start mb-4'>
              <div>
                <p className='text-sm text-gray-400'>NFT</p>
                <p className='font-mono text-sm'>
                  {loan.listing.nftMint.toString().slice(0, 16)}...
                </p>
              </div>
              <div className='text-right'>
                <p className='text-sm text-gray-400'>Status</p>
                <p className='font-bold text-red-400'>
                  {formatOverdueTime(loan.timeOverdue)}
                </p>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4 mb-4'>
              <div>
                <p className='text-sm text-gray-400'>Collateral Available</p>
                <p className='font-bold text-green-400'>
                  {formatCollateral(loan.account.collateralAmount)}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-400'>Interest Rate</p>
                <p>{loan.account.interestRate.toString()}%</p>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4 mb-4'>
              <div>
                <p className='text-sm text-gray-400'>Borrower</p>
                <p className='font-mono text-sm'>
                  {loan.account.borrower.toString().slice(0, 16)}...
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-400'>Lender</p>
                <p className='font-mono text-sm'>
                  {loan.listing.lender.toString().slice(0, 16)}...
                </p>
              </div>
            </div>

            <button
              onClick={() => handleLiquidate(loan)}
              disabled={loading}
              className='w-full bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50'
            >
              {loading ? 'Processing...' : 'Liquidate Loan'}
            </button>
          </div>
        ))}
        {liquidatableLoans.length === 0 && (
          <div className='text-center py-8'>
            <p className='text-gray-400'>No liquidatable loans found</p>
            <p className='text-gray-500 text-sm mt-2'>
              Loans become liquidatable after their repayment deadline
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
export default LiquidateLoan;
