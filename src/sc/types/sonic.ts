/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/sonic.json`.
 */
export type Sonic = {
  "address": "BEF3CqKU1Db7FsqHyuugE7xd6YCz7gD3jMi2wA1yeD4x",
  "metadata": {
    "name": "sonic",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "borrowNft",
      "discriminator": [
        204,
        252,
        145,
        5,
        59,
        189,
        158,
        223
      ],
      "accounts": [
        {
          "name": "borrower",
          "writable": true,
          "signer": true
        },
        {
          "name": "listing",
          "writable": true
        },
        {
          "name": "loan",
          "writable": true,
          "signer": true
        },
        {
          "name": "collateralMint"
        },
        {
          "name": "borrowerCollateralAccount",
          "writable": true
        },
        {
          "name": "vaultCollateralAccount",
          "writable": true
        },
        {
          "name": "borrowerNftAccount",
          "writable": true
        },
        {
          "name": "vaultNftAccount",
          "writable": true
        },
        {
          "name": "vaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "nftMint"
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "state",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "liquidateLoan",
      "discriminator": [
        111,
        249,
        185,
        54,
        161,
        147,
        178,
        24
      ],
      "accounts": [
        {
          "name": "liquidator",
          "writable": true,
          "signer": true
        },
        {
          "name": "loan",
          "writable": true
        },
        {
          "name": "listing",
          "writable": true
        },
        {
          "name": "collateralMint"
        },
        {
          "name": "vaultCollateralAccount",
          "writable": true
        },
        {
          "name": "lenderCollateralAccount",
          "writable": true
        },
        {
          "name": "vaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "listNft",
      "discriminator": [
        88,
        221,
        93,
        166,
        63,
        220,
        106,
        232
      ],
      "accounts": [
        {
          "name": "lender",
          "writable": true,
          "signer": true
        },
        {
          "name": "listing",
          "writable": true,
          "signer": true
        },
        {
          "name": "nftMint"
        },
        {
          "name": "lenderNftAccount",
          "writable": true
        },
        {
          "name": "vaultNftAccount",
          "writable": true
        },
        {
          "name": "vaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "loanDuration",
          "type": "i64"
        },
        {
          "name": "interestRate",
          "type": "u64"
        },
        {
          "name": "collateralAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "repayLoan",
      "discriminator": [
        224,
        93,
        144,
        77,
        61,
        17,
        137,
        54
      ],
      "accounts": [
        {
          "name": "borrower",
          "writable": true,
          "signer": true
        },
        {
          "name": "loan",
          "writable": true
        },
        {
          "name": "listing",
          "writable": true
        },
        {
          "name": "collateralMint"
        },
        {
          "name": "borrowerCollateralAccount",
          "writable": true
        },
        {
          "name": "vaultCollateralAccount",
          "writable": true
        },
        {
          "name": "lenderCollateralAccount",
          "writable": true
        },
        {
          "name": "borrowerNftAccount",
          "writable": true
        },
        {
          "name": "vaultNftAccount",
          "writable": true
        },
        {
          "name": "lenderNftAccount",
          "writable": true
        },
        {
          "name": "vaultAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "nftMint"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "loan",
      "discriminator": [
        20,
        195,
        70,
        117,
        165,
        227,
        182,
        1
      ]
    },
    {
      "name": "nftListing",
      "discriminator": [
        35,
        98,
        212,
        46,
        196,
        243,
        199,
        114
      ]
    },
    {
      "name": "protocolState",
      "discriminator": [
        33,
        51,
        173,
        134,
        35,
        140,
        195,
        248
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "listingNotActive",
      "msg": "The listing is not active"
    },
    {
      "code": 6001,
      "name": "loanNotActive",
      "msg": "The loan is not active"
    },
    {
      "code": 6002,
      "name": "loanLiquidated",
      "msg": "The loan has already been liquidated"
    },
    {
      "code": 6003,
      "name": "loanNotLiquidatable",
      "msg": "The loan cannot be liquidated yet"
    },
    {
      "code": 6004,
      "name": "invalidDuration",
      "msg": "Invalid loan duration"
    },
    {
      "code": 6005,
      "name": "invalidCollateral",
      "msg": "Invalid collateral amount"
    },
    {
      "code": 6006,
      "name": "unauthorizedAccess",
      "msg": "Unauthorized access"
    },
    {
      "code": 6007,
      "name": "mathOverflow",
      "msg": "Math overflow"
    }
  ],
  "types": [
    {
      "name": "loan",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "borrower",
            "type": "pubkey"
          },
          {
            "name": "listing",
            "type": "pubkey"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "collateralAmount",
            "type": "u64"
          },
          {
            "name": "interestRate",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "isLiquidated",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "nftListing",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lender",
            "type": "pubkey"
          },
          {
            "name": "nftMint",
            "type": "pubkey"
          },
          {
            "name": "loanDuration",
            "type": "i64"
          },
          {
            "name": "interestRate",
            "type": "u64"
          },
          {
            "name": "collateralAmount",
            "type": "u64"
          },
          {
            "name": "isActive",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "protocolState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "protocolFee",
            "type": "u16"
          }
        ]
      }
    }
  ]
};
