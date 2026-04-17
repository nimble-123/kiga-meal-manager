import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAutoBackup } from '../../src/hooks/useAutoBackup';
import { resetStore, seedStore } from '../setup';

describe('useAutoBackup', () => {
  beforeEach(() => {
    resetStore();
    vi.restoreAllMocks();
  });

  it('loads default settings when none saved', async () => {
    const { result } = renderHook(() => useAutoBackup());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.settings.enabled).toBe(false);
    expect(result.current.settings.interval).toBe('daily');
    expect(result.current.settings.maxBackups).toBe(10);
    expect(result.current.settings.folderPath).toBe('');
  });

  it('loads saved settings from store', async () => {
    seedStore({
      autoBackup: { enabled: true, interval: 'weekly', folderPath: '/backups', maxBackups: 5, lastBackupDate: '2026-01-01T00:00:00.000Z' },
    });
    const { result } = renderHook(() => useAutoBackup());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.settings.enabled).toBe(true);
    expect(result.current.settings.interval).toBe('weekly');
    expect(result.current.settings.folderPath).toBe('/backups');
    expect(result.current.settings.maxBackups).toBe(5);
  });

  it('updates settings and persists to store', async () => {
    const { result } = renderHook(() => useAutoBackup());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateSettings({ enabled: true, interval: 'monthly' });
    });

    expect(result.current.settings.enabled).toBe(true);
    expect(result.current.settings.interval).toBe('monthly');
    // Verify persistence
    expect(window.api.store.set).toHaveBeenCalledWith('autoBackup', expect.objectContaining({ enabled: true, interval: 'monthly' }));
  });

  it('creates backup with correct filename pattern', async () => {
    seedStore({
      autoBackup: { enabled: false, interval: 'daily', folderPath: '/backups', maxBackups: 10, lastBackupDate: null },
      children: [{ id: 'c1', name: 'Test' }],
    });
    const { result } = renderHook(() => useAutoBackup());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let backupResult;
    await act(async () => {
      backupResult = await result.current.createBackup();
    });

    expect(backupResult.success).toBe(true);
    expect(window.api.saveFileToPath).toHaveBeenCalledWith(
      expect.objectContaining({
        filePath: expect.stringMatching(/^\/backups\/KiGa_AutoBackup_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/),
        content: expect.stringContaining('"children"'),
      })
    );
  });

  it('returns error when no folder selected', async () => {
    const { result } = renderHook(() => useAutoBackup());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let backupResult;
    await act(async () => {
      backupResult = await result.current.createBackup();
    });

    expect(backupResult.success).toBe(false);
    expect(backupResult.error).toContain('Kein Ordner');
  });

  it('cleans up old backups beyond maxBackups', async () => {
    const oldFiles = [
      { name: 'KiGa_AutoBackup_2026-01-01T10-00-00.json', path: '/backups/KiGa_AutoBackup_2026-01-01T10-00-00.json', mtime: '2026-01-01T10:00:00.000Z', size: 100 },
      { name: 'KiGa_AutoBackup_2026-01-02T10-00-00.json', path: '/backups/KiGa_AutoBackup_2026-01-02T10-00-00.json', mtime: '2026-01-02T10:00:00.000Z', size: 100 },
      { name: 'KiGa_AutoBackup_2026-01-03T10-00-00.json', path: '/backups/KiGa_AutoBackup_2026-01-03T10-00-00.json', mtime: '2026-01-03T10:00:00.000Z', size: 100 },
    ];
    window.api.listFiles.mockResolvedValue({ success: true, files: oldFiles });

    seedStore({
      autoBackup: { enabled: false, interval: 'daily', folderPath: '/backups', maxBackups: 2, lastBackupDate: null },
    });
    const { result } = renderHook(() => useAutoBackup());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.createBackup();
    });

    // Should delete the oldest file (only 1 over the max of 2, since 3 existing + listFiles returns the 3)
    expect(window.api.deleteFile).toHaveBeenCalledWith({
      filePath: '/backups/KiGa_AutoBackup_2026-01-01T10-00-00.json',
    });
  });

  it('detects electron environment', async () => {
    const { result } = renderHook(() => useAutoBackup());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.isElectron).toBe(true);
  });
});
