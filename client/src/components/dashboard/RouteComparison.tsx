import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Route {
  id: string;
  name: string;
  output: string;
  gas: string;
  netValue: string;
  isBest: boolean;
  tags: string[];
}

interface RouteComparisonProps {
  routes: Route[];
  onExecute: (route: Route) => void;
}

export default function RouteComparison({ routes, onExecute }: RouteComparisonProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow className="hover:bg-slate-50">
            <TableHead className="w-[300px] text-xs font-bold uppercase tracking-wider text-slate-500">Route Strategy</TableHead>
            <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500">Output</TableHead>
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
            <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500">Net Value</TableHead>
            <TableHead className="w-[100px] text-center text-xs font-bold uppercase tracking-wider text-slate-500">Best?</TableHead>
            <TableHead className="w-[120px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {routes.map((route) => (
            <TableRow 
              key={route.id} 
              className={cn(
                "transition-colors h-16",
                route.isBest ? "bg-green-50/30 hover:bg-green-50/50" : "hover:bg-slate-50"
              )}
              data-testid={`row-route-${route.id}`}
            >
              <TableCell className="relative">
                {route.isBest && (
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-600"></div>
                )}
                <div className="flex flex-col">
                   <span className="font-bold text-slate-900 text-base" data-testid={`text-route-name-${route.id}`}>{route.name}</span>
                   {route.tags.length > 0 && (
                     <div className="flex gap-1 mt-1">
                       {route.tags.map(tag => (
                         <span key={tag} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
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
              <TableCell className="text-right font-mono text-sm text-slate-500 tabular-nums">
                {route.gas}
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-medium text-slate-900 tabular-nums">
                {route.netValue}
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
  );
}
