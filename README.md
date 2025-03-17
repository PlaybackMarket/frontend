# Playback - Gaming Asset Lending Protocol

Playback is a peer-to-peer lending platform for gaming assets built on Solana. It allows NFT owners to lend their gaming assets and earn interest, while borrowers can access these assets by providing collateral.

## Features

- **Lending**: NFT owners can list their gaming assets for lending, setting loan duration, interest rate, and required collateral.
- **Borrowing**: Users can borrow NFTs by providing collateral, use them for the loan duration, and return them to get their collateral back.
- **Portfolio Management**: Track your lending and borrowing activities in one place.
- **Collection Exploration**: Browse collections and view available lending offers.

## Technical Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Blockchain**: Solana, Anchor Framework
- **Wallet Integration**: Solana Wallet Adapter (supports Phantom, Solflare, Backpack, and Nightly)

## Smart Contract Functionality

The protocol implements the following core functions:

1. **List NFT**: Allows an NFT owner to list their asset for lending with specified terms.
2. **Borrow NFT**: Enables a borrower to deposit collateral and borrow a listed NFT.
3. **Repay Loan**: Allows a borrower to return the NFT and retrieve their collateral minus interest.
4. **Liquidate Loan**: Handles the case when a loan is not repaid by the due date.

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- A Solana wallet (Phantom, Solflare, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/playback.git
cd playback

# Install dependencies
npm install
# or
yarn install

# Start the development server
npm run dev
# or
yarn dev
```

### Usage

1. Connect your Solana wallet using the "Connect Wallet" button.
2. Browse collections to find NFTs available for lending or borrowing.
3. To lend an NFT:
   - Navigate to your NFT in the Collections or Portfolio section
   - Click "Lend" and set your terms (duration, interest rate, collateral)
   - Confirm the transaction
4. To borrow an NFT:
   - Find an NFT with active lending offers
   - Click "Borrow" and review the terms
   - Deposit the required collateral
   - The NFT will be transferred to your wallet
5. To repay a loan:
   - Go to your Portfolio and find the borrowed NFT
   - Click "Repay" and confirm the transaction
   - Your collateral will be returned minus the interest

## Development Roadmap

- **Phase 1**: Core lending and borrowing functionality (current)
- **Phase 2**: Advanced features (partial repayments, refinancing, etc.)
- **Phase 3**: Integration with gaming platforms
- **Phase 4**: Mobile app and expanded blockchain support

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please reach out to us at support@playback.io
