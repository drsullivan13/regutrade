// Uniswap Labs API Integration for Base L2
// Documentation: https://docs.uniswap.org/api/reference

import { TOKENS, BASE_CHAIN_ID, parseTokenAmount, type Token } from "@shared/tokens";
import { getSwapRate, getEthPrice } from "./graph";

const UNISWAP_API_BASE = "https://api.uniswap.org/v2";

// Uniswap protocol types
export type Protocol = "v2" | "v3" | "v4" | "mixed";

export interface QuoteRequest {
  tokenIn: string;
  tokenInDecimals: number;
  tokenOut: string;
  tokenOutDecimals: number;
  amount: string;
  type: "EXACT_INPUT" | "EXACT_OUTPUT";
  protocols?: Protocol[];
  slippageTolerance?: number;
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
  priceSource?: string;
}

// Generate quotes using The Graph for real prices
async function generateQuotesWithGraphPricing(
  tokenIn: Token,
  tokenOut: Token,
  amountInRaw: string,
  amountInFormatted: string
): Promise<QuoteResponse> {
  const amount = parseFloat(amountInFormatted);
  
  // Try to get real swap rate from The Graph
  const swapData = await getSwapRate(tokenIn.symbol, tokenOut.symbol);
  const ethPrice = await getEthPrice();
  
  let baseRate: number;
  let priceSource: string;
  
  if (swapData) {
    baseRate = swapData.rate;
    priceSource = "The Graph (Live)";
    console.log(`Using Graph pricing: 1 ${tokenIn.symbol} = ${baseRate.toFixed(6)} ${tokenOut.symbol}`);
  } else {
    // Fallback to hardcoded rates
    if (tokenIn.symbol === "USDC" || tokenIn.symbol === "USDbC" || tokenIn.symbol === "DAI") {
      if (tokenOut.symbol === "WETH") {
        baseRate = 1 / ethPrice;
      } else if (tokenOut.symbol === "cbETH") {
        baseRate = 1 / (ethPrice * 1.07); // cbETH trades at ~7% premium
      } else {
        baseRate = 1;
      }
    } else if (tokenIn.symbol === "WETH") {
      baseRate = ethPrice;
    } else {
      baseRate = 1;
    }
    priceSource = "Fallback";
  }

  // Calculate gas costs in USD (Base L2 is very cheap)
  const baseGasPrice = 0.001; // ~$0.001 per gas unit on Base
  
  const routes: RouteQuote[] = [
    {
      id: "v3-optimized",
      protocol: "Uniswap V3",
      routeString: `${tokenIn.symbol} → [0.05%] → ${tokenOut.symbol}`,
      amountOut: (amount * baseRate * 0.9998).toFixed(tokenOut.decimals > 6 ? 6 : 2),
      amountOutFormatted: (amount * baseRate * 0.9998).toFixed(6),
      gasEstimate: "145000",
      gasEstimateUSD: (145000 * baseGasPrice).toFixed(2),
      priceImpact: calculatePriceImpact(amount, 0.0002),
      netValueUSD: calculateNetValue(amount, baseRate, 0.9998, 145000 * baseGasPrice, tokenOut.symbol, ethPrice),
      isBest: true,
    },
    {
      id: "v3-standard",
      protocol: "Uniswap V3",
      routeString: `${tokenIn.symbol} → [0.30%] → ${tokenOut.symbol}`,
      amountOut: (amount * baseRate * 0.9985).toFixed(tokenOut.decimals > 6 ? 6 : 2),
      amountOutFormatted: (amount * baseRate * 0.9985).toFixed(6),
      gasEstimate: "120000",
      gasEstimateUSD: (120000 * baseGasPrice).toFixed(2),
      priceImpact: calculatePriceImpact(amount, 0.0015),
      netValueUSD: calculateNetValue(amount, baseRate, 0.9985, 120000 * baseGasPrice, tokenOut.symbol, ethPrice),
      isBest: false,
    },
    {
      id: "v2-legacy",
      protocol: "Uniswap V2",
      routeString: `${tokenIn.symbol} → ${tokenOut.symbol}`,
      amountOut: (amount * baseRate * 0.9970).toFixed(tokenOut.decimals > 6 ? 6 : 2),
      amountOutFormatted: (amount * baseRate * 0.9970).toFixed(6),
      gasEstimate: "95000",
      gasEstimateUSD: (95000 * baseGasPrice).toFixed(2),
      priceImpact: calculatePriceImpact(amount, 0.003),
      netValueUSD: calculateNetValue(amount, baseRate, 0.9970, 95000 * baseGasPrice, tokenOut.symbol, ethPrice),
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
    priceSource,
  };
}

// Calculate price impact based on trade size
function calculatePriceImpact(amount: number, baseImpact: number): string {
  // Larger trades have more impact
  const sizeMultiplier = amount > 1000000 ? 2 : amount > 100000 ? 1.5 : 1;
  const impact = baseImpact * sizeMultiplier * 100;
  return `-${impact.toFixed(2)}%`;
}

// Calculate net value in USD
function calculateNetValue(
  amountIn: number,
  rate: number,
  efficiency: number,
  gasCostUSD: number,
  tokenOutSymbol: string,
  ethPrice: number
): string {
  const outputAmount = amountIn * rate * efficiency;
  
  // Convert output to USD
  let outputUSD: number;
  if (tokenOutSymbol === "WETH") {
    outputUSD = outputAmount * ethPrice;
  } else if (tokenOutSymbol === "cbETH") {
    outputUSD = outputAmount * ethPrice * 1.07;
  } else {
    // Stablecoins
    outputUSD = outputAmount;
  }
  
  return (outputUSD - gasCostUSD).toFixed(2);
}

// Main quote function - uses Graph pricing when available
export async function getQuotes(
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amountIn: string
): Promise<QuoteResponse> {
  const tokenIn = TOKENS[tokenInSymbol.toUpperCase()];
  const tokenOut = TOKENS[tokenOutSymbol.toUpperCase()];

  if (!tokenIn || !tokenOut) {
    throw new Error(`Unknown token: ${tokenInSymbol} or ${tokenOutSymbol}`);
  }

  const amountInRaw = parseTokenAmount(amountIn, tokenIn.decimals);

  // Check for Uniswap Labs API key first (preferred for execution)
  const uniswapApiKey = process.env.UNISWAP_API_KEY;

  if (uniswapApiKey) {
    try {
      const response = await fetch(`${UNISWAP_API_BASE}/quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": uniswapApiKey,
        },
        body: JSON.stringify({
          tokenIn: tokenIn.address,
          tokenInChainId: BASE_CHAIN_ID,
          tokenOut: tokenOut.address,
          tokenOutChainId: BASE_CHAIN_ID,
          amount: amountInRaw,
          type: "EXACT_INPUT",
          protocols: ["v2", "v3"],
          slippageTolerance: 50,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          routes: data.routes?.map((route: any, index: number) => ({
            id: `route-${index}`,
            protocol: route.protocol || "Uniswap",
            routeString: route.routeString || `${tokenIn.symbol} → ${tokenOut.symbol}`,
            amountOut: route.quote || "0",
            amountOutFormatted: (parseFloat(route.quote || "0") / Math.pow(10, tokenOut.decimals)).toFixed(6),
            gasEstimate: route.gasEstimate || "150000",
            gasEstimateUSD: route.gasUseEstimateUSD || "0.15",
            priceImpact: route.priceImpact || "0%",
            netValueUSD: route.quoteGasAdjustedUSD || "0",
            isBest: index === 0,
          })) || [],
          tokenIn,
          tokenOut,
          amountIn: amountInRaw,
          amountInFormatted: amountIn,
          timestamp: new Date().toISOString(),
          priceSource: "Uniswap Labs API",
        };
      }
    } catch (error) {
      console.warn("Uniswap Labs API call failed:", error);
    }
  }

  // Use The Graph for pricing data
  console.log("Using The Graph for pricing data...");
  return generateQuotesWithGraphPricing(tokenIn, tokenOut, amountInRaw, amountIn);
}

export { TOKENS, TOKEN_PAIRS, BASE_CHAIN_ID } from "@shared/tokens";
