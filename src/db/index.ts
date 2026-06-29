import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "./schema";

/**
 * Drizzle ORM client backed by @vercel/postgres.
 *
 * Connection is configured entirely through environment variables
 * set by Vercel when you provision a Postgres (Neon) database:
 *   POSTGRES_URL, POSTGRES_URL_NON_POOLING, etc.
 *
 * This module MUST only be imported from Server Components
 * or Server Actions — never from client components directly.
 */
export const db = drizzle(sql, { schema });

export { schema };