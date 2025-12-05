import { type User, type InsertUser, type Trade, type InsertTrade, users, trades } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Trade operations
  createTrade(trade: InsertTrade): Promise<Trade>;
  getTradeById(id: number): Promise<Trade | undefined>;
  getTradeByTradeId(tradeId: string): Promise<Trade | undefined>;
  getAllTrades(): Promise<Trade[]>;
  getRecentTrades(limit?: number): Promise<Trade[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const [trade] = await db
      .insert(trades)
      .values(insertTrade)
      .returning();
    return trade;
  }

  async getTradeById(id: number): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id));
    return trade || undefined;
  }

  async getTradeByTradeId(tradeId: string): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.tradeId, tradeId));
    return trade || undefined;
  }

  async getAllTrades(): Promise<Trade[]> {
    return await db.select().from(trades).orderBy(desc(trades.timestamp));
  }

  async getRecentTrades(limit: number = 50): Promise<Trade[]> {
    return await db.select().from(trades).orderBy(desc(trades.timestamp)).limit(limit);
  }
}

export const storage = new DatabaseStorage();
