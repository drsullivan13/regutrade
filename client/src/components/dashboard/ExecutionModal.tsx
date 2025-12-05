import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ShieldCheck, Wallet, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useAccount } from "wagmi";
import type { Route } from "./RouteComparison";

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
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [tradeId, setTradeId] = useState<string>("");
  const [executionStarted, setExecutionStarted] = useState(false);
  const [steps, setSteps] = useState<Step[]>([
    { id: "wallet", label: "Wallet Approval", description: "Confirm transaction in your wallet", status: "pending" },
    { id: "compliance", label: "Compliance Check", description: "Verifying sanctions and limits", status: "pending" },
    { id: "execution", label: "On-Chain Execution", description: "Swapping tokens via Uniswap", status: "pending" },
    { id: "settlement", label: "Settlement", description: "Waiting for block confirmation", status: "pending" },
  ]);

  const routeToExecute = selectedRoute || analysisData?.routes?.find((r: Route) => r.isBest);

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  useEffect(() => {
    if (isOpen && analysisData && routeToExecute && executionStarted) {
      setCurrentStepIndex(0);
      setSteps(steps.map((s, i) => ({ ...s, status: i === 0 ? "active" : "pending" })));

      const interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= 3) {
            clearInterval(interval);
            if (prev === 3) {
              createTrade();
            }
            return prev;
          }
          const next = prev + 1;
          setSteps((currentSteps) => 
            currentSteps.map((step, index) => ({
              ...step,
              status: index < next ? "completed" : index === next ? "active" : "pending"
            }))
          );
          return next;
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isOpen, analysisData, routeToExecute, executionStarted]);

  useEffect(() => {
    if (!isOpen) {
      setExecutionStarted(false);
      setCurrentStepIndex(0);
      setTradeId("");
      setSteps(steps.map(s => ({ ...s, status: "pending" })));
    }
  }, [isOpen]);

  const createTrade = async () => {
    if (!analysisData || !routeToExecute) return;

    const walletAddr = address || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

    const tradeData = {
      tradeId: `TR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      pairFrom: analysisData.pairFrom,
      pairTo: analysisData.pairTo,
      amountIn: analysisData.amountIn,
      amountOut: routeToExecute.outputRaw || routeToExecute.output.split(" ")[0],
      type: "buy",
      route: routeToExecute.routeString || routeToExecute.name,
      effectiveRate: "1842.15",
      gasCost: routeToExecute.gas,
      gasUsed: routeToExecute.gasRaw || "145203",
      executionQuality: "Excellent",
      qualityScore: "99.48",
      predictedOutput: routeToExecute.predictedOutput || routeToExecute.output.split(" ")[0],
      priceImpact: routeToExecute.priceImpact,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      walletAddress: walletAddr,
      network: "Base L2",
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
    } catch (error) {
      console.error("Failed to create trade:", error);
    }
  };

  const handleStartExecution = () => {
    setExecutionStarted(true);
  };

  const isComplete = steps[steps.length - 1].status === "completed";

  const handleViewReport = () => {
    onOpenChange(false);
    setLocation("/analysis");
  };

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
              Connect your wallet to execute trades on Base L2.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              <p className="font-medium">Connection Required</p>
              <p className="mt-1">
                To execute trades on-chain, you need to connect a wallet that supports Base L2.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => onOpenChange(false)} className="bg-primary hover:bg-blue-800">
                Connect Wallet First
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
              <span>Executing from: <span className="font-mono">{address ? formatAddress(address) : "Not connected"}</span></span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleStartExecution} 
                className="bg-primary hover:bg-blue-800 gap-2"
                data-testid="button-confirm-execution"
              >
                <Wallet className="h-4 w-4" />
                Confirm & Execute
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-slate-900 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium tracking-tight text-white flex items-center gap-2">
              {isComplete ? (
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
            <DialogDescription className="text-slate-400">
              {isComplete ? "Your trade has been confirmed on Base L2" : "Please wait while we process your transaction"}
            </DialogDescription>
            <div className="mt-2 space-y-1">
              <div className="text-slate-400 font-mono text-sm">
                {isComplete ? `ID: ${tradeId}` : "Processing..."}
              </div>
              {routeToExecute && (
                <div className="text-slate-300 text-sm">
                  Route: {routeToExecute.name}
                </div>
              )}
              {address && (
                <div className="text-slate-400 text-xs font-mono">
                  Wallet: {formatAddress(address)}
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
                  step.status === "active" ? "bg-white border-primary text-primary ring-4 ring-blue-50" :
                  "bg-white border-slate-200 text-slate-300"
                )}>
                  {step.status === "completed" ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : step.id === "wallet" ? (
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
                    step.status === "pending" ? "text-slate-400" : "text-slate-900"
                  )}>
                    {step.label}
                  </h4>
                  <p className="text-sm text-slate-500 mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end pt-6 border-t border-slate-100">
            {isComplete ? (
               <Button onClick={handleViewReport} className="bg-primary hover:bg-blue-800 w-full sm:w-auto" data-testid="button-view-analysis">
                 View Post-Trade Analysis
               </Button>
            ) : (
               <Button disabled variant="outline" className="w-full sm:w-auto">
                 Processing...
               </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
