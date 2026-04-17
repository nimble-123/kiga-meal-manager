import { useState, useEffect, useCallback } from 'react';
import { storageGet, storageSet, storageKeys, saveFileToPath, listFiles, deleteFile, selectDirectory } from '../utils/storage';

const DEFAULT_SETTINGS = {
  enabled: false,
  interval: 'daily',
  folderPath: '',
  maxBackups: 10,
  lastBackupDate: null,
};

const INTERVAL_MS = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

export function useAutoBackup() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const isElectron = !!window.api?.selectDirectory;

  useEffect(() => {
    (async () => {
      const saved = await storageGet('autoBackup');
      if (saved) setSettings({ ...DEFAULT_SETTINGS, ...saved });
      setLoading(false);
    })();
  }, []);

  const updateSettings = useCallback(async (patch) => {
    setSettings((prev) => {
      const updated = { ...prev, ...patch };
      storageSet('autoBackup', updated);
      return updated;
    });
  }, []);

  const pickFolder = useCallback(async () => {
    const result = await selectDirectory();
    if (result.success) {
      await updateSettings({ folderPath: result.path });
    }
    return result;
  }, [updateSettings]);

  const cleanupOldBackups = useCallback(async (folderPath, maxBackups) => {
    if (!folderPath || !maxBackups) return;
    const result = await listFiles(folderPath);
    if (!result.success) return;
    const backupFiles = result.files
      .filter((f) => f.name.startsWith('KiGa_AutoBackup_') && f.name.endsWith('.json'))
      .sort((a, b) => b.mtime.localeCompare(a.mtime));
    const toDelete = backupFiles.slice(maxBackups);
    for (const f of toDelete) {
      await deleteFile(f.path);
    }
  }, []);

  const createBackup = useCallback(async () => {
    if (!settings.folderPath) return { success: false, error: 'Kein Ordner ausgewählt' };
    const keys = await storageKeys();
    const data = {};
    for (const k of keys) { data[k] = await storageGet(k); }
    const content = JSON.stringify(data, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `KiGa_AutoBackup_${timestamp}.json`;
    const filePath = `${settings.folderPath}/${filename}`;
    const result = await saveFileToPath(filePath, content);
    if (result.success) {
      const now = new Date().toISOString();
      await updateSettings({ lastBackupDate: now });
      await cleanupOldBackups(settings.folderPath, settings.maxBackups);
    }
    return result;
  }, [settings.folderPath, settings.maxBackups, updateSettings, cleanupOldBackups]);

  // Check on mount whether a backup is due
  useEffect(() => {
    if (loading || !isElectron || !settings.enabled || !settings.folderPath) return;
    const intervalMs = INTERVAL_MS[settings.interval] || INTERVAL_MS.daily;
    const lastDate = settings.lastBackupDate ? new Date(settings.lastBackupDate).getTime() : 0;
    const now = Date.now();
    if (now - lastDate >= intervalMs) {
      createBackup();
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps -- intentionally run once after load

  return { settings, updateSettings, pickFolder, createBackup, isElectron, loading };
}
