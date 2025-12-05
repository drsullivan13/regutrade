// Uniswap V3 Direct Contract Integration for Base L2
// Uses QuoterV2 contract for real-time on-chain quotes

import { createPublicClient, http, parseUnits, formatUnits } from 'viem';
import { base } from 'viem/chains';
import { TOKENS, type Token } from '@shared/tokens';

// Base L2 Uniswap V3 Contract Addresses
export const V3_CONTRACTS = {
  QUOTER_V2: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
  SWAP_ROUTER_02: '0x2626664c2603336E57B271c5C0b26F421741e481',
  FACTORY: '0x33128a8fC17869897dcE68Ed026d694621f6FDfD',
} as const;

// Fee tiers: 0.01%, 0.05%, 0.3%, 1%
export const V3_FEE_TIERS = [100, 500, 3000, 10000] as const;
export type FeeTier = typeof V3_FEE_TIERS[number];

export const FEE_TIER_LABELS: Record<number, string> = {
  100: '0.01%',
  500: '0.05%',
  3000: '0.3%',
  10000: '1%',
};

// QuoterV2 ABI for quoteExactInputSingle
const QUOTER_V2_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'fee', type: 'uint24' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'quoteExactInputSingle',
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Base L2 RPC endpoint - configurable via environment
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

// Create public client for Base L2
const publicClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL),
});

// Quote result from QuoterV2
export interface QuoteResult {
  amountOut: bigint;
  sqrtPriceX96After: bigint;
  initializedTicksCrossed: number;
  gasEstimate: bigint;
}

// Route quote with calculated values
export interface RouteQuote {
  fee: FeeTier;
  feeLabel: string;
  amountOut: bigint;
  amountOutFormatted: string;
  gasEstimate: bigint;
  gasEstimateUSD: string;
  priceImpact: string;
  route: string;
  isBest: boolean;
}

/**
 * Get a quote for swapping tokens using V3 QuoterV2
 * This is a read-only call that simulates the swap to get the output amount
 * Includes retry logic for RPC rate limiting
 */
export async function getQuoteV3(
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint,
  fee: FeeTier,
  retryCount = 0
): Promise<QuoteResult> {
  try {
    const result = await publicClient.readContract({
      address: V3_CONTRACTS.QUOTER_V2 as `0x${string}`,
      abi: QUOTER_V2_ABI,
      functionName: 'quoteExactInputSingle',
      args: [{
        tokenIn: tokenIn as `0x${string}`,
        tokenOut: tokenOut as `0x${string}`,
        amountIn,
        fee,
        sqrtPriceLimitX96: BigInt(0),
      }],
    });

    return {
      amountOut: result[0],
      sqrtPriceX96After: result[1],
      initializedTicksCrossed: result[2],
      gasEstimate: result[3],
    };
  } catch (error: any) {
    // Check if this is a rate limit / network error (not a contract revert)
    const errorMsg = error?.message || String(error);
    const isRateLimitError = !errorMsg.includes('execution reverted') && 
                             !errorMsg.includes('0x') &&
                             retryCount < 1; // Only retry once
    
    if (isRateLimitError) {
      // Quick retry after 50ms delay
      await new Promise(resolve => setTimeout(resolve, 50));
      return getQuoteV3(tokenIn, tokenOut, amountIn, fee, retryCount + 1);
    }
    
    throw error;
  }
}

/**
 * Get the current gas price on Base L2
 */
export async function getBaseGasPrice(): Promise<{ gasPrice: bigint; gasPriceGwei: string }> {
  try {
    const gasPrice = await publicClient.getGasPrice();
    const gasPriceGwei = formatUnits(gasPrice, 9);
    return { gasPrice, gasPriceGwei };
  } catch (error) {
    console.error('Failed to fetch gas price:', error);
    // Fallback: Base L2 typically has very low gas (~0.001 gwei)
    return { gasPrice: BigInt(1000000), gasPriceGwei: '0.001' };
  }
}

/**
 * Get ETH price in USD (simplified - uses a price feed or fallback)
 */
export async function getEthPriceUSD(): Promise<number> {
  try {
    // Try to get from a simple API
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    if (response.ok) {
      const data = await response.json();
      return data.ethereum?.usd || 3500;
    }
  } catch (error) {
    console.log('Using fallback ETH price');
  }
  return 3500; // Fallback price
}

/**
 * Find the best route by querying all fee tiers
 * Returns routes sorted by output (highest first)
 */
export async function findBestRoute(
  tokenInSymbol: string,
  tokenOutSymbol: string,
  amountInFormatted: string
): Promise<{ routes: RouteQuote[]; best: RouteQuote | null; ethPriceUSD: number }> {
  const tokenIn = TOKENS[tokenInSymbol.toUpperCase()];
  const tokenOut = TOKENS[tokenOutSymbol.toUpperCase()];

  if (!tokenIn || !tokenOut) {
    throw new Error(`Unknown token: ${tokenInSymbol} or ${tokenOutSymbol}`);
  }

  // Handle native ETH by using WETH address
  const tokenInAddress = tokenIn.address === '0x0000000000000000000000000000000000000000' 
    ? TOKENS.WETH.address 
    : tokenIn.address;
  const tokenOutAddress = tokenOut.address === '0x0000000000000000000000000000000000000000'
    ? TOKENS.WETH.address
    : tokenOut.address;

  // Parse amount to wei
  const amountIn = parseUnits(amountInFormatted, tokenIn.decimals);

  // Get gas price and ETH price in parallel
  const [gasData, ethPriceUSD] = await Promise.all([
    getBaseGasPrice(),
    getEthPriceUSD(),
  ]);

  const routes: RouteQuote[] = [];

  // Query all fee tiers with slight stagger to avoid RPC rate limits
  // Each call starts 25ms apart, keeping total time under 100ms for initial dispatch
  const quotePromises = V3_FEE_TIERS.map(async (fee, index) => {
    try {
      // Stagger requests to avoid RPC rate limiting
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, index * 25));
      }
      const quote = await getQuoteV3(tokenInAddress, tokenOutAddress, amountIn, fee);
      
      // Calculate gas cost in USD
      // gasEstimate * gasPrice = gas cost in wei
      // Convert to ETH, then multiply by ETH price
      const gasCostWei = quote.gasEstimate * gasData.gasPrice;
      const gasCostETH = Number(gasCostWei) / 1e18;
      const gasCostUSD = gasCostETH * ethPriceUSD;

      // Format output amount
      const amountOutFormatted = formatUnits(quote.amountOut, tokenOut.decimals);

      // Calculate price impact based on fee tier (actual price impact is small for liquid pairs)
      // Fee tier is the primary "impact" on the trade - higher fee = more slippage
      const feePercent = fee / 10000; // Convert basis points to percent (100 = 0.01%, 500 = 0.05%)
      const priceImpact = -feePercent; // Price impact is negative (you lose value to fees)

      return {
        fee,
        feeLabel: FEE_TIER_LABELS[fee],
        amountOut: quote.amountOut,
        amountOutFormatted,
        gasEstimate: quote.gasEstimate,
        gasEstimateUSD: `$${gasCostUSD.toFixed(4)}`,
        priceImpact: `${priceImpact.toFixed(2)}%`,
        route: `${tokenIn.symbol} -> [${FEE_TIER_LABELS[fee]}] -> ${tokenOut.symbol}`,
        isBest: false,
      };
    } catch (error: any) {
      // Could be "no pool", "no liquidity", or RPC error
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes('execution reverted') || errorMsg.includes('0x')) {
        // This is likely "no pool" or "no liquidity" - expected for some fee tiers
        console.log(`No pool for ${tokenIn.symbol}/${tokenOut.symbol} at ${FEE_TIER_LABELS[fee]}`);
      } else {
        // RPC or network error - worth logging more details
        console.error(`RPC error for ${tokenIn.symbol}/${tokenOut.symbol} at ${FEE_TIER_LABELS[fee]}:`, errorMsg);
      }
      return null;
    }
  });

  const results = await Promise.allSettled(quotePromises);

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value !== null) {
      routes.push(result.value);
    }
  }

  // Sort by amountOut descending (highest output first)
  routes.sort((a, b) => {
    if (b.amountOut > a.amountOut) return 1;
    if (b.amountOut < a.amountOut) return -1;
    return 0;
  });

  // Mark best route
  if (routes.length > 0) {
    routes[0].isBest = true;
  }

  return {
    routes,
    best: routes[0] || null,
    ethPriceUSD,
  };
}

/**
 * Get current block number for compliance tracking
 */
export async function getBlockNumber(): Promise<bigint> {
  return await publicClient.getBlockNumber();
}

export { publicClient };
