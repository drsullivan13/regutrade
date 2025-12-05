import React, { useState } from "react";
import TradeInput from "@/components/dashboard/TradeInput";
import RouteComparison from "@/components/dashboard/RouteComparison";
import RecommendationPanel from "@/components/dashboard/RecommendationPanel";
import ExecutionModal from "@/components/dashboard/ExecutionModal";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [showResults, setShowResults] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);

  const handleAnalyze = async (tradeParams: { pairFrom: string; pairTo: string; amountIn: string }) => {
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tradeParams),
      });
      const data = await response.json();
      setAnalysisData(data);
      setShowResults(true);
    } catch (error) {
      console.error("Failed to analyze routes:", error);
    }
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
        <TradeInput onAnalyze={handleAnalyze} />
        
        {!showResults ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-12 text-center bg-slate-50/50">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
                  <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900">Ready to Analyze</h3>
              <p className="text-slate-500 mt-2 max-w-md mx-auto">
                Enter your trade details above and click "Analyze Routes" to view optimal execution paths across the DeFi ecosystem.
              </p>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            {analysisData && (
              <>
                <RouteComparison routes={analysisData.routes} onExecute={handleExecute} />
                <RecommendationPanel />
              </>
            )}
          </div>
        )}
      </div>

      <ExecutionModal 
        isOpen={showModal} 
        onOpenChange={setShowModal}
        analysisData={analysisData}
      />
    </div>
  );
}
