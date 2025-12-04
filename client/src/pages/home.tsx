import React, { useState } from "react";
import TradeInput from "@/components/dashboard/TradeInput";
import RouteComparison from "@/components/dashboard/RouteComparison";
import RecommendationPanel from "@/components/dashboard/RecommendationPanel";
import ExecutionModal from "@/components/dashboard/ExecutionModal";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [showResults, setShowResults] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleAnalyze = () => {
     // Simulate loading then show results
     setTimeout(() => setShowResults(true), 800);
  };

  const handleExecute = () => {
     setShowModal(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Analysis & Execution</h1>
        <p className="text-slate-500 max-w-2xl">
          Input your trade parameters to analyze liquidity routes across decentralized exchanges. 
          Our engine prioritizes compliance and best execution.
        </p>
      </div>

      <div className="grid gap-8">
        <div className="relative">
           <TradeInput />
           {/* Overlay click handler for demo purposes if needed, but button inside works too */}
           {!showResults && (
             <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 pointer-events-none">
               {/* Hint: Click Analyze Routes in the card */}
             </div>
           )}
        </div>
        
        {!showResults ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-12 text-center bg-slate-50/50">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
                  <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900">Ready to Analyze</h3>
              <p className="text-slate-500 mt-2 max-w-md mx-auto">
                Enter your trade details above and click "Analyze Routes" to view optimal execution paths across the DeFi ecosystem.
              </p>
              <div className="mt-6">
                <Button variant="outline" onClick={handleAnalyze}>
                   Demo: Show Results
                </Button>
              </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <RouteComparison onExecute={handleExecute} />
            <RecommendationPanel />
          </div>
        )}
      </div>

      <ExecutionModal isOpen={showModal} onOpenChange={setShowModal} />
    </div>
  );
}
