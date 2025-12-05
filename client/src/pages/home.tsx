import React, { useState } from "react";
import TradeInput from "@/components/dashboard/TradeInput";
import RouteComparison, { type Route } from "@/components/dashboard/RouteComparison";
import RecommendationPanel from "@/components/dashboard/RecommendationPanel";
import ExecutionModal from "@/components/dashboard/ExecutionModal";
import { Loader2 } from "lucide-react";

interface AnalysisData {
  routes: Route[];
  pairFrom: string;
  pairTo: string;
  amountIn: string;
  tokenIn?: any;
  tokenOut?: any;
  timestamp?: string;
}

export default function Home() {
  const [showResults, setShowResults] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (tradeParams: { pairFrom: string; pairTo: string; amountIn: string }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tradeParams),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze routes");
      }
      
      const data = await response.json();
      setAnalysisData(data);
      setShowResults(true);
    } catch (err: any) {
      console.error("Failed to analyze routes:", err);
      setError(err.message || "Failed to analyze routes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = (route: Route) => {
    setSelectedRoute(route);
    setShowModal(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Analysis & Execution</h1>
        <p className="text-slate-500 max-w-2xl">
          Input your trade parameters to analyze liquidity routes across decentralized exchanges. 
          Our engine queries Uniswap V2/V3 protocols on Base L2 to find optimal execution.
        </p>
      </div>

      <div className="grid gap-8">
        <TradeInput onAnalyze={handleAnalyze} />
        
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="font-medium">Analysis Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Analyzing Routes...</h3>
            <p className="text-slate-500 mt-2">Querying Uniswap protocols for the best execution path.</p>
          </div>
        )}
        
        {!showResults && !isLoading && !error && (
          <div className="rounded-lg border border-dashed border-slate-300 p-12 text-center bg-slate-50/50">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
                  <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900">Ready to Analyze</h3>
              <p className="text-slate-500 mt-2 max-w-md mx-auto">
                Enter your trade details above and click "Analyze Routes" to view optimal execution paths.
              </p>
          </div>
        )}
        
        {showResults && analysisData && !isLoading && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <RouteComparison 
              routes={analysisData.routes} 
              onExecute={handleExecute}
              pairFrom={analysisData.pairFrom}
              pairTo={analysisData.pairTo}
            />
            <RecommendationPanel />
          </div>
        )}
      </div>

      <ExecutionModal 
        isOpen={showModal} 
        onOpenChange={setShowModal}
        analysisData={analysisData}
        selectedRoute={selectedRoute}
      />
    </div>
  );
}
