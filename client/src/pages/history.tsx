import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Filter, ArrowUpRight, ArrowDownLeft, MoreHorizontal, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const trades = [
  {
    id: "TR-2024-001",
    date: "2024-10-24 14:30:05",
    pair: "USDC/WETH",
    type: "Buy",
    amountIn: "500,000.00",
    amountOut: "271.4205",
    status: "Completed",
    quality: "Excellent",
  },
  {
    id: "TR-2024-002",
    date: "2024-10-24 10:15:22",
    pair: "WBTC/USDC",
    type: "Sell",
    amountIn: "5.0000",
    amountOut: "342,150.00",
    status: "Completed",
    quality: "Good",
  },
  {
    id: "TR-2024-003",
    date: "2024-10-23 16:45:10",
    pair: "WETH/DAI",
    type: "Sell",
    amountIn: "150.0000",
    amountOut: "276,450.00",
    status: "Completed",
    quality: "Excellent",
  },
  {
    id: "TR-2024-004",
    date: "2024-10-23 09:12:45",
    pair: "AAVE/USDC",
    type: "Buy",
    amountIn: "50,000.00",
    amountOut: "412.50",
    status: "Review",
    quality: "Review",
  },
  {
    id: "TR-2024-005",
    date: "2024-10-22 11:20:00",
    pair: "USDC/WETH",
    type: "Buy",
    amountIn: "1,200,000.00",
    amountOut: "650.1240",
    status: "Completed",
    quality: "Excellent",
  },
];

export default function History() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Trade History</h1>
          <p className="text-slate-500">Audit log of all executed trades and their compliance status.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <DownloadIcon className="h-4 w-4" />
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
              {trades.map((trade) => (
                <TableRow key={trade.id} className="cursor-pointer hover:bg-slate-50/80 transition-colors">
                  <TableCell className="font-mono font-medium text-slate-700">{trade.id}</TableCell>
                  <TableCell className="text-slate-600 tabular-nums">{trade.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="rounded-sm px-1.5 py-0.5 text-xs bg-white font-normal text-slate-600 border-slate-200">
                        {trade.pair}
                      </Badge>
                      {trade.type === 'Buy' ? (
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
                  <TableCell className="text-right font-mono text-slate-600 tabular-nums">{trade.amountIn}</TableCell>
                  <TableCell className="text-right font-mono text-slate-900 font-medium tabular-nums">{trade.amountOut}</TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium border-0 shadow-none",
                        trade.quality === "Excellent" && "bg-green-100 text-green-700 hover:bg-green-100",
                        trade.quality === "Good" && "bg-blue-100 text-blue-700 hover:bg-blue-100",
                        trade.quality === "Review" && "bg-amber-100 text-amber-700 hover:bg-amber-100",
                      )}
                    >
                      {trade.quality}
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
        </CardContent>
      </Card>
    </div>
  );
}

function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  )
}
