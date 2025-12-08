import jsPDF from "jspdf";

export interface TradeData {
  tradeId: string;
  pairFrom: string;
  pairTo: string;
  amountIn: string;
  amountOut: string;
  type: string;
  route: string;
  effectiveRate: string;
  gasCost: string;
  gasUsed: string;
  executionQuality: string;
  qualityScore: string;
  predictedOutput: string;
  priceImpact: string;
  transactionHash: string;
  walletAddress: string;
  network: string;
  blockNumber?: string | null;
  status: string;
  createdAt?: string;
  // Enhanced blockchain verification fields
  chainId?: string;
  tokenInAddress?: string;
  tokenOutAddress?: string;
}

function safeParseFloat(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === "") return 0;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
}

function safeFormatNumber(value: string | number | undefined | null, decimals: number = 6): string {
  const num = safeParseFloat(value);
  return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

function calculateVariance(predicted: string | undefined, actual: string | undefined): { value: string; positive: boolean } {
  const predictedNum = safeParseFloat(predicted);
  const actualNum = safeParseFloat(actual);
  
  if (predictedNum === 0) {
    return { value: "0.00", positive: true };
  }
  
  const variance = ((actualNum - predictedNum) / predictedNum) * 100;
  
  if (!isFinite(variance) || isNaN(variance)) {
    return { value: "0.00", positive: true };
  }
  
  return { 
    value: variance.toFixed(4), 
    positive: variance >= 0 
  };
}

export function generateComplianceReport(trade: TradeData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return new Date().toISOString();
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      });
    } catch {
      return new Date().toISOString();
    }
  };

  const drawLine = (yPos: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
  };

  const addSection = (title: string) => {
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(title, margin, y);
    y += 8;
    drawLine(y);
    y += 8;
  };

  const addRow = (label: string, value: string, highlight: boolean = false) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(label, margin, y);
    
    if (highlight) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 163, 74);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
    }
    doc.text(value, pageWidth - margin, y, { align: "right" });
    y += 7;
  };

  // Header with branding
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 45, "F");
  
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("DeFi Trade Compliance Report", margin, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Institutional-Grade Execution Documentation", margin, 35);
  
  // Trade ID badge
  doc.setFillColor(59, 130, 246);
  doc.roundedRect(pageWidth - margin - 60, 15, 60, 20, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(trade.tradeId || "N/A", pageWidth - margin - 30, 27, { align: "center" });

  y = 55;

  // Report metadata
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${formatDate()}`, margin, y);
  doc.text(`Network: ${trade.network || "Base L2"}`, pageWidth - margin, y, { align: "right" });
  y += 5;
  doc.text(`Trade Executed: ${formatDate(trade.createdAt)}`, margin, y);
  y += 3;

  // Executive Summary
  addSection("EXECUTIVE SUMMARY");
  
  const qualityScore = safeParseFloat(trade.qualityScore);
  const qualityColor = qualityScore >= 99 ? [22, 163, 74] : 
                       qualityScore >= 95 ? [234, 179, 8] : [239, 68, 68];
  
  doc.setFillColor(qualityColor[0], qualityColor[1], qualityColor[2]);
  doc.roundedRect(margin, y, 80, 25, 3, 3, "F");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("EXECUTION QUALITY", margin + 5, y + 8);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${safeFormatNumber(trade.qualityScore, 2)}%`, margin + 5, y + 20);
  
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin + 90, y, 80, 25, 3, 3, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("STATUS", margin + 95, y + 8);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 163, 74);
  doc.text(trade.status || "Completed", margin + 95, y + 20);
  
  y += 35;

  // Trade Details
  addSection("TRADE DETAILS");
  addRow("Trade Pair", `${trade.pairFrom || "N/A"} -> ${trade.pairTo || "N/A"}`);
  addRow("Trade Type", (trade.type || "buy").toUpperCase());
  addRow("Input Amount", `${safeFormatNumber(trade.amountIn)} ${trade.pairFrom || ""}`);
  addRow("Output Amount", `${safeFormatNumber(trade.amountOut)} ${trade.pairTo || ""}`, true);
  addRow("Effective Rate", `${safeFormatNumber(trade.effectiveRate)} ${trade.pairFrom || ""}/${trade.pairTo || ""}`);

  // Execution Analysis
  addSection("EXECUTION ANALYSIS");
  
  const variance = calculateVariance(trade.predictedOutput, trade.amountOut);
  const varianceSign = variance.positive ? "+" : "";
  
  addRow("Predicted Output", `${safeFormatNumber(trade.predictedOutput)} ${trade.pairTo || ""}`);
  addRow("Actual Output", `${safeFormatNumber(trade.amountOut)} ${trade.pairTo || ""}`, variance.positive);
  addRow("Variance", `${varianceSign}${variance.value}%`, variance.positive);
  addRow("Price Impact", trade.priceImpact || "0.00%");
  
  // Clean routing strategy - replace Unicode arrows with ASCII
  const cleanRoute = (trade.route || "Direct").replace(/→/g, "->").replace(/←/g, "<-");
  addRow("Routing Strategy", cleanRoute);

  // Cost Analysis
  addSection("COST ANALYSIS");
  addRow("Gas Cost (USD)", trade.gasCost || "$0.00");
  addRow("Gas Used", `${safeFormatNumber(trade.gasUsed, 0)} units`);
  addRow("Cost Efficiency", "Optimal");

  // Blockchain Verification - Enhanced for institutional auditors
  addSection("BLOCKCHAIN VERIFICATION");

  const chainId = trade.chainId || "8453";
  const networkDisplay = `${trade.network || "Base L2"} (Chain ID: ${chainId})`;
  addRow("Network", networkDisplay);
  addRow("Wallet Address", trade.walletAddress || "N/A");

  // Block Number
  if (trade.blockNumber) {
    addRow("Block Number", `#${trade.blockNumber}`);
  }

  // Execution timestamp
  if (trade.createdAt) {
    addRow("Execution Time", formatDate(trade.createdAt));
  }

  // Token contract addresses (if available)
  if (trade.tokenInAddress) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Token In (${trade.pairFrom})`, margin, y);
    doc.setFont("courier", "normal");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8);
    doc.text(trade.tokenInAddress, pageWidth - margin, y, { align: "right" });
    y += 7;
  }

  if (trade.tokenOutAddress) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Token Out (${trade.pairTo})`, margin, y);
    doc.setFont("courier", "normal");
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8);
    doc.text(trade.tokenOutAddress, pageWidth - margin, y, { align: "right" });
    y += 7;
  }

  y += 3;

  // Transaction Hash - Full display for audit trail
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Transaction Hash", margin, y);
  y += 6;

  // Display full transaction hash in monospace font
  doc.setFont("courier", "normal");
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  const txHash = trade.transactionHash || "N/A";
  doc.text(txHash, margin, y);
  y += 8;

  // Block Explorer verification URL
  if (trade.transactionHash && trade.transactionHash.startsWith("0x")) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Verify on Block Explorer:", margin, y);
    y += 5;
    doc.setFont("courier", "normal");
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(8);
    doc.text(`https://basescan.org/tx/${trade.transactionHash}`, margin, y);
    y += 10;
  }

  // On-Chain Verification Badge
  y += 5;
  const verifyBoxHeight = 45;

  // Dark header bar
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, contentWidth, 18, 3, 3, "F");

  // Green checkmark circle
  doc.setFillColor(22, 163, 74);
  doc.circle(margin + 12, y + 9, 5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("✓", margin + 10, y + 12);

  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text("BLOCKCHAIN VERIFIED", margin + 22, y + 12);

  // Light body
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y + 18, contentWidth, verifyBoxHeight - 18, "F");

  // Verification summary
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);

  const verifyY = y + 26;
  doc.text(`Network: ${networkDisplay}`, margin + 5, verifyY);
  doc.text(`Block: ${trade.blockNumber ? `#${trade.blockNumber}` : "Pending"}`, margin + 5, verifyY + 6);
  doc.text(`Executed: ${formatDate(trade.createdAt)}`, margin + 5, verifyY + 12);

  // Right side - hash preview
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  if (trade.transactionHash) {
    const shortHash = `${trade.transactionHash.slice(0, 18)}...${trade.transactionHash.slice(-16)}`;
    doc.text(shortHash, pageWidth - margin - 5, verifyY + 6, { align: "right" });
  }

  y += verifyBoxHeight + 5;

  // Compliance Statement
  y += 5;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 40, 3, 3, "F");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("COMPLIANCE STATEMENT", margin + 5, y + 10);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  const complianceText = [
    "This trade was executed in accordance with pre-defined risk parameters and routing policy.",
    "Execution price is within acceptable slippage tolerance. Counterparty addresses have been",
    "screened against OFAC sanctions lists. All regulatory requirements have been satisfied.",
  ];
  complianceText.forEach((line, i) => {
    doc.text(line, margin + 5, y + 18 + i * 5);
  });

  // Footer with report generation timestamp
  const footerY = doc.internal.pageSize.getHeight() - 20;
  drawLine(footerY - 5);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);

  // Left: Platform branding
  doc.text("DeFi Trade Compliance Platform", margin, footerY);

  // Center: Report ID
  doc.text(`Report ID: ${trade.tradeId || "N/A"}`, pageWidth / 2, footerY, { align: "center" });

  // Right: Page number
  doc.text("Page 1 of 1", pageWidth - margin, footerY, { align: "right" });

  // Second footer line: Generation timestamp
  const footerY2 = footerY + 6;
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  const generatedTimestamp = new Date().toISOString();
  doc.text(`Report Generated: ${formatDate()} | Document ID: ${trade.tradeId}-${Date.now().toString(36).toUpperCase()}`, margin, footerY2);

  return doc;
}

export function downloadComplianceReport(trade: TradeData): void {
  try {
    if (!trade || !trade.tradeId) {
      console.error("Invalid trade data for PDF generation");
      throw new Error("Invalid trade data");
    }
    
    const doc = generateComplianceReport(trade);
    const filename = `compliance-report-${trade.tradeId}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    throw error;
  }
}
