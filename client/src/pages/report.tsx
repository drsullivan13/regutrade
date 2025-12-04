import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { Separator } from "@/components/ui/separator";

export default function Report() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/history">
          <a className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to History
          </a>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <Card className="shadow-lg border-slate-200 print:shadow-none print:border-0">
        <CardHeader className="border-b border-slate-100 pb-8 pt-8 px-8 md:px-12">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trade Compliance Report</h1>
              <div className="mt-2 flex flex-col gap-1">
                <span className="font-mono text-sm text-slate-500">ID: TR-2024-001-XF92</span>
                <span className="text-sm text-slate-500">Generated on Oct 24, 2024 at 14:32:00 UTC</span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-900 text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-8 md:px-12 py-8 space-y-10">
          
          {/* Section 1: Trade Summary */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 pb-2 border-b border-slate-100">Trade Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Pair</div>
                <div className="font-medium text-slate-900">USDC / WETH</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Type</div>
                <div className="font-medium text-slate-900">Buy</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Network</div>
                <div className="font-medium text-slate-900">Base L2</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Executed By</div>
                <div className="font-mono text-sm text-slate-900">0x71C...9A2</div>
              </div>
            </div>
          </section>

          {/* Section 2: Execution Details */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 pb-2 border-b border-slate-100">Execution Details</h3>
            <div className="rounded-md border border-slate-200 bg-slate-50/50 p-4 grid gap-4">
               <div className="flex justify-between items-center">
                  <span className="text-slate-600">Input Amount</span>
                  <span className="font-mono font-medium text-slate-900">500,000.00 USDC</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-slate-600">Output Amount</span>
                  <span className="font-mono font-bold text-slate-900 text-lg">271.4205 WETH</span>
               </div>
               <Separator />
               <div className="flex justify-between items-center">
                  <span className="text-slate-600">Effective Rate</span>
                  <span className="font-mono text-slate-900">1,842.15 USDC/WETH</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-slate-600">Transaction Fee</span>
                  <span className="font-mono text-slate-900">$4.25 (0.00085 ETH)</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-slate-600">Transaction Hash</span>
                  <span className="font-mono text-slate-900 text-sm">0x7a92b3c...e4f1a9</span>
               </div>
            </div>
          </section>

           {/* Section 3: Compliance & Quality */}
           <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 pb-2 border-b border-slate-100">Compliance & Quality</h3>
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                 <div className="mt-1 h-2 w-2 rounded-full bg-green-600 flex-shrink-0" />
                 <p className="text-sm text-slate-700 leading-relaxed">
                   <strong className="font-medium text-slate-900">Best Execution:</strong> The trade was routed through Uniswap V3 (80%) and Curve (20%) to minimize slippage. The final execution price was 0.02% better than the market benchmark at the time of execution.
                 </p>
              </div>
              <div className="flex items-start gap-3">
                 <div className="mt-1 h-2 w-2 rounded-full bg-green-600 flex-shrink-0" />
                 <p className="text-sm text-slate-700 leading-relaxed">
                   <strong className="font-medium text-slate-900">Slippage Check:</strong> Realized slippage was 0.04%, which is within the user-defined tolerance of 0.50%.
                 </p>
              </div>
              <div className="flex items-start gap-3">
                 <div className="mt-1 h-2 w-2 rounded-full bg-green-600 flex-shrink-0" />
                 <p className="text-sm text-slate-700 leading-relaxed">
                   <strong className="font-medium text-slate-900">Sanctions Screening:</strong> All interacting pool addresses and counterparty wallets were screened against OFAC and UN sanctions lists with negative results.
                 </p>
              </div>
            </div>
          </section>

          {/* Footer Signature */}
          <section className="pt-8 mt-12 border-t border-slate-200">
             <div className="flex justify-between items-end">
                <div className="text-xs text-slate-400">
                   Generated by ReguTrade Platform<br />
                   Compliance Engine v2.4.1
                </div>
                <div className="text-right">
                   <div className="h-12 w-32 border-b border-slate-300 mb-2"></div>
                   <div className="text-xs text-slate-500 uppercase tracking-wide">Authorized Signature</div>
                </div>
             </div>
          </section>

        </CardContent>
      </Card>
    </div>
  );
}
