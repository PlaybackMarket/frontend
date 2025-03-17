import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';

export async function getOrCreateATA(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey,
  payer: PublicKey,
  sendTransaction: (transaction: Transaction) => Promise<string>
): Promise<PublicKey> {
  try {
    const ata = await getAssociatedTokenAddress(mint, owner);

    // Check if the ATA exists
    const account = await connection.getAccountInfo(ata);
    if (!account) {
      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(payer, ata, owner, mint)
      );
      const signature = await sendTransaction(transaction);
      await connection.confirmTransaction(signature, 'confirmed');
    }

    return ata;
  } catch (error) {
    console.error('Error getting or creating ATA:', error);
    throw error;
  }
} 