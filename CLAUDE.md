# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DeFi Trade Compliance Platform for institutional-grade trade execution on Base L2. Enables Uniswap routing analysis, trade execution with best execution proof, and compliance reports for regulatory audits.

## Commands

```bash
# Development - run the full-stack server (API + Vite HMR)
npm run dev

# Development - run only the Vite client
npm run dev:client

# Production build
npm run build

# Start production server
npm run start

# Type checking
npm run check

# Database schema push (requires DATABASE_URL)
npm run db:push
```

## Architecture

### Stack
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend**: Express.js + TypeScript running on Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Blockchain**: Base L2 (Chain ID: 8453) via viem/wagmi

### Directory Structure
```
client/           # React frontend (Vite root)
  src/
    pages/        # Route components (home, analysis, history, report)
    components/   # UI components (dashboard/, layout/, ui/, wallet/)
    lib/          # Utilities (wagmi config, queryClient, pdfGenerator, swap)
    hooks/        # React hooks
server/           # Express backend
  index.ts        # Server entry point, middleware setup
  routes.ts       # API route handlers
  storage.ts      # Database operations via Drizzle
  uniswapV3.ts    # Uniswap V3 QuoterV2 integration
shared/           # Shared between client and server
  schema.ts       # Drizzle schema (users, trades tables)
  tokens.ts       # Token registry with Base L2 addresses
```

### Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

### API Endpoints
- `GET /api/tokens/pairs` - Available trading pairs
- `POST /api/analyze` - Get Uniswap V3 quotes for trade routes
- `GET /api/trades` - Trade history (supports `walletAddress` or `tradeIds` query params)
- `GET /api/trades/:tradeId` - Single trade details
- `POST /api/trades` - Record executed trade
- `GET /api/price` - Current ETH/USD price

### Key Patterns
- Schema validation with Zod (via drizzle-zod)
- TanStack Query for server state management
- Wouter for lightweight client-side routing
- shadcn/ui components built on Radix UI primitives
- Wallet addresses normalized to lowercase for filtering

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - development/production
