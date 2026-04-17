// Zentrales Storage-Modul — Abstraktion über electron-store / localStorage

export async function storageGet(key) {
  try {
    if (window.api?.store) return await window.api.store.get(key);
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

export async function storageSet(key, val) {
  try {
    if (window.api?.store) {
      await window.api.store.set(key, val);
    } else {
      localStorage.setItem(key, JSON.stringify(val));
    }
  } catch {
    /* ignore */
  }
}

export async function storageDelete(key) {
  try {
    if (window.api?.store) {
      await window.api.store.delete(key);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

export async function storageKeys() {
  try {
    if (window.api?.store?.keys) return await window.api.store.keys();
    return Object.keys(localStorage);
  } catch {
    return [];
  }
}

export async function storageGetPath() {
  try {
    if (window.api?.store?.getPath) return await window.api.store.getPath();
    return null;
  } catch {
    return null;
  }
}

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
