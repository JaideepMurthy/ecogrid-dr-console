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
  
// Audit trail and compliance functions
export function createAuditLog(eventId, operatorName, action) {
  const timestamp = new Date().toISOString();
  const hash = generateHash(`${eventId}-${operatorName}-${action}-${timestamp}`);
  return {
    eventId,
    operatorName,
    action,
    timestamp,
    hash,
    verified: true
  };
}

// Simple hash function for tamper detection (client-side)
function generateHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// Save audit log to IndexedDB
export function saveAuditLog(auditLog) {
  return new Promise((resolve, reject) => {
    const store = getStore('auditLogs', 'readwrite');
    const req = store.add(auditLog);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Retrieve audit trail for specific event
export function getAuditTrail(eventId) {
  return new Promise((resolve, reject) => {
    const store = getStore('auditLogs', 'readonly');
    const req = store.getAll();
    req.onsuccess = () => {
      const logs = (req.result || []).filter(log => log.eventId === eventId);
      resolve(logs);
    };
    req.onerror = () => reject(req.error);
  });
// Export events with audit trail for compliance
export async function exportEventsWithAuditTrail() {
 const events = await listDrEvents();
 const auditLogs = await new Promise((resolve, reject) => {
 const store = getStore('auditLogs', 'readonly');
 const req = store.getAll();
 req.onsuccess = () => resolve(req.result || []);
 req.onerror = () => reject(req.error);
 });

 let csv = 'Event ID,Created At,Operator Name,Target MW,Achieved MW,Duration Hours,Cost Saved EUR,CO2 Avoided Tons,Audit Log\n';
 
 events.forEach(event => {
 const eventAuditLogs = auditLogs.filter(log => log.eventId === event.id);
 const auditSummary = eventAuditLogs.map(log => `${log.action}:${log.operatorName}@${log.timestamp}[${log.hash}]`).join(';');
 csv += `${event.id},"${event.createdAt}","${event.operatorName || 'Unknown'}",${event.targetMw},${event.achievedMw},${event.durationH},${event.costSavedEur.toFixed(2)},${event.co2AvoidedTons.toFixed(2)},"${auditSummary}"\n`;
 });
 
 return csv;
}
}
}
