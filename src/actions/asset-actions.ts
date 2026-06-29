"use server";

import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Validation schema (matches your existing form shape) ──────────────

const assetFormSchema = z.object({
  // Common
  name: z.string().min(1, "请输入名称"),
  type: z.enum(["physical", "digital_game", "subscription"]),
  category: z.string().min(1, "请选择分类"),
  tags: z.array(z.string()).default([]),
  price: z.coerce.number().min(0, "价格必须大于等于0"),
  purchase_date: z.string().optional(),

  image_urls: z.array(z.string()).default([]),
  note: z.string().optional(),

  // Physical
  brand: z.string().optional(),
  location: z.string().optional(),
  warranty_end: z.string().optional(),

  // Digital game
  platform: z.string().optional(),
  is_completed: z.boolean().optional(),

  // Subscription
  billing_cycle: z.string().optional(),
  next_billing: z.string().optional(),
  auto_renew: z.boolean().optional(),
});

export type ServerAssetInput = z.infer<typeof assetFormSchema>;

// ── Helpers ───────────────────────────────────────────────────────────

// ── Server Actions ─────────────────────────────────────────────────────

export async function createAsset(
  data: ServerAssetInput & { user_id?: string }
) {
  const parsed = assetFormSchema.parse(data);
  const userId = data.user_id ?? "local-user";

  const [row] = await db
    .insert(assets)
    .values({
      ...parsed,
      user_id: userId,
      price: String(parsed.price),
    })
    .returning();

  revalidatePath("/");
  revalidatePath("/assets");
  return row;
}

export async function getAssets(userId: string = "local-user") {
  const rows = await db
    .select()
    .from(assets)
    .where(eq(assets.user_id, userId))
    .orderBy(desc(assets.created_at));

  return rows;
}

export async function getAssetById(id: number) {
  const [row] = await db.select().from(assets).where(eq(assets.id, id));
  return row ?? null;
}

export async function updateAsset(
  id: number,
  data: Partial<ServerAssetInput>,
  userId?: string
) {
  const condition = userId
    ? and(eq(assets.id, id), eq(assets.user_id, userId))
    : eq(assets.id, id);

  const [row] = await db
    .update(assets)
    .set({
      ...data,
      price: data.price != null ? String(data.price) : undefined,
      updated_at: new Date(),
    })
    .where(condition)
    .returning();

  revalidatePath("/");
  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  revalidatePath(`/edit/${id}`);
  return row;
}

export async function deleteAsset(id: number, userId?: string) {
  const condition = userId
    ? and(eq(assets.id, id), eq(assets.user_id, userId))
    : eq(assets.id, id);

  await db.delete(assets).where(condition);

  revalidatePath("/");
  revalidatePath("/assets");
}