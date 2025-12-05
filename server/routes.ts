import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTradeSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { TOKEN_PAIRS, TOKENS } from "./uniswap";
import { findBestRoute, getBaseGasPrice, getEthPriceUSD, FEE_TIER_LABELS } from "./uniswapV3";

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

  // Analyze trade routes - REAL Uniswap V3 QuoterV2 data
  app.post("/api/analyze", async (req, res) => {
    try {
      const { pairFrom, pairTo, amountIn } = req.body;

      if (!pairFrom || !pairTo || !amountIn) {
        return res.status(400).json({ 
          error: "Missing required fields: pairFrom, pairTo, amountIn" 
        });
      }

      console.log(`[V3 Quote] Fetching real quotes for ${amountIn} ${pairFrom} -> ${pairTo}`);

      // Get REAL quotes from Uniswap V3 QuoterV2 contract on Base L2
      const { routes: v3Routes, ethPriceUSD } = await findBestRoute(pairFrom, pairTo, amountIn);

      if (v3Routes.length === 0) {
        return res.status(400).json({ 
          error: `No liquidity found for ${pairFrom}/${pairTo} pair on Base L2` 
        });
      }

      // Calculate net value in USD for each route
      const tokenIn = TOKENS[pairFrom.toUpperCase()];
      const tokenOut = TOKENS[pairTo.toUpperCase()];

      // Transform to frontend format
      const routes = v3Routes.map((route, index) => {
        const amountOutNum = parseFloat(route.amountOutFormatted);
        
        // Calculate output value in USD
        let outputUSD: number;
        if (tokenOut.symbol === 'WETH' || tokenOut.symbol === 'ETH') {
          outputUSD = amountOutNum * ethPriceUSD;
        } else if (tokenOut.symbol === 'cbETH') {
          outputUSD = amountOutNum * ethPriceUSD * 1.05; // cbETH premium
        } else {
          outputUSD = amountOutNum; // Stablecoins
        }

        // Parse gas cost (remove $ prefix)
        const gasCostUSD = parseFloat(route.gasEstimateUSD.replace('$', ''));
        const netValue = outputUSD - gasCostUSD;

        return {
          id: `v3-${route.fee}`,
          name: `Uniswap V3 (${route.feeLabel})`,
          output: `${route.amountOutFormatted} ${pairTo}`,
          outputRaw: route.amountOut.toString(),
          gas: route.gasEstimateUSD,
          gasRaw: route.gasEstimate.toString(),
          netValue: `$${netValue.toFixed(2)}`,
          priceImpact: route.priceImpact,
          isBest: route.isBest,
          tags: route.isBest ? ["Best Execution", "Live Quote"] : ["Live Quote"],
          routeString: route.route,
          predictedOutput: route.amountOutFormatted,
          route: route.route,
        };
      });

      console.log(`[V3 Quote] Found ${routes.length} routes, best: ${routes[0]?.name}`);

      res.json({ 
        routes, 
        pairFrom, 
        pairTo, 
        amountIn,
        tokenIn,
        tokenOut,
        ethPriceUSD,
        timestamp: new Date().toISOString(),
        priceSource: "Uniswap V3 QuoterV2 (Base L2 On-Chain)",
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Test endpoint for V3 quotes (debugging)
  app.get("/api/test-v3-quote", async (req, res) => {
    try {
      const { gasPrice, gasPriceGwei } = await getBaseGasPrice();
      const ethPrice = await getEthPriceUSD();
      
      // Test quote: 1000 USDC -> WETH
      const result = await findBestRoute("USDC", "WETH", "1000");

      res.json({
        gasPrice: gasPrice.toString(),
        gasPriceGwei,
        ethPriceUSD: ethPrice,
        testQuote: {
          input: "1000 USDC",
          output: result.best ? `${result.best.amountOutFormatted} WETH` : "No routes found",
          routes: result.routes.map(r => ({
            fee: r.feeLabel,
            output: r.amountOutFormatted,
            gas: r.gasEstimateUSD,
          })),
        },
        source: "Uniswap V3 QuoterV2 @ 0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message, stack: error.stack });
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
