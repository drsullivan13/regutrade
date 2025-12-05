import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  tradeId: text("trade_id").notNull().unique(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  
  // Trade Details
  pairFrom: text("pair_from").notNull(),
  pairTo: text("pair_to").notNull(),
  amountIn: text("amount_in").notNull(),
  amountOut: text("amount_out").notNull(),
  type: text("type").notNull(),
  
  // Execution Details
  route: text("route").notNull(),
  effectiveRate: text("effective_rate").notNull(),
  gasCost: text("gas_cost").notNull(),
  gasUsed: text("gas_used").notNull(),
  
  // Quality Metrics
  executionQuality: text("execution_quality").notNull(),
  qualityScore: text("quality_score").notNull(),
  predictedOutput: text("predicted_output").notNull(),
  priceImpact: text("price_impact").notNull(),
  
  // Blockchain
  transactionHash: text("transaction_hash").notNull(),
  walletAddress: text("wallet_address").notNull(),
  network: text("network").notNull().default("Base L2"),
  blockNumber: text("block_number"),
  
  // Compliance
  status: text("status").notNull().default("Completed"),
  
  // Pre-trade analysis data (routes that were evaluated)
  routesAnalyzed: jsonb("routes_analyzed"),
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  timestamp: true,
});

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;
