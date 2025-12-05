import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Filter, ArrowUpRight, ArrowDownLeft, MoreHorizontal, Search, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function History() {
  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["trades"],
    queryFn: async () => {
      const response = await fetch("/api/trades");
      if (!response.ok) throw new Error("Failed to fetch trades");
      return response.json();
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Trade History</h1>
          <p className="text-slate-500">Audit log of all executed trades and their compliance status.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by ID, hash, or token..."
                  className="pl-9 bg-slate-50 border-slate-200"
                  data-testid="input-search-trades"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="border-dashed border-slate-300 text-slate-600">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Date Range
              </Button>
              <Button variant="outline" size="sm" className="border-dashed border-slate-300 text-slate-600">
                <Filter className="mr-2 h-4 w-4" />
                Token
              </Button>
              <Button variant="outline" size="sm" className="border-dashed border-slate-300 text-slate-600">
                <Filter className="mr-2 h-4 w-4" />
                Quality
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : trades.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-medium text-slate-900">No trades yet</h3>
              <p className="text-slate-500 mt-2">Your trade history will appear here after executing trades.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[150px] text-xs font-semibold uppercase tracking-wider text-slate-500">Trade ID</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Date & Time</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pair</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Amount In</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Amount Out</TableHead>
                  <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider text-slate-500">Quality</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade: any) => (
                  <TableRow key={trade.id} className="cursor-pointer hover:bg-slate-50/80 transition-colors" data-testid={`row-trade-${trade.tradeId}`}>
                    <TableCell className="font-mono font-medium text-slate-700" data-testid={`text-trade-id-${trade.tradeId}`}>{trade.tradeId}</TableCell>
                    <TableCell className="text-slate-600 tabular-nums">{new Date(trade.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="rounded-sm px-1.5 py-0.5 text-xs bg-white font-normal text-slate-600 border-slate-200">
                          {trade.pairFrom}/{trade.pairTo}
                        </Badge>
                        {trade.type === 'buy' ? (
                          <span className="text-xs font-medium text-green-600 flex items-center">
                            <ArrowDownLeft className="h-3 w-3 mr-0.5" /> Buy
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-amber-600 flex items-center">
                            <ArrowUpRight className="h-3 w-3 mr-0.5" /> Sell
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-slate-600 tabular-nums">{parseFloat(trade.amountIn).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-slate-900 font-medium tabular-nums">{trade.amountOut}</TableCell>
                    <TableCell>
                      <Badge 
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium border-0 shadow-none",
                          trade.executionQuality === "Excellent" && "bg-green-100 text-green-700 hover:bg-green-100",
                          trade.executionQuality === "Good" && "bg-blue-100 text-blue-700 hover:bg-blue-100",
                          trade.executionQuality === "Review" && "bg-amber-100 text-amber-700 hover:bg-amber-100",
                        )}
                      >
                        {trade.executionQuality}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                          <MoreHorizontal className="h-4 w-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
