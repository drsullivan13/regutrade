import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowDown, Settings2, Loader2, DollarSign, Coins } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type InputMode = "token" | "usd";

interface TradeInputProps {
  onAnalyze: (params: { pairFrom: string; pairTo: string; amountIn: string }) => Promise<void>;
}

export default function TradeInput({ onAnalyze }: TradeInputProps) {
  const [sellToken, setSellToken] = useState("USDC");
  const [buyToken, setBuyToken] = useState("WETH");
  const [amount, setAmount] = useState("1000");
  const [inputMode, setInputMode] = useState<InputMode>("usd");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch current ETH price for USD/Token conversion
  const { data: priceData } = useQuery({
    queryKey: ["price"],
    queryFn: async () => {
      const response = await fetch("/api/price");
      if (!response.ok) throw new Error("Failed to fetch price");
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

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
  };

  const sellTokens = ["USDC", "WETH"];
  const buyTokens = ["WETH", "USDC"];

  // Validate that a price is a finite positive number
  const isValidPrice = (price: unknown): price is number => {
    return typeof price === "number" && Number.isFinite(price) && price > 0;
  };

  // Check if price data is loaded and valid (needed for WETH conversions)
  const isPriceLoaded = isValidPrice(priceData?.ethPriceUSD);

  // Get token price in USD - returns null if price is not valid
  const getTokenPriceUSD = (symbol: string): number | null => {
    if (symbol === "USDC") return 1;
    if (symbol === "WETH") {
      const price = priceData?.ethPriceUSD;
      if (!isValidPrice(price)) return null; // Price not loaded or invalid
      return price;
    }
    return 1;
  };

  // Convert between token amount and USD value
  const tokenToUSD = (tokenAmount: number, symbol: string): number | null => {
    const price = getTokenPriceUSD(symbol);
    if (price === null) return null;
    return tokenAmount * price;
  };

  const usdToToken = (usdAmount: number, symbol: string): number | null => {
    const price = getTokenPriceUSD(symbol);
    if (price === null) return null;
    return usdAmount / price;
  };

  // Check if we need price data and don't have it yet
  const needsPriceData = inputMode === "usd" && sellToken === "WETH";
  const priceReady = !needsPriceData || isPriceLoaded;

  // Calculate the actual token amount to send to the API
  const actualTokenAmount = useMemo((): number | null => {
    const numAmount = parseFloat(amount) || 0;
    if (inputMode === "usd") {
      return usdToToken(numAmount, sellToken);
    }
    return numAmount;
  }, [amount, inputMode, sellToken, priceData]);

  // Calculate the equivalent value for display
  const equivalentValue = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    if (inputMode === "usd") {
      // Show token equivalent
      const tokenAmt = usdToToken(numAmount, sellToken);
      if (tokenAmt === null) return "Loading price...";
      if (tokenAmt < 0.0001) return `≈ ${tokenAmt.toExponential(2)} ${sellToken}`;
      if (tokenAmt < 1) return `≈ ${tokenAmt.toFixed(6)} ${sellToken}`;
      return `≈ ${tokenAmt.toFixed(4)} ${sellToken}`;
    } else {
      // Show USD equivalent
      const usdAmt = tokenToUSD(numAmount, sellToken);
      if (usdAmt === null) return "Loading price...";
      if (usdAmt >= 1000000) return `≈ $${(usdAmt / 1000000).toFixed(2)}M`;
      if (usdAmt >= 1000) return `≈ $${usdAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
      return `≈ $${usdAmt.toFixed(2)}`;
    }
  }, [amount, inputMode, sellToken, priceData]);

  // Auto-switch buy token if it matches sell token
  useEffect(() => {
    if (buyToken === sellToken) {
      setBuyToken(sellToken === "USDC" ? "WETH" : "USDC");
    }
  }, [sellToken, buyToken]);

  const handleAnalyze = async () => {
    if (actualTokenAmount === null) return; // Price not ready
    setIsAnalyzing(true);
    try {
      // Always send token amount to the API
      await onAnalyze({
        pairFrom: sellToken,
        pairTo: buyToken,
        amountIn: actualTokenAmount.toString(),
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Check if analyze is disabled - ensure we have a valid finite token amount
  const hasValidTokenAmount = actualTokenAmount !== null && Number.isFinite(actualTokenAmount) && actualTokenAmount > 0;
  const isAnalyzeDisabled = isAnalyzing || !amount || parseFloat(amount) <= 0 || !hasValidTokenAmount;

  const formatDisplayAmount = () => {
    const numAmount = parseFloat(amount) || 0;
    if (inputMode === "usd") {
      if (numAmount >= 1000000) return `$${(numAmount / 1000000).toFixed(2)}M`;
      if (numAmount >= 1000) return `$${numAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
      return `$${numAmount.toFixed(2)}`;
    } else {
      if (numAmount < 0.0001) return `${numAmount.toExponential(2)} ${sellToken}`;
      if (numAmount < 1) return `${numAmount.toFixed(6)} ${sellToken}`;
      return `${numAmount.toFixed(4)} ${sellToken}`;
    }
  };

  const formatRouteDisplay = () => {
    // Always show token amount for route display
    const tokenAmt = actualTokenAmount;
    if (tokenAmt === null) return "Loading...";
    if (tokenAmt < 0.0001) return `${tokenAmt.toExponential(2)} ${sellToken}`;
    if (tokenAmt < 1) return `${tokenAmt.toFixed(6)} ${sellToken}`;
    if (tokenAmt >= 1000000) return `${(tokenAmt / 1000000).toFixed(2)}M ${sellToken}`;
    if (tokenAmt >= 1000) return `${tokenAmt.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${sellToken}`;
    return `${tokenAmt.toFixed(4)} ${sellToken}`;
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
            <div className="flex items-center justify-between">
              <Label htmlFor="sell-amount" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sell</Label>
              {/* Token/USD Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-md p-0.5" data-testid="toggle-input-mode">
                <button
                  type="button"
                  onClick={() => setInputMode("usd")}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    inputMode === "usd" 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  data-testid="button-mode-usd"
                >
                  <DollarSign className="h-3 w-3" />
                  USD
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("token")}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    inputMode === "token" 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  data-testid="button-mode-token"
                >
                  <Coins className="h-3 w-3" />
                  Token
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input 
                  id="sell-amount" 
                  type="number" 
                  placeholder={inputMode === "usd" ? "1000.00" : "0.5"} 
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
              <span>{equivalentValue}</span>
              <span 
                className="text-primary cursor-pointer font-medium hover:underline" 
                onClick={() => setAmount(inputMode === "usd" ? "1000000" : "100")}
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
              {formatRouteDisplay()} → {buyToken}
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
          disabled={isAnalyzeDisabled}
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
