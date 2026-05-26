const DB_NAME = "iattom_assets_db";
const STORE_NAME = "iattom_assets_v1";
const DB_VERSION = 1;

export interface AssetEntry {
  id: string;
  projectId: string;
  conceptIndex: number;
  base64: string;
  label: string;
  format: string;
  createdAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("projectId", "projectId", { unique: false });
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

export interface AssetInput {
  conceptIndex: number;
  base64: string;
  label: string;
  format: string;
}

export async function saveProjectAssets(projectId: string, assets: AssetInput[]): Promise<void> {
  if (!assets.length) return;
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const now = new Date().toISOString();
  for (const a of assets) {
    store.put({
      id: `${projectId}_${a.conceptIndex}`,
      projectId,
      conceptIndex: a.conceptIndex,
      base64: a.base64,
      label: a.label,
      format: a.format,
      createdAt: now,
    } satisfies AssetEntry);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function loadProjectAssets(projectId: string): Promise<AssetEntry[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("projectId");
    const req = index.getAll(projectId);
    req.onsuccess = () => {
      db.close();
      const sorted = (req.result as AssetEntry[]).sort((a, b) => a.conceptIndex - b.conceptIndex);
      resolve(sorted);
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function deleteProjectAssets(projectId: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const index = store.index("projectId");
  const keysReq = index.getAllKeys(projectId);
  keysReq.onsuccess = () => {
    for (const key of keysReq.result as IDBValidKey[]) {
      store.delete(key);
    }
  };
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
