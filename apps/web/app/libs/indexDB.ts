import { openDB } from 'idb';

export async function initDB() {
  return await openDB('my-recording-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('chunks')) {
        db.createObjectStore('chunks', { keyPath: 'index' });
      }
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'index' });
      }
    },
  });
}
