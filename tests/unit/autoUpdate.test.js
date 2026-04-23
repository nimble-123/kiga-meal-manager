import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoUpdate } from '../../src/hooks/useAutoUpdate';

describe('useAutoUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with idle status', () => {
    const { result } = renderHook(() => useAutoUpdate());
    expect(result.current.status).toBe('idle');
    expect(result.current.updateInfo).toBe(null);
    expect(result.current.progress).toBe(0);
    expect(result.current.error).toBe(null);
    expect(result.current.dismissed).toBe(false);
  });

  it('detects Electron environment', () => {
    const { result } = renderHook(() => useAutoUpdate());
    expect(result.current.isElectron).toBe(true);
  });

  it('subscribes to all updater events on mount', () => {
    renderHook(() => useAutoUpdate());
    expect(window.api.updater.onAvailable).toHaveBeenCalledOnce();
    expect(window.api.updater.onNotAvailable).toHaveBeenCalledOnce();
    expect(window.api.updater.onProgress).toHaveBeenCalledOnce();
    expect(window.api.updater.onDownloaded).toHaveBeenCalledOnce();
    expect(window.api.updater.onError).toHaveBeenCalledOnce();
  });

  it('unsubscribes from events on unmount', () => {
    const unsubAvailable = vi.fn();
    const unsubNotAvailable = vi.fn();
    const unsubProgress = vi.fn();
    const unsubDownloaded = vi.fn();
    const unsubError = vi.fn();
    window.api.updater.onAvailable.mockReturnValue(unsubAvailable);
    window.api.updater.onNotAvailable.mockReturnValue(unsubNotAvailable);
    window.api.updater.onProgress.mockReturnValue(unsubProgress);
    window.api.updater.onDownloaded.mockReturnValue(unsubDownloaded);
    window.api.updater.onError.mockReturnValue(unsubError);

    const { unmount } = renderHook(() => useAutoUpdate());
    unmount();

    expect(unsubAvailable).toHaveBeenCalledOnce();
    expect(unsubNotAvailable).toHaveBeenCalledOnce();
    expect(unsubProgress).toHaveBeenCalledOnce();
    expect(unsubDownloaded).toHaveBeenCalledOnce();
    expect(unsubError).toHaveBeenCalledOnce();
  });

  it('checkForUpdate calls updater.check', async () => {
    const { result } = renderHook(() => useAutoUpdate());
    await act(async () => {
      await result.current.checkForUpdate();
    });
    expect(window.api.updater.check).toHaveBeenCalledOnce();
  });

  it('checkForUpdate sets error status on failure', async () => {
    window.api.updater.check.mockResolvedValueOnce({ success: false, error: 'Updater nicht verfügbar' });
    const { result } = renderHook(() => useAutoUpdate());
    await act(async () => {
      await result.current.checkForUpdate();
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Updater nicht verfügbar');
  });

  it('downloadUpdate calls updater.download and resets progress', async () => {
    const { result } = renderHook(() => useAutoUpdate());
    await act(async () => {
      await result.current.downloadUpdate();
    });
    expect(window.api.updater.download).toHaveBeenCalledOnce();
    expect(result.current.progress).toBe(0);
  });

  it('installUpdate calls updater.install', () => {
    const { result } = renderHook(() => useAutoUpdate());
    act(() => {
      result.current.installUpdate();
    });
    expect(window.api.updater.install).toHaveBeenCalledOnce();
  });

  it('dismiss sets dismissed flag', () => {
    const { result } = renderHook(() => useAutoUpdate());
    act(() => {
      result.current.dismiss();
    });
    expect(result.current.dismissed).toBe(true);
  });

  it('handles update-available event', () => {
    let availableCb;
    window.api.updater.onAvailable.mockImplementation((cb) => { availableCb = cb; return () => {}; });

    const { result } = renderHook(() => useAutoUpdate());

    act(() => {
      availableCb({ version: '2.0.0', releaseDate: '2026-05-01' });
    });

    expect(result.current.status).toBe('available');
    expect(result.current.updateInfo).toEqual({ version: '2.0.0', releaseDate: '2026-05-01' });
    expect(result.current.dismissed).toBe(false);
  });

  it('handles update-not-available event', () => {
    let notAvailableCb;
    window.api.updater.onNotAvailable.mockImplementation((cb) => { notAvailableCb = cb; return () => {}; });

    const { result } = renderHook(() => useAutoUpdate());

    act(() => {
      notAvailableCb();
    });

    expect(result.current.status).toBe('up-to-date');
  });

  it('handles download-progress event', () => {
    let progressCb;
    window.api.updater.onProgress.mockImplementation((cb) => { progressCb = cb; return () => {}; });

    const { result } = renderHook(() => useAutoUpdate());

    act(() => {
      progressCb({ percent: 45.7, transferred: 5000, total: 10000 });
    });

    expect(result.current.status).toBe('downloading');
    expect(result.current.progress).toBe(46);
  });

  it('handles update-downloaded event', () => {
    let downloadedCb;
    window.api.updater.onDownloaded.mockImplementation((cb) => { downloadedCb = cb; return () => {}; });

    const { result } = renderHook(() => useAutoUpdate());

    act(() => {
      downloadedCb({ version: '2.0.0' });
    });

    expect(result.current.status).toBe('downloaded');
    expect(result.current.updateInfo).toEqual({ version: '2.0.0' });
  });

  it('handles error event', () => {
    let errorCb;
    window.api.updater.onError.mockImplementation((cb) => { errorCb = cb; return () => {}; });

    const { result } = renderHook(() => useAutoUpdate());

    act(() => {
      errorCb('Network error');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Network error');
  });

  it('is graceful when updater API is not available', () => {
    const savedUpdater = window.api.updater;
    delete window.api.updater;

    const { result } = renderHook(() => useAutoUpdate());
    expect(result.current.isElectron).toBe(false);
    expect(result.current.status).toBe('idle');

    // Actions should not throw
    act(() => {
      result.current.checkForUpdate();
      result.current.downloadUpdate();
      result.current.installUpdate();
    });

    window.api.updater = savedUpdater;
  });
});
