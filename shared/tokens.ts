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

// Official Base L2 token addresses
export const TOKENS: Record<string, Token> = {
  ETH: {
    symbol: "ETH",
    name: "Ether",
    address: "0x0000000000000000000000000000000000000000", // Native ETH
    decimals: 18,
  },
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
  USDbC: {
    symbol: "USDbC",
    name: "USD Base Coin (Bridged)",
    address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA",
    decimals: 6,
  },
  DAI: {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb",
    decimals: 18,
  },
  cbETH: {
    symbol: "cbETH",
    name: "Coinbase Wrapped Staked ETH",
    address: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
    decimals: 18,
  },
  LINK: {
    symbol: "LINK",
    name: "Chainlink",
    address: "0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196",
    decimals: 18,
  },
  AAVE: {
    symbol: "AAVE",
    name: "Aave",
    address: "0x63706e401c06ac8513145b7687a14804d17f814b",
    decimals: 18,
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
  // Stablecoin to ETH pairs
  {
    id: "usdc-weth",
    from: TOKENS.USDC,
    to: TOKENS.WETH,
    label: "USDC -> WETH",
  },
  {
    id: "usdc-eth",
    from: TOKENS.USDC,
    to: TOKENS.ETH,
    label: "USDC -> ETH",
  },
  {
    id: "usdc-cbeth",
    from: TOKENS.USDC,
    to: TOKENS.cbETH,
    label: "USDC -> cbETH",
  },
  {
    id: "dai-weth",
    from: TOKENS.DAI,
    to: TOKENS.WETH,
    label: "DAI -> WETH",
  },
  {
    id: "usdbc-weth",
    from: TOKENS.USDbC,
    to: TOKENS.WETH,
    label: "USDbC -> WETH",
  },
  // ETH to stablecoin pairs
  {
    id: "weth-usdc",
    from: TOKENS.WETH,
    to: TOKENS.USDC,
    label: "WETH -> USDC",
  },
  {
    id: "eth-usdc",
    from: TOKENS.ETH,
    to: TOKENS.USDC,
    label: "ETH -> USDC",
  },
  // DeFi token pairs (verified official tokens on Base L2)
  {
    id: "usdc-link",
    from: TOKENS.USDC,
    to: TOKENS.LINK,
    label: "USDC -> LINK",
  },
  {
    id: "usdc-aave",
    from: TOKENS.USDC,
    to: TOKENS.AAVE,
    label: "USDC -> AAVE",
  },
  {
    id: "weth-link",
    from: TOKENS.WETH,
    to: TOKENS.LINK,
    label: "WETH -> LINK",
  },
  {
    id: "weth-aave",
    from: TOKENS.WETH,
    to: TOKENS.AAVE,
    label: "WETH -> AAVE",
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
