// Verschlüsselter Daten-Store. Wird erst geöffnet, nachdem eine gültige Lizenz
// vorliegt (encryptionKey wird aus dem Lizenzschlüssel abgeleitet, siehe license.js).
let store = null;

const STORE_NAME = 'kiga-essenverwaltung-data';

// Öffnet (lazy) den verschlüsselten Daten-Store als Singleton.
async function openDataStore(encryptionKey) {
  if (store) return store;
  const { default: Store } = await import('electron-store');
  store = new Store({ name: STORE_NAME, encryptionKey, defaults: { children: [] } });
  return store;
}

// Liefert den geöffneten Store oder null (wenn noch nicht entsperrt).
function getDataStore() {
  return store;
}

// Migriert eine bestehende KLARTEXT-Datendatei einmalig in den verschlüsselten Store.
// Sicher gegen Datenverlust: Ist die Datei bereits verschlüsselt/korrupt, wirft der
// Klartext-Read (kein clearInvalidConfig) -> wir fassen die Datei NICHT an.
async function migrateToEncrypted(encryptionKey) {
  const { default: Store } = await import('electron-store');
  let plaintext;
  try {
    // Wirft bei bereits verschlüsselter/korrupter Datei (statt still zurückzusetzen).
    plaintext = new Store({ name: STORE_NAME }).store;
  } catch {
    return false; // Nicht im Klartext -> niemals überschreiben.
  }
  const enc = new Store({ name: STORE_NAME, encryptionKey, defaults: { children: [] } });
  enc.store = plaintext; // schreibt die Datei verschlüsselt zurück
  store = enc; // als Singleton übernehmen
  return true;
}

module.exports = { openDataStore, getDataStore, migrateToEncrypted };
