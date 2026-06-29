import {
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  timestamp,
  jsonb,
  numeric,
} from "drizzle-orm/pg-core";

/**
 * Assets table — the single source of truth in Postgres.
 *
 * Uses a "single-table" design with nullable type-specific columns,
 * matching the existing Zod discriminated union shape.
 */
export const assets = pgTable("assets", {
  // ── Common fields ──────────────────────────────────────────
  id: serial("id").primaryKey(),

  user_id: varchar("user_id", { length: 128 }).notNull().default("local-user"),

  type: varchar("type", { length: 20 })
    .notNull()
    .$type<"physical" | "digital_game" | "subscription">(),

  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
  purchase_date: varchar("purchase_date", { length: 20 }),

  image_urls: jsonb("image_urls").$type<string[]>().default([]).notNull(),
  note: text("note"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),

  // ── Physical-only ──────────────────────────────────────────
  brand: varchar("brand", { length: 255 }),
  location: varchar("location", { length: 255 }),
  warranty_end: varchar("warranty_end", { length: 20 }),

  // ── Digital-game-only ──────────────────────────────────────
  platform: varchar("platform", { length: 50 }),
  is_completed: boolean("is_completed").default(false),

  // ── Subscription-only ──────────────────────────────────────
  billing_cycle: varchar("billing_cycle", { length: 20 }),
  next_billing: varchar("next_billing", { length: 20 }),
  auto_renew: boolean("auto_renew").default(true),
});

export type AssetRow = typeof assets.$inferSelect;
export type NewAssetRow = typeof assets.$inferInsert;