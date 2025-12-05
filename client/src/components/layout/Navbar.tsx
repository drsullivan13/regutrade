import React from "react";
import { Link, useLocation } from "wouter";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import WalletButton from "@/components/wallet/WalletButton";
import WalletBalances from "@/components/wallet/WalletBalances";

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
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-slate-900">
                ReguTrade
              </span>
            </div>
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
              <div
                className={cn(
                  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
                  location === item.href
                    ? "text-primary border-b-2 border-primary rounded-none px-2"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {item.label}
              </div>
            </Link>
          ))}
        </nav>

        {/* Right: Wallet Balances & Connect Button */}
        <div className="flex items-center gap-4">
          <WalletBalances />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
