import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTradeSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get all trades (for history page)
  app.get("/api/trades", async (req, res) => {
    try {
      const trades = await storage.getAllTrades();
      res.json(trades);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single trade by ID
  app.get("/api/trades/:tradeId", async (req, res) => {
    try {
      const trade = await storage.getTradeByTradeId(req.params.tradeId);
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }
      res.json(trade);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new trade (execute trade)
  app.post("/api/trades", async (req, res) => {
    try {
      const parsed = insertTradeSchema.safeParse(req.body);
      if (!parsed.success) {
        const validationError = fromZodError(parsed.error);
        return res.status(400).json({ error: validationError.message });
      }

      const trade = await storage.createTrade(parsed.data);
      res.status(201).json(trade);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Analyze routes (simulated - returns mock route analysis)
  app.post("/api/analyze", async (req, res) => {
    try {
      const { pairFrom, pairTo, amountIn } = req.body;
      
      // Simulate route analysis with realistic data
      const routes = [
        {
          id: "1",
          name: "Uniswap V3 + Curve",
          output: calculateOutput(amountIn, pairFrom, pairTo, 0.9995),
          gas: "$4.25",
          netValue: calculateNetValue(amountIn, 0.9995, 4.25),
          isBest: true,
          tags: ["Best Execution", "Low Slippage"],
          predictedOutput: calculateOutput(amountIn, pairFrom, pairTo, 0.9995),
          priceImpact: "-0.04%",
          route: "Uniswap V3 (80%) + Curve (20%)",
        },
        {
          id: "2",
          name: "1inch Aggregator",
          output: calculateOutput(amountIn, pairFrom, pairTo, 0.998),
          gas: "$5.10",
          netValue: calculateNetValue(amountIn, 0.998, 5.10),
          isBest: false,
          tags: [],
          predictedOutput: calculateOutput(amountIn, pairFrom, pairTo, 0.998),
          priceImpact: "-0.08%",
          route: "1inch Router",
        },
        {
          id: "3",
          name: "SushiSwap V3",
          output: calculateOutput(amountIn, pairFrom, pairTo, 0.996),
          gas: "$3.80",
          netValue: calculateNetValue(amountIn, 0.996, 3.80),
          isBest: false,
          tags: [],
          predictedOutput: calculateOutput(amountIn, pairFrom, pairTo, 0.996),
          priceImpact: "-0.12%",
          route: "SushiSwap V3",
        },
      ];

      res.json({ routes, pairFrom, pairTo, amountIn });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}

// Helper functions for route simulation
function calculateOutput(amountIn: string, from: string, to: string, efficiency: number): string {
  // Simplified price calculation for demo (USDC to WETH at ~$1850/WETH)
  const amount = parseFloat(amountIn);
  if (from === "USDC" && to === "WETH") {
    const output = (amount / 1842.15) * efficiency;
    return output.toFixed(4);
  }
  // Default fallback
  return (amount * 0.000542 * efficiency).toFixed(4);
}

function calculateNetValue(amountIn: string, efficiency: number, gasCost: number): string {
  const amount = parseFloat(amountIn);
  const netValue = (amount * efficiency) - gasCost;
  return netValue.toFixed(2);
}
