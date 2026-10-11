import { useState, useEffect, useCallback } from 'react';
import { storageGet, storageSet } from '../utils/storage';

// Einwilligung in anonyme Nutzungsstatistiken. Persistiert `telemetryConsent`,
// standardmäßig AUS (opt-in). Muster wie useWeekView.
export function useTelemetryConsent() {
  const [consent, setConsentState] = useState(false);

  useEffect(() => {
    (async () => {
      const v = await storageGet('telemetryConsent');
      if (v) setConsentState(true);
    })();
  }, []);

  const setConsent = useCallback(async (next) => {
    setConsentState(next);
    await storageSet('telemetryConsent', next);
  }, []);

  return { consent, setConsent };
}
