import { useState, useEffect, useCallback } from 'react';

const STATUS = {
  IDLE: 'idle',
  CHECKING: 'checking',
  AVAILABLE: 'available',
  DOWNLOADING: 'downloading',
  DOWNLOADED: 'downloaded',
  UP_TO_DATE: 'up-to-date',
  ERROR: 'error',
};

export function useAutoUpdate() {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const isElectron = !!window.api?.updater;

  useEffect(() => {
    if (!isElectron) return;

    const unsubs = [
      window.api.updater.onAvailable((info) => {
        setUpdateInfo(info);
        setStatus(STATUS.AVAILABLE);
        setDismissed(false);
      }),
      window.api.updater.onNotAvailable(() => {
        setStatus(STATUS.UP_TO_DATE);
      }),
      window.api.updater.onProgress((p) => {
        setProgress(Math.round(p.percent));
        setStatus(STATUS.DOWNLOADING);
      }),
      window.api.updater.onDownloaded((info) => {
        setUpdateInfo(info);
        setStatus(STATUS.DOWNLOADED);
      }),
      window.api.updater.onError((msg) => {
        setError(msg);
        setStatus(STATUS.ERROR);
      }),
    ];

    return () => unsubs.forEach((unsub) => unsub());
  }, [isElectron]);

  const checkForUpdate = useCallback(async () => {
    if (!isElectron) return;
    setError(null);
    setStatus(STATUS.CHECKING);
    const result = await window.api.updater.check();
    if (!result.success) {
      setError(result.error);
      setStatus(STATUS.ERROR);
    }
  }, [isElectron]);

  const downloadUpdate = useCallback(async () => {
    if (!isElectron) return;
    setProgress(0);
    return window.api.updater.download();
  }, [isElectron]);

  const installUpdate = useCallback(() => {
    if (!isElectron) return;
    window.api.updater.install();
  }, [isElectron]);

  const dismiss = useCallback(() => setDismissed(true), []);

  return {
    status,
    updateInfo,
    progress,
    error,
    dismissed,
    isElectron,
    checkForUpdate,
    downloadUpdate,
    installUpdate,
    dismiss,
  };
}
