// The Graph API Integration for Uniswap V3 on Base
// Fetches real-time token prices and pool data

import { TOKENS, BASE_CHAIN_ID, type Token } from "@shared/tokens";

// Uniswap V3 Base Subgraph ID (from The Graph's decentralized network)
const UNISWAP_V3_BASE_SUBGRAPH = "GqzP4Xaehti8KSfQmv3ZctFSjnSUYZ4En5NRsiTbvZpz";

const GRAPH_API_BASE = "https://gateway.thegraph.com/api";

interface PoolData {
  id: string;
  token0: {
    id: string;
    symbol: string;
    decimals: string;
  };
  token1: {
    id: string;
    symbol: string;
    decimals: string;
  };
  feeTier: string;
  liquidity: string;
  sqrtPrice: string;
  token0Price: string;
  token1Price: string;
  volumeUSD: string;
  txCount: string;
}

interface TokenData {
  id: string;
  symbol: string;
  name: string;
  decimals: string;
  derivedETH: string;
  volumeUSD: string;
  txCount: string;
}

export interface GraphPriceData {
  ethPriceUSD: string;
  tokens: Record<string, {
    priceUSD: string;
    priceETH: string;
    volume24h: string;
  }>;
  pools: PoolData[];
  timestamp: string;
}

// GraphQL query for token prices and pool data
const PRICE_QUERY = `
  query GetPrices($tokenAddresses: [String!]!) {
    bundle(id: "1") {
      ethPriceUSD
    }
    tokens(where: { id_in: $tokenAddresses }) {
      id
      symbol
      name
      decimals
      derivedETH
      volumeUSD
      txCount
    }
    pools(
      first: 20
      orderBy: volumeUSD
      orderDirection: desc
      where: { 
        token0_in: $tokenAddresses
        token1_in: $tokenAddresses 
      }
    ) {
      id
      token0 {
        id
        symbol
        decimals
      }
      token1 {
        id
        symbol
        decimals
      }
      feeTier
      liquidity
      sqrtPrice
      token0Price
      token1Price
      volumeUSD
      txCount
    }
  }
`;

// Fetch real-time prices from The Graph
export async function fetchGraphPrices(): Promise<GraphPriceData | null> {
  const apiKey = process.env.GRAPH_API_KEY;
  
  if (!apiKey) {
    console.log("No GRAPH_API_KEY found, skipping Graph integration");
    return null;
  }

  // Get token addresses (lowercase for subgraph)
  const tokenAddresses = Object.values(TOKENS)
    .filter(t => t.address !== "0x0000000000000000000000000000000000000000")
    .map(t => t.address.toLowerCase());

  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/${apiKey}/subgraphs/id/${UNISWAP_V3_BASE_SUBGRAPH}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: PRICE_QUERY,
          variables: { tokenAddresses },
        }),
      }
    );

    if (!response.ok) {
      console.error("Graph API error:", response.status, await response.text());
      return null;
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error("GraphQL errors:", result.errors);
      return null;
    }

    const data = result.data;
    const ethPriceUSD = data.bundle?.ethPriceUSD || "0";

    // Build token price map
    const tokens: Record<string, { priceUSD: string; priceETH: string; volume24h: string }> = {};
    
    for (const token of data.tokens || []) {
      const priceETH = parseFloat(token.derivedETH) || 0;
      const priceUSD = priceETH * parseFloat(ethPriceUSD);
      
      // Find our token symbol from address
      const ourToken = Object.values(TOKENS).find(
        t => t.address.toLowerCase() === token.id.toLowerCase()
      );
      
      if (ourToken) {
        tokens[ourToken.symbol] = {
          priceUSD: priceUSD.toFixed(6),
          priceETH: token.derivedETH,
          volume24h: token.volumeUSD,
        };
      }
    }

    return {
      ethPriceUSD,
      tokens,
      pools: data.pools || [],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch from The Graph:", error);
    return null;
  }
}

// Get current ETH price in USD
export async function getEthPrice(): Promise<number> {
  const data = await fetchGraphPrices();
  if (data) {
    return parseFloat(data.ethPriceUSD);
  }
  // Fallback price
  return 1850;
}

// Get token price in USD
export async function getTokenPriceUSD(symbol: string): Promise<number> {
  const data = await fetchGraphPrices();
  
  if (data && data.tokens[symbol]) {
    return parseFloat(data.tokens[symbol].priceUSD);
  }
  
  // Fallback prices for core tokens
  const fallbackPrices: Record<string, number> = {
    ETH: 1850,
    WETH: 1850,
    USDC: 1,
  };
  
  return fallbackPrices[symbol] || 0;
}

// Calculate swap rate between two tokens using Graph data
export async function getSwapRate(
  tokenInSymbol: string,
  tokenOutSymbol: string
): Promise<{ rate: number; ethPrice: number } | null> {
  const data = await fetchGraphPrices();
  
  if (!data) return null;
  
  const ethPrice = parseFloat(data.ethPriceUSD);
  
  // Get prices for both tokens
  const tokenInPrice = data.tokens[tokenInSymbol];
  const tokenOutPrice = data.tokens[tokenOutSymbol];
  
  if (!tokenInPrice || !tokenOutPrice) return null;
  
  const inPriceUSD = parseFloat(tokenInPrice.priceUSD);
  const outPriceUSD = parseFloat(tokenOutPrice.priceUSD);
  
  if (outPriceUSD === 0) return null;
  
  // Rate = how many tokenOut per tokenIn
  const rate = inPriceUSD / outPriceUSD;
  
  return { rate, ethPrice };
}
