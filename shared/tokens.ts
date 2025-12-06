// Base L2 Token Registry
// Chain ID: 8453
// Reference: https://basescan.org

export const BASE_CHAIN_ID = 8453;

export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI?: string;
}

// Official Base L2 token addresses - Core tokens only (USDC and WETH)
export const TOKENS: Record<string, Token> = {
  WETH: {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18,
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
  },
};

// Supported trading pairs for the platform
export interface TokenPair {
  id: string;
  from: Token;
  to: Token;
  label: string;
}

export const TOKEN_PAIRS: TokenPair[] = [
  // USDC <-> WETH pairs (the only valid Uniswap swap pairs)
  {
    id: "usdc-weth",
    from: TOKENS.USDC,
    to: TOKENS.WETH,
    label: "USDC -> WETH",
  },
  {
    id: "weth-usdc",
    from: TOKENS.WETH,
    to: TOKENS.USDC,
    label: "WETH -> USDC",
  },
];

// Helper to format token amounts for display
export function formatTokenAmount(amount: string, decimals: number): string {
  const num = parseFloat(amount) / Math.pow(10, decimals);
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + "K";
  }
  if (num < 0.0001) {
    return num.toExponential(4);
  }
  return num.toFixed(4);
}

// Parse human-readable amount to raw amount with decimals
export function parseTokenAmount(amount: string, decimals: number): string {
  const num = parseFloat(amount);
  const raw = num * Math.pow(10, decimals);
  return Math.floor(raw).toString();
}

// Get token by symbol
export function getToken(symbol: string): Token | undefined {
  return TOKENS[symbol.toUpperCase()];
}

// Get token pair by id
export function getTokenPair(id: string): TokenPair | undefined {
  return TOKEN_PAIRS.find(pair => pair.id === id);
}
