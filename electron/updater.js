const { autoUpdater } = require('electron-updater');
const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let updaterActive = false;

function sendToRenderer(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

function setupAutoUpdater(win, { enableAutoCheck = true } = {}) {
  mainWindow = win;

  // IPC-Handler immer registrieren (auch im Dev-Modus)
  ipcMain.handle('updater:check', async () => {
    if (!updaterActive) return { success: false, error: 'Updater nicht verfügbar' };
    try {
      const result = await autoUpdater.checkForUpdates();
      return { success: true, version: result?.updateInfo?.version };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('updater:download', async () => {
    if (!updaterActive) return { success: false, error: 'Updater nicht verfügbar' };
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('updater:install', () => {
    if (!updaterActive) return;
    autoUpdater.quitAndInstall(false, true);
  });

  if (!enableAutoCheck) {
    // Im Dev-Modus: Updater trotzdem aktivieren wenn dev-app-update.yml existiert
    const devConfigPath = path.join(__dirname, '..', 'dev-app-update.yml');
    if (fs.existsSync(devConfigPath)) {
      updaterActive = true;
      autoUpdater.updateConfigPath = devConfigPath;
      autoUpdater.forceDevUpdateConfig = true;
    }
    if (!updaterActive) return;
  }

  // Updater konfigurieren
  updaterActive = true;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // Events an Renderer weiterleiten
  autoUpdater.on('update-available', (info) => {
    sendToRenderer('updater:available', {
      version: info.version,
      releaseDate: info.releaseDate,
    });
  });

  autoUpdater.on('update-not-available', () => {
    sendToRenderer('updater:not-available');
  });

  autoUpdater.on('download-progress', (progress) => {
    sendToRenderer('updater:progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendToRenderer('updater:downloaded', {
      version: info.version,
    });
  });

  autoUpdater.on('error', (err) => {
    sendToRenderer('updater:error', err?.message || 'Unbekannter Fehler');
  });

  // Automatischer Check beim Start (5s Verzögerung)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 5000);
}

module.exports = { setupAutoUpdater };
