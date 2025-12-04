import React from "react";
import { Link, useLocation } from "wouter";
import { Shield, Wallet, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { label: "Analyze Trade", href: "/" },
    { label: "Trade History", href: "/history" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Left: Logo & Network */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              ReguTrade
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            Base L2
          </div>
        </div>

        {/* Center: Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-slate-100/50 data-[state=open]:bg-slate-100/50",
                  location === item.href
                    ? "text-primary border-b-2 border-primary rounded-none px-2"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {item.label}
              </a>
            </Link>
          ))}
        </nav>

        {/* Right: Wallet & Balance */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end text-xs">
            <span className="text-slate-500">Balance</span>
            <span className="font-mono font-medium tabular-nums text-slate-900">
              $1,240,500.00 USDC
            </span>
          </div>
          <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50">
            <Wallet className="h-4 w-4" />
            <span>0x71C...9A2</span>
          </button>
        </div>
      </div>
    </header>
  );
}
