import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowDown, Settings2 } from "lucide-react";

export default function TradeInput() {
  return (
    <Card className="w-full shadow-sm border-slate-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium text-slate-900">Trade Execution</CardTitle>
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
                  defaultValue="500000"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">USD Value</span>
              </div>
              <Select defaultValue="USDC">
                <SelectTrigger className="w-[120px] h-12 border-slate-300 font-medium bg-slate-50">
                  <SelectValue placeholder="Token" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="DAI">DAI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between text-xs text-slate-500 px-1">
              <span>Balance: $1,240,500.00</span>
              <span className="text-primary cursor-pointer font-medium">Max</span>
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
              <Select defaultValue="WETH">
                <SelectTrigger className="flex-1 h-12 border-slate-300 font-medium bg-slate-50">
                  <SelectValue placeholder="Select Token" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WETH">WETH</SelectItem>
                  <SelectItem value="WBTC">WBTC</SelectItem>
                  <SelectItem value="AAVE">AAVE</SelectItem>
                  <SelectItem value="UNI">UNI</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="flex justify-end text-xs text-slate-500 px-1">
              <span>Balance: 0.00</span>
            </div>
          </div>
        </div>

        {/* Advanced Settings Toggle */}
        <div className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer hover:text-slate-900 transition-colors w-max">
           <Settings2 className="h-4 w-4" />
           <span>Advanced Parameters</span>
        </div>

        <Button className="w-full h-14 text-lg font-medium bg-primary hover:bg-blue-800 shadow-md transition-all active:scale-[0.99]">
          Analyze Routes
        </Button>
      </CardContent>
    </Card>
  );
}
