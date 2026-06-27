// Lizenz-Logik im Main-Prozess: Bootstrapping, Aktivierung und Meta-Store.
// Die Krypto-Verifikation liegt in ./licenseCrypto (isoliert testbar).
const { verifyToken, deriveKey } = require('./licenseCrypto');
const dataStore = require('./store');

// Unverschlüsselter Meta-Store: hält nur den signierten (nicht geheimen) Token,
// Lizenznehmer, Ausstelldatum und das Migrations-Flag.
let metaStore = null;
async function initMetaStore() {
  if (metaStore) return metaStore;
  const { default: Store } = await import('electron-store');
  metaStore = new Store({
    name: 'kiga-license',
    defaults: { token: null, licensee: null, issuedAt: null, migrated: false },
  });
  return metaStore;
}

// Reine Entscheidungslogik (isoliert testbar) —

// Status-Objekt aus verifiziertem Payload. Gibt den Token NIE heraus.
function statusFromPayload(payload) {
  if (!payload) return { licensed: false };
  return { licensed: true, licensee: payload.name, issuedAt: payload.iat };
}

// Re-Key-Schutz: ein Wechsel auf einen anderen Token nach erfolgter Migration würde
// (anderer abgeleiteter Key) die verschlüsselten Daten unlesbar machen -> blockieren.
function rekeyBlocked(existingToken, nextToken, migrated) {
  return Boolean(existingToken && existingToken !== nextToken && migrated);
}

// Öffnet den verschlüsselten Daten-Store (mit einmaliger Klartext-Migration).
async function openLicensed(token) {
  const key = deriveKey(token);
  const meta = await initMetaStore();
  if (!meta.get('migrated')) {
    await dataStore.migrateToEncrypted(key);
    meta.set('migrated', true);
  }
  await dataStore.openDataStore(key);
}

// Status für den Renderer — gibt den Token NIE heraus.
async function getStatus() {
  const meta = await initMetaStore();
  const token = meta.get('token');
  return statusFromPayload(token ? verifyToken(token) : null);
}

// Aktivierung: prüft den Schlüssel, entsperrt die Daten und persistiert die Lizenz.
async function activate(rawKey) {
  const payload = verifyToken(rawKey);
  if (!payload) {
    return { success: false, error: 'Ungültiger oder beschädigter Lizenzschlüssel.' };
  }
  const token = String(rawKey).trim();
  const meta = await initMetaStore();
  if (rekeyBlocked(meta.get('token'), token, meta.get('migrated'))) {
    return {
      success: false,
      error: 'Es ist bereits eine andere Lizenz aktiv. Bitte zuerst ein Vollbackup exportieren, '
        + 'dann die App-Daten zurücksetzen und die Daten nach der Aktivierung neu importieren.',
    };
  }
  await openLicensed(token);
  meta.set('token', token);
  meta.set('licensee', payload.name);
  meta.set('issuedAt', payload.iat);
  return { success: true, licensee: payload.name };
}

// Startup: bei gültiger gespeicherter Lizenz den Daten-Store öffnen.
async function bootstrap() {
  const meta = await initMetaStore();
  const token = meta.get('token');
  if (token && verifyToken(token)) {
    await openLicensed(token);
    return true;
  }
  return false;
}

module.exports = { getStatus, activate, bootstrap, statusFromPayload, rekeyBlocked };
