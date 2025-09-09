import { openDB, DBSchema } from 'https://esm.sh/idb@8.0.0';

const DB_NAME = 'StudyJamDB';
const DB_VERSION = 1;
const STORE_NAME = 'projectFiles';

interface StudyJamDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: Blob;
  };
}

const dbPromise = openDB<StudyJamDB>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  },
});

export async function setFile(id: string, file: Blob): Promise<void> {
  const db = await dbPromise;
  await db.put(STORE_NAME, file, id);
}

export async function getFile(id: string): Promise<Blob | undefined> {
  const db = await dbPromise;
  return db.get(STORE_NAME, id);
}

export async function deleteFile(id: string): Promise<void> {
  const db = await dbPromise;
  await db.delete(STORE_NAME, id);
}

export async function clearFiles(fileIds: string[]): Promise<void> {
    const db = await dbPromise;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await Promise.all(fileIds.map(id => tx.store.delete(id)));
    await tx.done;
}
