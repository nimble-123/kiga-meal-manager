import { useState, useEffect, useCallback } from 'react';

// Lizenzstatus für den Renderer. Fehlt window.api.license (Browser/Dev/Tests),
// wird der Gate übersprungen (Entwicklermodus -> sofort licensed).
export function useLicense() {
  const hasApi = !!window.api?.license;
  const [status, setStatus] = useState(
    hasApi
      ? { loading: true, licensed: false }
      : { loading: false, licensed: true, bypass: true }
  );

  const refresh = useCallback(async () => {
    if (!hasApi) return;
    const s = await window.api.license.status();
    setStatus({ loading: false, ...s });
  }, [hasApi]);

  useEffect(() => {
    if (hasApi) refresh();
  }, [hasApi, refresh]);

  const activate = useCallback(async (key) => {
    if (!hasApi) return { success: true };
    return window.api.license.activate(key);
  }, [hasApi]);

  return { ...status, activate, refresh };
}
