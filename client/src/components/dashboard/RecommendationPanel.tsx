import React from "react";
import { ShieldCheck } from "lucide-react";

export default function RecommendationPanel() {
  return (
    <div className="flex items-start gap-4 rounded-lg border-l-4 border-l-primary bg-blue-50/50 p-6 shadow-sm border-t border-r border-b border-slate-200">
      <div className="mt-1 rounded-full bg-blue-100 p-2 text-primary">
        <ShieldCheck className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h4 className="text-lg font-bold text-slate-900">Recommended: Uniswap V3 + Curve</h4>
        <p className="text-slate-600 leading-relaxed max-w-3xl">
          This route offers the best execution price with the lowest slippage probability (0.04%). 
          It has been verified against your compliance policy "Standard-Risk-2024" and passes all sanctions checks.
        </p>
      </div>
    </div>
  );
}
