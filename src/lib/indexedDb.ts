import { ChatSession } from '../types';
import { saveSessionToCloud } from './firebase';
import {
  saveSessionToSQLite,
  saveAllSessionsToSQLite,
  getAllSessionsFromSQLite,
  deleteSessionFromSQLite,
  enqueuePendingSyncSQLite,
  getPendingSyncQueueSQLite,
  clearPendingSyncSQLite,
  getSQLiteDiagnostics,
  openSQLiteDB,
  isSQLiteSupported,
} from './sqliteStorage';

export { getSQLiteDiagnostics, isSQLiteSupported, openSQLiteDB };

const DB_NAME = 'RubelAI_ChatDB';
const DB_VERSION = 1;
const SESSIONS_STORE = 'sessions';
const PENDING_SYNC_STORE = 'pending_sync';

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

/**
 * Initializes and returns the IndexedDB database instance.
 */
export function openChatDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Sessions store (Key: session.id, Index: updatedAt)
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        const sessionStore = db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
        sessionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        sessionStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 2. Pending sync store for offline modifications
      if (!db.objectStoreNames.contains(PENDING_SYNC_STORE)) {
        const pendingStore = db.createObjectStore(PENDING_SYNC_STORE, { keyPath: 'id' });
        pendingStore.createIndex('queuedAt', 'queuedAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      dbInstance.onversionchange = () => {
        dbInstance?.close();
        dbInstance = null;
        dbInitPromise = null;
      };
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('Failed to open IndexedDB:', (event.target as IDBOpenDBRequest).error);
      dbInitPromise = null;
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbInitPromise;
}

/**
 * Saves or updates a single chat session across both persistent SQLite and IndexedDB.
 * SQLite provides Android re-install survival, while IndexedDB provides fast in-browser caching.
 */
export async function saveSessionToIndexedDB(session: ChatSession): Promise<void> {
  // 1. Persist to SQLite (survives app re-installs and Android data clearing)
  saveSessionToSQLite(session).catch((err) => {
    console.warn('Dual-storage SQLite save notice:', err?.message || err);
  });

  // 2. Persist to IndexedDB
  try {
    const db = await openChatDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SESSIONS_STORE, 'readwrite');
      const store = tx.objectStore(SESSIONS_STORE);
      const request = store.put(session);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('saveSessionToIndexedDB error:', err);
  }
}

/**
 * Saves multiple sessions in a single readwrite transaction across both SQLite and IndexedDB.
 */
export async function saveAllSessionsToIndexedDB(sessions: ChatSession[]): Promise<void> {
  if (!Array.isArray(sessions) || sessions.length === 0) return;

  // Persist to SQLite batch
  saveAllSessionsToSQLite(sessions).catch((err) => {
    console.warn('Dual-storage SQLite batch save notice:', err?.message || err);
  });

  try {
    const db = await openChatDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SESSIONS_STORE, 'readwrite');
      const store = tx.objectStore(SESSIONS_STORE);

      for (const session of sessions) {
        store.put(session);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('saveAllSessionsToIndexedDB error:', err);
  }
}

/**
 * Retrieves all sessions sorted by newest updatedAt.
 * Reconciles sessions from both SQLite and IndexedDB to guarantee survival across
 * app re-installs, browser cache purges, and offline periods.
 */
export async function getAllSessionsFromIndexedDB(): Promise<ChatSession[]> {
  const [idbList, sqliteList] = await Promise.all([
    // Load from IndexedDB
    (async () => {
      try {
        const db = await openChatDB();
        return new Promise<ChatSession[]>((resolve, reject) => {
          const tx = db.transaction(SESSIONS_STORE, 'readonly');
          const store = tx.objectStore(SESSIONS_STORE);
          const request = store.getAll();

          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      } catch (err) {
        console.warn('IndexedDB read notice:', err);
        return [];
      }
    })(),
    // Load from persistent SQLite
    getAllSessionsFromSQLite().catch(() => []),
  ]);

  const sessionMap = new Map<string, ChatSession>();

  // Add IndexedDB records
  for (const s of idbList) {
    if (s && s.id) {
      sessionMap.set(s.id, s);
    }
  }

  // Merge SQLite records (SQLite takes precedence if newer, or restores deleted browser data)
  const missingInIdb: ChatSession[] = [];
  const missingInSQLite: ChatSession[] = [];

  for (const s of sqliteList) {
    if (!s || !s.id) continue;
    const existing = sessionMap.get(s.id);
    if (!existing) {
      sessionMap.set(s.id, s);
      missingInIdb.push(s);
    } else if ((s.updatedAt || 0) > (existing.updatedAt || 0)) {
      sessionMap.set(s.id, s);
      missingInIdb.push(s);
    }
  }

  // Cross-pollinate / backfill IndexedDB from SQLite if restored from a reinstall
  if (missingInIdb.length > 0) {
    try {
      const db = await openChatDB();
      const tx = db.transaction(SESSIONS_STORE, 'readwrite');
      const store = tx.objectStore(SESSIONS_STORE);
      for (const item of missingInIdb) {
        store.put(item);
      }
    } catch (_) {}
  }

  // Cross-pollinate SQLite from IndexedDB if not yet indexed in SQLite
  for (const s of idbList) {
    if (s && s.id && !sqliteList.some((sq) => sq.id === s.id)) {
      missingInSQLite.push(s);
    }
  }
  if (missingInSQLite.length > 0) {
    saveAllSessionsToSQLite(missingInSQLite).catch(() => {});
  }

  const combined = Array.from(sessionMap.values());
  combined.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return combined;
}

/**
 * Deletes a session from both SQLite and IndexedDB.
 */
export async function deleteSessionFromIndexedDB(sessionId: string): Promise<void> {
  // Delete from SQLite
  deleteSessionFromSQLite(sessionId).catch(() => {});

  // Delete from IndexedDB
  try {
    const db = await openChatDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([SESSIONS_STORE, PENDING_SYNC_STORE], 'readwrite');
      tx.objectStore(SESSIONS_STORE).delete(sessionId);
      tx.objectStore(PENDING_SYNC_STORE).delete(sessionId);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('deleteSessionFromIndexedDB error:', err);
  }
}

/**
 * Enqueues a session for background sync when offline in both SQLite and IndexedDB.
 */
export async function enqueuePendingSync(session: ChatSession): Promise<void> {
  // Enqueue in SQLite
  enqueuePendingSyncSQLite(session).catch(() => {});

  // Enqueue in IndexedDB
  try {
    const db = await openChatDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PENDING_SYNC_STORE, 'readwrite');
      const store = tx.objectStore(PENDING_SYNC_STORE);
      const pendingItem = {
        ...session,
        queuedAt: Date.now(),
      };
      const request = store.put(pendingItem);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('enqueuePendingSync error:', err);
  }
}

/**
 * Gets all pending offline sessions waiting to be synced to Firestore from both engines.
 */
export async function getPendingSyncQueue(): Promise<ChatSession[]> {
  const [idbQueue, sqliteQueue] = await Promise.all([
    (async () => {
      try {
        const db = await openChatDB();
        return new Promise<ChatSession[]>((resolve, reject) => {
          const tx = db.transaction(PENDING_SYNC_STORE, 'readonly');
          const store = tx.objectStore(PENDING_SYNC_STORE);
          const request = store.getAll();

          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      } catch (err) {
        console.error('getPendingSyncQueue error:', err);
        return [];
      }
    })(),
    getPendingSyncQueueSQLite().catch(() => []),
  ]);

  const map = new Map<string, ChatSession>();
  for (const s of idbQueue) {
    if (s && s.id) map.set(s.id, s);
  }
  for (const s of sqliteQueue) {
    if (s && s.id && !map.has(s.id)) map.set(s.id, s);
  }

  return Array.from(map.values());
}

/**
 * Removes a session from the pending sync queue after successful Firestore upload.
 */
export async function clearPendingSync(sessionId: string): Promise<void> {
  // Clear from SQLite
  clearPendingSyncSQLite(sessionId).catch(() => {});

  // Clear from IndexedDB
  try {
    const db = await openChatDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PENDING_SYNC_STORE, 'readwrite');
      const store = tx.objectStore(PENDING_SYNC_STORE);
      const request = store.delete(sessionId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('clearPendingSync error:', err);
  }
}

const LAST_SYNC_KEY = 'rubel_ai_last_firestore_sync';

/**
 * Gets the timestamp (ms) of the last successful Firestore sync.
 */
export function getLastFirestoreSyncTime(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(LAST_SYNC_KEY);
    return val ? parseInt(val, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Sets the timestamp (ms) of the last successful Firestore sync.
 */
export function setLastFirestoreSyncTime(timestamp: number = Date.now()): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_SYNC_KEY, String(timestamp));
  } catch (err) {
    console.warn('Failed to save last Firestore sync timestamp:', err);
  }
}

/**
 * Converts numbers to Bengali numerals (0-9 -> ০-৯).
 */
export function toBengaliNumber(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
}

/**
 * Formats a timestamp into human-readable relative Bengali text.
 * e.g., "সবেমাত্র", "৩ মিনিট আগে", "১ ঘণ্টা আগে", "২ দিন আগে"
 */
export function formatBengaliTimeAgo(timestamp: number | null): string {
  if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
    return 'এখনো ক্লাউড সিঙ্ক হয়নি';
  }

  const diffMs = Date.now() - timestamp;
  if (diffMs < 0 || diffMs < 30000) {
    return 'সবেমাত্র (কয়েক সেকেন্ড আগে)';
  }

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) {
    return `${toBengaliNumber(seconds)} সেকেন্ড আগে`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${toBengaliNumber(minutes)} মিনিট আগে`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${toBengaliNumber(hours)} ঘণ্টা আগে`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${toBengaliNumber(days)} দিন আগে`;
  }

  const date = new Date(timestamp);
  return date.toLocaleDateString('bn-BD', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Syncs all pending offline sessions to Firebase Firestore when internet is restored.
 */
export async function syncPendingToFirestore(
  userId: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ syncedCount: number; errors: any[] }> {
  if (!userId) return { syncedCount: 0, errors: [] };

  const pendingList = await getPendingSyncQueue();
  if (!pendingList.length) {
    // If nothing pending, current state is already in sync
    return { syncedCount: 0, errors: [] };
  }

  let syncedCount = 0;
  const errors: any[] = [];

  for (let i = 0; i < pendingList.length; i++) {
    const session = pendingList[i];
    try {
      await saveSessionToCloud(userId, session);
      await clearPendingSync(session.id);
      syncedCount++;
      if (onProgress) {
        onProgress(i + 1, pendingList.length);
      }
    } catch (err) {
      console.warn(`Failed to sync pending session ${session.id} to Firestore:`, err);
      errors.push(err);
    }
  }

  if (syncedCount > 0) {
    setLastFirestoreSyncTime();
  }

  return { syncedCount, errors };
}

/**
 * Returns real-time diagnostics on local database architecture (Capacitor SQLite + IndexedDB).
 */
export async function getLocalDatabaseDiagnostics(): Promise<{
  indexedDbActive: boolean;
  sqliteActive: boolean;
  isNative: boolean;
  engineDescription: string;
  sqliteSessionsCount: number;
}> {
  const sqliteDiag = await getSQLiteDiagnostics();
  const idbActive = typeof window !== 'undefined' && !!window.indexedDB;

  let desc = 'IndexedDB Browser Storage';
  if (sqliteDiag.isAvailable) {
    desc = sqliteDiag.isNative
      ? 'Capacitor SQLite (Native Persistent Auto-Backup) + IndexedDB'
      : 'Capacitor SQLite + IndexedDB Dual-Engine';
  }

  return {
    indexedDbActive: idbActive,
    sqliteActive: sqliteDiag.isAvailable,
    isNative: sqliteDiag.isNative,
    engineDescription: desc,
    sqliteSessionsCount: sqliteDiag.totalSessions,
  };
}
