/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/sonic.json`.
 */
import { Idl } from '@project-serum/anchor';

export interface Sonic extends Idl {
  version: '0.1.0';
  name: 'sonic';
  instructions: [
    {
      name: 'borrow_nft';
      accounts: [
        { name: 'borrower'; isMut: true; isSigner: true },
        { name: 'listing'; isMut: true; isSigner: false },
        { name: 'loan'; isMut: true; isSigner: true },
        { name: 'borrower_nft_account'; isMut: true; isSigner: false },
        { name: 'vault_nft_account'; isMut: true; isSigner: false },
        { name: 'vault_authority'; isMut: true; isSigner: false; pda: { seeds: [{ kind: 'const'; value: number[] }] } },
        { name: 'token_program'; isMut: false; isSigner: false; address: string },
        { name: 'system_program'; isMut: false; isSigner: false; address: string },
        { name: 'rent'; isMut: false; isSigner: false; address: string },
        { name: 'nft_mint'; isMut: false; isSigner: false }
      ];
      args: [];
    },
    {
      name: 'cancel_listing';
      accounts: [
        { name: 'lender'; isMut: true; isSigner: true },
        { name: 'listing'; isMut: true; isSigner: false },
        { name: 'nft_mint'; isMut: false; isSigner: false },
        { name: 'vault_nft_account'; isMut: true; isSigner: false },
        { name: 'lender_nft_account'; isMut: true; isSigner: false },
        { name: 'vault_authority'; isMut: false; isSigner: false; pda: { seeds: [{ kind: 'const'; value: number[] }] } },
        { name: 'token_program'; isMut: false; isSigner: false; address: string }
      ];
      args: [];
    },
    {
      name: 'initialize';
      accounts: [
        { name: 'authority'; isMut: true; isSigner: true },
        { name: 'state'; isMut: true; isSigner: true },
        { name: 'system_program'; isMut: false; isSigner: false; address: string }
      ];
      args: [];
    },
    {
      name: 'liquidate_loan';
      accounts: [
        { name: 'liquidator'; isMut: true; isSigner: true },
        { name: 'lender'; isMut: true; isSigner: false },
        { name: 'loan'; isMut: true; isSigner: false },
        { name: 'listing'; isMut: true; isSigner: false },
        { name: 'vault_authority'; isMut: true; isSigner: false; pda: { seeds: [{ kind: 'const'; value: number[] }] } },
        { name: 'system_program'; isMut: false; isSigner: false; address: string }
      ];
      args: [];
    },
    {
      name: 'list_nft';
      accounts: [
        { name: 'lender'; isMut: true; isSigner: true },
        { name: 'listing'; isMut: true; isSigner: true },
        { name: 'nft_mint'; isMut: false; isSigner: false },
        { name: 'lender_nft_account'; isMut: true; isSigner: false },
        { name: 'vault_nft_account'; isMut: true; isSigner: false },
        { name: 'vault_authority'; isMut: false; isSigner: false; pda: { seeds: [{ kind: 'const'; value: number[] }] } },
        { name: 'token_program'; isMut: false; isSigner: false; address: string },
        { name: 'associated_token_program'; isMut: false; isSigner: false; address: string },
        { name: 'system_program'; isMut: false; isSigner: false; address: string },
        { name: 'rent'; isMut: false; isSigner: false; address: string }
      ];
      args: [
        { name: 'loan_duration'; type: 'u64' },
        { name: 'interest_rate'; type: 'u64' },
        { name: 'collateral_amount'; type: 'u64' }
      ];
    },
    {
      name: 'repay_loan';
      accounts: [
        { name: 'borrower'; isMut: true; isSigner: true },
        { name: 'lender'; isMut: true; isSigner: false },
        { name: 'loan'; isMut: true; isSigner: false },
        { name: 'listing'; isMut: true; isSigner: false },
        { name: 'nft_mint'; isMut: false; isSigner: false },
        { name: 'borrower_nft_account'; isMut: true; isSigner: false },
        { name: 'vault_nft_account'; isMut: true; isSigner: false },
        { name: 'lender_nft_account'; isMut: true; isSigner: false },
        { name: 'vault_authority'; isMut: false; isSigner: false; pda: { seeds: [{ kind: 'const'; value: number[] }] } },
        { name: 'token_program'; isMut: false; isSigner: false; address: string },
        { name: 'associated_token_program'; isMut: false; isSigner: false; address: string },
        { name: 'system_program'; isMut: false; isSigner: false; address: string }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: 'loan';
      type: {
        kind: 'struct';
        fields: [
          { name: 'borrower'; type: 'publicKey' },
          { name: 'listing'; type: 'publicKey' },
          { name: 'start_time'; type: 'i64' },
          { name: 'end_time'; type: 'i64' },
          { name: 'collateral_amount'; type: 'u64' },
          { name: 'interest_rate'; type: 'u64' },
          { name: 'loan_duration'; type: 'u64' },
          { name: 'is_active'; type: 'bool' }
        ];
      };
    },
    {
      name: 'nft_listing';
      type: {
        kind: 'struct';
        fields: [
          { name: 'lender'; type: 'publicKey' },
          { name: 'nft_mint'; type: 'publicKey' },
          { name: 'loan_duration'; type: 'u64' },
          { name: 'interest_rate'; type: 'u64' },
          { name: 'collateral_amount'; type: 'u64' },
          { name: 'is_active'; type: 'bool' }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: 'listing_not_active';
      msg: 'The listing is not active';
    },
    {
      code: 6001;
      name: 'loan_not_active';
      msg: 'The loan is not active';
    },
    {
      code: 6002;
      name: 'loan_liquidated';
      msg: 'The loan has already been liquidated';
    },
    {
      code: 6003;
      name: 'loan_not_liquidatable';
      msg: 'The loan cannot be liquidated yet';
    },
    {
      code: 6004;
      name: 'invalid_duration';
      msg: 'Invalid loan duration';
    },
    {
      code: 6005;
      name: 'invalid_collateral';
      msg: 'Invalid collateral amount';
    },
    {
      code: 6006;
      name: 'unauthorized_access';
      msg: 'Unauthorized access';
    },
    {
      code: 6007;
      name: 'math_overflow';
      msg: 'Math overflow';
    },
    {
      code: 6008;
      name: 'invalid_token_balance';
      msg: 'Invalid token balance';
    }
  ];
}
