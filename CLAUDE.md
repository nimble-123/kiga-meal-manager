# KiGa Essenverwaltung

Electron-Desktop-App zur Verwaltung der Essenkosten in einer Kindertagesstätte (KiGa Mitte).

## Tech Stack

- **Frontend:** React 19, Tailwind CSS 4, Vite 8
- **Charts:** recharts
- **Guided Tour:** driver.js
- **Desktop:** Electron 41, electron-builder
- **Datenspeicherung:** electron-store (lokale JSON-Datei im User-Verzeichnis)
- **CSV-Parsing:** papaparse
- **Sprache:** JavaScript (kein TypeScript)

## Projektstruktur

```
electron/              Electron Main Process (main.js, preload.js, store.js)
data/sample/           Sample-CSV-Dateien für Erstimport (kinder.csv, gruppen.csv)
src/
  App.jsx              Haupt-App mit Tab-Navigation (6 Views) + Keyboard-Shortcuts
  main.jsx             React Entry Point
  components/
    Header.jsx         Navigation Header mit Version + 6 Tabs + Help-Button
    DailyEntry.jsx     Tageserfassung (Essenauswahl + Abmeldung pro Kind/Tag)
    MonthlyReport.jsx  Monatsübersicht (Zusammenfassung pro Kind)
    YearlyReport.jsx   Jahresübersicht (12-Monats-Matrix)
    Stammdaten.jsx     Kinderverwaltung + Gruppenverwaltung (sortierbar)
    ChildForm.jsx      Formular zum Anlegen/Bearbeiten von Kindern
    Analytics.jsx      Auswertungs-View mit 6 recharts-Charts
    Administration.jsx Verwaltungs-View (Import/Export, Testdaten, Backup, Auto-Backup)
    EmptyState.jsx     Willkommen-Screen bei leerem Store + Tour-Button
    ui/
      Badge.jsx        Farbige Label-Badges
      Button.jsx       Button-Wrapper
      Select.jsx       Select-Wrapper
      SortHeader.jsx   Sortierbare Spaltenheader (klickbar, Pfeil-Indikator)
      PriceInput.jsx   Preis-Input mit Formatierung + Validierung
      ConfirmDialog.jsx Modal-Dialog für destruktive Aktionen
  hooks/
    useChildren.js     Kinder- und Gruppen-CRUD + Persistenz + Bulk-Import
    useMeals.js        Essens-Daten pro Tag/Monat (Preise + Auswahl + Abmeldungen + byMeal-Tracking)
    useSortableTable.js Sortier-Hook für Tabellen (locale-aware, accessor-support)
    useAutoBackup.js   Automatisches periodisches Backup (Electron-only)
    useTour.js         Geführte App-Tour via driver.js
  config/
    tourSteps.js       Tour-Schritte-Definition (17 Steps durch alle 6 Tabs)
  data/
    childUtils.js      createChild() Factory-Funktion für Child-Objekte
    holidays.js        Deutsche Feiertage + Schließtag-Prüfung
  utils/
    storage.js         Zentrales Storage-Modul (get/set/delete/keys/openFile/selectDirectory/saveFileToPath/listFiles/deleteFile)
    dates.js           Konstanten (Gerichte, Monate, Farben), Hilfsfunktionen
    csv.js             CSV-Download
    email.js           E-Mail-Versand mit CSV-Anhang
    import.js          CSV/JSON Import/Export für Stamm- und Bewegungsdaten
    testData.js        Testdaten-Generator (realistische Essensdaten)
    analytics.js       Analytics-Daten-Aggregation (12 Monate parallel)
    mealBreakdown.jsx  Essen-Aufschlüsselung nach Gerichttyp (A/B/C/D/E)
```

## NPM Scripts

| Script | Beschreibung |
|--------|-------------|
| `npm run dev` | Startet Vite Dev-Server + Electron im Entwicklungsmodus |
| `npm run build` | Erstellt den Vite Production Build in `dist/` |
| `npm run package` | Paketiert als Windows-Installer (NSIS + Portable) |
| `npm run package:mac` | Paketiert als macOS DMG |
| `npm test` | Unit & Integration Tests (Vitest) |
| `npm run test:e2e` | E2E Tests (Playwright) |
| `npm run test:all` | Alle Tests |
| `npm run test:watch` | Tests im Watch-Modus |

## Architektur-Hinweise

- **State-Management:** Kein Redux/Zustand - Custom Hooks (`useChildren`, `useMeals`) verwalten State in `App.jsx` und reichen Props an Komponenten durch.
- **Storage:** Zentrales Modul `src/utils/storage.js` abstrahiert über electron-store / localStorage. Alle Storage-Zugriffe laufen hierüber.
- **Datenspeicherung:** Schlüssel: `meals-YYYY-MM` für Essens-Daten, `children` für Kinderliste, `gruppen` für Gruppen. Tages-Daten enthalten `prices`, `selections` und optional `abmeldungen` (`{ active: bool, grund: string }` pro Kind).
- **Gruppen:** Dynamisch verwaltbar im Stammdaten-Tab (collapsible Panel über der Kindertabelle). Farben via `getGruppeColor()` (feste Map + Hash-Fallback).
- **Filter:** Alle Views unterstützen Gruppenfilter. Summen/Gesamt-Anzeigen berücksichtigen immer den aktiven Filter via `filteredChildren`.
- **Sortierung:** `useSortableTable` Hook + `SortHeader` Komponente. Alle Tabellen sind einheitlich sortierbar.
- **Meal-Breakdown:** `getMonthSummary` liefert `byMeal: {A, B, C, D, E}` pro Kind. Footer zeigen Aufschlüsselung.
- **Preise:** `PriceInput` Komponente zeigt immer 2 Nachkommastellen, validiert gegen negative Werte.
- **Tooltips:** CSS-only via `data-tooltip` Attribut + `[data-tooltip]::after` in index.css.
- **Version:** `__APP_VERSION__` wird von Vite aus package.json injiziert, im Header angezeigt.
- **Styling:** Inline-Styles + Tailwind-Utility-Klassen. Farbschema: Beige (#FAF7F2), Teal (#2D9F93).
- **Feiertage:** In `data/holidays.js`. An diesen Tagen wird die Essenauswahl gesperrt.
- **Erststart:** Leerer Store zeigt EmptyState mit Import-Option und Tour-Button. Sample-CSV in `data/sample/`.
- **Geführte Tour:** driver.js-basierte Tour durch alle 6 Tabs. Startet automatisch beim Erststart, danach über Help-Button (?) im Header. Persistiert `tourCompleted` im Store.
- **Auto-Backup:** Konfigurierbar im Backup-Panel (Intervall, Ordner, Max-Backups). Nur in Electron verfügbar. Settings unter `autoBackup` im Store.
- **ConfirmDialogs:** Alle destruktiven Aktionen (Kind/Gruppe/Stammdaten/Bewegungsdaten löschen, Backup wiederherstellen) zeigen ConfirmDialog.

## Wichtige Konventionen

- Deutsche UI-Texte durchgehend
- Geldbeträge mit `fmtEuro()` formatiert (€, 2 Dezimalstellen)
- Kinder-IDs: `c${Date.now()}_${index}` für Imports, `c${Date.now()}` für Einzelanlage
- CSV-Export mit BOM-Prefix (\uFEFF) und Semikolon-Delimiter
- CSV-Import via papaparse mit Semikolon-Delimiter
- JSX in Utils-Dateien brauchen `.jsx` Extension (nicht `.js`)

## IPC-Kanäle (Electron)

| Kanal | Zweck |
|-------|-------|
| `store:get/set/delete/has` | Key-Value Storage |
| `store:keys` | Alle Keys auflisten |
| `store:path` | Dateipfad des Stores |
| `save-csv` | CSV-Datei speichern (Dialog) |
| `save-file` | Beliebige Datei speichern (JSON-Export) |
| `open-file` | Datei öffnen + Inhalt lesen (Import) |
| `send-email-with-csv` | E-Mail mit CSV-Anhang |
| `open-email` | Einfache E-Mail (mailto:) |
| `select-directory` | Ordner-Auswahl-Dialog (Auto-Backup) |
| `save-file-to-path` | Datei an Pfad speichern ohne Dialog |
| `list-files` | Dateien in Verzeichnis auflisten |
| `delete-file` | Datei löschen |

## Testing

- **Unit/Integration:** Vitest + React Testing Library, Setup in `tests/setup.js` mockt `window.api`
- **E2E:** Playwright mit Chromium, testet gegen Vite Dev-Server, Daten via localStorage geseedet
- **Config:** `vitest.config.js`, `playwright.config.js`
- Test-Artefakte (screenshots, reports) liegen in `test-results/` (gitignored)

## CI/CD

- **CI:** `.github/workflows/ci.yml` — Unit-Tests + Build + E2E auf jedem Push/PR
- **Release:** `.github/workflows/release-please.yml` — Release-Please erstellt PR + Release, baut danach Win/Mac Pakete und laedt sie zum Release hoch
