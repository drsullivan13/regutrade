import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTradeSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { getQuotes, TOKEN_PAIRS, TOKENS } from "./uniswap";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get available token pairs
  app.get("/api/tokens/pairs", async (req, res) => {
    try {
      res.json({ 
        pairs: TOKEN_PAIRS,
        tokens: TOKENS
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Analyze trade routes - now with real Uniswap data
  app.post("/api/analyze", async (req, res) => {
    try {
      const { pairFrom, pairTo, amountIn } = req.body;

      if (!pairFrom || !pairTo || !amountIn) {
        return res.status(400).json({ 
          error: "Missing required fields: pairFrom, pairTo, amountIn" 
        });
      }

      // Get quotes from Uniswap (real or simulated)
      const quoteResponse = await getQuotes(pairFrom, pairTo, amountIn);

      // Transform to frontend format
      const routes = quoteResponse.routes.map(route => ({
        id: route.id,
        name: route.protocol,
        output: `${route.amountOutFormatted} ${pairTo}`,
        outputRaw: route.amountOut,
        gas: `$${route.gasEstimateUSD}`,
        gasRaw: route.gasEstimate,
        netValue: `$${route.netValueUSD}`,
        priceImpact: route.priceImpact,
        isBest: route.isBest,
        tags: route.isBest ? ["Best Execution", "Low Slippage"] : [],
        routeString: route.routeString,
        predictedOutput: route.amountOutFormatted,
        route: route.routeString,
      }));

      res.json({ 
        routes, 
        pairFrom, 
        pairTo, 
        amountIn,
        tokenIn: quoteResponse.tokenIn,
        tokenOut: quoteResponse.tokenOut,
        timestamp: quoteResponse.timestamp,
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: error.message });
    }
  });

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

  return httpServer;
}
