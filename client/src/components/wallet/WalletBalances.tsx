import { useAccount, useBalance, useReadContracts } from "wagmi";
import { TOKEN_ADDRESSES, erc20Abi } from "@/lib/wagmi";
import { formatUnits } from "viem";

export default function WalletBalances() {
  const { address, isConnected } = useAccount();
  
  const { data: ethBalance } = useBalance({ address });
  
  const { data: tokenBalances } = useReadContracts({
    contracts: isConnected && address ? [
      {
        address: TOKEN_ADDRESSES.USDC,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      },
      {
        address: TOKEN_ADDRESSES.WETH,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      },
    ] : [],
  });

  if (!isConnected) {
    return null;
  }

  const usdcBalance = tokenBalances?.[0]?.result 
    ? parseFloat(formatUnits(tokenBalances[0].result as bigint, 6)).toFixed(2)
    : "0.00";
    
  const wethBalance = tokenBalances?.[1]?.result
    ? parseFloat(formatUnits(tokenBalances[1].result as bigint, 18)).toFixed(4)
    : "0.0000";

  return (
    <div className="hidden md:flex items-center gap-4 text-xs">
      <div className="flex flex-col items-end">
        <span className="text-slate-500">USDC</span>
        <span className="font-mono font-medium tabular-nums text-slate-900" data-testid="text-usdc-balance">
          ${parseFloat(usdcBalance).toLocaleString()}
        </span>
      </div>
      <div className="h-8 w-px bg-slate-200"></div>
      <div className="flex flex-col items-end">
        <span className="text-slate-500">WETH</span>
        <span className="font-mono font-medium tabular-nums text-slate-900" data-testid="text-weth-balance">
          {wethBalance}
        </span>
      </div>
    </div>
  );
}
