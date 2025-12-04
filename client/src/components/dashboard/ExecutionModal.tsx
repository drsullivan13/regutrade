import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ShieldCheck, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface ExecutionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type StepStatus = "pending" | "active" | "completed";

interface Step {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
}

export default function ExecutionModal({ isOpen, onOpenChange }: ExecutionModalProps) {
  const [, setLocation] = useLocation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<Step[]>([
    { id: "wallet", label: "Wallet Approval", description: "Confirm transaction in your wallet", status: "active" },
    { id: "compliance", label: "Compliance Check", description: "Verifying sanctions and limits", status: "pending" },
    { id: "execution", label: "On-Chain Execution", description: "Swapping tokens via Uniswap V3", status: "pending" },
    { id: "settlement", label: "Settlement", description: "Waiting for block confirmation", status: "pending" },
  ]);

  // Simulate progress
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      // Reset steps
      setSteps(steps.map((s, i) => ({ ...s, status: i === 0 ? "active" : "pending" })));

      const interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= 3) {
            clearInterval(interval);
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
  }, [isOpen]);

  const isComplete = steps[steps.length - 1].status === "completed" || steps[steps.length - 1].status === "active"; // Simplified for demo

  const handleViewReport = () => {
    onOpenChange(false);
    setLocation("/analysis");
  };

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
            <div className="mt-2 text-slate-400 font-mono text-sm">
              Tx Hash: {isComplete ? "0x7a92...f1a9" : "Pending..."}
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 bg-white">
          <div className="relative flex flex-col gap-8 pl-4">
            {/* Vertical Line */}
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
               <Button onClick={handleViewReport} className="bg-primary hover:bg-blue-800 w-full sm:w-auto">
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
