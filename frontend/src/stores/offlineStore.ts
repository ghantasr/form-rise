import { openDB } from 'idb';
import type { SubmitAnswerDto } from '../api/responses';

const DB_NAME = 'formflow';
const STORE = 'offline_queue';

interface QueuedSubmission {
  id: string;
  slug: string;
  respondentEmail?: string;
  qrToken?: string;
  answers: SubmitAnswerDto[];
  queuedAt: string;
  attempts: number;
}

function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    },
  });
}

export const offlineQueue = {
  async enqueue(item: Omit<QueuedSubmission, 'id' | 'queuedAt' | 'attempts'>): Promise<string> {
    const db = await getDb();
    const entry: QueuedSubmission = {
      ...item,
      id: crypto.randomUUID(),
      queuedAt: new Date().toISOString(),
      attempts: 0,
    };
    await db.put(STORE, entry);
    return entry.id;
  },

  async getAll(): Promise<QueuedSubmission[]> {
    const db = await getDb();
    return db.getAll(STORE);
  },

  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(STORE, id);
  },

  async incrementAttempts(id: string): Promise<void> {
    const db = await getDb();
    const item = await db.get(STORE, id);
    if (item) await db.put(STORE, { ...item, attempts: item.attempts + 1 });
  },

  async count(): Promise<number> {
    const db = await getDb();
    return db.count(STORE);
  },
};
