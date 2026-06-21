/**
 * IndexedDB persistence for editor drafts using the `idb` library.
 *
 * Schema:
 *   DB name:  bana-editor
 *   Version:  1
 *   Store:    drafts
 *     key:    string (document id)
 *     value:  DraftRecord
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

const DB_NAME = 'bana-editor'
const DB_VERSION = 1
const STORE_NAME = 'drafts'
const DEFAULT_DRAFT_ID = 'default'

export interface DraftRecord {
  id: string
  /** Tiptap JSON document serialised as a plain object */
  content: unknown
  updatedAt: number
}

interface BanaEditorDB extends DBSchema {
  drafts: {
    key: string
    value: DraftRecord
  }
}

let dbPromise: Promise<IDBPDatabase<BanaEditorDB>> | null = null

function getDb(): Promise<IDBPDatabase<BanaEditorDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BanaEditorDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

/** Persist editor content for the given document id. */
export async function saveDraft(content: unknown, id = DEFAULT_DRAFT_ID): Promise<void> {
  const db = await getDb()
  const record: DraftRecord = { id, content, updatedAt: Date.now() }
  await db.put(STORE_NAME, record)
}

/** Load previously persisted editor content. Returns null when nothing exists. */
export async function loadDraft(id = DEFAULT_DRAFT_ID): Promise<unknown | null> {
  const db = await getDb()
  const record = await db.get(STORE_NAME, id)
  return record?.content ?? null
}

/** Delete a draft (e.g. when starting fresh). */
export async function deleteDraft(id = DEFAULT_DRAFT_ID): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_NAME, id)
}

/** List all saved draft records (for future multi-document support). */
export async function listDrafts(): Promise<DraftRecord[]> {
  const db = await getDb()
  return db.getAll(STORE_NAME)
}
