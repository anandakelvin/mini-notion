import { Injectable } from "@nestjs/common";
import { PrismaClient } from "./generated/prisma/client";

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const dbUrl = process.env.DATABASE_URL;
    const isPostgres = dbUrl?.startsWith("postgresql://") || dbUrl?.startsWith("postgres://");

    if (isPostgres) {
      try {
        const { PrismaPg } = require("@prisma/adapter-pg");
        const adapter = new PrismaPg({
          connectionString: dbUrl,
        });
        super({ adapter });
        return;
      } catch (e) {
        console.warn("Failed to load @prisma/adapter-pg, falling back:", e);
      }
    }

    // Default to SQLite adapter
    try {
      const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
      const adapter = new PrismaBetterSqlite3({
        url: dbUrl ?? "file:./dev.db",
      });
      super({ adapter });
    } catch (e) {
      console.error("Failed to load SQLite adapter:", e);
      super({} as any);
    }
  }
}