import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageGet, storageSet, storageDelete, subscribeStorage } from '../../src/utils/storage';
import { resetStore } from '../setup';

describe('storage Pub/Sub', () => {
  beforeEach(() => {
    resetStore();
  });

  it('benachrichtigt Subscriber bei storageSet', async () => {
    const fn = vi.fn();
    const unsub = subscribeStorage(fn);
    await storageSet('foo', { v: 1 });
    expect(fn).toHaveBeenCalledWith('foo');
    unsub();
  });

  it('benachrichtigt Subscriber bei storageDelete', async () => {
    const fn = vi.fn();
    const unsub = subscribeStorage(fn);
    await storageDelete('foo');
    expect(fn).toHaveBeenCalledWith('foo');
    unsub();
  });

  it('benachrichtigt mehrere Subscriber unabhängig voneinander', async () => {
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = subscribeStorage(a);
    const unsubB = subscribeStorage(b);
    await storageSet('x', 1);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    unsubA();
    unsubB();
  });

  it('unsubscribe entfernt den Listener', async () => {
    const fn = vi.fn();
    const unsub = subscribeStorage(fn);
    unsub();
    await storageSet('y', 2);
    expect(fn).not.toHaveBeenCalled();
  });

  it('Fehler in einem Listener brechen andere Listener nicht ab', async () => {
    const broken = vi.fn(() => { throw new Error('boom'); });
    const intact = vi.fn();
    const u1 = subscribeStorage(broken);
    const u2 = subscribeStorage(intact);
    await storageSet('z', 3);
    expect(broken).toHaveBeenCalled();
    expect(intact).toHaveBeenCalledWith('z');
    u1();
    u2();
  });

  it('storageGet liefert gespeicherten Wert nach storageSet', async () => {
    await storageSet('roundtrip', { a: 1, b: [2, 3] });
    expect(await storageGet('roundtrip')).toEqual({ a: 1, b: [2, 3] });
  });

  it('storageGet liefert null für unbekannten Key', async () => {
    expect(await storageGet('does-not-exist')).toBeNull();
  });

  it('storageDelete entfernt den Eintrag', async () => {
    await storageSet('temp', 'val');
    await storageDelete('temp');
    expect(await storageGet('temp')).toBeNull();
  });
});
