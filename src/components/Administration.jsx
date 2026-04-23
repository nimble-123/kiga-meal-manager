import { useState, useEffect, useCallback } from 'react';
import Badge from './ui/Badge';
import ConfirmDialog from './ui/ConfirmDialog';
import { getGruppeColor, DEFAULT_GRUPPEN } from '../utils/dates';
import { storageGet, storageSet, storageDelete, storageKeys, storageGetPath, openFile } from '../utils/storage';
import { parseChildrenCSV, parseChildrenJSON, parseGruppenCSV, exportChildrenCSV, exportChildrenJSON, parseMealsJSON, parseMealsCSV, exportMealsCSV } from '../utils/import';
import { downloadCSV } from '../utils/csv';
import { generateTestData } from '../utils/testData';
import { useAutoBackup } from '../hooks/useAutoBackup';

function Section({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#1F2937' }}
      >
        <span>{icon} {title}</span>
        <span style={{ fontSize: 12, color: '#9CA3AF', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>{'\u25BC'}</span>
      </button>
      {open && <div style={{ padding: '0 18px 18px' }}>{children}</div>}
    </div>
  );
}

export default function Administration({ children, activeChildren, gruppen, setChildrenBulk, setGruppenBulk, update }) {
  const [importPreview, setImportPreview] = useState(null);
  const [importMode, setImportMode] = useState('replace');
  const [confirm, setConfirm] = useState(null);
  const [mealKeyCount, setMealKeyCount] = useState(0);
  const [storagePath, setStoragePath] = useState('');
  const [testMonths, setTestMonths] = useState(6);
  const [feedback, setFeedback] = useState('');
  const { settings: backupSettings, updateSettings: updateBackupSettings, pickFolder, isElectron: isElectronBackup } = useAutoBackup();

  useEffect(() => {
    (async () => {
      const keys = await storageKeys();
      setMealKeyCount(keys.filter((k) => k.startsWith('meals-')).length);
      const p = await storageGetPath();
      if (p) setStoragePath(p);
    })();
  }, []);

  const showFeedback = useCallback((msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3000);
  }, []);

  // --- Stammdaten: Alle löschen ---
  const handleDeleteAllChildren = () => {
    setChildrenBulk([]);
    setGruppenBulk(DEFAULT_GRUPPEN);
    setConfirm(null);
    showFeedback('Alle Stammdaten gelöscht');
  };

  // --- Stammdaten Import ---
  const handleImportCSV = async () => {
    const result = await openFile([{ name: 'CSV-Dateien', extensions: ['csv'] }]);
    if (!result.success) return;
    const { children: parsed, errors } = parseChildrenCSV(result.content);
    if (errors.length > 0) alert(`Warnungen:\n${errors.join('\n')}`);
    if (parsed.length > 0) setImportPreview({ children: parsed, source: result.filename });
  };

  const handleImportJSON = async () => {
    const result = await openFile([{ name: 'JSON-Dateien', extensions: ['json'] }]);
    if (!result.success) return;
    const { children: parsed, errors } = parseChildrenJSON(result.content);
    if (errors.length > 0) alert(`Fehler:\n${errors.join('\n')}`);
    if (parsed.length > 0) setImportPreview({ children: parsed, source: result.filename });
  };

  const confirmImport = () => {
    if (!importPreview) return;
    if (importMode === 'replace') {
      setChildrenBulk(importPreview.children);
      const newGruppen = [...new Set(importPreview.children.map((c) => c.gruppe).filter(Boolean))];
      if (newGruppen.length > 0) setGruppenBulk(newGruppen);
    } else {
      const existingNames = new Set(children.map((c) => c.name));
      const newChildren = importPreview.children.filter((c) => !existingNames.has(c.name));
      setChildrenBulk([...children, ...newChildren]);
      const allGruppen = [...new Set([...gruppen, ...importPreview.children.map((c) => c.gruppe).filter(Boolean)])];
      setGruppenBulk(allGruppen);
    }
    setImportPreview(null);
    showFeedback(`${importPreview.children.length} Kinder importiert`);
  };

  // --- Stammdaten Export ---
  const handleExportCSV = () => {
    downloadCSV(`Stammdaten_${new Date().toISOString().split('T')[0]}.csv`, exportChildrenCSV(children));
  };

  const handleExportJSON = async () => {
    const content = exportChildrenJSON(children);
    if (window.api?.saveFile) {
      await window.api.saveFile({ filename: `Stammdaten_${new Date().toISOString().split('T')[0]}.json`, content });
    } else {
      const blob = new Blob([content], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Stammdaten_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    }
  };

  // --- Bewegungsdaten ---
  const handleExportMeals = async () => {
    const keys = await storageKeys();
    const mealKeys = keys.filter((k) => k.startsWith('meals-')).sort();
    const data = {};
    for (const k of mealKeys) { data[k] = await storageGet(k); }
    const content = JSON.stringify(data, null, 2);
    if (window.api?.saveFile) {
      await window.api.saveFile({ filename: `Bewegungsdaten_${new Date().toISOString().split('T')[0]}.json`, content });
    } else {
      const blob = new Blob([content], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Bewegungsdaten.json`;
      a.click();
    }
  };

  const handleImportMeals = async () => {
    const result = await openFile([{ name: 'JSON-Dateien', extensions: ['json'] }]);
    if (!result.success) return;
    const { meals, errors, count } = parseMealsJSON(result.content);
    if (errors.length > 0) { alert(`Fehler:\n${errors.join('\n')}`); return; }
    for (const [key, val] of Object.entries(meals)) { await storageSet(key, val); }
    const keys = await storageKeys();
    setMealKeyCount(keys.filter((k) => k.startsWith('meals-')).length);
    showFeedback(`${count} Monate importiert`);
  };

  const handleExportMealsCSV = async () => {
    const keys = await storageKeys();
    const mealKeys = keys.filter((k) => k.startsWith('meals-')).sort();
    const data = {};
    for (const k of mealKeys) { data[k] = await storageGet(k); }
    const csvContent = exportMealsCSV(data, children);
    downloadCSV(`Bewegungsdaten_${new Date().toISOString().split('T')[0]}.csv`, csvContent);
  };

  const handleImportMealsCSV = async () => {
    const result = await openFile([{ name: 'CSV-Dateien', extensions: ['csv'] }]);
    if (!result.success) return;
    const { meals, errors, count } = parseMealsCSV(result.content, children);
    if (errors.length > 0) alert(`Warnungen:\n${errors.join('\n')}`);
    if (count === 0 && errors.length > 0) return;
    for (const [key, val] of Object.entries(meals)) { await storageSet(key, val); }
    const keys = await storageKeys();
    setMealKeyCount(keys.filter((k) => k.startsWith('meals-')).length);
    showFeedback(`${count} Monate importiert (CSV)`);
  };

  const handleDeleteMeals = async () => {
    const keys = await storageKeys();
    const mealKeys = keys.filter((k) => k.startsWith('meals-'));
    for (const k of mealKeys) { await storageDelete(k); }
    setMealKeyCount(0);
    setConfirm(null);
    showFeedback('Alle Bewegungsdaten gelöscht');
  };

  // --- Testdaten ---
  const handleGenerateTestData = async () => {
    const now = new Date();
    let startMonth = now.getMonth() - testMonths + 1;
    let startYear = now.getFullYear();
    while (startMonth < 0) { startMonth += 12; startYear--; }

    const activeKids = children.filter((c) => c.status === 'aktiv');
    if (activeKids.length === 0) { alert('Keine aktiven Kinder vorhanden.'); return; }

    const data = generateTestData(activeKids, startYear, startMonth, testMonths);
    for (const [key, val] of Object.entries(data)) { await storageSet(key, val); }
    const keys = await storageKeys();
    setMealKeyCount(keys.filter((k) => k.startsWith('meals-')).length);
    setConfirm(null);
    showFeedback(`Testdaten für ${testMonths} Monate generiert`);
  };

  // --- Backup ---
  const handleBackup = async () => {
    const keys = await storageKeys();
    const data = {};
    for (const k of keys) { data[k] = await storageGet(k); }
    const content = JSON.stringify(data, null, 2);
    if (window.api?.saveFile) {
      await window.api.saveFile({ filename: `KiGa_Backup_${new Date().toISOString().split('T')[0]}.json`, content });
    } else {
      const blob = new Blob([content], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `KiGa_Backup.json`;
      a.click();
    }
  };

  const handleRestore = async () => {
    const result = await openFile([{ name: 'JSON-Dateien', extensions: ['json'] }]);
    if (!result.success) return;
    try {
      const data = JSON.parse(result.content);
      for (const [key, val] of Object.entries(data)) { await storageSet(key, val); }
      // Neu laden um State zu synchronisieren
      if (data.children) setChildrenBulk(data.children);
      if (data.gruppen) setGruppenBulk(data.gruppen);
      const keys = await storageKeys();
      setMealKeyCount(keys.filter((k) => k.startsWith('meals-')).length);
      showFeedback('Backup wiederhergestellt');
    } catch (e) {
      alert(`Fehler beim Wiederherstellen: ${e.message}`);
    }
  };

  return (
    <div className="fade-in">
      {feedback && (
        <div style={{ position: 'fixed', top: 70, right: 24, background: '#059669', color: 'white', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 100 }} className="fade-in">
          {'\u2713'} {feedback}
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
          danger
        />
      )}

      {/* Import-Vorschau */}
      {importPreview && (
        <div className="card fade-in" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            Import-Vorschau: {importPreview.source} ({importPreview.children.length} Kinder)
          </div>
          <div style={{ overflowX: 'auto', marginBottom: 12 }}>
            <table>
              <thead>
                <tr style={{ background: '#FAFAF7' }}>
                  <th>Name</th><th>Gruppe</th><th>BUT</th><th>Zahlungspflichtiger</th>
                </tr>
              </thead>
              <tbody>
                {importPreview.children.slice(0, 5).map((c, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td><Badge color={getGruppeColor(c.gruppe)}>{c.gruppe}</Badge></td>
                    <td>{c.but ? 'Ja' : 'Nein'}</td>
                    <td style={{ fontSize: 12 }}>{c.zahlungspfl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {importPreview.children.length > 5 && (
              <div style={{ fontSize: 12, color: '#9CA3AF', padding: 8 }}>... und {importPreview.children.length - 5} weitere</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <select className="input" value={importMode} onChange={(e) => setImportMode(e.target.value)} style={{ width: 180 }}>
              <option value="replace">Ersetzen</option>
              <option value="merge">Zusammenführen</option>
            </select>
            <button className="btn btn-primary" onClick={confirmImport}>Importieren</button>
            <button className="btn btn-secondary" onClick={() => setImportPreview(null)}>Abbrechen</button>
          </div>
        </div>
      )}

      <Section title="Stammdaten Import / Export" icon={'\uD83D\uDC67'} defaultOpen>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 1.6 }}>
          Exportiere oder importiere Kinderdaten als CSV oder JSON.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <button className="btn btn-primary" onClick={handleExportCSV}>{'\uD83D\uDCE5'} CSV exportieren</button>
          <button className="btn btn-primary" onClick={handleExportJSON}>{'\uD83D\uDCE5'} JSON exportieren</button>
          <button className="btn btn-secondary" onClick={handleImportCSV}>{'\uD83D\uDCE4'} CSV importieren</button>
          <button className="btn btn-secondary" onClick={handleImportJSON}>{'\uD83D\uDCE4'} JSON importieren</button>
          <button
            className="btn btn-danger"
            onClick={() => setConfirm({
              title: 'Alle Stammdaten löschen?',
              message: `Es werden ${children.length} Kinder und alle Gruppen unwiderruflich gelöscht. Die Gruppen werden auf die Standardgruppen zurückgesetzt.`,
              confirmLabel: 'Endgültig löschen',
              onConfirm: handleDeleteAllChildren,
            })}
            disabled={children.length === 0}
          >
            {'\uD83D\uDDD1'} Alle löschen ({children.length} Kinder)
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>
          CSV-Format: Name;Gruppe;BUT;Zahlungspflichtiger;Adresse;Kassenzeichen (Semikolon-getrennt)
        </div>
      </Section>

      <Section title="Bewegungsdaten Import / Export" icon={'\uD83D\uDCCA'}>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 1.6 }}>
          Exportiere oder importiere Essensdaten. Bewegungsdaten enthalten Gerichtauswahl, Preise und Abmeldungen.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <button className="btn btn-primary" onClick={handleExportMealsCSV}>{'\uD83D\uDCE5'} CSV exportieren</button>
          <button className="btn btn-primary" onClick={handleExportMeals}>{'\uD83D\uDCE5'} JSON exportieren</button>
          <button className="btn btn-secondary" onClick={handleImportMealsCSV}>{'\uD83D\uDCE4'} CSV importieren</button>
          <button className="btn btn-secondary" onClick={handleImportMeals}>{'\uD83D\uDCE4'} JSON importieren</button>
          <button
            className="btn btn-danger"
            onClick={() => setConfirm({
              title: 'Alle Bewegungsdaten löschen?',
              message: `Es werden ${mealKeyCount} Monate an Essensdaten unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.`,
              confirmLabel: 'Endgültig löschen',
              onConfirm: handleDeleteMeals,
            })}
            disabled={mealKeyCount === 0}
          >
            {'\uD83D\uDDD1'} Alle löschen ({mealKeyCount} Monate)
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>
          CSV-Format: Datum;Name;Gericht;Preis;Abgemeldet;Grund (Semikolon-getrennt)
        </div>
      </Section>

      <Section title="Testdaten generieren" icon={'\uD83E\uDDEA'}>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 1.6 }}>
          Generiert realistische Essensdaten für die letzten Monate. Bestehende Daten für diese Monate werden überschrieben.
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ fontSize: 13 }}>Anzahl Monate:</label>
          <input type="number" className="input" style={{ width: 60 }} min={1} max={24} value={testMonths} onChange={(e) => setTestMonths(Math.max(1, Math.min(24, +e.target.value)))} />
          <button
            className="btn btn-primary"
            onClick={() => setConfirm({
              title: 'Testdaten generieren?',
              message: `Es werden Essensdaten für ${testMonths} Monate generiert. Bestehende Daten in diesem Zeitraum werden überschrieben.`,
              confirmLabel: 'Generieren',
              onConfirm: handleGenerateTestData,
            })}
          >
            {'\u2699\uFE0F'} Testdaten generieren
          </button>
        </div>
      </Section>

      <Section title="Backup / Restore" icon={'\uD83D\uDCBE'}>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 1.6 }}>
          Erstellt ein vollständiges Backup aller Daten (Kinder, Gruppen, Essensdaten) als JSON-Datei.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={handleBackup}>{'\uD83D\uDCBE'} Vollbackup erstellen</button>
          <button
            className="btn btn-secondary"
            onClick={() => setConfirm({
              title: 'Backup wiederherstellen?',
              message: 'Alle aktuellen Daten werden durch die Daten aus dem Backup ersetzt.',
              confirmLabel: 'Wiederherstellen',
              onConfirm: handleRestore,
            })}
          >
            {'\uD83D\uDD04'} Backup wiederherstellen
          </button>
        </div>
        <div style={{ borderTop: '1px solid #E5E1DA', marginTop: 16, paddingTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Automatisches Backup</div>
          {!isElectronBackup ? (
            <div style={{ fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>
              Automatische Backups sind nur in der Desktop-Version verfügbar.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '10px 16px', alignItems: 'center', fontSize: 13 }}>
              <span style={{ color: '#6B7280' }}>Aktiviert:</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={backupSettings.enabled}
                  onChange={(e) => updateBackupSettings({ enabled: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: '#2D9F93' }}
                />
                <span>{backupSettings.enabled ? 'Ja' : 'Nein'}</span>
              </label>
              <span style={{ color: '#6B7280' }}>Intervall:</span>
              <select className="input" style={{ width: 160 }} value={backupSettings.interval} onChange={(e) => updateBackupSettings({ interval: e.target.value })}>
                <option value="daily">Täglich</option>
                <option value="weekly">Wöchentlich</option>
                <option value="monthly">Monatlich</option>
              </select>
              <span style={{ color: '#6B7280' }}>Backup-Ordner:</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn btn-secondary" onClick={pickFolder}>Ordner wählen</button>
                <span style={{ fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all', color: backupSettings.folderPath ? '#1F2937' : '#9CA3AF' }}>
                  {backupSettings.folderPath || 'Kein Ordner ausgewählt'}
                </span>
              </div>
              <span style={{ color: '#6B7280' }}>Max. Backups:</span>
              <input
                type="number"
                className="input"
                style={{ width: 60 }}
                min={1}
                max={100}
                value={backupSettings.maxBackups}
                onChange={(e) => updateBackupSettings({ maxBackups: Math.max(1, Math.min(100, +e.target.value)) })}
              />
              <span style={{ color: '#6B7280' }}>Letztes Backup:</span>
              <span style={{ fontWeight: 600 }}>
                {backupSettings.lastBackupDate
                  ? new Date(backupSettings.lastBackupDate).toLocaleString('de-DE')
                  : 'Noch kein Backup erstellt'}
              </span>
            </div>
          )}
        </div>
      </Section>

      <Section title="System-Info" icon={'\u2139\uFE0F'}>
        <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 1.6 }}>
          Übersicht über die aktuelle Konfiguration und Datenlage.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '8px 16px', fontSize: 13 }}>
          <span style={{ color: '#6B7280' }}>Version:</span>
          <span style={{ fontWeight: 600 }}>v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '?'}</span>
          <span style={{ color: '#6B7280' }}>Kinder (gesamt / aktiv):</span>
          <span style={{ fontWeight: 600 }}>{children.length} / {activeChildren.length}</span>
          <span style={{ color: '#6B7280' }}>Gruppen:</span>
          <span style={{ fontWeight: 600 }}>{gruppen.length}</span>
          <span style={{ color: '#6B7280' }}>Monate mit Daten:</span>
          <span style={{ fontWeight: 600 }}>{mealKeyCount}</span>
          {storagePath && (
            <>
              <span style={{ color: '#6B7280' }}>Speicherort:</span>
              <span style={{ fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>{storagePath}</span>
            </>
          )}
          {update?.isElectron && (
            <>
              <span style={{ color: '#6B7280' }}>Update-Status:</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {update.status === 'checking' && <span style={{ color: '#6B7280' }}>Prüfe…</span>}
                {update.status === 'up-to-date' && <span style={{ color: '#059669', fontWeight: 600 }}>Aktuell</span>}
                {update.status === 'available' && <span style={{ color: '#D97706', fontWeight: 600 }}>v{update.updateInfo?.version} verfügbar</span>}
                {update.status === 'downloading' && <span style={{ color: '#2D9F93', fontWeight: 600 }}>Wird heruntergeladen… {update.progress}%</span>}
                {update.status === 'downloaded' && <span style={{ color: '#059669', fontWeight: 600 }}>v{update.updateInfo?.version} bereit</span>}
                {update.status === 'error' && <span style={{ color: '#DC2626' }}>Fehler: {update.error}</span>}
                {(update.status === 'idle' || update.status === 'up-to-date' || update.status === 'error') && (
                  <button
                    onClick={update.checkForUpdate}
                    className="btn"
                    style={{ padding: '2px 10px', fontSize: 11 }}
                  >
                    Nach Updates suchen
                  </button>
                )}
              </span>
            </>
          )}
        </div>
      </Section>
    </div>
  );
}
