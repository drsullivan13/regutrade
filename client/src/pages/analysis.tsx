import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CheckCircle2, Download, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Analysis() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Post-Trade Analysis</h1>
          <p className="text-slate-500">Trade execution report and slippage analysis.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button className="gap-2">
            New Trade
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-green-600 shadow-sm">
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Execution Quality</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-slate-900 tabular-nums">99.48%</span>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Excellent</Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">0.02% better than predicted</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
           <CardContent className="pt-6">
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Effective Rate</div>
            <div className="mt-2 text-4xl font-bold text-slate-900 tabular-nums">1,842.15</div>
            <p className="mt-1 text-xs text-slate-500">USDC per WETH</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
           <CardContent className="pt-6">
            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Transaction Cost</div>
            <div className="mt-2 text-4xl font-bold text-slate-900 tabular-nums">$4.25</div>
            <p className="mt-1 text-xs text-slate-500">Gas used: 145,203 Gwei</p>
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
                <span className="font-mono font-medium text-slate-700">271.4120 WETH</span>
             </div>
             <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Price Impact</span>
                <span className="font-mono font-medium text-slate-700">-0.05%</span>
             </div>
             <div className="flex justify-between py-2">
                <span className="text-slate-500">Route</span>
                <span className="font-medium text-slate-700">Uniswap V3 (80%) + Curve (20%)</span>
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
                <span className="font-mono font-bold text-slate-900">271.4205 WETH</span>
             </div>
             <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Price Impact</span>
                <span className="font-mono font-medium text-green-700">-0.04%</span>
             </div>
             <div className="flex justify-between py-2">
                <span className="text-slate-500">Transaction Hash</span>
                <a href="#" className="font-mono text-primary flex items-center gap-1 hover:underline">
                  0x7a...3b9 <ExternalLink className="h-3 w-3" />
                </a>
             </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Compliance Footer */}
      <div className="rounded-lg bg-slate-100 p-6 border border-slate-200">
        <div className="flex items-start gap-4">
          <Shield className="h-6 w-6 text-slate-400 mt-1" />
          <div>
            <h4 className="font-medium text-slate-900">Compliance Statement</h4>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              This trade was executed in accordance with the pre-defined risk parameters and routing policy. 
              The execution price is within the acceptable slippage tolerance of 0.5%. 
              Counterparty addresses have been screened against OFAC sanctions lists.
            </p>
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
    )
  }
