const DB_NAME = 'ecogrid-dr-console';
const DB_VERSION = 1;
let dbInstance = null;

export function initDb() {
  return new Promise((resolve, reject) => {
    const openReq = indexedDB.open(DB_NAME, DB_VERSION);
    openReq.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('gridCache')) db.createObjectStore('gridCache', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('drEvents')) db.createObjectStore('drEvents', { keyPath: 'id', autoIncrement: true });
    };
    openReq.onsuccess = () => { dbInstance = openReq.result; resolve(); };
    openReq.onerror = () => reject(openReq.error);
  });
}

function getStore(storeName, mode = 'readonly') {
  if (!dbInstance) throw new Error('DB not initialised');
  const tx = dbInstance.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

export function saveGridResponse(key, data) {
  const store = getStore('gridCache', 'readwrite');
  const entry = { key, data, timestamp: Date.now() };
  store.put(entry);
}

export function loadGridResponse(key) {
  return new Promise((resolve, reject) => {
    const store = getStore('gridCache', 'readonly');
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export function createDrEvent(eventObj) {
  return new Promise((resolve, reject) => {
    const store = getStore('drEvents', 'readwrite');
    const req = store.add(eventObj);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function listDrEvents() {
  return new Promise((resolve, reject) => {
    const store = getStore('drEvents', 'readonly');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export function getDrEventById(id) {
  return new Promise((resolve, reject) => {
    const store = getStore('drEvents', 'readonly');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
