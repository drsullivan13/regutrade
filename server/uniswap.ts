// Uniswap Labs API Integration for Base L2
// Documentation: https://docs.uniswap.org/api/reference

import { TOKENS, BASE_CHAIN_ID, parseTokenAmount, type Token } from "@shared/tokens";

const UNISWAP_API_BASE = "https://api.uniswap.org/v2";

// Uniswap protocol types
export type Protocol = "v2" | "v3" | "v4" | "mixed";

export interface QuoteRequest {
  tokenIn: string;
  tokenInDecimals: number;
  tokenOut: string;
  tokenOutDecimals: number;
  amount: string; // Raw amount with decimals
  type: "EXACT_INPUT" | "EXACT_OUTPUT";
  protocols?: Protocol[];
  slippageTolerance?: number; // Basis points (50 = 0.5%)
}

export interface RouteQuote {
  id: string;
  protocol: string;
  routeString: string;
  amountOut: string;
  amountOutFormatted: string;
  gasEstimate: string;
  gasEstimateUSD: string;
  priceImpact: string;
  netValueUSD: string;
  isBest: boolean;
}

export interface QuoteResponse {
  routes: RouteQuote[];
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  amountInFormatted: string;
  timestamp: string;
}

// Simulated quotes for demo purposes when API key is not available
// This provides realistic data structure matching Uniswap's response format
function generateSimulatedQuotes(
  tokenIn: Token,
  tokenOut: Token,
  amountInRaw: string,
  amountInFormatted: string
): QuoteResponse {
  const amount = parseFloat(amountInFormatted);
  
  // Realistic ETH price simulation (~$1850/WETH)
  let baseRate = 0.000542; // USDC to WETH rate
  
  if (tokenIn.symbol === "WETH" && tokenOut.symbol === "USDC") {
    baseRate = 1845.50; // WETH to USDC
  } else if (tokenIn.symbol === "DAI") {
    baseRate = 0.000540; // DAI slightly different
  }

  const routes: RouteQuote[] = [
    {
      id: "v3-optimized",
      protocol: "Uniswap V3",
      routeString: `${tokenIn.symbol} → [0.05%] → ${tokenOut.symbol}`,
      amountOut: (amount * baseRate * 0.9998).toFixed(tokenOut.decimals > 6 ? 6 : 2),
      amountOutFormatted: (amount * baseRate * 0.9998).toFixed(4),
      gasEstimate: "145000",
      gasEstimateUSD: "0.42",
      priceImpact: "-0.02%",
      netValueUSD: (amount * 0.9998 - 0.42).toFixed(2),
      isBest: true,
    },
    {
      id: "v3-standard",
      protocol: "Uniswap V3",
      routeString: `${tokenIn.symbol} → [0.30%] → ${tokenOut.symbol}`,
      amountOut: (amount * baseRate * 0.9985).toFixed(tokenOut.decimals > 6 ? 6 : 2),
      amountOutFormatted: (amount * baseRate * 0.9985).toFixed(4),
      gasEstimate: "120000",
      gasEstimateUSD: "0.35",
      priceImpact: "-0.05%",
      netValueUSD: (amount * 0.9985 - 0.35).toFixed(2),
      isBest: false,
    },
    {
      id: "v2-legacy",
      protocol: "Uniswap V2",
      routeString: `${tokenIn.symbol} → ${tokenOut.symbol}`,
      amountOut: (amount * baseRate * 0.9970).toFixed(tokenOut.decimals > 6 ? 6 : 2),
      amountOutFormatted: (amount * baseRate * 0.9970).toFixed(4),
      gasEstimate: "95000",
      gasEstimateUSD: "0.28",
      priceImpact: "-0.12%",
      netValueUSD: (amount * 0.9970 - 0.28).toFixed(2),
      isBest: false,
    },
  ];

  return {
    routes,
    tokenIn,
    tokenOut,
    amountIn: amountInRaw,
    amountInFormatted,
    timestamp: new Date().toISOString(),
  };
}

// Main quote function - will use real API when key is available
export async function getQuotes(
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amountIn: string // Human-readable amount
): Promise<QuoteResponse> {
  const tokenIn = TOKENS[tokenInSymbol.toUpperCase()];
  const tokenOut = TOKENS[tokenOutSymbol.toUpperCase()];

  if (!tokenIn || !tokenOut) {
    throw new Error(`Unknown token: ${tokenInSymbol} or ${tokenOutSymbol}`);
  }

  const amountInRaw = parseTokenAmount(amountIn, tokenIn.decimals);

  // Check for Uniswap API key
  const apiKey = process.env.UNISWAP_API_KEY;

  if (apiKey) {
    // Real Uniswap API call
    try {
      const response = await fetch(`${UNISWAP_API_BASE}/quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          tokenIn: tokenIn.address,
          tokenInChainId: BASE_CHAIN_ID,
          tokenOut: tokenOut.address,
          tokenOutChainId: BASE_CHAIN_ID,
          amount: amountInRaw,
          type: "EXACT_INPUT",
          protocols: ["v2", "v3"],
          slippageTolerance: 50, // 0.5%
        }),
      });

      if (!response.ok) {
        console.warn("Uniswap API error, falling back to simulation:", response.status);
        return generateSimulatedQuotes(tokenIn, tokenOut, amountInRaw, amountIn);
      }

      const data = await response.json();
      
      // Transform API response to our format
      // Note: Actual API response structure may vary - adapt as needed
      return {
        routes: data.routes?.map((route: any, index: number) => ({
          id: `route-${index}`,
          protocol: route.protocol || "Uniswap",
          routeString: route.routeString || `${tokenIn.symbol} → ${tokenOut.symbol}`,
          amountOut: route.quote || "0",
          amountOutFormatted: (parseFloat(route.quote || "0") / Math.pow(10, tokenOut.decimals)).toFixed(4),
          gasEstimate: route.gasEstimate || "150000",
          gasEstimateUSD: route.gasUseEstimateUSD || "0.50",
          priceImpact: route.priceImpact || "0%",
          netValueUSD: route.quoteGasAdjustedUSD || "0",
          isBest: index === 0,
        })) || [],
        tokenIn,
        tokenOut,
        amountIn: amountInRaw,
        amountInFormatted: amountIn,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.warn("Uniswap API call failed, using simulation:", error);
      return generateSimulatedQuotes(tokenIn, tokenOut, amountInRaw, amountIn);
    }
  }

  // No API key - use simulation
  console.log("No UNISWAP_API_KEY found, using simulated quotes");
  return generateSimulatedQuotes(tokenIn, tokenOut, amountInRaw, amountIn);
}

// Export for use in routes
export { TOKENS, TOKEN_PAIRS, BASE_CHAIN_ID } from "@shared/tokens";
