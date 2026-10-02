import { promises as fs } from "fs";
import path from "path";
import { Pool } from "pg";

let pool: Pool | null = null;
let schemaReady = false;

const SCHEMA_PATH = path.join(process.cwd(), "sql", "schema.sql");

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Render Postgres requires TLS.
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
    pool.on("error", (err) => console.error("[db] pool error", err));
  }
  return pool;
}

export async function ensureSchema(): Promise<void> {
  const p = getPool();
  if (!p || schemaReady) return;
  const sql = await fs.readFile(SCHEMA_PATH, "utf8");
  await p.query(sql);
  schemaReady = true;
}
