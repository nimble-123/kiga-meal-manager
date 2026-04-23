const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { initStore } = require('./store');
const { setupAutoUpdater } = require('./updater');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'KiGa Essenverwaltung',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(async () => {
  await initStore();
  createWindow();

  const isProduction = process.env.NODE_ENV !== 'development';
  const isPortable = !!process.env.PORTABLE_EXECUTABLE_DIR;
  setupAutoUpdater(mainWindow, { enableAutoCheck: isProduction && !isPortable });
});
app.on('window-all-closed', () => app.quit());

// IPC Handlers für Datenspeicherung
ipcMain.handle('store:get', async (_, key) => {
  const store = await initStore();
  return store.get(key);
});
ipcMain.handle('store:set', async (_, key, value) => {
  const store = await initStore();
  store.set(key, value);
});
ipcMain.handle('store:delete', async (_, key) => {
  const store = await initStore();
  store.delete(key);
});
ipcMain.handle('store:has', async (_, key) => {
  const store = await initStore();
  return store.has(key);
});

// Store: Alle Keys auflisten
ipcMain.handle('store:keys', async () => {
  const store = await initStore();
  return Object.keys(store.store);
});
// Store: Dateipfad
ipcMain.handle('store:path', async () => {
  const store = await initStore();
  return store.path;
});
// Datei öffnen (Import)
ipcMain.handle('open-file', async (_, { filters }) => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(mainWindow, { filters, properties: ['openFile'] });
  if (!result.canceled && result.filePaths.length > 0) {
    const fs = require('fs');
    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    return { success: true, content, filename: path.basename(result.filePaths[0]) };
  }
  return { success: false };
});
// Datei speichern (JSON-Export)
ipcMain.handle('save-file', async (_, { filename, content, filters }) => {
  const { dialog } = require('electron');
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: filename,
    filters: filters || [{ name: 'JSON-Dateien', extensions: ['json'] }],
  });
  if (!result.canceled && result.filePath) {
    const fs = require('fs');
    fs.writeFileSync(result.filePath, content, 'utf-8');
    return { success: true, path: result.filePath };
  }
  return { success: false };
});

// Datei speichern (für CSV-Export)
ipcMain.handle('save-csv', async (_, { filename, content }) => {
  const { dialog } = require('electron');
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: filename,
    filters: [{ name: 'CSV-Dateien', extensions: ['csv'] }],
  });
  if (!result.canceled && result.filePath) {
    const fs = require('fs');
    fs.writeFileSync(result.filePath, '\uFEFF' + content, 'utf-8');
    return { success: true, path: result.filePath };
  }
  return { success: false };
});

// E-Mail mit CSV-Anhang
ipcMain.handle('send-email-with-csv', async (_, { subject, body, csvFilename, csvContent }) => {
  const fs = require('fs');
  const os = require('os');
  const { exec } = require('child_process');

  // CSV in Temp-Verzeichnis speichern
  const tmpDir = path.join(os.tmpdir(), 'kiga-essenverwaltung');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const csvPath = path.join(tmpDir, csvFilename);
  fs.writeFileSync(csvPath, '\uFEFF' + csvContent, 'utf-8');

  if (process.platform === 'darwin') {
    // macOS: AppleScript öffnet Mail.app mit Anhang
    const escapedSubject = subject.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const escapedBody = body.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const script = `
      tell application "Mail"
        set newMsg to make new outgoing message with properties {subject:"${escapedSubject}", content:"${escapedBody}", visible:true}
        tell newMsg
          make new attachment with properties {file name:POSIX file "${csvPath}"}
        end tell
        activate
      end tell
    `;
    return new Promise((resolve) => {
      exec(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, (err) => {
        if (err) {
          // Fallback: mailto + Datei im Finder zeigen
          shell.openExternal(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
          shell.showItemInFolder(csvPath);
          resolve({ success: true, fallback: true, csvPath });
        } else {
          resolve({ success: true });
        }
      });
    });
  } else {
    // Windows/Linux: mailto öffnen + CSV-Datei im Explorer zeigen
    shell.openExternal(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    shell.showItemInFolder(csvPath);
    const { dialog } = require('electron');
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'CSV-Anhang',
      message: `Die CSV-Datei wurde gespeichert unter:\n\n${csvPath}\n\nBitte fügen Sie diese Datei manuell als Anhang zur E-Mail hinzu.`,
    });
    return { success: true, fallback: true, csvPath };
  }
});

// Ordner auswählen (für Auto-Backup)
ipcMain.handle('select-directory', async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return { success: true, path: result.filePaths[0] };
  }
  return { success: false };
});

// Datei direkt an Pfad speichern (ohne Dialog)
ipcMain.handle('save-file-to-path', async (_, { filePath, content }) => {
  const fs = require('fs');
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, path: filePath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Dateien in Verzeichnis auflisten
ipcMain.handle('list-files', async (_, { dirPath }) => {
  const fs = require('fs');
  try {
    const files = fs.readdirSync(dirPath).map((name) => {
      const fullPath = path.join(dirPath, name);
      const stat = fs.statSync(fullPath);
      return { name, path: fullPath, mtime: stat.mtime.toISOString(), size: stat.size };
    });
    return { success: true, files };
  } catch (e) {
    return { success: false, error: e.message, files: [] };
  }
});

// Datei löschen
ipcMain.handle('delete-file', async (_, { filePath }) => {
  const fs = require('fs');
  try {
    fs.unlinkSync(filePath);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Rückwärtskompatibel: einfache E-Mail ohne Anhang
ipcMain.handle('open-email', (_, { subject, body }) => {
  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  shell.openExternal(mailto);
});
