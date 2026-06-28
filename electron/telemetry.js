// Anonyme, opt-in Nutzungsstatistiken (Aptabase) — ausschließlich im Main-Prozess.
// Der Renderer kennt Aptabase nicht; er ruft nur window.api.telemetry.track(...),
// das hier landet und gegen die Einwilligung geprüft wird.
//
// Garantien:
//  - Kein App-Key  -> komplett deaktiviert (no-op).
//  - Keine Einwilligung (`telemetryConsent` im Store) -> nichts wird gesendet.
//  - Fehler werden geschluckt (Telemetrie darf die App niemals stören).
//  - Es werden NUR anonyme Ereignisse gesendet (App-Version, OS via SDK, Feature-Namen),
//    NIEMALS Kinderdaten, Namen, Gruppen, Beträge oder Freitext.
const { initialize, trackEvent } = require('@aptabase/electron/main');
const { APTABASE_APP_KEY, APTABASE_HOST } = require('./telemetryConfig');
const { initStore } = require('./store');

let initialized = false;

function ensureInitialized() {
  if (initialized) return true;
  if (!APTABASE_APP_KEY) return false;
  initialize(APTABASE_APP_KEY, APTABASE_HOST ? { host: APTABASE_HOST } : undefined);
  initialized = true;
  return true;
}

async function hasConsent() {
  try {
    const store = await initStore();
    return store.get('telemetryConsent') === true;
  } catch {
    return false;
  }
}

async function track(name, props) {
  try {
    if (!APTABASE_APP_KEY) return;
    if (!(await hasConsent())) return;
    if (!ensureInitialized()) return;
    await trackEvent(name, props || {});
  } catch {
    /* niemals werfen */
  }
}

module.exports = { track };
