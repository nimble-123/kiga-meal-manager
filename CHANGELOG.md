# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-04-04

### Added

- **Analytics View** — 6 interaktive Charts (Preisentwicklung, Monatskosten, Teilnahmequote, Essenverteilung, Gruppenvergleich, BUT-Anteil) mit recharts
- **Administration View** — CSV/JSON Import/Export für Stamm- und Bewegungsdaten, Testdaten-Generator, Vollbackup/Restore, Gruppenverwaltung, System-Info
- **Sortierbare Tabellen** — Alle Tabellen per Klick auf Spaltenheader sortierbar (locale-aware für deutsche Umlaute)
- **Essen-Aufschlüsselung** — Gesamt-Anzeige zeigt Breakdown nach Gerichttyp (z.B. "44 Essen (5 A, 1 B, 3 C)")
- **PriceInput-Komponente** — Preiseingabe mit automatischer 2-Nachkommastellen-Formatierung und Validierung (keine negativen Werte)
- **Tooltips** — CSS-only Tooltips auf Buttons, Badges und Bedienelementen
- **Versions-Anzeige** — App-Version im Header sichtbar
- **Keyboard-Shortcuts** — Ctrl+1 bis Ctrl+6 für Tab-Wechsel
- **Empty-State** — Willkommen-Screen bei leerem Store mit CSV-Import-Option
- **CSV-Import** — Kinder und Gruppen aus CSV/JSON importieren (papaparse)
- **Testdaten-Generator** — Generiert realistische Essensdaten für beliebige Zeiträume
- **Backup/Restore** — Vollständiges Backup aller Daten als JSON
- **Bestätigungsdialoge** — Modal-Dialoge für destruktive Aktionen
- **Zebra-Striping** — Alternierende Zeilenfarben in Tabellen
- **App-Icons** — Eigene Icons für Windows (.ico) und macOS (.icns)
- **Sample-Daten** — Anonymisierte Beispiel-CSV für Erstimport (`data/sample/`)
- **E-Mail mit CSV-Anhang** — Monatsberichte per E-Mail mit automatisch angehängter CSV-Datei
- **Unit & Integration Tests** — 35 Tests mit Vitest + React Testing Library
- **E2E Tests** — 25 Tests mit Playwright (Chromium)
- **CI/CD** — GitHub Actions für automatische Tests und Release-Builds (Windows + macOS)

### Changed

- **Gruppenverwaltung** verschoben von Stammdaten in den Verwaltungs-Tab (Link-Button in Stammdaten)
- **Initiale Kinderdaten** aus dem Source Code entfernt — Import via CSV statt hardcoded
- **Storage-Layer** in zentrales Modul `src/utils/storage.js` extrahiert
- `initialChildren.js` umbenannt zu `childUtils.js` mit `createChild()` Factory-Funktion

### Fixed

- **Timezone-Bug in Feiertags-Erkennung** — `toISOString()` durch lokale Datumsformatierung ersetzt
- **EmptyState blockierte alle Tabs** — Wird nur noch auf dem Tageserfassungs-Tab angezeigt
- **Monatsübersicht Gesamt** ignorierte Gruppenfilter
- **Jahresübersicht Summen** ignorierte Gruppenfilter

## [1.0.0] - 2026-04-03

### Added

- Tageserfassung mit Essenauswahl pro Kind (Gerichte A-E)
- Monatsübersicht mit CSV-Export
- Jahresübersicht mit 12-Monats-Matrix
- Stammdaten-Verwaltung (Kinder anlegen, bearbeiten, aktivieren/deaktivieren)
- Dynamische Gruppenverwaltung
- Gruppenfilter in allen Views
- Feiertags- und Schließtag-Erkennung
- electron-store Datenpersistenz
- macOS und Windows Packaging

[1.1.0]: https://github.com/nimble-123/kiga-meal-manager/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/nimble-123/kiga-meal-manager/releases/tag/v1.0.0
