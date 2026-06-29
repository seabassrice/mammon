/**
 * Unified data service — single interface for both cloud (Postgres)
 * and local (IndexedDB) storage.
 *
 * ## Behaviour
 * - When `getUserId()` returns a non-null value (user is logged in),
 *   all CRUD goes through Server Actions → Postgres.
 * - When `getUserId()` returns null (local mode), IndexedDB is used.
 * - Cloud reads that fail automatically fall back to IndexedDB.
 *
 * ## Current state
 * `getUserId()` always returns `null`, so all data stays in IndexedDB.
 * When you add auth (Auth.js / Clerk / etc.), wire it into `getUserId()`
 * and the rest lights up.
 *
 * ## Usage (same as the old db.ts — drop-in replacement)
 * ```ts
 * import { getAllAssets, addAsset, updateAsset, deleteAsset } from "@/lib/data-service";
 * ```
 */

import type { Asset } from "@/lib/types";
import * as local from "@/lib/db";

// ── Auth bridge ────────────────────────────────────────────────────────
// Uses Better Auth to check the session. Returns the user's ID when
// authenticated, or null for local (IndexedDB) mode.
export async function getUserId(): Promise<string | null> {
  try {
    const { authClient } = await import("@/lib/auth-client");
    const { data: session } = await authClient.getSession();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

// ── CRUD helpers ──────────────────────────────────────────────────────
// These are the same signatures exported by db.ts, so you can swap
// imports in any page without touching the component logic.

export async function getAllAssets(): Promise<Asset[]> {
  const uid = await getUserId();

  if (uid) {
    // Logged in → try Postgres, fall back to IndexedDB
    try {
      const { getAssets } = await import("@/actions/asset-actions");
      const rows = await getAssets(uid);
      return rows.map((r) => rowToAsset(r) as Asset).filter(Boolean);
    } catch (err) {
      console.error("Cloud read failed, falling back to IndexedDB:", err);
      return local.getAllAssets();
    }
  }

  // Local mode → IndexedDB
  return local.getAllAssets();
}

/**
 * Same as `getAsset` but accepts a string id (as used by page params).
 */
export async function getAssetById(id: string): Promise<Asset | undefined> {
  const numeric = Number(id);
  if (isNaN(numeric)) return undefined;
  return getAsset(numeric);
}

export async function getAsset(id: number): Promise<Asset | undefined> {
  const uid = await getUserId();

  if (uid) {
    try {
      const { getAssetById } = await import("@/actions/asset-actions");
      const row = await getAssetById(id);
      return row ? (rowToAsset(row) as Asset | undefined) : undefined;
    } catch (err) {
      console.error("Cloud read failed, falling back to IndexedDB:", err);
      return local.getAssetById(String(id));
    }
  }

  return local.getAssetById(String(id));
}

export async function addAsset(data: Record<string, any>): Promise<Asset> {
  const uid = await getUserId();

  if (uid) {
    const { createAsset } = await import("@/actions/asset-actions");
    const row = await createAsset({
      ...mapAssetToRow(data),
      user_id: uid,
    } as any);
    // Also cache locally
    await local.addAsset(data).catch(() => {});
    return rowToAsset(row) as Asset;
  }

  return local.addAsset(data);
}

export async function updateAsset(
  id: string | number,
  data: Record<string, any>
): Promise<Asset | undefined> {
  const uid = await getUserId();

  if (uid) {
    const numeric = typeof id === "string" ? Number(id) : id;
    const { updateAsset: cloudUpdate } = await import(
      "@/actions/asset-actions"
    );
    const row = await cloudUpdate(numeric, mapAssetToRow(data) as any, uid);
    // Also cache locally (use string id for IndexedDB)
    await local.updateAsset(String(id), data).catch(() => {});
    return row ? (rowToAsset(row) as Asset) : undefined;
  }

  return local.updateAsset(String(id), data);
}

export async function deleteAsset(id: string | number): Promise<void> {
  const uid = await getUserId();

  if (uid) {
    const numeric = typeof id === "string" ? Number(id) : id;
    const { deleteAsset: cloudDelete } = await import(
      "@/actions/asset-actions"
    );
    await cloudDelete(numeric, uid);
    // Also remove from local cache (use string id for IndexedDB)
    await local.deleteAsset(String(id)).catch(() => {});
    return;
  }

  return local.deleteAsset(String(id));
}

// ── Mapping helpers ────────────────────────────────────────────────────
// Convert between the Postgres row shape and the existing client types.
// Type assertions at call sites are safe — mapAssetToRow always produces
// all required fields for the Drizzle insert/update shape.

type AnyRow = Record<string, any>;

/**
 * Map a Postgres row back to the client-side `Asset` type.
 * Fields that exist in IndexedDB but not in the DB schema (like `currency`,
 * `condition`, `model`, `isRedeemed`, etc.) are carried over via the
 * IndexedDB layer.  When reading from Postgres we fill reasonable defaults.
 */
function rowToAsset(row: AnyRow): any {
  try {
    const base = {
      id: row.id,
      type: row.type,
      name: row.name,
      category: row.category,
      tags: row.tags ?? [],
      price: Number(row.price ?? 0),
      currency: "CNY",
      purchaseDate: row.purchase_date ?? undefined,
      notes: row.note ?? "",
      image_urls: row.image_urls ?? [],
      createdAt: row.created_at
        ? new Date(row.created_at as string).toISOString()
        : new Date().toISOString(),
      updatedAt: row.updated_at
        ? new Date(row.updated_at as string).toISOString()
        : new Date().toISOString(),
    };

    switch (row.type) {
      case "physical":
        return {
          ...base,
          type: "physical" as const,
          brand: row.brand ?? "",
          model: "",
          condition: "good",
          purchaseDate: row.purchase_date ?? "",
          storageLocation: row.location ?? "",
          warrantyExpire: row.warranty_end ?? "",
          purchaseChannel: "",
          status: "in_use",
        };
      case "digital_game":
        return {
          ...base,
          type: "digital_game" as const,
          platform: row.platform ?? "Steam",
          isRedeemed: false,
          redeemedOn: undefined,
          code: undefined,
          activated: false,
          completed: row.is_completed ?? false,
          addedDate: row.purchase_date ?? "",
        };
      case "subscription":
        return {
          ...base,
          type: "subscription" as const,
          billingCycle: row.billing_cycle ?? "monthly",
          nextBillingDate: row.next_billing ?? "",
          autoRenew: row.auto_renew ?? true,
          firstBillingDate: row.purchase_date ?? "",
          cycleDays: undefined,
          billingPlatform: "",
          notificationDays: 7,
        };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Map client-side asset data to Postgres row shape (snake_case).
 */
function mapAssetToRow(data: AnyRow): AnyRow {
  const row: AnyRow = {
    type: data.type,
    name: data.name,
    category: data.category,
    tags: data.tags ?? [],
    price: String(data.price ?? 0),
    purchase_date: data.purchaseDate || undefined,
    note: data.notes || "",
    image_urls: data.image_urls ?? [],
  };

  switch (data.type) {
    case "physical":
      Object.assign(row, {
        brand: data.brand || "",
        location: data.storageLocation || "",
        warranty_end: data.warrantyExpire || "",
      });
      break;
    case "digital_game":
      Object.assign(row, {
        platform: data.platform || "Steam",
        is_completed: data.completed ?? false,
      });
      break;
    case "subscription":
      Object.assign(row, {
        billing_cycle: data.billingCycle || "monthly",
        next_billing: data.nextBillingDate || "",
        auto_renew: data.autoRenew ?? true,
      });
      break;
  }

  return row;
}

// Re-export IndexedDB-only utilities (for Settings page and others)
export { exportAllData, importData, clearAllAssets } from "@/lib/db";