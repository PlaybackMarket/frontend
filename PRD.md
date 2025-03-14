# Sonic SVM Lending Protocol - Product Requirements Document

## 1. Project Overview

### 1.1 Project Name
Sonic SVM Lending Protocol

### 1.2 Description
A peer-to-peer lending platform for gaming assets (NFTs and fungible tokens) built on Solana L1 (Sonic SVM). The platform enables users to lend and borrow gaming assets with customizable terms and conditions.

### 1.3 Objective
Develop a fully functional lending protocol with a focused scope for a hackathon demonstration. The application will enable users to complete the entire lifecycle of lending and borrowing gaming assets on the Solana blockchain.

## 2. Technical Stack

- **Frontend**: Next.js
- **Package Manager**: pnpm
- **Blockchain**: Solana L1 (Sonic SVM)
- **Styling**: Tailwind CSS
- **Wallet Integration**: Solana wallets (Phantom, Solflare)

## 3. Detailed Feature Specifications

### 3.1 Wallet Connection

#### 3.1.1 Requirements
- Support connection to Solana wallets (Phantom, Solflare)
- Display wallet address in truncated format (e.g., 0x1234...5678)
- Show wallet balance in SOL
- Enable wallet disconnection

#### 3.1.2 User Flow
1. User clicks "CONNECT WALLET" button in the header
2. Wallet selection modal appears
3. User selects their preferred wallet
4. Upon successful connection, the button changes to show the truncated wallet address
5. Clicking the connected wallet address shows a dropdown with "Disconnect" option

### 3.2 Asset Marketplace

#### 3.2.1 Requirements
- Display gaming assets available for lending in a table format similar to blur.io
- Show key metrics for each asset: Floor Price, Top Bid, 1D Change, 7D Change, 15M Volume, 1D Volume, 7D Volume, Owners, Supply
- Implement sorting functionality for each column
- Support filtering by asset type (NFT/Fungible Token)
- Implement search functionality to find specific assets

#### 3.2.2 Asset Card Information
- Asset image/icon
- Asset name
- Collection name (for NFTs)
- Current floor price
- Price trend indicators (up/down arrows with percentage)
- Volume data

#### 3.2.3 User Flow
1. User lands on the homepage showing the asset marketplace
2. User can sort, filter, and search for assets
3. Clicking on an asset opens its detailed view

### 3.3 Asset Detail View

#### 3.3.1 Requirements
- Display comprehensive asset information
- Show lending terms available for this asset
- Display borrowing history and current status
- Show asset price history chart
- Display similar assets

#### 3.3.2 Information to Display
- Asset image (larger view)
- Asset name and collection
- Asset description
- Owner information
- Current floor price and price history
- Available lending terms
- Borrowing history

#### 3.3.3 User Flow
1. User clicks on an asset from the marketplace
2. Detailed view opens showing all asset information
3. User can choose to lend or borrow the asset from this view

### 3.4 Lending Functionality

#### 3.4.1 Requirements
- Allow users to list their assets for lending
- Enable setting custom lending terms:
  - Duration (in days)
  - Interest rate (percentage)
  - Collateral requirements (percentage of asset value)
- Support for both NFTs and fungible tokens
- Ability to cancel lending offers

#### 3.4.2 Lending Form Fields
- Asset selection (from user's wallet)
- Duration options: 1 day, 3 days, 7 days, 14 days, 30 days
- Interest rate input (percentage)
- Collateral requirement input (percentage of asset value)
- Terms and conditions checkbox

#### 3.4.3 User Flow
1. User navigates to "Lend" section
2. User selects an asset from their wallet
3. User sets lending terms (duration, interest rate, collateral)
4. User confirms the lending offer
5. Asset is listed on the marketplace as available for borrowing

### 3.5 Borrowing Functionality

#### 3.5.1 Requirements
- Allow users to browse assets available for borrowing
- Enable users to accept lending terms
- Require users to provide the necessary collateral
- Support for both NFTs and fungible tokens
- Implement borrowing period tracking

#### 3.5.2 Borrowing Process Information
- Display lending terms clearly
- Show collateral requirement
- Calculate total cost including interest
- Display borrowing period countdown

#### 3.5.3 User Flow
1. User finds an asset they want to borrow
2. User reviews the lending terms
3. User provides the required collateral
4. User confirms the borrowing transaction
5. Asset is transferred to the user's wallet for the specified duration

### 3.6 Loan Management

#### 3.6.1 Requirements
- Dashboard for users to track their active loans (both as lender and borrower)
- Display loan status, duration remaining, and interest accrued
- Enable early repayment functionality
- Implement automatic return process when loan period ends
- Handle collateral release upon successful return

#### 3.6.2 Dashboard Information
- Active loans as lender
- Active loans as borrower
- Loan history
- Upcoming loan expirations
- Interest earned/paid

#### 3.6.3 User Flow
1. User navigates to "Portfolio" section
2. User views their active loans and borrowings
3. User can choose to repay loans early
4. System automatically handles loan expiration and collateral management

### 3.7 Transaction History

#### 3.7.1 Requirements
- Comprehensive transaction history for all lending and borrowing activities
- Filter options by transaction type (lend, borrow, repay, etc.)
- Sort options by date, asset, value
- Export functionality for transaction records

#### 3.7.2 Transaction Information
- Transaction type
- Asset involved
- Date and time
- Transaction value
- Status (completed, pending, failed)
- Transaction hash (with link to Solana explorer)

#### 3.7.3 User Flow
1. User navigates to "Activity" section
2. User views their transaction history
3. User can filter and sort transactions
4. User can click on a transaction to view details

## 4. UI/UX Specifications

### 4.1 Design System

#### 4.1.1 Color Palette
- Primary Background: #000000 (Black)
- Secondary Background: #111111
- Accent Color: #FF6B00 (Orange, for buttons and highlights)
- Text Primary: #FFFFFF (White)
- Text Secondary: #AAAAAA (Light Gray)
- Success: #4CAF50 (Green)
- Error: #F44336 (Red)
- Warning: #FFC107 (Amber)

#### 4.1.2 Typography
- Primary Font: Inter or similar sans-serif font
- Headings: Bold, larger sizes
- Body Text: Regular weight
- Monospace font for wallet addresses and transaction hashes

#### 4.1.3 Components
- Buttons: Rectangular with slight rounded corners, orange fill for primary actions
- Cards: Dark background with subtle border or shadow
- Tables: Clean lines, alternating row colors for readability
- Charts: Minimal design with clear data points and tooltips

### 4.2 Page Layouts

#### 4.2.1 Header
- Logo on the left
- Navigation menu in the center (Collections, Portfolio, Activity, Airdrop)
- Search bar
- Connect Wallet button on the right

#### 4.2.2 Collections Page (Main Marketplace)
- Table layout similar to blur.io
- Columns for asset details
- Sorting and filtering options
- Pagination or infinite scroll

#### 4.2.3 Portfolio Page
- Tabs for "Lending", "Borrowing", "History"
- Cards or table layout for active loans
- Summary statistics at the top

#### 4.2.4 Activity Page
- Transaction history in table format
- Filtering options
- Detailed view for each transaction

#### 4.2.5 Asset Detail Page
- Asset image and details on the left
- Lending/Borrowing options on the right
- Price history chart
- Tabs for additional information

## 5. Smart Contract Functionality

### 5.1 Core Smart Contracts

#### 5.1.1 LendingPool Contract
- Manages the pool of assets available for lending
- Handles collateral management
- Processes interest calculations

#### 5.1.2 LoanManager Contract
- Creates and manages individual loan agreements
- Handles loan repayments
- Manages loan durations and expirations

#### 5.1.3 TokenWrapper Contract
- Handles wrapping of NFTs and fungible tokens for lending
- Ensures secure transfer of assets between parties

### 5.2 Key Smart Contract Functions

#### 5.2.1 Lending Functions
- `createLendingOffer(asset, duration, interestRate, collateralRequired)`
- `cancelLendingOffer(offerId)`
- `updateLendingTerms(offerId, newDuration, newInterestRate, newCollateralRequired)`

#### 5.2.2 Borrowing Functions
- `borrowAsset(offerId, collateralAmount)`
- `repayLoan(loanId)`
- `extendLoanDuration(loanId, additionalDays)`

#### 5.2.3 System Functions
- `calculateInterest(loanId)`
- `processExpiredLoans()`
- `releaseCollateral(loanId)`
- `claimDefaultedCollateral(loanId)`

## 6. Minimum Viable Product (MVP) Scope

For the hackathon, the MVP will focus on the following core functionality:

### 6.1 MVP Features
1. Wallet connection
2. Asset marketplace display (similar to blur.io)
3. Basic lending functionality (fixed terms)
4. Basic borrowing functionality
5. Simple loan management
6. Transaction history

### 6.2 MVP User Flows

#### 6.2.1 Lender Flow
1. Connect wallet
2. Navigate to Portfolio
3. Select asset to lend
4. Set basic lending terms
5. Confirm lending offer
6. View active lending offers

#### 6.2.2 Borrower Flow
1. Connect wallet
2. Browse available assets
3. Select asset to borrow
4. Review lending terms
5. Provide collateral
6. Confirm borrowing
7. View borrowed assets in Portfolio

#### 6.2.3 Loan Completion Flow
1. System tracks loan duration
2. Borrower repays loan before expiration
3. Asset returns to lender
4. Collateral returns to borrower
5. Transaction recorded in history

## 7. Future Enhancements (Post-Hackathon)

### 7.1 Additional Features
- Advanced interest rate models
- Auction-based lending
- NFT fractionalization
- Lending pools
- Governance token
- Risk assessment for assets
- Insurance fund for defaults

### 7.2 Integrations
- Gaming platforms integration
- Cross-chain lending
- Oracle price feeds
- Analytics dashboard

## 8. Technical Constraints

### 8.1 Solana L1 (Sonic SVM) Considerations
- Transaction speed and cost
- Smart contract limitations
- Wallet compatibility
- Token standards support

### 8.2 Frontend Performance
- Optimize for fast loading times
- Efficient data fetching
- Responsive design for all devices

## 9. Success Metrics

### 9.1 Hackathon Success Criteria
- Fully functional lending and borrowing flow
- Smooth user experience
- Secure smart contract implementation
- Visually appealing UI similar to blur.io
- Successful demonstration of a complete loan cycle

### 9.2 User Experience Goals
- Less than 3 seconds page load time
- Intuitive navigation
- Clear presentation of lending terms
- Transparent transaction process
- Responsive design across devices 