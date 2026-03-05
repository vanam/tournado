const DB_NAME = 'tournado';
const DB_VERSION = 5;

export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: IDBVersionChangeEvent): void => {
      const db = request.result;
      if (!db.objectStoreNames.contains('tournaments')) {
        db.createObjectStore('tournaments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('players')) {
        db.createObjectStore('players', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('groups')) {
        db.createObjectStore('groups', { keyPath: 'id' });
      }
      const tx = request.transaction;
      if (db.objectStoreNames.contains('playerLibrary') && tx !== null) {
        migratePlayerLibrary(db, tx, event.oldVersion);
      }
      if (event.oldVersion < 5 && tx !== null) {
        migrateVersionStamps(tx);
      }
    };
    request.onsuccess = (): void => { resolve(request.result); };
    request.addEventListener('error', () => { reject(new Error('Failed to open IndexedDB')); });
  });
}

function migratePlayerLibrary(db: IDBDatabase, tx: IDBTransaction, oldVersion: number): void {
  const oldStore = tx.objectStore('playerLibrary');
  const playersStore = tx.objectStore('players');
  const groupsStore = tx.objectStore('groups');

  if (oldVersion <= 2) {
    // v2: single 'main' record with { groups: [], players: [] }
    const getReq = oldStore.get('main');
    getReq.onsuccess = (): void => {
      const raw: unknown = getReq.result;
      if (typeof raw === 'object' && raw !== null) {
        const obj = raw as Record<string, unknown>;
        const groups = Array.isArray(obj['groups']) ? (obj['groups'] as Record<string, unknown>[]) : [];
        const players = Array.isArray(obj['players']) ? (obj['players'] as Record<string, unknown>[]) : [];
        for (const g of groups) groupsStore.add(g);
        for (const p of players) playersStore.add(p);
      }
      db.deleteObjectStore('playerLibrary');
    };
  } else {
    // v3: separate 'groups' and 'players' keys in playerLibrary store
    const getGroups = oldStore.get('groups');
    getGroups.onsuccess = (): void => {
      const rawGroups: unknown = getGroups.result;
      const groups = Array.isArray(rawGroups) ? (rawGroups as Record<string, unknown>[]) : [];
      for (const g of groups) groupsStore.add(g);
    };
    const getPlayers = oldStore.get('players');
    getPlayers.onsuccess = (): void => {
      const rawPlayers: unknown = getPlayers.result;
      const players = Array.isArray(rawPlayers) ? (rawPlayers as Record<string, unknown>[]) : [];
      for (const p of players) playersStore.add(p);
      db.deleteObjectStore('playerLibrary');
    };
  }
}

function migrateVersionStamps(tx: IDBTransaction): void {
  const storeVersions: Array<[string, number]> = [
    ['tournaments', 1],
    ['players', 1],
    ['groups', 1],
  ];
  for (const [storeName, version] of storeVersions) {
    const store = tx.objectStore(storeName);
    const getAllReq = store.getAll();
    getAllReq.onsuccess = (): void => {
      for (const item of getAllReq.result as Array<Record<string, unknown>>) {
        if (item['version'] === undefined) {
          item['version'] = version;
          store.put(item);
        }
      }
    };
  }
}

export function txPromise<T>(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = fn(store);
    request.onsuccess = (): void => { resolve(request.result); };
    request.addEventListener('error', () => { reject(new Error('IndexedDB transaction failed')); });
  });
}

export function clearAndPutAll(db: IDBDatabase, storeName: string, items: unknown[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const clearReq = store.clear();
    clearReq.onsuccess = (): void => {
      for (const item of items) {
        store.put(item);
      }
    };
    tx.oncomplete = (): void => { resolve(); };
    tx.addEventListener('error', () => { reject(new Error('IndexedDB transaction failed')); });
  });
}
