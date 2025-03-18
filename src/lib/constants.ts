import { PublicKey, clusterApiUrl } from "@solana/web3.js";

// This is the previous program id
// export const PROGRAM_ID = new PublicKey(
//   "BEF3CqKU1Db7FsqHyuugE7xd6YCz7gD3jMi2wA1yeD4x"
// );

// This is the new program id
export const PROGRAM_ID = new PublicKey(
    "7kpZb8kihX7FRtjVNsGYrGZqUmFzzsQSuEPo1zUo35vC"
  );

export const VAULT_AUTHORITY_SEED = "vault_authority";

export const MAINNET_RPC_URL = 'https://rpc.mainnet-alpha.sonic.game';
export const TESTNET_RPC_URL = "https://api.testnet.sonic.game";
