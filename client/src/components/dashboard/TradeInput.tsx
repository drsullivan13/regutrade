import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowDown, Settings2, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface TradeInputProps {
  onAnalyze: (params: { pairFrom: string; pairTo: string; amountIn: string }) => Promise<void>;
}

export default function TradeInput({ onAnalyze }: TradeInputProps) {
  const [sellToken, setSellToken] = useState("USDC");
  const [buyToken, setBuyToken] = useState("WETH");
  const [amount, setAmount] = useState("500000");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch available token pairs from API
  const { data: tokenData } = useQuery({
    queryKey: ["tokens"],
    queryFn: async () => {
      const response = await fetch("/api/tokens/pairs");
      if (!response.ok) throw new Error("Failed to fetch tokens");
      return response.json();
    },
  });

  const tokens = tokenData?.tokens || {
    USDC: { symbol: "USDC", name: "USD Coin" },
    WETH: { symbol: "WETH", name: "Wrapped Ether" },
    ETH: { symbol: "ETH", name: "Ether" },
    DAI: { symbol: "DAI", name: "Dai Stablecoin" },
    USDbC: { symbol: "USDbC", name: "USD Base Coin" },
    cbETH: { symbol: "cbETH", name: "Coinbase Staked ETH" },
    LINK: { symbol: "LINK", name: "Chainlink" },
    AAVE: { symbol: "AAVE", name: "Aave" },
  };

  const sellTokens = ["USDC", "DAI", "USDbC", "WETH", "ETH"];
  const buyTokens = ["WETH", "ETH", "cbETH", "USDC", "LINK", "AAVE"];

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await onAnalyze({
        pairFrom: sellToken,
        pairTo: buyToken,
        amountIn: amount,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatBalance = (value: string) => {
    const num = parseFloat(value);
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <Card className="w-full shadow-sm border-slate-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-slate-900">Trade Execution</CardTitle>
          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
            Base L2
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          
          {/* Sell Side */}
          <div className="space-y-2">
            <Label htmlFor="sell-amount" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sell</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input 
                  id="sell-amount" 
                  type="number" 
                  placeholder="0.00" 
                  className="h-12 text-lg font-mono pl-4 border-slate-300 focus-visible:ring-primary"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-testid="input-sell-amount"
                />
              </div>
              <Select value={sellToken} onValueChange={setSellToken}>
                <SelectTrigger className="w-[120px] h-12 border-slate-300 font-medium bg-slate-50" data-testid="select-sell-token">
                  <SelectValue placeholder="Token" />
                </SelectTrigger>
                <SelectContent>
                  {sellTokens.map((symbol) => (
                    <SelectItem key={symbol} value={symbol}>
                      {symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between text-xs text-slate-500 px-1">
              <span>Amount: {formatBalance(amount)}</span>
              <span 
                className="text-primary cursor-pointer font-medium hover:underline" 
                onClick={() => setAmount("1000000")}
              >
                Max
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center pb-4 text-slate-400">
            <ArrowRight className="hidden md:block h-6 w-6" />
            <ArrowDown className="md:hidden h-6 w-6" />
          </div>

          {/* Buy Side */}
          <div className="space-y-2">
            <Label htmlFor="buy-token" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Buy</Label>
            <div className="flex gap-2">
              <Select value={buyToken} onValueChange={setBuyToken}>
                <SelectTrigger className="flex-1 h-12 border-slate-300 font-medium bg-slate-50" data-testid="select-buy-token">
                  <SelectValue placeholder="Select Token" />
                </SelectTrigger>
                <SelectContent>
                  {buyTokens.filter(t => t !== sellToken).map((symbol) => (
                    <SelectItem key={symbol} value={symbol}>
                      {symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end text-xs text-slate-500 px-1">
              <span>Token: {tokens[buyToken]?.name || buyToken}</span>
            </div>
          </div>
        </div>

        {/* Trade info */}
        <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-600 border border-slate-100">
          <div className="flex items-center justify-between">
            <span>Analyzing routes for:</span>
            <span className="font-mono font-medium text-slate-900">
              {formatBalance(amount)} {sellToken} → {buyToken}
            </span>
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <div className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer hover:text-slate-900 transition-colors w-max">
           <Settings2 className="h-4 w-4" />
           <span>Advanced Parameters</span>
        </div>

        <Button 
          className="w-full h-14 text-lg font-medium bg-primary hover:bg-blue-800 shadow-md transition-all active:scale-[0.99]"
          onClick={handleAnalyze}
          disabled={isAnalyzing || !amount || parseFloat(amount) <= 0}
          data-testid="button-analyze-routes"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analyzing Routes...
            </>
          ) : (
            "Analyze Routes"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
