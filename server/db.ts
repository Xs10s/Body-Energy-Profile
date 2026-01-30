import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { profiles } from "./db/schema";

const { Pool } = pg;

export type DbClient = ReturnType<typeof drizzle>;

export async function createDbClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema: { profiles } });

  await pool.query("select 1");

  return { db, pool };
}
