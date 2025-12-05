import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Info, Zap, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface Route {
  id: string;
  name: string;
  output: string;
  outputRaw?: string;
  gas: string;
  gasRaw?: string;
  netValue: string;
  priceImpact: string;
  isBest: boolean;
  tags: string[];
  routeString?: string;
  predictedOutput?: string;
  route?: string;
}

interface RouteComparisonProps {
  routes: Route[];
  onExecute: (route: Route) => void;
  pairFrom?: string;
  pairTo?: string;
}

export default function RouteComparison({ routes, onExecute, pairFrom, pairTo }: RouteComparisonProps) {
  if (!routes || routes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center bg-slate-50/50">
        <p className="text-slate-500">No routes found for this token pair.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Route Analysis</h3>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Zap className="h-3.5 w-3.5" />
          <span>{routes.length} routes evaluated</span>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="hover:bg-slate-50">
              <TableHead className="w-[280px] text-xs font-bold uppercase tracking-wider text-slate-500">Route Strategy</TableHead>
              <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                Output {pairTo && <span className="normal-case font-normal">({pairTo})</span>}
              </TableHead>
              <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                <div className="flex items-center justify-end gap-1">
                  Price Impact
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>Impact on market price from this trade</TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                <div className="flex items-center justify-end gap-1">
                  Est. Gas
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>Estimated network fees in USD</TooltipContent>
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="w-[80px] text-center text-xs font-bold uppercase tracking-wider text-slate-500">Best?</TableHead>
              <TableHead className="w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.map((route, index) => (
              <TableRow 
                key={route.id} 
                className={cn(
                  "transition-colors h-16",
                  route.isBest ? "bg-green-50/40 hover:bg-green-50/60" : "hover:bg-slate-50"
                )}
                data-testid={`row-route-${route.id}`}
              >
                <TableCell className="relative">
                  {route.isBest && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-600"></div>
                  )}
                  <div className="flex flex-col pl-2">
                    <span className="font-bold text-slate-900 text-base" data-testid={`text-route-name-${route.id}`}>
                      {route.name}
                    </span>
                    {route.routeString && (
                      <span className="text-xs text-slate-500 font-mono mt-0.5">{route.routeString}</span>
                    )}
                    {route.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5">
                        {route.tags.map(tag => (
                          <span 
                            key={tag} 
                            className={cn(
                              "text-[10px] font-medium px-1.5 py-0.5 rounded",
                              tag === "Best Execution" 
                                ? "bg-green-100 text-green-700 border border-green-200" 
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            )}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-base font-medium text-slate-900 tabular-nums" data-testid={`text-output-${route.id}`}>
                  {route.output}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono text-sm tabular-nums",
                  route.priceImpact.startsWith("-") ? "text-amber-600" : "text-slate-500"
                )}>
                  {route.priceImpact}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-slate-500 tabular-nums">
                  {route.gas}
                </TableCell>
                <TableCell className="text-center">
                  {route.isBest && (
                    <div className="flex justify-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600 fill-green-100" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Button 
                    onClick={() => onExecute(route)}
                    className={cn(
                      "w-full font-medium shadow-sm transition-all",
                      route.isBest 
                        ? "bg-primary hover:bg-blue-800" 
                        : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-none"
                    )}
                    data-testid={`button-execute-${route.id}`}
                  >
                    Execute
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Best route summary */}
      {routes.find(r => r.isBest) && (
        <div className="flex items-center gap-3 rounded-md bg-green-50 border border-green-100 p-3 text-sm">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <div>
            <span className="font-medium text-green-800">Recommended: </span>
            <span className="text-green-700">
              {routes.find(r => r.isBest)?.name} offers the best net output after gas costs.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
