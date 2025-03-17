'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  Keypair,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import toast from 'react-hot-toast';
import { useNetwork } from '@/contexts/NetworkContext';

import {
  Program,
  Idl,
  AnchorProvider,
  setProvider,
  type Provider,
  Wallet,
} from '@project-serum/anchor';

import idl from '@/sc/sonic.json';
import type { Sonic } from '@/sc/types/sonic';
import { BN } from '@coral-xyz/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { PROGRAM_ID } from '@/lib/constants';
import { findVaultAuthorityPDA } from '../sc/pda';
import { getOrCreateATA } from '../utils/ata';
import { getLoanData, Loan } from '../utils/loan';

interface NFTListing {
  lender: PublicKey;
  nft_mint: PublicKey;
  loan_duration: number;
  interest_rate: number;
  collateral_amount: number;
  is_active: boolean;
}

export function LendDashboard() {
  const { publicKey, sendTransaction: walletSendTransaction } = useWallet();
  const { network } = useNetwork();
  const [balance, setBalance] = useState<number | null>(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txHistory, setTxHistory] = useState<
    Array<{ hash: string; amount: string; date: Date }>
  >([]);
  const [loan_duration, setLoanDuration] = useState('');
  const [interest_rate, setInterestRate] = useState('');
  const [collateral_amount, setCollateralAmount] = useState('');
  const [nft_mint, setNftMint] = useState('');
  const [selectedListing, setSelectedListing] = useState('');
  const [selectedLoan, setSelectedLoan] = useState('');
  const [collateral_mint, setCollateralMint] = useState('');
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);

  const connection = new Connection(network.endpoint);
  const programID = PROGRAM_ID;

  const wallet = {
    publicKey,
    signTransaction: async (tx: Transaction) => {
      return walletSendTransaction(tx, connection);
    },
    signAllTransactions: async (txs: Transaction[]) => {
      return Promise.all(
        txs.map((tx) => walletSendTransaction(tx, connection))
      );
    },
    sendTransaction: walletSendTransaction,
  } as unknown as Wallet;

  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });
  setProvider(provider);

  const program = new Program<Sonic>(
    {
      version: '0.1.0',
      name: 'sonic',
      instructions: idl.instructions.map((ix) => ({
        ...ix,
        accounts: ix.accounts.map((acc) => ({
          ...acc,
          isMut: acc.writable,
          isSigner: acc.signer,
        })),
      })),
      accounts: idl.accounts,
      errors: idl.errors,
    } as unknown as Sonic,
    programID,
    provider
  );

  // Create a wrapper for sendTransaction that matches the expected signature
  const sendTransaction = async (transaction: Transaction) => {
    return walletSendTransaction(transaction, connection);
  };

  const fetchBalance = async () => {
    if (!publicKey) return;
    try {
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (e) {
      console.error('Error fetching balance:', e);
      toast.error('Failed to fetch balance');
    }
  };

  useEffect(() => {
    if (publicKey) {
      toast.success('Wallet connected!');
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

    const toastId = toast.loading('Preparing transaction...');

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

      toast.loading('Waiting for signature...', { id: toastId });
      const signature = await sendTransaction(transaction);

      toast.loading('Confirming transaction...', { id: toastId });
      await connection.confirmTransaction(signature, 'confirmed');

      setTxHistory((prev) => [
        { hash: signature, amount: amount, date: new Date() },
        ...prev.slice(0, 4),
      ]);

      toast.success(`${amount} SOL sent successfully!`, { id: toastId });
      await fetchBalance();

      setRecipient('');
      setAmount('');
    } catch (e) {
      console.error('Error sending transaction:', e);
      toast.error('Transaction failed', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleListNFT = async () => {
    if (
      !publicKey ||
      !nft_mint ||
      !loan_duration ||
      !interest_rate ||
      !collateral_amount
    ) {
      toast.error('Please fill in all fields');
      return;
    }

    const toastId = toast.loading('Listing NFT...');
    try {
      const listingKeypair = Keypair.generate();
      const [vault_authority] = await findVaultAuthorityPDA(programID);

      const lender_nft_ata = await getOrCreateATA(
        connection,
        new PublicKey(nft_mint),
        publicKey,
        publicKey,
        sendTransaction
      );
      const vault_nft_ata = await getOrCreateATA(
        connection,
        new PublicKey(nft_mint),
        vault_authority,
        publicKey,
        sendTransaction
      );

      await program.methods
        .list_nft(
          new BN(loan_duration),
          new BN(interest_rate),
          new BN(collateral_amount)
        )
        .accounts({
          lender: publicKey,
          listing: listingKeypair.publicKey,
          nft_mint: new PublicKey(nft_mint),
          lender_nft_account: lender_nft_ata,
          vault_nft_account: vault_nft_ata,
          vault_authority,
          token_program: TOKEN_PROGRAM_ID,
          associated_token_program: ASSOCIATED_TOKEN_PROGRAM_ID,
          system_program: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([listingKeypair])
        .rpc();

      toast.success('NFT listed successfully!', { id: toastId });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error listing NFT:', errorMessage);
      toast.error(`Failed to list NFT: ${errorMessage}`, { id: toastId });
    }
  };

  const fetchListings = async () => {
    try {
      const listings = await program.account.nft_listing.all();
      setListings(
        listings.map((listing) => ({
          lender: listing.account.lender,
          nft_mint: listing.account.nft_mint,
          loan_duration: listing.account.loan_duration.toNumber(),
          interest_rate: listing.account.interest_rate.toNumber(),
          collateral_amount: listing.account.collateral_amount.toNumber(),
          is_active: listing.account.is_active,
        }))
      );
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const fetchLoans = async () => {
    try {
      const loans = await program.account.loan.all();
      setLoans(
        loans.map((loan) => ({
          borrower: loan.account.borrower,
          listing: loan.account.listing,
          start_time: loan.account.start_time.toNumber(),
          end_time: loan.account.end_time.toNumber(),
          collateral_amount: loan.account.collateral_amount.toNumber(),
          is_active: loan.account.is_active,
          nft_mint: loan.account.nft_mint,
          lender: loan.account.lender,
        }))
      );
    } catch (error) {
      console.error('Error fetching loans:', error);
    }
  };

  const handleBorrowNFT = async () => {
    if (!publicKey || !selectedListing || !nft_mint) {
      toast.error('Please fill in all required fields');
      return;
    }

    const toastId = toast.loading('Borrowing NFT...');
    try {
      const loanKeypair = Keypair.generate();

      // Get the vault authority PDA
      const [vault_authority] = await findVaultAuthorityPDA(programID);

      // Get or create all necessary ATAs
      const borrower_nft_ata = await getOrCreateATA(
        connection,
        new PublicKey(nft_mint),
        publicKey,
        publicKey,
        sendTransaction
      );
      const vault_nft_ata = await getOrCreateATA(
        connection,
        new PublicKey(nft_mint),
        vault_authority,
        publicKey,
        sendTransaction
      );

      await program.methods
        .borrow_nft()
        .accounts({
          borrower: publicKey,
          listing: new PublicKey(selectedListing),
          loan: loanKeypair.publicKey,
          borrower_nft_account: borrower_nft_ata,
          vault_nft_account: vault_nft_ata,
          vault_authority,
          token_program: TOKEN_PROGRAM_ID,
          system_program: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          nft_mint: new PublicKey(nft_mint),
        })
        .signers([loanKeypair])
        .rpc();

      toast.success('NFT borrowed successfully!', { id: toastId });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error borrowing NFT:', errorMessage);
      toast.error(`Failed to borrow NFT: ${errorMessage}`, { id: toastId });
    }
  };

  const handleRepayLoan = async () => {
    if (!publicKey || !selectedLoan) {
      toast.error('Please select a loan to repay');
      return;
    }

    const toastId = toast.loading('Repaying loan...');
    try {
      const loanPubkey = new PublicKey(selectedLoan);
      const loanData = await getLoanData(program, loanPubkey);

      // Get the vault authority PDA
      const [vault_authority] = await findVaultAuthorityPDA(programID);

      // Get or create all necessary ATAs
      const borrower_nft_ata = await getOrCreateATA(
        connection,
        loanData.nft_mint,
        publicKey,
        publicKey,
        sendTransaction
      );
      const vault_nft_ata = await getOrCreateATA(
        connection,
        loanData.nft_mint,
        vault_authority,
        publicKey,
        sendTransaction
      );
      const lender_nft_ata = await getOrCreateATA(
        connection,
        loanData.nft_mint,
        loanData.lender,
        publicKey,
        sendTransaction
      );

      await program.methods
        .repay_loan()
        .accounts({
          borrower: publicKey,
          lender: loanData.lender,
          loan: loanPubkey,
          listing: loanData.listing,
          nft_mint: loanData.nft_mint,
          borrower_nft_account: borrower_nft_ata,
          vault_nft_account: vault_nft_ata,
          lender_nft_account: lender_nft_ata,
          vault_authority,
          token_program: TOKEN_PROGRAM_ID,
          associated_token_program: ASSOCIATED_TOKEN_PROGRAM_ID,
          system_program: SystemProgram.programId,
        })
        .rpc();

      toast.success('Loan repaid successfully!', { id: toastId });
      setSelectedLoan('');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error repaying loan:', errorMessage);
      toast.error(`Failed to repay loan: ${errorMessage}`, { id: toastId });
    }
  };

  const handleLiquidateLoan = async () => {
    if (!publicKey || !selectedLoan) {
      toast.error('Please select a loan to liquidate');
      return;
    }

    const toastId = toast.loading('Liquidating loan...');
    try {
      const loanPubkey = new PublicKey(selectedLoan);
      const loanData = await getLoanData(program, loanPubkey);

      // Get the vault authority PDA
      const [vault_authority] = await findVaultAuthorityPDA(programID);

      await program.methods
        .liquidate_loan()
        .accounts({
          liquidator: publicKey,
          lender: loanData.lender,
          loan: loanPubkey,
          listing: loanData.listing,
          vault_authority,
          system_program: SystemProgram.programId,
        })
        .rpc();

      toast.success('Loan liquidated successfully!', { id: toastId });
      setSelectedLoan('');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error liquidating loan:', errorMessage);
      toast.error(`Failed to liquidate loan: ${errorMessage}`, { id: toastId });
    }
  };

  return (
    <div className='max-w-4xl mx-auto p-4'>
      <h1 className='text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 glitch-text'>
        SuperSonic Wallet
        <span className='text-sm ml-2 font-normal bg-black/50 px-2 py-1 rounded-md border border-cyan-800/50'>
          {network.label}
        </span>
      </h1>

      <div className='space-y-8'>
        {!publicKey ? (
          <div className='flex flex-col items-center justify-center min-h-[400px] border border-cyan-800 rounded-lg bg-black/50 backdrop-blur relative overflow-hidden'>
            <div className="absolute inset-0 bg-[url('/sonic-pattern.svg')] opacity-5"></div>
            <div className='relative z-10'>
              <h2 className='text-2xl mb-4 text-cyan-400'>
                Connect your wallet to begin
              </h2>
            </div>
          </div>
        ) : (
          <>
            <div className='grid gap-8 md:grid-cols-2'>
              <div className='p-6 border border-cyan-800 rounded-lg bg-black/50 backdrop-blur relative overflow-hidden'>
                <div className="absolute inset-0 bg-[url('/sonic-pattern.svg')] opacity-5"></div>
                <div className='relative z-10'>
                  <h2 className='text-xl mb-2 text-cyan-400'>Your Balance</h2>
                  <div className='text-4xl font-mono mb-2'>
                    {balance === null ? (
                      <span className='text-cyan-500'>Loading...</span>
                    ) : (
                      <span className='text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500'>
                        {balance.toFixed(4)} SOL
                      </span>
                    )}
                  </div>
                  <div className='mt-4 text-sm text-cyan-600 font-mono break-all bg-black/30 p-2 rounded'>
                    {publicKey.toBase58()}
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleSend}
                className='p-6 border border-cyan-800 rounded-lg bg-black/50 backdrop-blur relative overflow-hidden'
              >
                <div className="absolute inset-0 bg-[url('/sonic-pattern.svg')] opacity-5"></div>
                <div className='relative z-10'>
                  <h2 className='text-xl mb-4 text-cyan-400'>Send SOL</h2>
                  <div className='space-y-4'>
                    <div>
                      <label className='block text-sm mb-2 text-cyan-500'>
                        Recipient Address
                      </label>
                      <input
                        type='text'
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className='w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                        placeholder="Enter recipient's address"
                      />
                    </div>
                    <div>
                      <label className='block text-sm mb-2 text-cyan-500'>
                        Amount (SOL)
                      </label>
                      <input
                        type='number'
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className='w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                        placeholder='0.0'
                        step='0.001'
                      />
                    </div>
                    <button
                      type='submit'
                      disabled={loading}
                      className='w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 font-mono relative overflow-hidden group'
                    >
                      <span className='relative z-10'>
                        {loading ? 'Processing...' : 'Send SOL'}
                      </span>
                      <span className='absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity'></span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {txHistory.length > 0 && (
              <div className='p-6 border border-cyan-800 rounded-lg bg-black/50 backdrop-blur relative overflow-hidden mt-8'>
                <div className="absolute inset-0 bg-[url('/sonic-pattern.svg')] opacity-5"></div>
                <div className='relative z-10'>
                  <h2 className='text-xl mb-4 text-cyan-400'>
                    Recent Transactions
                  </h2>
                  <div className='space-y-3'>
                    {txHistory.map((tx, index) => (
                      <div
                        key={index}
                        className='flex justify-between items-center border-b border-cyan-800/30 pb-2'
                      >
                        <div>
                          <div className='text-sm text-cyan-500'>
                            {tx.hash.slice(0, 8)}...{tx.hash.slice(-8)}
                          </div>
                          <div className='text-xs text-cyan-700'>
                            {tx.date.toLocaleString()}
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='text-sm text-purple-400'>
                            -{tx.amount} SOL
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className='p-6 border border-cyan-800 rounded-lg bg-black/50 backdrop-blur relative overflow-hidden'>
              <div className='space-y-4 '>
                <div>
                  <label className='block text-sm mb-2 text-cyan-500'>
                    NFT Mint Address
                  </label>
                  <input
                    type='text'
                    value={nft_mint}
                    onChange={(e) => setNftMint(e.target.value)}
                    className='w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500'
                    placeholder='Enter NFT mint address'
                  />
                </div>
                <div>
                  <label className='block text-sm mb-2 text-cyan-500'>
                    Loan Duration (seconds)
                  </label>
                  <input
                    type='number'
                    value={loan_duration}
                    onChange={(e) => setLoanDuration(e.target.value)}
                    className='w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500'
                    placeholder='Enter loan duration'
                  />
                </div>
                <div>
                  <label className='block text-sm mb-2 text-cyan-500'>
                    Interest Rate
                  </label>
                  <input
                    type='number'
                    value={interest_rate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className='w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500'
                    placeholder='Enter interest rate'
                  />
                </div>
                <div>
                  <label className='block text-sm mb-2 text-cyan-500'>
                    Collateral Amount
                  </label>
                  <input
                    type='number'
                    value={collateral_amount}
                    onChange={(e) => setCollateralAmount(e.target.value)}
                    className='w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500'
                    placeholder='Enter collateral amount'
                  />
                </div>
                <button
                  onClick={handleListNFT}
                  className='w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded hover:from-cyan-500 hover:to-purple-500 transition-all'
                >
                  List NFT
                </button>
                {/* Add more buttons as needed */}
              </div>
            </div>
            <div className='space-y-4'>
              <div className='p-6 border border-cyan-800 rounded-lg bg-black/50'>
                <h3 className='text-xl mb-4 text-cyan-400'>Borrow NFT</h3>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm mb-2 text-cyan-500'>
                      Listing Address
                    </label>
                    <input
                      type='text'
                      value={selectedListing}
                      onChange={(e) => setSelectedListing(e.target.value)}
                      className='w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500'
                      placeholder='Enter listing address'
                    />
                  </div>
                  <div>
                    <label className='block text-sm mb-2 text-cyan-500'>
                      Collateral Mint
                    </label>
                    <input
                      type='text'
                      value={collateral_mint}
                      onChange={(e) => setCollateralMint(e.target.value)}
                      className='w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500'
                      placeholder='Enter collateral mint address'
                    />
                  </div>
                  <div>
                    <label className='block text-sm mb-2 text-cyan-500'>
                      NFT Mint
                    </label>
                    <input
                      type='text'
                      value={nft_mint}
                      onChange={(e) => setNftMint(e.target.value)}
                      className='w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500'
                      placeholder='Enter NFT mint address'
                    />
                  </div>
                  <button
                    onClick={handleBorrowNFT}
                    disabled={
                      !publicKey ||
                      !selectedListing ||
                      !collateral_mint ||
                      !nft_mint
                    }
                    className='w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded 
                      hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 
                      disabled:cursor-not-allowed'
                  >
                    Borrow NFT
                  </button>
                </div>
              </div>

              <div className='p-6 border border-cyan-800 rounded-lg bg-black/50'>
                <h3 className='text-xl mb-4 text-cyan-400'>Repay Loan</h3>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm mb-2 text-cyan-500'>
                      Loan Address
                    </label>
                    <input
                      type='text'
                      value={selectedLoan}
                      onChange={(e) => setSelectedLoan(e.target.value)}
                      className='w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500'
                      placeholder='Enter loan address'
                    />
                  </div>
                  <button
                    onClick={handleRepayLoan}
                    disabled={!publicKey || !selectedLoan}
                    className='w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded 
                      hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 
                      disabled:cursor-not-allowed'
                  >
                    Repay Loan
                  </button>
                </div>
              </div>

              <div className='p-6 border border-cyan-800 rounded-lg bg-black/50'>
                <h3 className='text-xl mb-4 text-cyan-400'>Liquidate Loan</h3>
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm mb-2 text-cyan-500'>
                      Loan Address
                    </label>
                    <input
                      type='text'
                      value={selectedLoan}
                      onChange={(e) => setSelectedLoan(e.target.value)}
                      className='w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500'
                      placeholder='Enter loan address'
                    />
                  </div>
                  <button
                    onClick={handleLiquidateLoan}
                    disabled={!publicKey || !selectedLoan}
                    className='w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded 
                      hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 
                      disabled:cursor-not-allowed'
                  >
                    Liquidate Loan
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
