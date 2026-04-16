export type StoredAttachment = {
  name: string;
  type: string;
  size: string;
  data?: string;
  storageKey?: string;
};

/** Loose input for rehydrating from IndexedDB / form rows where MIME or size may be omitted */
export type HydratableAttachment = {
  name: string;
  type?: string;
  size?: string;
  data?: string;
  storageKey?: string;
};

type AttachmentRow = {
  storageKey: string;
  payload: string;
  createdAt: number;
};

const DB_NAME = 'aa2000-kpi-attachments-db';
const DB_VERSION = 1;
const STORE_NAME = 'attachments';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function isIndexedDbAvailable() {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase | null> {
  if (!isIndexedDbAvailable()) return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'storageKey' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });

  return dbPromise;
}

function randomKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string) || '');
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

async function putAttachmentPayload(storageKey: string, payload: string): Promise<void> {
  const db = await openDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const row: AttachmentRow = { storageKey, payload, createdAt: Date.now() };
    store.put(row);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
}

export async function getAttachmentPayload(storageKey?: string): Promise<string | undefined> {
  if (!storageKey) return undefined;
  const db = await openDb();
  if (!db) return undefined;

  return new Promise<string | undefined>((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(storageKey);
    request.onsuccess = () => {
      const row = request.result as AttachmentRow | undefined;
      resolve(row?.payload);
    };
    request.onerror = () => resolve(undefined);
  });
}

export async function createStoredAttachmentFromFile(file: File): Promise<StoredAttachment> {
  const data = await readFileAsDataUrl(file);
  const storageKey = randomKey();
  await putAttachmentPayload(storageKey, data);
  return {
    name: file.name,
    type: file.type,
    size: `${(file.size / 1024).toFixed(1)} KB`,
    data,
    storageKey,
  };
}

export async function hydrateAttachmentData(attachment: HydratableAttachment | StoredAttachment): Promise<StoredAttachment> {
  const withMeta = (data?: string): StoredAttachment => ({
    name: attachment.name,
    type: attachment.type ?? '',
    size: attachment.size ?? '',
    data,
    storageKey: attachment.storageKey,
  });
  if (attachment.data) {
    return withMeta(attachment.data);
  }
  const payload = await getAttachmentPayload(attachment.storageKey);
  if (!payload) return withMeta(undefined);
  return withMeta(payload);
}

/** Same physical file (for UI: highlight row + preview sync). */
export function attachmentsMatch(
  a: { name: string; size?: string; storageKey?: string } | null | undefined,
  b: { name: string; size?: string; storageKey?: string } | null | undefined
): boolean {
  if (!a || !b) return false;
  if (a.storageKey && b.storageKey) return a.storageKey === b.storageKey;
  return a.name === b.name && (a.size ?? '') === (b.size ?? '');
}
