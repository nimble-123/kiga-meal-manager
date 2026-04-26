# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0](https://github.com/nimble-123/kiga-meal-manager/compare/v1.4.1...v1.5.0) (2026-04-26)


### Features

* add weekly meal entry view as parallel workflow to daily entry ([007b543](https://github.com/nimble-123/kiga-meal-manager/commit/007b54394f865ed014ce369f45d45cab5d2ef603))

## [1.4.1](https://github.com/nimble-123/kiga-meal-manager/compare/v1.4.0...v1.4.1) (2026-04-25)


### Bug Fixes

* set electron-builder releaseType to "release" for GitHub publishing ([59c73c7](https://github.com/nimble-123/kiga-meal-manager/commit/59c73c7a46a99e1122247d10a2ee83caf40c5244))

## [1.4.0](https://github.com/nimble-123/kiga-meal-manager/compare/v1.3.0...v1.4.0) (2026-04-23)


### Features

* add auto-update mechanism via electron-updater ([c2a4b94](https://github.com/nimble-123/kiga-meal-manager/commit/c2a4b946a17faf26ed0c3b2c3ef8b5b22865d9da))
* add bulk meal assignment in daily entry view ([0231b2c](https://github.com/nimble-123/kiga-meal-manager/commit/0231b2c71caed5201922da68a40257f531366a1a))

## [1.3.0](https://github.com/nimble-123/kiga-meal-manager/compare/v1.2.1...v1.3.0) (2026-04-17)


### Features

* add admin enhancements, guided tour, and UX improvements ([d6a8d60](https://github.com/nimble-123/kiga-meal-manager/commit/d6a8d601d392499722d36daa49f47b1086c59fc8))

## [1.2.1](https://github.com/nimble-123/kiga-meal-manager/compare/v1.2.0...v1.2.1) (2026-04-06)


### Bug Fixes

* **ci:** integrate build jobs into release-please workflow ([799ae94](https://github.com/nimble-123/kiga-meal-manager/commit/799ae9472afd335f621f864e0681aca58594d65f))

## [1.2.0](https://github.com/nimble-123/kiga-meal-manager/compare/v1.1.0...v1.2.0) (2026-04-06)


### Features

* add Abmeldung checkbox and notes field to daily entry view ([2dc8eee](https://github.com/nimble-123/kiga-meal-manager/commit/2dc8eee41c72978ef5ebdec6a7e250e6a076c1d3))


### Bug Fixes

* prevent input focus loss in ChildForm by extracting Field component ([bcff2df](https://github.com/nimble-123/kiga-meal-manager/commit/bcff2df9a53071890b8b211d5c5161aabe047b34))

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
