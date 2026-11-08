import { useState, useEffect, useCallback } from 'react';
import { storageGet, storageSet } from '../utils/storage';

// Schaltet die kaufmännische Rundung der Monatssumme pro Kind auf volle Euro ein/aus.
// Persistiert unter `monthRounding`, standardmäßig aktiviert (fehlender Key = an).
export function useRounding() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      const v = await storageGet('monthRounding');
      if (v === false) setEnabled(false);
    })();
  }, []);

  const setRounding = useCallback(async (next) => {
    setEnabled(next);
    await storageSet('monthRounding', next);
  }, []);

  return { enabled, setRounding };
}
