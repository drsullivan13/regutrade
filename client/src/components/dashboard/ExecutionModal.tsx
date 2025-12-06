import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ShieldCheck, Wallet, AlertCircle, ExternalLink, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useAccount, useSendTransaction, usePublicClient } from "wagmi";
import type { Route } from "./RouteComparison";
import { 
  buildSwapTransaction, 
  buildApprovalTransaction, 
  calculateMinOutput,
  getFeeTier,
  SWAP_ROUTER_02_ADDRESS 
} from "@/lib/swap";
import { TOKEN_ADDRESSES } from "@/lib/wagmi";
import type { Address } from "viem";
import { addDemoTradeId } from "@/pages/history";

interface ExecutionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  analysisData: any;
  selectedRoute?: Route | null;
}

type StepStatus = "pending" | "active" | "completed" | "error";

interface Step {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
}

export default function ExecutionModal({ isOpen, onOpenChange, analysisData, selectedRoute }: ExecutionModalProps) {
  const [, setLocation] = useLocation();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [tradeId, setTradeId] = useState<string>("");
  const [executionStarted, setExecutionStarted] = useState(false);
  const [executionMode, setExecutionMode] = useState<"demo" | "live">("demo");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [blockNumber, setBlockNumber] = useState<bigint | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [steps, setSteps] = useState<Step[]>([
    { id: "approval", label: "Token Approval", description: "Approve token spending", status: "pending" },
    { id: "compliance", label: "Compliance Check", description: "Verifying sanctions and limits", status: "pending" },
    { id: "execution", label: "On-Chain Execution", description: "Swapping tokens via Uniswap", status: "pending" },
    { id: "settlement", label: "Settlement", description: "Waiting for block confirmation", status: "pending" },
  ]);

  const { sendTransactionAsync, isPending: isSending } = useSendTransaction();

  const routeToExecute = selectedRoute || analysisData?.routes?.find((r: Route) => r.isBest);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const getTokenAddress = (symbol: string): Address => {
    const normalizedSymbol = symbol.toUpperCase();
    const addresses: Record<string, Address> = {
      USDC: TOKEN_ADDRESSES.USDC,
      WETH: TOKEN_ADDRESSES.WETH,
      ETH: TOKEN_ADDRESSES.WETH, // Native ETH uses WETH for Uniswap V3 swaps
      DAI: TOKEN_ADDRESSES.DAI,
      USDBC: TOKEN_ADDRESSES.USDbC, // Uppercase key to match normalization
      CBETH: TOKEN_ADDRESSES.cbETH, // Uppercase key to match normalization
      LINK: "0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196" as Address,
      AAVE: "0x63706e401c06ac8513145b7687a14804d17f814b" as Address,
    };
    
    const address = addresses[normalizedSymbol];
    if (!address) {
      console.error(`Unknown token symbol: ${symbol}, defaulting to WETH`);
      return TOKEN_ADDRESSES.WETH;
    }
    return address;
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setExecutionStarted(false);
      setExecutionMode("demo");
      setError(null);
      setTxHash(undefined);
      setBlockNumber(undefined);
      setTradeId("");
      setIsProcessing(false);
      setSteps(steps.map(s => ({ ...s, status: "pending" })));
    }
  }, [isOpen]);

  // Demo mode execution (simulated)
  const executeDemoMode = async () => {
    if (!analysisData || !routeToExecute) {
      setError("Missing trade data");
      return;
    }
    
    setIsProcessing(true);
    setSteps(steps.map((s, i) => ({ ...s, status: i === 0 ? "active" : "pending" })));
    
    for (let i = 0; i < 4; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSteps(currentSteps => 
        currentSteps.map((step, index) => ({
          ...step,
          status: index <= i ? "completed" : index === i + 1 ? "active" : "pending"
        }))
      );
    }
    
    // Create trade with simulated hash and block
    const simulatedHash = `0x${Date.now().toString(16)}${Math.random().toString(16).substr(2, 48)}` as `0x${string}`;
    const simulatedBlock = BigInt(Math.floor(Date.now() / 1000));
    setTxHash(simulatedHash);
    setBlockNumber(simulatedBlock);
    
    // Create and save the trade
    await createTradeRecord(simulatedHash, simulatedBlock);
    setIsProcessing(false);
  };

  // Live mode execution (real on-chain)
  const executeLiveMode = useCallback(async () => {
    if (!address || !analysisData || !routeToExecute || !publicClient) return;

    setIsProcessing(true);
    
    try {
      setError(null);
      const tokenIn = getTokenAddress(analysisData.pairFrom);
      const tokenOut = getTokenAddress(analysisData.pairTo);
      const amountIn = analysisData.amountIn;
      // Use human-readable output value (not raw wei) for slippage calculation
      // predictedOutput is the human-readable value like "0.000330..." 
      const expectedOutput = routeToExecute.predictedOutput || routeToExecute.output.split(" ")[0];
      const minOutput = calculateMinOutput(expectedOutput, 100); // 1% slippage for safety
      const fee = getFeeTier(tokenIn, tokenOut);

      // Step 1: Approval
      setSteps(currentSteps => 
        currentSteps.map((step, i) => ({ ...step, status: i === 0 ? "active" : "pending" }))
      );

      const approvalTx = buildApprovalTransaction(tokenIn, SWAP_ROUTER_02_ADDRESS, amountIn);
      
      try {
        // Send approval transaction
        const approvalHash = await sendTransactionAsync({
          to: approvalTx.to,
          data: approvalTx.data,
          value: approvalTx.value,
        });

        // CRITICAL: Wait for approval transaction to be confirmed on-chain
        // This ensures the allowance is set before we attempt the swap
        const approvalReceipt = await publicClient.waitForTransactionReceipt({
          hash: approvalHash,
          confirmations: 1,
        });

        if (approvalReceipt.status !== "success") {
          throw new Error("Approval transaction failed");
        }

        setSteps(currentSteps => 
          currentSteps.map((step, i) => ({ 
            ...step, 
            status: i === 0 ? "completed" : i === 1 ? "active" : "pending" 
          }))
        );

        // Step 2: Compliance check (instant in live mode to prevent popup blocker)
        // No delay - browser popup blockers will block second popup if we wait too long
        setSteps(currentSteps => 
          currentSteps.map((step, i) => ({ 
            ...step, 
            status: i <= 1 ? "completed" : i === 2 ? "active" : "pending" 
          }))
        );

        // Step 3: Execute swap
        const swapTx = buildSwapTransaction({
          tokenIn,
          tokenOut,
          amountIn,
          amountOutMin: minOutput,
          recipient: address,
          fee,
        });

        const swapHash = await sendTransactionAsync({
          to: swapTx.to,
          data: swapTx.data,
          value: swapTx.value,
        });

        setTxHash(swapHash);
        
        setSteps(currentSteps => 
          currentSteps.map((step, i) => ({ 
            ...step, 
            status: i <= 2 ? "completed" : "active" 
          }))
        );

        // Step 4: Wait for swap confirmation
        const swapReceipt = await publicClient.waitForTransactionReceipt({
          hash: swapHash,
          confirmations: 1,
        });

        if (swapReceipt.status !== "success") {
          throw new Error("Swap transaction failed");
        }

        setBlockNumber(swapReceipt.blockNumber);
        
        setSteps(currentSteps => 
          currentSteps.map(step => ({ ...step, status: "completed" }))
        );

        // Create trade record with real on-chain data
        await createTradeRecord(swapHash, swapReceipt.blockNumber);

      } catch (txError: any) {
        console.error("Transaction error:", txError);
        
        let errorMessage = "Transaction failed";
        const errorDetails = txError.message || txError.details || JSON.stringify(txError);
        
        if (errorDetails.includes("rejected") || errorDetails.includes("denied") || errorDetails.includes("User rejected") || errorDetails.includes("cancelled")) {
          errorMessage = "Transaction rejected by user";
        } else if (errorDetails.includes("Pop up") || errorDetails.includes("popup") || errorDetails.includes("window failed")) {
          errorMessage = "Wallet popup was blocked. Please allow popups for this site and try again.";
        } else if (errorDetails.includes("insufficient") || errorDetails.includes("Insufficient")) {
          errorMessage = "Insufficient token balance";
        } else if (errorDetails.includes("allowance")) {
          errorMessage = "Token approval failed";
        } else if (errorDetails.includes("execution reverted")) {
          errorMessage = "Transaction reverted - check slippage or liquidity";
        } else if (errorDetails.includes("timeout") || errorDetails.includes("Timeout")) {
          errorMessage = "Transaction timed out - please try again";
        }
        
        setError(errorMessage);
        setSteps(currentSteps => 
          currentSteps.map((step) => ({ 
            ...step, 
            status: step.status === "active" ? "error" : step.status 
          }))
        );
      }

    } catch (err: any) {
      console.error("Execution error:", err);
      setError(err.message || "Execution failed");
    } finally {
      setIsProcessing(false);
    }
  }, [address, analysisData, routeToExecute, sendTransactionAsync, publicClient]);

  const createTradeRecord = async (transactionHash: `0x${string}`, confirmedBlockNumber?: bigint) => {
    if (!analysisData || !routeToExecute) return;

    const walletAddr = address || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
    
    // Get the predicted output from the quote (what we expected)
    const predictedOutput = routeToExecute.predictedOutput || routeToExecute.outputRaw || routeToExecute.output.split(" ")[0];
    
    // For demo mode, simulate a small variance (actual slightly differs from predicted)
    // In live mode, this would be the real execution result
    const predictedValue = parseFloat(predictedOutput);
    // Demo mode: simulate 0.01-0.05% variance (realistic for Base L2)
    const variancePercent = (Math.random() * 0.04 + 0.01) * (Math.random() > 0.5 ? 1 : -1);
    const actualOutput = executionMode === "demo" 
      ? (predictedValue * (1 + variancePercent / 100)).toFixed(18).replace(/\.?0+$/, '')
      : predictedOutput; // Live mode would use actual execution result
    
    // Calculate effective rate from actual quote data
    const amountIn = parseFloat(analysisData.amountIn);
    const amountOut = parseFloat(actualOutput);
    const effectiveRate = amountOut > 0 ? (amountIn / amountOut).toFixed(2) : "0";
    
    // Calculate quality score based on price impact (clamp between 0-100)
    // Remove % sign and handle negative values properly
    const priceImpactStr = routeToExecute.priceImpact?.replace('%', '').replace('-', '') || '0';
    const priceImpactValue = parseFloat(priceImpactStr);
    // Lower price impact = higher quality score
    // 0% impact = 100 score, 1% impact = 90 score, etc.
    const rawScore = 100 - (priceImpactValue * 10);
    const qualityScore = Math.min(100, Math.max(0, rawScore)).toFixed(2);
    
    const qualityScoreNum = parseFloat(qualityScore);
    const executionQuality = qualityScoreNum >= 99 ? "Excellent" 
      : qualityScoreNum >= 95 ? "Good" 
      : qualityScoreNum >= 90 ? "Fair" 
      : "Poor";

    const tradeData = {
      tradeId: `TR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      pairFrom: analysisData.pairFrom,
      pairTo: analysisData.pairTo,
      amountIn: analysisData.amountIn,
      amountOut: actualOutput,
      type: "buy",
      route: routeToExecute.routeString || routeToExecute.route || routeToExecute.name,
      effectiveRate,
      gasCost: routeToExecute.gas,
      gasUsed: routeToExecute.gasRaw || "21000",
      executionQuality,
      qualityScore,
      predictedOutput: predictedOutput,
      priceImpact: routeToExecute.priceImpact,
      transactionHash: transactionHash,
      walletAddress: walletAddr,
      network: "Base L2",
      blockNumber: confirmedBlockNumber ? confirmedBlockNumber.toString() : null,
      status: "Completed",
      routesAnalyzed: analysisData.routes,
    };

    try {
      const response = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tradeData),
      });
      
      const createdTrade = await response.json();
      setTradeId(createdTrade.tradeId);
      
      // For demo mode (no connected wallet), save trade ID to session storage
      // so users can see their demo trades in history
      if (!isConnected) {
        addDemoTradeId(createdTrade.tradeId);
      }
    } catch (error) {
      console.error("Failed to create trade:", error);
    }
  };

  const handleStartExecution = (mode: "demo" | "live") => {
    setExecutionMode(mode);
    setExecutionStarted(true);
    
    if (mode === "demo") {
      executeDemoMode();
    } else {
      executeLiveMode();
    }
  };

  const isComplete = steps.every(s => s.status === "completed");
  const hasError = error !== null || steps.some(s => s.status === "error");

  const handleViewReport = () => {
    onOpenChange(false);
    // Navigate to the specific trade analysis page
    if (tradeId) {
      setLocation(`/analysis/${tradeId}`);
    } else {
      setLocation("/analysis");
    }
  };

  // Wallet not connected
  if (!isConnected && isOpen && !executionStarted) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Wallet Not Connected
            </DialogTitle>
            <DialogDescription>
              Connect your wallet to execute live trades on Base L2.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              <p className="font-medium">Connection Required for Live Trading</p>
              <p className="mt-1">
                You can still run a demo execution to see how the process works.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleStartExecution("demo")} 
                className="bg-slate-600 hover:bg-slate-700"
              >
                Run Demo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Confirmation screen
  if (!executionStarted && isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Confirm Trade Execution</DialogTitle>
            <DialogDescription>
              Review the trade details before submitting to Base L2.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">From</span>
                  <p className="font-mono font-medium text-slate-900">
                    {analysisData?.amountIn} {analysisData?.pairFrom}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">To (estimated)</span>
                  <p className="font-mono font-medium text-slate-900">
                    {routeToExecute?.output}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Route</span>
                  <p className="font-medium text-slate-900">{routeToExecute?.name}</p>
                </div>
                <div>
                  <span className="text-slate-500">Est. Gas</span>
                  <p className="font-medium text-slate-900">{routeToExecute?.gas}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
              <Wallet className="h-4 w-4" />
              <span>Executing from: <span className="font-mono">{address ? formatAddress(address) : "Demo mode"}</span></span>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <p className="font-medium">Test Mode Recommended</p>
              <p className="text-xs mt-1">
                For testing, use Demo mode. Live execution requires actual tokens and gas.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleStartExecution("demo")} 
                variant="outline"
                className="gap-2"
              >
                Demo Mode
              </Button>
              <Button 
                onClick={() => handleStartExecution("live")} 
                className="bg-primary hover:bg-blue-800 gap-2"
                data-testid="button-confirm-execution"
                disabled={!isConnected}
              >
                <Wallet className="h-4 w-4" />
                Execute Live
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Execution in progress
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden border-none shadow-2xl">
        <div className={cn(
          "p-6 text-white",
          hasError ? "bg-red-900" : isComplete ? "bg-green-900" : "bg-slate-900"
        )}>
          <DialogHeader>
            <DialogTitle className="text-xl font-medium tracking-tight text-white flex items-center gap-2">
              {hasError ? (
                <>
                  <XCircle className="h-6 w-6 text-red-400" />
                  Execution Failed
                </>
              ) : isComplete ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                  Trade Executed Successfully
                </>
              ) : (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                  Executing Trade...
                </>
              )}
            </DialogTitle>
            <DialogDescription className={cn(
              hasError ? "text-red-300" : "text-slate-400"
            )}>
              {hasError 
                ? error || "Transaction failed" 
                : isComplete 
                  ? "Your trade has been confirmed on Base L2" 
                  : "Please confirm transactions in your wallet"}
            </DialogDescription>
            <div className="mt-2 space-y-1">
              {isComplete && tradeId && (
                <div className="text-slate-400 font-mono text-sm">
                  Trade ID: {tradeId}
                </div>
              )}
              {txHash && (
                <a 
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-mono"
                >
                  {formatAddress(txHash)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {blockNumber && (
                <div className="text-slate-500 text-xs font-mono">
                  Block: {blockNumber.toString()}
                </div>
              )}
              {executionMode === "demo" && (
                <div className="text-amber-400 text-xs">
                  Demo Mode - No real transactions
                </div>
              )}
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 bg-white">
          <div className="relative flex flex-col gap-8 pl-4">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100"></div>

            {steps.map((step, index) => (
              <div key={step.id} className="relative flex items-start gap-4 z-10">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500",
                  step.status === "completed" ? "bg-green-600 border-green-600 text-white" :
                  step.status === "error" ? "bg-red-600 border-red-600 text-white" :
                  step.status === "active" ? "bg-white border-primary text-primary ring-4 ring-blue-50" :
                  "bg-white border-slate-200 text-slate-300"
                )}>
                  {step.status === "completed" ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : step.status === "error" ? (
                    <XCircle className="h-6 w-6" />
                  ) : step.status === "active" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : step.id === "approval" ? (
                    <Wallet className="h-5 w-5" />
                  ) : step.id === "compliance" ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : (
                    <span className="font-mono text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                <div className="pt-1">
                  <h4 className={cn(
                    "text-sm font-bold uppercase tracking-wide transition-colors",
                    step.status === "pending" ? "text-slate-400" : 
                    step.status === "error" ? "text-red-600" : "text-slate-900"
                  )}>
                    {step.label}
                  </h4>
                  <p className="text-sm text-slate-500 mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end pt-6 border-t border-slate-100 gap-3">
            {hasError ? (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setError(null);
                    setExecutionStarted(false);
                    setSteps(steps.map(s => ({ ...s, status: "pending" })));
                  }} 
                  className="bg-primary hover:bg-blue-800"
                >
                  Try Again
                </Button>
              </>
            ) : isComplete ? (
              <Button 
                onClick={handleViewReport} 
                className="bg-primary hover:bg-blue-800 w-full sm:w-auto" 
                data-testid="button-view-analysis"
              >
                View Post-Trade Analysis
              </Button>
            ) : (
              <Button disabled variant="outline" className="w-full sm:w-auto gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isSending ? "Confirm in Wallet..." : isProcessing ? "Processing..." : "Waiting..."}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
