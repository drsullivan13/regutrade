# ReguTrade

Institutional-grade trade execution and compliance reporting for DeFi on Base L2.

## The Problem

Decentralized exchanges offer transparent, permissionless trading—but institutions need audit trails, best execution proof, and regulatory documentation. This platform bridges that gap.

## What It Does

- Queries Uniswap V3 QuoterV2 directly on-chain to discover optimal routes across all fee tiers
- Compares routing options with real-time gas costs converted to USD
- Executes trades through SwapRouter02 with configurable slippage protection
- Generates institutional PDF compliance reports with execution variance analysis
- Tracks complete trade history with blockchain verification links

## Architecture

```
client/          React 19, TypeScript, Tailwind, Wagmi
server/          Express, Drizzle ORM, Viem
shared/          Zod schemas, token registry
                      │
                      ▼
               Base L2 (Chain 8453)
          Uniswap V3 QuoterV2 + SwapRouter02
```

## Technical Highlights

**Direct Contract Integration** — Reads quotes from Uniswap's QuoterV2 contract without API dependencies. Queries all four fee tiers (0.01%, 0.05%, 0.3%, 1%) in parallel and ranks by net output after gas.

**Type-Safe Blockchain Interactions** — Uses Viem for contract calls and Wagmi for wallet state. Transaction calldata is built with full TypeScript inference from ABIs.

**Compliance-First Data Model** — Every trade stores predicted vs actual output, price impact, gas costs, routing strategy, and on-chain proof. JSONB field preserves all analyzed routes for audit.

## Quick Start

```bash
npm install
export DATABASE_URL=postgres://...
npm run db:push
npm run dev
```

Server runs at `localhost:5000` with hot reload.

## Stack

React · TypeScript · Tailwind · Express · PostgreSQL · Drizzle · Viem · Wagmi · Base L2
