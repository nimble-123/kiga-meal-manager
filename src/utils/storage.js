// Zentrales Storage-Modul.
// Dual-Mode: Ist Supabase konfiguriert (VITE_SUPABASE_URL/ANON_KEY), läuft alles über
// die org-gescopte Supabase-Datenschicht (src/lib/data/*). Sonst der bisherige Pfad
// (electron-store via window.api bzw. localStorage) — so bleiben Desktop und die
// bestehenden Tests während der Migration unverändert lauffähig.

import { supabase } from '../lib/supabase';
import * as childrenData from '../lib/data/children';
import * as gruppenData from '../lib/data/gruppen';
import * as mealsData from '../lib/data/meals';
import * as profileData from '../lib/data/profile';

const MEALS_RE = /^meals-\d{4}-\d{2}$/;
const useSupabase = !!supabase;

function logError(...args) {
  // eslint-disable-next-line no-console
  console.error('[storage]', ...args);
}

const listeners = new Set();

export function subscribeStorage(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifyStorage(key) {
  listeners.forEach((fn) => {
    try { fn(key); } catch { /* ignore listener errors */ }
  });
}

export async function storageGet(key) {
  if (useSupabase) {
    try {
      if (key === 'children') return await childrenData.getChildren();
      if (key === 'gruppen') return await gruppenData.getGruppen();
      if (key === 'tourCompleted') return await profileData.getTourCompleted();
      if (MEALS_RE.test(key)) return await mealsData.getMonth(key);
      return null;
    } catch (e) { logError('get', key, e); return null; }
  }
  try {
    if (window.api?.store) return await window.api.store.get(key);
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

export async function storageSet(key, val) {
  if (useSupabase) {
    try {
      if (key === 'children') await childrenData.setChildren(val);
      else if (key === 'gruppen') await gruppenData.setGruppen(val);
      else if (key === 'tourCompleted') await profileData.setTourCompleted(val);
      else if (MEALS_RE.test(key)) await mealsData.setMonth(key, val);
    } catch (e) { logError('set', key, e); }
    notifyStorage(key);
    return;
  }
  try {
    if (window.api?.store) {
      await window.api.store.set(key, val);
    } else {
      localStorage.setItem(key, JSON.stringify(val));
    }
  } catch {
    /* ignore */
  }
  notifyStorage(key);
}

export async function storageDelete(key) {
  if (useSupabase) {
    try {
      if (MEALS_RE.test(key)) await mealsData.deleteMonth(key);
      else if (key === 'children') await childrenData.setChildren([]);
      else if (key === 'gruppen') await gruppenData.setGruppen([]);
    } catch (e) { logError('delete', key, e); }
    notifyStorage(key);
    return;
  }
  try {
    if (window.api?.store) {
      await window.api.store.delete(key);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
  notifyStorage(key);
}

export async function storageKeys() {
  if (useSupabase) {
    try {
      const months = await mealsData.listMonthKeys();
      return ['children', 'gruppen', 'tourCompleted', ...months];
    } catch (e) { logError('keys', e); return []; }
  }
  try {
    if (window.api?.store?.keys) return await window.api.store.keys();
    return Object.keys(localStorage);
  } catch {
    return [];
  }
}

export async function storageGetPath() {
  if (useSupabase) return null;
  try {
    if (window.api?.store?.getPath) return await window.api.store.getPath();
    return null;
  } catch {
    return null;
  }
}

// --- Datei-/Electron-Funktionen (Web: Browser-Fallbacks; Electron-Reste werden in Phase 5 entfernt) ---

export async function selectDirectory() {
  try {
    if (window.api?.selectDirectory) return await window.api.selectDirectory();
    return { success: false, error: 'Nur in Electron verfügbar' };
  } catch { return { success: false }; }
}

export async function saveFileToPath(filePath, content) {
  try {
    if (window.api?.saveFileToPath) return await window.api.saveFileToPath({ filePath, content });
    return { success: false, error: 'Nur in Electron verfügbar' };
  } catch { return { success: false }; }
}

export async function listFiles(dirPath) {
  try {
    if (window.api?.listFiles) return await window.api.listFiles({ dirPath });
    return { success: false, files: [] };
  } catch { return { success: false, files: [] }; }
}

export async function deleteFile(filePath) {
  try {
    if (window.api?.deleteFile) return await window.api.deleteFile({ filePath });
    return { success: false };
  } catch { return { success: false }; }
}

export async function openFile(filters) {
  try {
    if (window.api?.openFile) return await window.api.openFile({ filters });
    // Browser-Fallback: file input
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = filters?.map((f) => f.extensions.map((e) => `.${e}`).join(',')).join(',') || '*';
      input.onchange = () => {
        const file = input.files[0];
        if (!file) return resolve({ success: false });
        const reader = new FileReader();
        reader.onload = () => resolve({ success: true, content: reader.result, filename: file.name });
        reader.readAsText(file);
      };
      input.click();
    });
  } catch {
    return { success: false };
  }
}
