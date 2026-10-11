import { useState, useEffect, useCallback } from 'react';
import { storageGet, storageSet } from '../utils/storage';

// Schaltet die Wochenerfassung ein/aus (Tab + Keyboard-Shortcut + Tour-Schritt).
// Persistiert unter `weekViewEnabled`, standardmäßig deaktiviert.
export function useWeekView() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const v = await storageGet('weekViewEnabled');
      if (v) setEnabled(true);
    })();
  }, []);

  const setWeekView = useCallback(async (next) => {
    setEnabled(next);
    await storageSet('weekViewEnabled', next);
  }, []);

  return { enabled, setWeekView };
}
