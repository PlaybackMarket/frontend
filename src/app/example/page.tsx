"use client";

import { FC, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";

import {
  Program,
  Idl,
  AnchorProvider,
  setProvider,
  type Provider,
  BN,
} from "@coral-xyz/anchor";

import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import toast from "react-hot-toast";
import { useConnection } from "@solana/wallet-adapter-react";
import idl from "@/sc/sonic.json";

import type { Sonic } from "@/sc/types/sonic";
import { Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import LiquidateLoan from "./components/LiquidateLoan";
import RepayLoan from "./components/RepayLoan";
import ListNFT from "./components/ListNft";
import CancelListing from "./components/CancelListing";
import BorrowNFT from "./components/BorrowNFT";

export default function Example() {
  const wallet = useWallet();

  if (!wallet.publicKey) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Connect your wallet</h2>
        <p className="text-gray-400 mb-8">
          Please connect your wallet to interact with the protocol
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Sonic Protocol Interface</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ListNFT />
          <BorrowNFT />
          <CancelListing />
          <LiquidateLoan />
          <RepayLoan />
        </div>
      </div>
    </div>
  );
}
