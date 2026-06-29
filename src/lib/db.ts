import { openDB, IDBPDatabase } from "idb";
import type { Asset, AssetType } from "./types";

const DB_NAME = "MammonDB";
const DB_VERSION = 1;
const STORE_NAME = "assets";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
          });
          store.createIndex("type", "type", { unique: false });
          store.createIndex("category", "category", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// CRUD Operations

export async function getAllAssets(): Promise<Asset[]> {
  const db = await getDb();
  const assets = await db.getAll(STORE_NAME);
  return assets as Asset[];
}

export async function getAssetsByType(type: AssetType): Promise<Asset[]> {
  const db = await getDb();
  const assets = await db.getAllFromIndex(STORE_NAME, "type", type);
  return assets as Asset[];
}

export async function getAssetById(id: string): Promise<Asset | undefined> {
  const db = await getDb();
  const asset = await db.get(STORE_NAME, id);
  return asset as Asset | undefined;
}

export async function addAsset(
  asset: Record<string, any>
): Promise<Asset> {
  const db = await getDb();
  const now = new Date().toISOString();
  const newAsset = {
    ...asset,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  } as Asset;
  await db.add(STORE_NAME, newAsset);
  return newAsset;
}

export async function updateAsset(
  id: string,
  updates: Partial<Record<string, any>>
): Promise<Asset | undefined> {
  const db = await getDb();
  const existing = await db.get(STORE_NAME, id);
  if (!existing) return undefined;
  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await db.put(STORE_NAME, updated);
  return updated as Asset;
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}

export async function clearAllAssets(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE_NAME);
}

export async function exportAllData(): Promise<Asset[]> {
  return getAllAssets();
}

export async function importData(assets: Asset[]): Promise<number> {
  const db = await getDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  let count = 0;
  for (const asset of assets) {
    // Ensure the asset has required fields
    if (asset.id && asset.type && asset.name) {
      await store.put({
        ...asset,
        updatedAt: new Date().toISOString(),
      });
      count++;
    }
  }
  await tx.done;
  return count;
}