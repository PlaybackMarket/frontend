import { PublicKey } from '@solana/web3.js';

const VAULT_AUTHORITY_SEED = Buffer.from('vault_authority');

export async function findVaultAuthorityPDA(
  programId: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress([VAULT_AUTHORITY_SEED], programId);
} 