// Uniswap Universal Router integration for Base L2
// Handles building swap transactions for token exchanges

import { encodeFunctionData, parseUnits, type Address } from "viem";
import { TOKEN_ADDRESSES } from "./wagmi";

// Uniswap Universal Router on Base L2
export const UNIVERSAL_ROUTER_ADDRESS = "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD" as const;

// Uniswap V3 SwapRouter02 on Base L2 (simpler interface)
export const SWAP_ROUTER_02_ADDRESS = "0x2626664c2603336E57B271c5C0b26F421741e481" as const;

// WETH9 on Base
export const WETH_ADDRESS = "0x4200000000000000000000000000000000000006" as const;

// Swap Router 02 ABI (simplified for exactInputSingle)
const swapRouter02Abi = [
  {
    name: "exactInputSingle",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" },
        ],
      },
    ],
    outputs: [{ name: "amountOut", type: "uint256" }],
  },
] as const;

// ERC20 approve ABI
const erc20ApproveAbi = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export interface SwapParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: string; // Human-readable amount
  amountOutMin: string; // Human-readable minimum output
  recipient: Address;
  fee?: number; // Pool fee tier (default 3000 = 0.3%)
  slippageBps?: number; // Slippage tolerance in basis points (default 50 = 0.5%)
}

export interface SwapTransaction {
  to: Address;
  data: `0x${string}`;
  value: bigint;
}

// Get token decimals
export function getTokenDecimals(address: Address): number {
  const decimalsMap: Record<string, number> = {
    [TOKEN_ADDRESSES.USDC.toLowerCase()]: 6,
    [TOKEN_ADDRESSES.USDbC.toLowerCase()]: 6,
    [TOKEN_ADDRESSES.WETH.toLowerCase()]: 18,
    [TOKEN_ADDRESSES.DAI.toLowerCase()]: 18,
    [TOKEN_ADDRESSES.cbETH.toLowerCase()]: 18,
  };
  return decimalsMap[address.toLowerCase()] || 18;
}

// Build the swap transaction calldata
export function buildSwapTransaction(params: SwapParams): SwapTransaction {
  const {
    tokenIn,
    tokenOut,
    amountIn,
    amountOutMin,
    recipient,
    fee = 3000, // 0.3% fee tier (most common)
  } = params;

  const tokenInDecimals = getTokenDecimals(tokenIn);
  const tokenOutDecimals = getTokenDecimals(tokenOut);

  const amountInWei = parseUnits(amountIn, tokenInDecimals);
  const amountOutMinWei = parseUnits(amountOutMin, tokenOutDecimals);

  // Build exactInputSingle params
  const swapParams = {
    tokenIn,
    tokenOut,
    fee,
    recipient,
    amountIn: amountInWei,
    amountOutMinimum: amountOutMinWei,
    sqrtPriceLimitX96: BigInt(0), // No price limit
  };

  const data = encodeFunctionData({
    abi: swapRouter02Abi,
    functionName: "exactInputSingle",
    args: [swapParams],
  });

  return {
    to: SWAP_ROUTER_02_ADDRESS,
    data,
    value: BigInt(0), // No ETH value for token swaps
  };
}

// Build approval transaction for token spending
export function buildApprovalTransaction(
  tokenAddress: Address,
  spender: Address,
  amount: string
): SwapTransaction {
  const decimals = getTokenDecimals(tokenAddress);
  const amountWei = parseUnits(amount, decimals);

  const data = encodeFunctionData({
    abi: erc20ApproveAbi,
    functionName: "approve",
    args: [spender, amountWei],
  });

  return {
    to: tokenAddress,
    data,
    value: BigInt(0),
  };
}

// Calculate minimum output with slippage
export function calculateMinOutput(
  expectedOutput: string,
  slippageBps: number = 50 // 0.5% default
): string {
  const output = parseFloat(expectedOutput);
  const minOutput = output * (1 - slippageBps / 10000);
  return minOutput.toFixed(8);
}

// Get the appropriate fee tier based on token pair
export function getFeeTier(tokenIn: Address, tokenOut: Address): number {
  const stablecoins = [
    TOKEN_ADDRESSES.USDC.toLowerCase(),
    TOKEN_ADDRESSES.USDbC.toLowerCase(),
    TOKEN_ADDRESSES.DAI.toLowerCase(),
  ];
  
  const isStablecoinIn = stablecoins.includes(tokenIn.toLowerCase());
  const isStablecoinOut = stablecoins.includes(tokenOut.toLowerCase());
  
  // Stablecoin to stablecoin: 100 (0.01%)
  if (isStablecoinIn && isStablecoinOut) {
    return 100;
  }
  
  // Stablecoin to ETH derivatives: 500 (0.05%) - most liquid
  if (isStablecoinIn || isStablecoinOut) {
    return 500;
  }
  
  // Default: 3000 (0.3%)
  return 3000;
}

export { erc20ApproveAbi, swapRouter02Abi };
