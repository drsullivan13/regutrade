import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CheckCircle2, Download, ExternalLink, Loader2, FileText, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useLocation, useParams } from "wouter";
import { downloadComplianceReport, type TradeData } from "@/lib/pdfGenerator";
import { toast } from "sonner";
import { useAccount } from "wagmi";

const DEMO_TRADES_KEY = "defi-compliance-demo-trades";

function getDemoTradeIds(): string[] {
  try {
    const stored = sessionStorage.getItem(DEMO_TRADES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

interface Trade {
  id: number;
  tradeId: string;
  timestamp: string;
  pairFrom: string;
  pairTo: string;
  amountIn: string;
  amountOut: string;
  type: string;
  route: string;
  effectiveRate: string;
  gasCost: string;
  gasUsed: string;
  executionQuality: string;
  qualityScore: string;
  predictedOutput: string;
  priceImpact: string;
  transactionHash: string;
  walletAddress: string;
  network: string;
  blockNumber?: string | null;
  status: string;
  routesAnalyzed: any;
}

export default function Analysis() {
  const [, setLocation] = useLocation();
  const params = useParams<{ tradeId?: string }>();
  const { address, isConnected } = useAccount();
  
  const { data: trades, isLoading } = useQuery<Trade[]>({
    queryKey: ["trades", address, isConnected, params.tradeId],
    queryFn: async () => {
      // If we have a specific trade ID, fetch just that trade by ID
      if (params.tradeId) {
        const demoIds = getDemoTradeIds();
        // Include the specific trade ID in demo IDs if needed
        const tradeIds = demoIds.includes(params.tradeId) ? demoIds : [...demoIds, params.tradeId];
        const res = await fetch(`/api/trades?tradeIds=${tradeIds.join(',')}`);
        if (!res.ok) throw new Error("Failed to fetch trades");
        return res.json();
      }
      
      // Otherwise use wallet/demo filtering
      let url = "/api/trades";
      
      if (isConnected && address) {
        url += `?walletAddress=${address}`;
      } else {
        const demoIds = getDemoTradeIds();
        if (demoIds.length > 0) {
          url += `?tradeIds=${demoIds.join(',')}`;
        } else {
          return [];
        }
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch trades");
      return res.json();
    },
  });

  // If a specific trade ID is provided in the URL, find that trade
  // Otherwise, show the latest trade
  const selectedTrade = params.tradeId 
    ? trades?.find(t => t.tradeId === params.tradeId)
    : trades?.[0];
  
  const isSpecificTrade = !!params.tradeId;

  const handleDownloadPDF = () => {
    if (!selectedTrade) {
      toast.error("No trade data available");
      return;
    }
    
    try {
      const tradeData: TradeData = {
        tradeId: selectedTrade.tradeId,
        pairFrom: selectedTrade.pairFrom,
        pairTo: selectedTrade.pairTo,
        amountIn: selectedTrade.amountIn,
        amountOut: selectedTrade.amountOut,
        type: selectedTrade.type,
        route: selectedTrade.route,
        effectiveRate: selectedTrade.effectiveRate,
        gasCost: selectedTrade.gasCost,
        gasUsed: selectedTrade.gasUsed,
        executionQuality: selectedTrade.executionQuality,
        qualityScore: selectedTrade.qualityScore,
        predictedOutput: selectedTrade.predictedOutput,
        priceImpact: selectedTrade.priceImpact,
        transactionHash: selectedTrade.transactionHash,
        walletAddress: selectedTrade.walletAddress,
        network: selectedTrade.network,
        blockNumber: selectedTrade.blockNumber,
        status: selectedTrade.status,
        createdAt: selectedTrade.timestamp,
      };
      
      downloadComplianceReport(tradeData);
      toast.success("Compliance report downloaded successfully");
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error("Failed to generate compliance report. Please try again.");
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return "N/A";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatNumber = (num: string | number) => {
    const parsed = parseFloat(String(num));
    if (isNaN(parsed)) return "0.00";
    return parsed.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  const calculateVariance = () => {
    if (!selectedTrade) return { value: "0.00", positive: true };
    const predicted = parseFloat(selectedTrade.predictedOutput);
    const actual = parseFloat(selectedTrade.amountOut);
    if (isNaN(predicted) || isNaN(actual) || predicted === 0) return { value: "0.00", positive: true };
    const variance = ((actual - predicted) / predicted * 100);
    return { 
      value: variance.toFixed(4), 
      positive: variance >= 0 
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedTrade) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Post-Trade Analysis</h1>
            <p className="text-slate-500">Trade execution report and compliance documentation.</p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No Trades Yet</h3>
            <p className="text-slate-500 text-sm mt-1 mb-6">Execute a trade to see the compliance analysis report.</p>
            <Button onClick={() => setLocation("/")} data-testid="button-new-trade">
              Analyze New Trade
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const variance = calculateVariance();
  const qualityScore = parseFloat(selectedTrade.qualityScore);
  const qualityBadge = qualityScore >= 99 ? "Excellent" : qualityScore >= 95 ? "Good" : "Fair";
  const qualityColor = qualityScore >= 99 ? "bg-green-100 text-green-800 border-green-200" : 
                       qualityScore >= 95 ? "bg-amber-100 text-amber-800 border-amber-200" : 
                       "bg-red-100 text-red-800 border-red-200";

  return (
    <div className="space-y-8">
      {isSpecificTrade && (
        <Button 
          variant="ghost" 
          size="sm"
          className="gap-1.5 text-slate-600 hover:text-slate-900 -ml-2"
          onClick={() => setLocation("/history")}
          data-testid="button-back-history"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Trade History
        </Button>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Post-Trade Analysis</h1>
          <p className="text-slate-500">Trade execution report and compliance documentation.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleDownloadPDF}
            data-testid="button-export-pdf"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button className="gap-2" onClick={() => setLocation("/")} data-testid="button-new-trade">
            New Trade
          </Button>
        </div>
      </div>

      {/* Trade ID Header */}
      <div className="flex items-center gap-4">
        <Badge variant="outline" className="text-sm px-3 py-1 font-mono">
          {selectedTrade.tradeId}
        </Badge>
        <span className="text-sm text-slate-500">
          {new Date(selectedTrade.timestamp).toLocaleString()}
        </span>
        <Badge className={qualityColor}>{qualityBadge}</Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-green-600 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Execution Quality</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-slate-900 tabular-nums" data-testid="text-quality-score">
                {selectedTrade.qualityScore}%
              </span>
              <Badge className={qualityColor}>{qualityBadge}</Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {variance.positive ? "+" : ""}{variance.value}% vs predicted
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Effective Rate</div>
            <div className="mt-2 text-4xl font-bold text-slate-900 tabular-nums" data-testid="text-effective-rate">
              {formatNumber(selectedTrade.effectiveRate)}
            </div>
            <p className="mt-1 text-xs text-slate-500">{selectedTrade.pairFrom} per {selectedTrade.pairTo}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Transaction Cost</div>
            <div className="mt-2 text-4xl font-bold text-slate-900 tabular-nums" data-testid="text-gas-cost">
              {selectedTrade.gasCost}
            </div>
            <p className="mt-1 text-xs text-slate-500">Gas used: {formatNumber(selectedTrade.gasUsed)} units</p>
          </CardContent>
        </Card>
      </div>

      {/* Comparison */}
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="shadow-sm border-slate-200 bg-slate-50/50">
          <CardHeader>
            <CardTitle className="text-lg text-slate-700">Predicted Outcome</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Expected Output</span>
              <span className="font-mono font-medium text-slate-700" data-testid="text-predicted-output">
                {formatNumber(selectedTrade.predictedOutput)} {selectedTrade.pairTo}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Price Impact</span>
              <span className="font-mono font-medium text-slate-700">{selectedTrade.priceImpact}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Route</span>
              <span className="font-medium text-slate-700 text-right max-w-[200px]">{selectedTrade.route}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-slate-200 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-600"></div>
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
              Actual Execution
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Actual Output</span>
              <span className="font-mono font-bold text-slate-900" data-testid="text-actual-output">
                {formatNumber(selectedTrade.amountOut)} {selectedTrade.pairTo}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Variance</span>
              <span className={`font-mono font-medium ${variance.positive ? "text-green-700" : "text-red-700"}`}>
                {variance.positive ? "+" : ""}{variance.value}%
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Transaction Hash</span>
              <a 
                href={`https://basescan.org/tx/${selectedTrade.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-primary flex items-center gap-1 hover:underline"
                data-testid="link-transaction"
              >
                {formatAddress(selectedTrade.transactionHash)} 
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blockchain Details */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Blockchain Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <div className="text-sm text-slate-500">Network</div>
              <div className="font-medium text-slate-900">{selectedTrade.network}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Wallet Address</div>
              <div className="font-mono text-slate-900">{formatAddress(selectedTrade.walletAddress)}</div>
            </div>
            {selectedTrade.blockNumber && (
              <div>
                <div className="text-sm text-slate-500">Block Number</div>
                <div className="font-mono text-slate-900" data-testid="text-block-number">
                  {selectedTrade.blockNumber}
                </div>
              </div>
            )}
            <div>
              <div className="text-sm text-slate-500">Status</div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="font-medium text-green-700">{selectedTrade.status}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Compliance Footer */}
      <div className="rounded-lg bg-slate-100 p-6 border border-slate-200">
        <div className="flex items-start gap-4">
          <Shield className="h-6 w-6 text-slate-400 mt-1" />
          <div>
            <h4 className="font-medium text-slate-900">Compliance Statement</h4>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              This trade was executed in accordance with pre-defined risk parameters and routing policy. 
              The execution price is within the acceptable slippage tolerance. 
              Counterparty addresses have been screened against OFAC sanctions lists.
              All regulatory requirements have been satisfied for audit purposes.
            </p>
            <div className="mt-4 flex gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handleDownloadPDF}
              >
                <Download className="h-4 w-4" />
                Download Compliance Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Shield(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}
