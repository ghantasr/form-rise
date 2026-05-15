import { useEffect, useRef } from 'react';
import { offlineQueue } from '../stores/offlineStore';
import { responsesApi } from '../api/responses';

const MAX_ATTEMPTS = 5;

async function processQueue(onSynced?: (count: number) => void) {
  const items = await offlineQueue.getAll();
  if (items.length === 0) return;

  let synced = 0;
  for (const item of items) {
    if (item.attempts >= MAX_ATTEMPTS) {
      await offlineQueue.remove(item.id);
      continue;
    }
    try {
      await responsesApi.submit(item.slug, item.respondentEmail, item.qrToken, item.answers);
      await offlineQueue.remove(item.id);
      synced++;
    } catch {
      await offlineQueue.incrementAttempts(item.id);
    }
  }

  if (synced > 0) onSynced?.(synced);
}

export function useOfflineSync(onSynced?: (count: number) => void) {
  const callbackRef = useRef(onSynced);
  callbackRef.current = onSynced;

  useEffect(() => {
    const handle = () => processQueue(callbackRef.current);

    // Try to sync any queued items when the hook mounts (in case we reconnected)
    if (navigator.onLine) handle();

    window.addEventListener('online', handle);
    return () => window.removeEventListener('online', handle);
  }, []);
}
