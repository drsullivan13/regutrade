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

// Factory ABI to get pool address
const FACTORY_ABI = [
  {
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'fee', type: 'uint24' },
    ],
    name: 'getPool',
    outputs: [{ name: 'pool', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Pool ABI to get slot0 (current price)
const POOL_ABI = [
  {
    inputs: [],
    name: 'slot0',
    outputs: [
      { name: 'sqrtPriceX96', type: 'uint160' },
      { name: 'tick', type: 'int24' },
      { name: 'observationIndex', type: 'uint16' },
      { name: 'observationCardinality', type: 'uint16' },
      { name: 'observationCardinalityNext', type: 'uint16' },
      { name: 'feeProtocol', type: 'uint8' },
      { name: 'unlocked', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

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
 */
export async function getQuoteV3(
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint,
  fee: FeeTier
): Promise<QuoteResult> {
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
}

/**
 * Get pool address from factory
 */
export async function getPoolAddress(
  tokenA: string,
  tokenB: string,
  fee: FeeTier
): Promise<string | null> {
  try {
    const poolAddress = await publicClient.readContract({
      address: V3_CONTRACTS.FACTORY as `0x${string}`,
      abi: FACTORY_ABI,
      functionName: 'getPool',
      args: [tokenA as `0x${string}`, tokenB as `0x${string}`, fee],
    });
    
    // Check if pool exists (address is not zero)
    if (poolAddress === '0x0000000000000000000000000000000000000000') {
      return null;
    }
    return poolAddress;
  } catch (error) {
    console.log(`Failed to get pool for fee tier ${fee}:`, error);
    return null;
  }
}

/**
 * Get current sqrtPriceX96 from pool slot0
 */
export async function getPoolSlot0(
  poolAddress: string
): Promise<{ sqrtPriceX96: bigint; tick: number } | null> {
  try {
    const slot0 = await publicClient.readContract({
      address: poolAddress as `0x${string}`,
      abi: POOL_ABI,
      functionName: 'slot0',
    });
    
    return {
      sqrtPriceX96: slot0[0],
      tick: slot0[1],
    };
  } catch (error) {
    console.log(`Failed to get slot0 for pool ${poolAddress}:`, error);
    return null;
  }
}

/**
 * Convert sqrtPriceX96 to actual price ratio
 * sqrtPriceX96 = sqrt(price) * 2^96
 * price = (sqrtPriceX96 / 2^96)^2
 * This gives price of token1 in terms of token0
 */
export function sqrtPriceX96ToPrice(
  sqrtPriceX96: bigint,
  token0Decimals: number,
  token1Decimals: number
): number {
  // Convert to number for calculation (may lose precision for very large values)
  const sqrtPrice = Number(sqrtPriceX96) / Math.pow(2, 96);
  const price = sqrtPrice * sqrtPrice;
  
  // Adjust for decimal differences
  // price is token1/token0, so we adjust for decimals
  const decimalAdjustment = Math.pow(10, token0Decimals - token1Decimals);
  
  return price * decimalAdjustment;
}

/**
 * Calculate price impact using QuoterV2 response data (no extra RPC calls needed)
 * 
 * Uses the relationship between amountIn, amountOut, fee, and sqrtPriceX96After
 * to derive the pre-trade spot price and compare to execution price.
 * 
 * For swaps within a single tick range:
 * - amountInNet = amountIn * (1e6 - fee) / 1e6
 * - The ratio R = amountOut/amountInNet relates to sqrt prices
 * - We can derive sqrtPriceBefore from sqrtPriceAfter and R
 */
export function calculatePriceImpactFromQuote(
  amountIn: bigint,
  amountOut: bigint,
  sqrtPriceX96After: bigint,
  fee: number,
  tokenInDecimals: number,
  tokenOutDecimals: number,
  isToken0In: boolean,
  ticksCrossed: number
): { priceImpact: number; isReliable: boolean } {
  // If multiple ticks crossed, the math becomes complex - mark as less reliable
  const isReliable = ticksCrossed <= 1;
  
  // Calculate execution price (tokenOut per tokenIn, adjusted for decimals)
  const amountInNum = Number(amountIn) / Math.pow(10, tokenInDecimals);
  const amountOutNum = Number(amountOut) / Math.pow(10, tokenOutDecimals);
  const executionPrice = amountOutNum / amountInNum;
  
  // Calculate the fee-adjusted input
  const feeMultiplier = (1000000 - fee) / 1000000;
  const amountInNetNum = amountInNum * feeMultiplier;
  
  // Derive spot price from sqrtPriceX96After
  // sqrtPriceX96 = sqrt(price_token1/token0) * 2^96
  const sqrtPriceAfter = Number(sqrtPriceX96After) / Math.pow(2, 96);
  const priceAfter = sqrtPriceAfter * sqrtPriceAfter;
  
  // Adjust for decimals: price is token1/token0
  const decimalAdjustment = Math.pow(10, tokenInDecimals - tokenOutDecimals);
  
  // For the spot price, we use the geometric relationship
  // R (ratio) = amountOut / amountInNet encodes price information
  const R = amountOutNum / amountInNetNum;
  
  // The spot price (before trade) can be approximated from the execution
  // For small trades, execution price ≈ spot price * (1 - fee)
  // So spot price ≈ execution price / (1 - fee/100)
  // But more accurately, we use the after-price and work backwards
  
  // Convert sqrtPriceAfter to human-readable price
  // If token0 is tokenIn, price is token1/token0 (what we get per input)
  // If token1 is tokenIn, we need the inverse
  let spotPriceAfterTrade: number;
  if (isToken0In) {
    // Price is token1 per token0 = tokenOut per tokenIn
    spotPriceAfterTrade = priceAfter * decimalAdjustment;
  } else {
    // Price is token0 per token1 = 1/priceAfter
    spotPriceAfterTrade = (1 / priceAfter) * decimalAdjustment;
  }
  
  // For price impact, compare execution price to the post-trade spot
  // A negative impact means we got less than spot (moved price against us)
  // For small trades, the difference is primarily the fee
  // For large trades, there's additional slippage
  
  // Theoretical output at spot = amountInNet * spotPrice
  // Actual output = amountOut
  // Price impact = (actual - theoretical) / theoretical * 100
  
  // Using post-trade spot as reference (conservative estimate)
  const theoreticalOutput = amountInNetNum * spotPriceAfterTrade;
  const priceImpact = ((amountOutNum - theoreticalOutput) / theoreticalOutput) * 100;
  
  return { priceImpact, isReliable };
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

  // Determine token order in pool (Uniswap V3 orders by address)
  const token0 = tokenInAddress.toLowerCase() < tokenOutAddress.toLowerCase() 
    ? tokenInAddress : tokenOutAddress;
  const isToken0In = tokenInAddress.toLowerCase() === token0.toLowerCase();

  // Query all fee tiers in parallel - only QuoterV2 calls needed
  const quotePromises = V3_FEE_TIERS.map(async (fee) => {
    try {
      const quote = await getQuoteV3(tokenInAddress, tokenOutAddress, amountIn, fee);
      
      // Calculate gas cost in USD
      const gasCostWei = quote.gasEstimate * gasData.gasPrice;
      const gasCostETH = Number(gasCostWei) / 1e18;
      const gasCostUSD = gasCostETH * ethPriceUSD;

      // Format output amount
      const amountOutFormatted = formatUnits(quote.amountOut, tokenOut.decimals);

      // Calculate price impact using QuoterV2 response data (no extra RPC calls)
      const { priceImpact, isReliable } = calculatePriceImpactFromQuote(
        amountIn,
        quote.amountOut,
        quote.sqrtPriceX96After,
        fee,
        tokenIn.decimals,
        tokenOut.decimals,
        isToken0In,
        quote.initializedTicksCrossed
      );
      
      // Format with sign, add ~ if unreliable (many ticks crossed)
      const prefix = isReliable ? '' : '~';
      const priceImpactStr = `${prefix}${priceImpact >= 0 ? '+' : ''}${priceImpact.toFixed(2)}%`;

      return {
        fee,
        feeLabel: FEE_TIER_LABELS[fee],
        amountOut: quote.amountOut,
        amountOutFormatted,
        gasEstimate: quote.gasEstimate,
        gasEstimateUSD: `$${gasCostUSD.toFixed(4)}`,
        priceImpact: priceImpactStr,
        route: `${tokenIn.symbol} -> [${FEE_TIER_LABELS[fee]}] -> ${tokenOut.symbol}`,
        isBest: false,
      };
    } catch (error) {
      // Pool doesn't exist or has no liquidity for this fee tier
      console.log(`No pool for ${tokenIn.symbol}/${tokenOut.symbol} at ${FEE_TIER_LABELS[fee]}`);
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
