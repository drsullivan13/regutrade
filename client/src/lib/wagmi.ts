import { http, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { injected, coinbaseWallet } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected(),
    coinbaseWallet({ 
      appName: "DeFi Compliance Platform",
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});

export const TOKEN_ADDRESSES = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
  WETH: "0x4200000000000000000000000000000000000006" as `0x${string}`,
  DAI: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb" as `0x${string}`,
  USDbC: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA" as `0x${string}`,
  cbETH: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22" as `0x${string}`,
} as const;

export const erc20Abi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;
