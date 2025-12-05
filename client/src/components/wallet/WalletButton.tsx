import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut, Check } from "lucide-react";

export default function WalletButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openExplorer = () => {
    if (address) {
      window.open(`https://basescan.org/address/${address}`, "_blank");
    }
  };

  const getConnectorIcon = (name: string) => {
    if (name.toLowerCase().includes("metamask")) return "🦊";
    if (name.toLowerCase().includes("coinbase")) return "💰";
    if (name.toLowerCase().includes("injected")) return "💉";
    return "🔗";
  };

  const getConnectorDescription = (name: string) => {
    if (name.toLowerCase().includes("metamask")) return "Browser extension";
    if (name.toLowerCase().includes("coinbase")) return "Mobile & extension";
    if (name.toLowerCase().includes("injected")) return "Browser wallet";
    return "Connect wallet";
  };

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="h-10 gap-2 border-slate-200 bg-white hover:bg-slate-50 font-medium"
            data-testid="button-wallet-connected"
          >
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span className="font-mono text-sm">{formatAddress(address)}</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-slate-500">Connected to {chain?.name || "Base"}</p>
              <p className="font-mono text-sm font-medium">{formatAddress(address)}</p>
              {balance && (
                <p className="text-xs text-slate-500">
                  {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyAddress} className="cursor-pointer gap-2">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Address"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openExplorer} className="cursor-pointer gap-2">
            <ExternalLink className="h-4 w-4" />
            View on BaseScan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => disconnect()} 
            className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
            data-testid="button-disconnect-wallet"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <Button 
        onClick={() => setShowConnectModal(true)}
        className="h-10 gap-2 bg-primary hover:bg-blue-800 font-medium"
        data-testid="button-connect-wallet"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>

      <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Connect Wallet</DialogTitle>
            <DialogDescription>
              Choose a wallet to connect to Base L2
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            {connectors.map((connector) => (
              <Button
                key={connector.uid}
                variant="outline"
                className="w-full h-14 justify-start gap-3 text-left font-medium hover:bg-slate-50 border-slate-200"
                disabled={isPending}
                onClick={() => {
                  connect({ connector });
                  setShowConnectModal(false);
                }}
                data-testid={`button-connect-${connector.name.toLowerCase().replace(/\s/g, '-')}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <span className="text-xl">{getConnectorIcon(connector.name)}</span>
                </div>
                <div className="flex flex-col">
                  <span>{connector.name}</span>
                  <span className="text-xs text-slate-500 font-normal">
                    {getConnectorDescription(connector.name)}
                  </span>
                </div>
              </Button>
            ))}
          </div>
          <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
            <p className="font-medium">Base L2 Network</p>
            <p className="text-xs mt-1 text-blue-600">
              Make sure your wallet is connected to Base (Chain ID: 8453)
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
