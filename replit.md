# DeFi Trade Compliance Platform

## Overview

This application provides institutional-grade trade execution and compliance monitoring for DeFi trading on Base L2. It enables institutional investors to analyze Uniswap routing options, execute trades with best execution proof, and generate compliance reports for regulatory audits. The platform addresses the critical gap between DeFi trading capabilities and institutional regulatory requirements by providing pre-trade analysis, on-chain execution tracking, and post-trade compliance documentation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling:**
- React with TypeScript for type safety and developer experience
- Vite as the build tool for fast development and optimized production builds
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management and caching

**UI Component System:**
- shadcn/ui components with Radix UI primitives for accessible, customizable components
- Tailwind CSS for styling with custom design tokens matching institutional finance aesthetics
- Custom theme focused on professional "financial trust" color palette (indigo/royal blue primary, slate gray neutral, forest green success, amber warning, crimson alert)
- Typography using Inter for body text and JetBrains Mono for code/numbers

**Key Design Decisions:**
- Light mode only (optimized for office environments and document printing)
- Data-dense interfaces inspired by Bloomberg Terminal but with modern UX
- Focus on clarity and trust through clean layouts and professional color scheme

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript running on Node.js
- HTTP server for API endpoints and static file serving
- Custom logging middleware for request/response tracking
- Vite middleware integration for development hot-reloading

**API Design:**
- RESTful endpoints under `/api` prefix
- `/api/tokens/pairs` - Returns available trading pairs and token metadata
- `/api/analyze` - Accepts trade parameters and returns routing analysis from Uniswap
- `/api/trades` - CRUD operations for trade history (supports wallet filtering via `walletAddress` or `tradeIds` query params)
- `/api/execute` - Executes trades and stores compliance records

**Wallet-based Trade Filtering:**
- Connected wallets see only their own trades filtered by wallet address
- Demo mode users see trades stored in session storage
- Wallet addresses normalized to lowercase for case-insensitive matching

**External Integration Strategy:**
- Uniswap Labs API integration for routing quotes and execution data
- Simulated quote generation when API key unavailable (for development/demo)
- Support for multiple Uniswap protocols (V2, V3, V4, UniswapX, Mixed routes)

### Data Storage

**Database:**
- PostgreSQL as primary database
- Drizzle ORM for type-safe database operations and schema management
- Schema location: `shared/schema.ts` for code sharing between client and server

**Key Tables:**
- `users` - User authentication and profile data
- `trades` - Complete trade execution records including:
  - Trade parameters (pair, amounts, type)
  - Execution details (route, gas costs, effective rate)
  - Quality metrics (execution quality score, price impact, slippage)
  - Blockchain data (transaction hash, wallet address, network)
  - Compliance metadata (status, notes, timestamps)

**Schema Design Philosophy:**
- Store comprehensive audit trail for regulatory compliance
- Text fields for numeric values to preserve precision
- Timestamps for all records to support temporal queries
- Unique trade IDs for external reference and deduplication

### Application Flow

**Pre-Trade Analysis:**
1. User inputs trade parameters (token pair, amount)
2. Backend fetches quotes from Uniswap API for all available protocols
3. System calculates gas estimates, price impact, and net value for each route
4. Frontend displays comparative analysis with "best execution" recommendation
5. Routes ranked by net value after gas costs

**Trade Execution:**
1. User selects route and initiates execution
2. Modal displays multi-step progress (wallet approval, compliance check, on-chain execution, settlement)
3. Trade parameters and execution data stored in database
4. Transaction hash and on-chain confirmation tracked

**Post-Trade Compliance:**
1. System generates compliance report comparing predicted vs actual execution
2. Report includes quality score, effective rate, gas costs, and blockchain proof
3. Reports stored in database with unique IDs for audit retrieval
4. PDF export capability for regulatory submission

### Blockchain Integration

**Network:**
- Base L2 (Ethereum Layer 2) for low-cost execution (~$0.50 per trade)
- Chain ID: 8453

**Token Support:**
- Native ETH and wrapped tokens (WETH, cbETH)
- Stablecoins (USDC, USDbC, DAI)
- Token registry in `shared/tokens.ts` with official Base L2 addresses

**Web3 Stack (Planned/Future):**
- wagmi for React hooks and wallet interaction
- Web3Modal for wallet connection UI
- Viem for low-level Ethereum interactions

### Build & Deployment

**Build Process:**
- Client: Vite builds React app to `dist/public`
- Server: esbuild bundles server code to `dist/index.cjs`
- Bundle optimization: Selected dependencies bundled to reduce cold start times
- Separate build script (`script/build.ts`) coordinates both builds

**Development Workflow:**
- Separate dev scripts for client (`dev:client`) and server (`dev`)
- Vite HMR for instant client updates
- tsx for TypeScript execution without compilation step
- Database migrations via `db:push` script using Drizzle Kit

**Environment Configuration:**
- `DATABASE_URL` required for PostgreSQL connection
- Drizzle config points to `shared/schema.ts` for schema source
- Production mode uses compiled bundles, development uses direct execution

## External Dependencies

### Core Infrastructure
- **PostgreSQL Database** - Primary data store, provisioned via DATABASE_URL environment variable
- **Base L2 Network** - Ethereum Layer 2 for on-chain trade execution (Chain ID: 8453)

### Third-Party APIs
- **Uniswap Labs API** (`https://api.uniswap.org/v2`) - Route quotes, gas estimates, and execution data for V2/V3/V4/UniswapX protocols

### Key Libraries
- **Drizzle ORM** (`drizzle-orm`, `drizzle-kit`) - Type-safe database operations and migrations
- **Express** - Web server framework
- **React & Vite** - Frontend framework and build tool
- **TanStack Query** - Server state management
- **Radix UI** - Headless UI component primitives
- **Tailwind CSS** - Utility-first styling
- **Wouter** - Lightweight routing
- **TypeScript** - Type safety across entire stack

### Development Tools
- **Replit Platform Plugins** - Development banner, cartographer, runtime error modal, meta image injection
- **tsx** - TypeScript execution for development
- **esbuild** - Production server bundling