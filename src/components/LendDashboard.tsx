// "use client";

// import { useWallet } from "@solana/wallet-adapter-react";
// import { useEffect, useState } from "react";
// import {
//   Connection,
//   LAMPORTS_PER_SOL,
//   PublicKey,
//   SystemProgram,
//   Transaction,
//   Keypair,
//   SYSVAR_RENT_PUBKEY,
// } from "@solana/web3.js";
// import toast from "react-hot-toast";
// import { useNetwork } from "@/contexts/NetworkContext";

// import {
//   Program,
//   Idl,
//   AnchorProvider,
//   setProvider,
//   type Provider,
// } from "@coral-xyz/anchor";

// import idl from "@/sc/sonic.json";
// import type { Sonic } from "@/sc/types/sonic";
// import { BN } from "@coral-xyz/anchor";
// import {
//   ASSOCIATED_TOKEN_PROGRAM_ID,
//   TOKEN_PROGRAM_ID,
//   getAssociatedTokenAddress,
//   createAssociatedTokenAccountInstruction,
// } from "@solana/spl-token";
// import { PROGRAM_ID } from "@/lib/constants";

// interface Loan {
//   listing: PublicKey;
//   nftMint: PublicKey;
//   collateralMint: PublicKey;
//   lender: PublicKey;
// }

// interface NFTListing {
//   lender: PublicKey;
//   nftMint: PublicKey;
// }

// export function LendDashboard() {
//   const { publicKey, sendTransaction } = useWallet();
//   const { network } = useNetwork();
//   const [balance, setBalance] = useState<number | null>(null);
//   const [recipient, setRecipient] = useState("");
//   const [amount, setAmount] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [txHistory, setTxHistory] = useState<
//     Array<{ hash: string; amount: string; date: Date }>
//   >([]);
//   const [loanDuration, setLoanDuration] = useState("");
//   const [interestRate, setInterestRate] = useState("");
//   const [collateralAmount, setCollateralAmount] = useState("");
//   const [nftMint, setNftMint] = useState("");
//   const [selectedListing, setSelectedListing] = useState("");
//   const [selectedLoan, setSelectedLoan] = useState("");
//   const [collateralMint, setCollateralMint] = useState("");

//   const connection = new Connection(network.endpoint);

//   const programID = PROGRAM_ID;

//   // const program = new Program(idl as Sonic);
//   const program = new Program<Sonic>(idl, {} as Provider);

//   const fetchBalance = async () => {
//     if (!publicKey) return;
//     try {
//       const balance = await connection.getBalance(publicKey);
//       setBalance(balance / LAMPORTS_PER_SOL);
//     } catch (e) {
//       console.error("Error fetching balance:", e);
//       toast.error("Failed to fetch balance");
//     }
//   };

//   useEffect(() => {
//     if (publicKey) {
//       toast.success("Wallet connected!");
//       fetchBalance();
//       const interval = setInterval(fetchBalance, 30000);
//       return () => clearInterval(interval);
//     } else {
//       setBalance(null);
//     }
//   }, [network, publicKey]);

//   const handleSend = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!publicKey || !recipient || !amount) return;

//     const toastId = toast.loading("Preparing transaction...");

//     try {
//       setLoading(true);
//       const recipientPubKey = new PublicKey(recipient);
//       const transaction = new Transaction().add(
//         SystemProgram.transfer({
//           fromPubkey: publicKey,
//           toPubkey: recipientPubKey,
//           lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
//         })
//       );

//       toast.loading("Waiting for signature...", { id: toastId });
//       const signature = await sendTransaction(transaction, connection);

//       toast.loading("Confirming transaction...", { id: toastId });
//       await connection.confirmTransaction(signature, "confirmed");

//       setTxHistory((prev) => [
//         { hash: signature, amount: amount, date: new Date() },
//         ...prev.slice(0, 4),
//       ]);

//       toast.success(`${amount} SOL sent successfully!`, { id: toastId });
//       await fetchBalance();

//       setRecipient("");
//       setAmount("");
//     } catch (e) {
//       console.error("Error sending transaction:", e);
//       toast.error("Transaction failed", { id: toastId });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleListNFT = async () => {
//     if (
//       !publicKey ||
//       !nftMint ||
//       !loanDuration ||
//       !interestRate ||
//       !collateralAmount
//     ) {
//       toast.error("Please fill in all fields");
//       return;
//     }

//     const toastId = toast.loading("Listing NFT...");
//     // try {
//     //   await program.methods
//     //     .listNft(
//     //       new BN(loanDuration),
//     //       new BN(interestRate),
//     //       new BN(collateralAmount)
//     //     )
//     //     .accounts({
//     //       lender: publicKey,
//     //       nftMint: new PublicKey(nftMint),

//     //     })
//     //     .rpc();

//     //   toast.success("NFT listed successfully!", { id: toastId });
//     // } catch (e) {
//     //   console.error("Error listing NFT:", e);
//     //   toast.error("Failed to list NFT", { id: toastId });
//     // }
//   };

//   const VAULT_AUTHORITY_SEED = Buffer.from("vault_authority");

//   async function findVaultAuthorityPDA(
//     programId: PublicKey
//   ): Promise<[PublicKey, number]> {
//     return PublicKey.findProgramAddress([VAULT_AUTHORITY_SEED], programId);
//   }

//   async function getOrCreateATA(
//     connection: Connection,
//     mint: PublicKey,
//     owner: PublicKey,
//     payer: PublicKey,
//     sendTransaction: (transaction: Transaction) => Promise<string>
//   ): Promise<PublicKey> {
//     try {
//       const ata = await getAssociatedTokenAddress(mint, owner);

//       // Check if the ATA exists
//       const account = await connection.getAccountInfo(ata);
//       if (!account) {
//         const transaction = new Transaction().add(
//           createAssociatedTokenAccountInstruction(payer, ata, owner, mint)
//         );
//         // await sendTransaction(transaction);
//         // await connection.confirmTransaction(signature, "confirmed");
//       }

//       return ata;
//     } catch (error) {
//       console.error("Error getting or creating ATA:", error);
//       throw error;
//     }
//   }

//   const getLoanData = async (
//     program: Program<Sonic>,
//     loanAddress: PublicKey
//   ): Promise<Loan> => {
//     try {
//       const loanAccount = await program.account.loan.fetch(loanAddress);
//       return loanAccount as unknown as Loan;
//     } catch (error) {
//       console.error("Error fetching loan data:", error);
//       throw error;
//     }
//   };

//   const getListingData = async (
//     program: Program<Sonic>,
//     listingAddress: PublicKey
//   ): Promise<NFTListing> => {
//     try {
//       const listingAccount = await program.account.nftListing.fetch(
//         listingAddress
//       );
//       return listingAccount as unknown as NFTListing;
//     } catch (error) {
//       console.error("Error fetching listing data:", error);
//       throw error;
//     }
//   };

//   const handleBorrowNFT = async () => {
//     if (!publicKey || !selectedListing || !collateralMint) {
//       toast.error("Please fill in all required fields");
//       return;
//     }

//     const toastId = toast.loading("Borrowing NFT...");
//     try {
//       // Create a new keypair for the loan account
//       const loanKeypair = Keypair.generate();

//       // Get the vault authority PDA
//       const [vaultAuthority] = await findVaultAuthorityPDA(programID);

//       // Get or create all necessary ATAs
//       const borrowerCollateralATA = await getOrCreateATA(
//         connection,
//         new PublicKey(collateralMint),
//         publicKey,
//         publicKey,
//         sendTransaction
//       );

//       const vaultCollateralATA = await getOrCreateATA(
//         connection,
//         new PublicKey(collateralMint),
//         vaultAuthority,
//         publicKey,
//         sendTransaction
//       );

//       const nftMintPubkey = new PublicKey(nftMint);
//       const borrowerNftATA = await getOrCreateATA(
//         connection,
//         nftMintPubkey,
//         publicKey,
//         publicKey,
//         sendTransaction
//       );

//       const vaultNftATA = await getOrCreateATA(
//         connection,
//         nftMintPubkey,
//         vaultAuthority,
//         publicKey,
//         sendTransaction
//       );

//       await program.methods
//         .borrowNft()
//         .accounts({
//           borrower: publicKey,
//           listing: new PublicKey(selectedListing),
//           loan: loanKeypair.publicKey,
//           collateralMint: new PublicKey(collateralMint),
//           borrowerCollateralAccount: borrowerCollateralATA,
//           vaultCollateralAccount: vaultCollateralATA,
//           borrowerNftAccount: borrowerNftATA,
//           vaultNftAccount: vaultNftATA,
//           vaultAuthority,
//           tokenProgram: TOKEN_PROGRAM_ID,
//           associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
//           systemProgram: SystemProgram.programId,
//           rent: SYSVAR_RENT_PUBKEY,
//           nftMint: nftMintPubkey,
//         })
//         .signers([loanKeypair])
//         .rpc();

//       toast.success("NFT borrowed successfully!", { id: toastId });

//       // Clear the form
//       setSelectedListing("");
//       setCollateralMint("");
//       setNftMint("");
//     } catch (e) {
//       console.error("Error borrowing NFT:", e);
//       toast.error(`Failed to borrow NFT: ${e.message}`, { id: toastId });
//     }
//   };

//   const handleRepayLoan = async () => {
//     if (!publicKey || !selectedLoan) {
//       toast.error("Please select a loan to repay");
//       return;
//     }

//     const toastId = toast.loading("Repaying loan...");
//     try {
//       const loanPubkey = new PublicKey(selectedLoan);
//       const loanData = await getLoanData(program, loanPubkey);

//       // Get the vault authority PDA
//       const [vaultAuthority] = await findVaultAuthorityPDA(programID);

//       // Get or create all necessary ATAs
//       const borrowerCollateralATA = await getOrCreateATA(
//         connection,
//         loanData.collateralMint,
//         publicKey,
//         publicKey,
//         sendTransaction
//       );

//       const vaultCollateralATA = await getOrCreateATA(
//         connection,
//         loanData.collateralMint,
//         vaultAuthority,
//         publicKey,
//         sendTransaction
//       );

//       const lenderCollateralATA = await getOrCreateATA(
//         connection,
//         loanData.collateralMint,
//         loanData.lender,
//         publicKey,
//         sendTransaction
//       );

//       const borrowerNftATA = await getOrCreateATA(
//         connection,
//         loanData.nftMint,
//         publicKey,
//         publicKey,
//         sendTransaction
//       );

//       const vaultNftATA = await getOrCreateATA(
//         connection,
//         loanData.nftMint,
//         vaultAuthority,
//         publicKey,
//         sendTransaction
//       );

//       const lenderNftATA = await getOrCreateATA(
//         connection,
//         loanData.nftMint,
//         loanData.lender,
//         publicKey,
//         sendTransaction
//       );

//       await program.methods
//         .repayLoan()
//         .accounts({
//           borrower: publicKey,
//           loan: loanPubkey,
//           listing: loanData.listing,
//           collateralMint: loanData.collateralMint,
//           borrowerCollateralAccount: borrowerCollateralATA,
//           vaultCollateralAccount: vaultCollateralATA,
//           lenderCollateralAccount: lenderCollateralATA,
//           borrowerNftAccount: borrowerNftATA,
//           vaultNftAccount: vaultNftATA,
//           lenderNftAccount: lenderNftATA,
//           vaultAuthority,
//           tokenProgram: TOKEN_PROGRAM_ID,
//           nftMint: loanData.nftMint,
//         })
//         .rpc();

//       toast.success("Loan repaid successfully!", { id: toastId });
//       setSelectedLoan("");
//     } catch (e) {
//       console.error("Error repaying loan:", e);
//       toast.error(`Failed to repay loan: ${e.message}`, { id: toastId });
//     }
//   };

//   const handleLiquidateLoan = async () => {
//     if (!publicKey || !selectedLoan) {
//       toast.error("Please select a loan to liquidate");
//       return;
//     }

//     const toastId = toast.loading("Liquidating loan...");
//     try {
//       const loanPubkey = new PublicKey(selectedLoan);
//       const loanData = await getLoanData(program, loanPubkey);

//       // Get the vault authority PDA
//       const [vaultAuthority] = await findVaultAuthorityPDA(programID);

//       // Get or create necessary ATAs
//       const vaultCollateralATA = await getOrCreateATA(
//         connection,
//         loanData.collateralMint,
//         vaultAuthority,
//         publicKey,
//         sendTransaction
//       );

//       const lenderCollateralATA = await getOrCreateATA(
//         connection,
//         loanData.collateralMint,
//         loanData.lender,
//         publicKey,
//         sendTransaction
//       );

//       await program.methods
//         .liquidateLoan()
//         .accounts({
//           liquidator: publicKey,
//           loan: loanPubkey,
//           listing: loanData.listing,
//           collateralMint: loanData.collateralMint,
//           vaultCollateralAccount: vaultCollateralATA,
//           lenderCollateralAccount: lenderCollateralATA,
//           vaultAuthority,
//           tokenProgram: TOKEN_PROGRAM_ID,
//         })
//         .rpc();

//       toast.success("Loan liquidated successfully!", { id: toastId });
//       setSelectedLoan("");
//     } catch (e) {
//       console.error("Error liquidating loan:", e);
//       toast.error(`Failed to liquidate loan: ${e.message}`, { id: toastId });
//     }
//   };

//   const fetchActiveLoansByBorrower = async () => {
//     if (!publicKey) return [];

//     try {
//       const loans = await program.account.loan.all([
//         {
//           memcmp: {
//             offset: 8, // After discriminator
//             bytes: publicKey.toBase58(),
//           },
//         },
//       ]);

//       return loans.filter((loan) => loan.account.isActive);
//     } catch (error) {
//       console.error("Error fetching loans:", error);
//       return [];
//     }
//   };

//   return (
//     <div className="max-w-4xl mx-auto p-4">
//       <h1 className="text-5xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 glitch-text">
//         SuperSonic Wallet
//         <span className="text-sm ml-2 font-normal bg-black/50 px-2 py-1 rounded-md border border-cyan-800/50">
//           {network.label}
//         </span>
//       </h1>

//       <div className="space-y-8">
//         {!publicKey ? (
//           <div className="flex flex-col items-center justify-center min-h-[400px] border border-cyan-800 rounded-lg bg-black/50 backdrop-blur relative overflow-hidden">
//             <div className="absolute inset-0 bg-[url('/sonic-pattern.svg')] opacity-5"></div>
//             <div className="relative z-10">
//               <h2 className="text-2xl mb-4 text-cyan-400">
//                 Connect your wallet to begin
//               </h2>
//             </div>
//           </div>
//         ) : (
//           <>
//             <div className="grid gap-8 md:grid-cols-2">
//               <div className="p-6 border border-cyan-800 rounded-lg bg-black/50 backdrop-blur relative overflow-hidden">
//                 <div className="absolute inset-0 bg-[url('/sonic-pattern.svg')] opacity-5"></div>
//                 <div className="relative z-10">
//                   <h2 className="text-xl mb-2 text-cyan-400">Your Balance</h2>
//                   <div className="text-4xl font-mono mb-2">
//                     {balance === null ? (
//                       <span className="text-cyan-500">Loading...</span>
//                     ) : (
//                       <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
//                         {balance.toFixed(4)} SOL
//                       </span>
//                     )}
//                   </div>
//                   <div className="mt-4 text-sm text-cyan-600 font-mono break-all bg-black/30 p-2 rounded">
//                     {publicKey.toBase58()}
//                   </div>
//                 </div>
//               </div>

//               <form
//                 onSubmit={handleSend}
//                 className="p-6 border border-cyan-800 rounded-lg bg-black/50 backdrop-blur relative overflow-hidden"
//               >
//                 <div className="absolute inset-0 bg-[url('/sonic-pattern.svg')] opacity-5"></div>
//                 <div className="relative z-10">
//                   <h2 className="text-xl mb-4 text-cyan-400">Send SOL</h2>
//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-sm mb-2 text-cyan-500">
//                         Recipient Address
//                       </label>
//                       <input
//                         type="text"
//                         value={recipient}
//                         onChange={(e) => setRecipient(e.target.value)}
//                         className="w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
//                         placeholder="Enter recipient's address"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm mb-2 text-cyan-500">
//                         Amount (SOL)
//                       </label>
//                       <input
//                         type="number"
//                         value={amount}
//                         onChange={(e) => setAmount(e.target.value)}
//                         className="w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
//                         placeholder="0.0"
//                         step="0.001"
//                       />
//                     </div>
//                     <button
//                       type="submit"
//                       disabled={loading}
//                       className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50 font-mono relative overflow-hidden group"
//                     >
//                       <span className="relative z-10">
//                         {loading ? "Processing..." : "Send SOL"}
//                       </span>
//                       <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity"></span>
//                     </button>
//                   </div>
//                 </div>
//               </form>
//             </div>

//             {txHistory.length > 0 && (
//               <div className="p-6 border border-cyan-800 rounded-lg bg-black/50 backdrop-blur relative overflow-hidden mt-8">
//                 <div className="absolute inset-0 bg-[url('/sonic-pattern.svg')] opacity-5"></div>
//                 <div className="relative z-10">
//                   <h2 className="text-xl mb-4 text-cyan-400">
//                     Recent Transactions
//                   </h2>
//                   <div className="space-y-3">
//                     {txHistory.map((tx, index) => (
//                       <div
//                         key={index}
//                         className="flex justify-between items-center border-b border-cyan-800/30 pb-2"
//                       >
//                         <div>
//                           <div className="text-sm text-cyan-500">
//                             {tx.hash.slice(0, 8)}...{tx.hash.slice(-8)}
//                           </div>
//                           <div className="text-xs text-cyan-700">
//                             {tx.date.toLocaleString()}
//                           </div>
//                         </div>
//                         <div className="text-right">
//                           <div className="text-sm text-purple-400">
//                             -{tx.amount} SOL
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             )}
//             <div className="p-6 border border-cyan-800 rounded-lg bg-black/50 backdrop-blur relative overflow-hidden">
//               <div className="space-y-4 ">
//                 <div>
//                   <label className="block text-sm mb-2 text-cyan-500">
//                     NFT Mint Address
//                   </label>
//                   <input
//                     type="text"
//                     value={nftMint}
//                     onChange={(e) => setNftMint(e.target.value)}
//                     className="w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500"
//                     placeholder="Enter NFT mint address"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm mb-2 text-cyan-500">
//                     Loan Duration (seconds)
//                   </label>
//                   <input
//                     type="number"
//                     value={loanDuration}
//                     onChange={(e) => setLoanDuration(e.target.value)}
//                     className="w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500"
//                     placeholder="Enter loan duration"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm mb-2 text-cyan-500">
//                     Interest Rate
//                   </label>
//                   <input
//                     type="number"
//                     value={interestRate}
//                     onChange={(e) => setInterestRate(e.target.value)}
//                     className="w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500"
//                     placeholder="Enter interest rate"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm mb-2 text-cyan-500">
//                     Collateral Amount
//                   </label>
//                   <input
//                     type="number"
//                     value={collateralAmount}
//                     onChange={(e) => setCollateralAmount(e.target.value)}
//                     className="w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500"
//                     placeholder="Enter collateral amount"
//                   />
//                 </div>
//                 <button
//                   onClick={handleListNFT}
//                   className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded hover:from-cyan-500 hover:to-purple-500 transition-all"
//                 >
//                   List NFT
//                 </button>
//                 {/* Add more buttons as needed */}
//               </div>
//             </div>
//             <div className="space-y-4">
//               <div className="p-6 border border-cyan-800 rounded-lg bg-black/50">
//                 <h3 className="text-xl mb-4 text-cyan-400">Borrow NFT</h3>
//                 <div className="space-y-4">
//                   <div>
//                     <label className="block text-sm mb-2 text-cyan-500">
//                       Listing Address
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedListing}
//                       onChange={(e) => setSelectedListing(e.target.value)}
//                       className="w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500"
//                       placeholder="Enter listing address"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm mb-2 text-cyan-500">
//                       Collateral Mint
//                     </label>
//                     <input
//                       type="text"
//                       value={collateralMint}
//                       onChange={(e) => setCollateralMint(e.target.value)}
//                       className="w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500"
//                       placeholder="Enter collateral mint address"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm mb-2 text-cyan-500">
//                       NFT Mint
//                     </label>
//                     <input
//                       type="text"
//                       value={nftMint}
//                       onChange={(e) => setNftMint(e.target.value)}
//                       className="w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500"
//                       placeholder="Enter NFT mint address"
//                     />
//                   </div>
//                   <button
//                     onClick={handleBorrowNFT}
//                     disabled={
//                       !publicKey ||
//                       !selectedListing ||
//                       !collateralMint ||
//                       !nftMint
//                     }
//                     className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded
//                       hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50
//                       disabled:cursor-not-allowed"
//                   >
//                     Borrow NFT
//                   </button>
//                 </div>
//               </div>

//               <div className="p-6 border border-cyan-800 rounded-lg bg-black/50">
//                 <h3 className="text-xl mb-4 text-cyan-400">Repay Loan</h3>
//                 <div className="space-y-4">
//                   <div>
//                     <label className="block text-sm mb-2 text-cyan-500">
//                       Loan Address
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedLoan}
//                       onChange={(e) => setSelectedLoan(e.target.value)}
//                       className="w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500"
//                       placeholder="Enter loan address"
//                     />
//                   </div>
//                   <button
//                     onClick={handleRepayLoan}
//                     disabled={!publicKey || !selectedLoan}
//                     className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded
//                       hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50
//                       disabled:cursor-not-allowed"
//                   >
//                     Repay Loan
//                   </button>
//                 </div>
//               </div>

//               <div className="p-6 border border-cyan-800 rounded-lg bg-black/50">
//                 <h3 className="text-xl mb-4 text-cyan-400">Liquidate Loan</h3>
//                 <div className="space-y-4">
//                   <div>
//                     <label className="block text-sm mb-2 text-cyan-500">
//                       Loan Address
//                     </label>
//                     <input
//                       type="text"
//                       value={selectedLoan}
//                       onChange={(e) => setSelectedLoan(e.target.value)}
//                       className="w-full p-2 bg-black/50 border border-cyan-800 rounded text-cyan-500"
//                       placeholder="Enter loan address"
//                     />
//                   </div>
//                   <button
//                     onClick={handleLiquidateLoan}
//                     disabled={!publicKey || !selectedLoan}
//                     className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded
//                       hover:from-cyan-500 hover:to-purple-500 transition-all disabled:opacity-50
//                       disabled:cursor-not-allowed"
//                   >
//                     Liquidate Loan
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }
