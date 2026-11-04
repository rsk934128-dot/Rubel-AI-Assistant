import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { ChatSession } from '../types';

const DB_NAME = 'rubel_ai_chat_db';
const DB_VERSION = 1;

let sqliteConnectionInstance: SQLiteConnection | null = null;
let dbConnectionInstance: SQLiteDBConnection | null = null;
let isInitialized = false;
let initPromise: Promise<SQLiteDBConnection | null> | null = null;

/**
 * Returns the singleton SQLiteConnection instance.
 */
export function getSQLiteConnection(): SQLiteConnection {
  if (!sqliteConnectionInstance) {
    sqliteConnectionInstance = new SQLiteConnection(CapacitorSQLite);
  }
  return sqliteConnectionInstance;
}

/**
 * Checks if SQLite is available and functional in the current environment.
 */
export function isSQLiteSupported(): boolean {
  try {
    // Native Android / iOS always has full native SQLite support
    if (Capacitor.isNativePlatform()) {
      return true;
    }
    // In web browsers, Capacitor SQLite requires custom web worker / jeep-sqlite
    // We check if the plugin is defined and responsive
    return typeof window !== 'undefined' && !!CapacitorSQLite;
  } catch {
    return false;
  }
}

/**
 * Initializes the SQLite database, establishes connection, and creates required schemas.
 */
export async function openSQLiteDB(): Promise<SQLiteDBConnection | null> {
  if (dbConnectionInstance && isInitialized) {
    try {
      const openCheck = await dbConnectionInstance.isDBOpen();
      if (openCheck?.result) {
        return dbConnectionInstance;
      }
    } catch {
      // Re-initialize if connection dropped
    }
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const sqlite = getSQLiteConnection();

      // Check if connection already exists in pool
      const checkConn = await sqlite.isConnection(DB_NAME, false);
      let db: SQLiteDBConnection;

      if (checkConn?.result) {
        db = await sqlite.retrieveConnection(DB_NAME, false);
      } else {
        db = await sqlite.createConnection(
          DB_NAME,
          false,
          'no-encryption',
          DB_VERSION,
          false
        );
      }

      // Check if DB is open
      const isOpen = await db.isDBOpen();
      if (!isOpen?.result) {
        await db.open();
      }

      // Create persistent schema for chat sessions, messages, and pending sync queue
      const schemaStatements = `
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id TEXT PRIMARY KEY,
          title TEXT,
          created_at INTEGER,
          updated_at INTEGER,
          pinned INTEGER DEFAULT 0,
          assistant_mode TEXT,
          session_data TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON chat_sessions(updated_at DESC);

        CREATE TABLE IF NOT EXISTS pending_sync_queue (
          id TEXT PRIMARY KEY,
          session_id TEXT,
          queued_at INTEGER,
          session_data TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_pending_queued_at ON pending_sync_queue(queued_at ASC);

        CREATE TABLE IF NOT EXISTS app_metadata (
          meta_key TEXT PRIMARY KEY,
          meta_val TEXT
        );
      `;

      await db.execute(schemaStatements);

      dbConnectionInstance = db;
      isInitialized = true;
      console.log('✅ Capacitor SQLite: Persistent local database initialized successfully');
      return db;
    } catch (err: any) {
      console.warn('Capacitor SQLite initialization notice (will use IndexedDB fallback if unavailable):', err?.message || err);
      dbConnectionInstance = null;
      isInitialized = false;
      return null;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Saves or updates a single chat session in SQLite.
 */
export async function saveSessionToSQLite(session: ChatSession): Promise<boolean> {
  try {
    const db = await openSQLiteDB();
    if (!db) return false;

    const sessionDataJson = JSON.stringify(session);
    const sql = `
      INSERT OR REPLACE INTO chat_sessions (
        id, title, created_at, updated_at, pinned, assistant_mode, session_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?);
    `;

    const values = [
      session.id,
      session.title || 'নামহীন কথোপকথন',
      session.createdAt || Date.now(),
      session.updatedAt || Date.now(),
      session.isPinned ? 1 : 0,
      session.mode || 'general',
      sessionDataJson,
    ];

    await db.run(sql, values);
    return true;
  } catch (err) {
    console.warn('saveSessionToSQLite failed:', err);
    return false;
  }
}

/**
 * Saves multiple chat sessions in a single batch transaction.
 */
export async function saveAllSessionsToSQLite(sessions: ChatSession[]): Promise<boolean> {
  if (!Array.isArray(sessions) || sessions.length === 0) return true;

  try {
    const db = await openSQLiteDB();
    if (!db) return false;

    await db.beginTransaction();
    try {
      const sql = `
        INSERT OR REPLACE INTO chat_sessions (
          id, title, created_at, updated_at, pinned, assistant_mode, session_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?);
      `;

      for (const session of sessions) {
        const values = [
          session.id,
          session.title || 'নামহীন কথোপকথন',
          session.createdAt || Date.now(),
          session.updatedAt || Date.now(),
          session.isPinned ? 1 : 0,
          session.mode || 'general',
          JSON.stringify(session),
        ];
        await db.run(sql, values);
      }

      await db.commitTransaction();
      return true;
    } catch (txErr) {
      await db.rollbackTransaction();
      throw txErr;
    }
  } catch (err) {
    console.warn('saveAllSessionsToSQLite failed:', err);
    return false;
  }
}

/**
 * Retrieves all chat sessions from SQLite sorted by newest updatedAt.
 */
export async function getAllSessionsFromSQLite(): Promise<ChatSession[]> {
  try {
    const db = await openSQLiteDB();
    if (!db) return [];

    const queryRes = await db.query(
      'SELECT session_data FROM chat_sessions ORDER BY updated_at DESC;'
    );

    const values = queryRes?.values || [];
    const sessions: ChatSession[] = [];

    for (const row of values) {
      if (row.session_data) {
        try {
          const parsed = JSON.parse(row.session_data);
          sessions.push(parsed);
        } catch {
          // Skip corrupt rows
        }
      }
    }

    return sessions;
  } catch (err) {
    console.warn('getAllSessionsFromSQLite failed:', err);
    return [];
  }
}

/**
 * Deletes a session and its pending sync state from SQLite.
 */
export async function deleteSessionFromSQLite(sessionId: string): Promise<boolean> {
  try {
    const db = await openSQLiteDB();
    if (!db) return false;

    await db.run('DELETE FROM chat_sessions WHERE id = ?;', [sessionId]);
    await db.run('DELETE FROM pending_sync_queue WHERE session_id = ? OR id = ?;', [sessionId, sessionId]);
    return true;
  } catch (err) {
    console.warn('deleteSessionFromSQLite failed:', err);
    return false;
  }
}

/**
 * Enqueues a session in SQLite for offline synchronization.
 */
export async function enqueuePendingSyncSQLite(session: ChatSession): Promise<boolean> {
  try {
    const db = await openSQLiteDB();
    if (!db) return false;

    const sql = `
      INSERT OR REPLACE INTO pending_sync_queue (
        id, session_id, queued_at, session_data
      ) VALUES (?, ?, ?, ?);
    `;

    const values = [
      session.id,
      session.id,
      Date.now(),
      JSON.stringify(session),
    ];

    await db.run(sql, values);
    return true;
  } catch (err) {
    console.warn('enqueuePendingSyncSQLite failed:', err);
    return false;
  }
}

/**
 * Gets all pending offline sessions waiting for Firestore sync from SQLite.
 */
export async function getPendingSyncQueueSQLite(): Promise<ChatSession[]> {
  try {
    const db = await openSQLiteDB();
    if (!db) return [];

    const res = await db.query(
      'SELECT session_data FROM pending_sync_queue ORDER BY queued_at ASC;'
    );

    const values = res?.values || [];
    const pendingList: ChatSession[] = [];

    for (const row of values) {
      if (row.session_data) {
        try {
          pendingList.push(JSON.parse(row.session_data));
        } catch {
          // ignore parsing error
        }
      }
    }

    return pendingList;
  } catch (err) {
    console.warn('getPendingSyncQueueSQLite failed:', err);
    return [];
  }
}

/**
 * Removes a session from the SQLite pending sync queue after successful Firestore sync.
 */
export async function clearPendingSyncSQLite(sessionId: string): Promise<boolean> {
  try {
    const db = await openSQLiteDB();
    if (!db) return false;

    await db.run('DELETE FROM pending_sync_queue WHERE session_id = ? OR id = ?;', [sessionId, sessionId]);
    return true;
  } catch (err) {
    console.warn('clearPendingSyncSQLite failed:', err);
    return false;
  }
}

/**
 * Returns real-time diagnostics on SQLite database health, storage engine state, and counts.
 */
export async function getSQLiteDiagnostics(): Promise<{
  isAvailable: boolean;
  isNative: boolean;
  totalSessions: number;
  totalPending: number;
  dbName: string;
}> {
  const isNative = Capacitor.isNativePlatform();
  try {
    const db = await openSQLiteDB();
    if (!db) {
      return {
        isAvailable: false,
        isNative,
        totalSessions: 0,
        totalPending: 0,
        dbName: DB_NAME,
      };
    }

    const sessRes = await db.query('SELECT COUNT(*) as count FROM chat_sessions;');
    const pendRes = await db.query('SELECT COUNT(*) as count FROM pending_sync_queue;');

    const totalSessions = sessRes?.values?.[0]?.count ?? 0;
    const totalPending = pendRes?.values?.[0]?.count ?? 0;

    return {
      isAvailable: true,
      isNative,
      totalSessions,
      totalPending,
      dbName: DB_NAME,
    };
  } catch {
    return {
      isAvailable: false,
      isNative,
      totalSessions: 0,
      totalPending: 0,
      dbName: DB_NAME,
    };
  }
}
