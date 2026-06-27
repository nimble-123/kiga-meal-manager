# KiGa Essenverwaltung

Desktop-Anwendung zur täglichen Erfassung der Essenskosten im Kindergarten "KiGa Mitte". Die App ersetzt eine Excel-basierte Lösung und ist so gestaltet, dass sie ohne technisches Vorwissen bedient werden kann.

## Features

- **Tageserfassung** - Essenauswahl pro Kind mit Preiseingabe pro Gericht (A-E), automatische 2-Nachkommastellen-Formatierung, Bulk-Zuweisung eines Gerichts an alle sichtbaren Kinder per Header-Button
- **Monatsübersicht** - Zusammenfassung aller Essen und Kosten pro Kind mit Aufschlüsselung nach Gerichttyp
- **Jahresübersicht** - 12-Monats-Matrix mit Gesamtkosten und Essen-Breakdown
- **Stammdaten** - Kinder verwalten (hinzufügen, bearbeiten, löschen, aktivieren/deaktivieren) mit sortierbaren Spalten und integrierter Gruppenverwaltung
- **Auswertung** - 6 interaktive Charts: Preisentwicklung, Monatskosten, Teilnahmequote, Essenverteilung, Gruppenvergleich, BUT-Anteil
- **Verwaltung** - CSV/JSON Import/Export für Stamm- und Bewegungsdaten, Testdaten-Generator, Vollbackup/Restore, automatisches periodisches Backup
- **Gruppenfilter** - Alle Views nach Kindergartengruppe filterbar
- **Sortierbare Tabellen** - Alle Tabellen per Klick auf Spaltenheader sortierbar
- **CSV-Export** - Monats- und Jahresberichte als CSV-Datei exportieren
- **E-Mail-Versand** - Monatsbericht als E-Mail mit CSV-Anhang versenden
- **Ferien/Schließtage** - An Schließtagen wird die Essensauswahl automatisch gesperrt
- **Tooltips** - Kontextbezogene Hilfe auf Buttons und Bedienelementen
- **Geführte Tour** - Interaktives Tutorial beim ersten Start, jederzeit über Help-Button wiederholbar
- **Sicherheitsabfragen** - Bestätigungsdialoge bei allen destruktiven Aktionen (Löschen, Überschreiben)
- **Lizenzschutz & Verschlüsselung** - Aktivierung mit signiertem Offline-Lizenzschlüssel; die lokalen Daten werden verschlüsselt gespeichert (siehe [Lizenzierung & Aktivierung](#lizenzierung--aktivierung))

## Tech-Stack

| Komponente | Technologie |
|---|---|
| Desktop-Runtime | Electron |
| Frontend | React 19, Vite 8 |
| Styling | Tailwind CSS 4, Inline-Styles |
| Charts | recharts |
| Guided Tour | driver.js |
| Datenspeicherung | electron-store (lokale JSON-Datei, verschlüsselt) |
| Lizenzierung | Signierte Ed25519-Lizenzschlüssel (Node `crypto`, offline) |
| CSV-Handling | papaparse |
| Build/Packaging | electron-builder |

## Voraussetzungen

- [Node.js](https://nodejs.org/) 18 oder neuer
- npm (wird mit Node.js installiert)

## Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsmodus starten (Vite Dev-Server + Electron)
npm run dev
```

Die App öffnet sich automatisch im Entwicklungsmodus mit Hot Module Replacement.

## Tests

```bash
# Unit & Integration Tests (Vitest)
npm test

# E2E Tests (Playwright)
npm run test:e2e

# Alle Tests
npm run test:all

# Tests im Watch-Modus
npm run test:watch
```

| Test-Art | Tool | Verzeichnis | Anzahl |
|---|---|---|---|
| Unit Tests | Vitest | `tests/unit/` | 121 |
| Integration Tests | Vitest + React Testing Library | `tests/integration/` | 90 |
| E2E Tests | Playwright | `e2e/` | 68 |

## CI/CD

Das Projekt nutzt GitHub Actions:

- **CI** (`.github/workflows/ci.yml`) — Läuft auf jedem Push/PR auf `main`: Unit-Tests, Build, E2E-Tests
- **Release** (`.github/workflows/release.yml`) — Beim Erstellen eines Git-Tags (`v*`): Baut Windows- und macOS-Pakete, erstellt einen GitHub Release Draft

### Release erstellen

```bash
# Version in package.json anpassen, dann:
git tag v1.1.0
git push origin v1.1.0
```

Der Release-Workflow baut automatisch Windows- und macOS-Installer und erstellt einen Draft-Release auf GitHub.

## Paketieren

### Windows

```bash
npm run package
```

Erstellt im Ordner `release/` zwei Varianten:
- **NSIS-Installer** (`KiGa Essenverwaltung Setup X.X.X.exe`) - Installiert die App unter Programme
- **Portable** (`KiGa Essenverwaltung X.X.X.exe`) - Kann direkt ohne Installation gestartet werden

### macOS

```bash
npm run package:mac
```

Erstellt im Ordner `release/` eine DMG-Datei (`KiGa Essenverwaltung-X.X.X.dmg`).

## Installation

### Windows

**Installer-Version:**
1. `KiGa Essenverwaltung Setup X.X.X.exe` ausführen
2. Installation durchklicken (wird unter `C:\Users\<Benutzer>\AppData\Local\Programs\` installiert)
3. Die App ist über das Desktop-Icon oder das Startmenü erreichbar

**Portable-Version:**
1. `KiGa Essenverwaltung X.X.X.exe` an beliebigen Ort kopieren (z.B. Desktop)
2. Direkt per Doppelklick starten - keine Installation nötig

### macOS

1. `KiGa Essenverwaltung-X.X.X.dmg` öffnen
2. Die App in den Programme-Ordner ziehen
3. Beim ersten Start ggf. unter *Systemeinstellungen > Datenschutz & Sicherheit* die Ausführung erlauben

## Erststart

Beim ersten Start muss die App zunächst mit einem **Lizenzschlüssel aktiviert** werden (siehe [Lizenzierung & Aktivierung](#lizenzierung--aktivierung)). Danach ist die App leer und eine **geführte Tour** startet automatisch und zeigt alle Bereiche. Es gibt drei Wege, Daten zu laden:

1. **CSV importieren** - Die mitgelieferte Sample-Datei `data/sample/kinder.csv` enthält Beispieldaten
2. **Manuell anlegen** - Kinder einzeln über das Stammdaten-Formular erfassen
3. **App-Tour starten** - Die Tour kann jederzeit über den **?**-Button im Header erneut gestartet werden

Im **Verwaltung**-Tab können zusätzlich Testdaten für vergangene Monate generiert werden, um die Auswertungen zu testen.

## Datenspeicherung

Alle Daten werden lokal auf dem Rechner gespeichert:

| Plattform | Speicherort |
|---|---|
| Windows | `%APPDATA%\kiga-essenverwaltung-data\` |
| macOS | `~/Library/Application Support/kiga-essenverwaltung-data/` |

Es wird keine Internetverbindung und kein externer Server benötigt.

Im Speicherordner liegen zwei Dateien:

- `kiga-essenverwaltung-data.json` – die eigentlichen Daten (Kinder, Essen, Gruppen), **verschlüsselt** (AES, Schlüssel aus dem Lizenzschlüssel abgeleitet)
- `kiga-license.json` – der Lizenz-Token, Lizenznehmer und ein Migrations-Flag (unverschlüsselt; der Token ist ein signiertes, nicht geheimes Artefakt)

## Lizenzierung & Aktivierung

Die App ist lizenzpflichtig und prüft beim Start einen **signierten Offline-Lizenzschlüssel** (Ed25519). Es ist keine Internetverbindung nötig.

### Für Anwender:innen

Beim ersten Start erscheint der Aktivierungs-Dialog. Den erhaltenen Lizenzschlüssel entweder direkt **einfügen** oder die gelieferte **`.lic`-Datei importieren** und auf *Aktivieren* klicken. Danach startet die App normal; der Lizenzstatus ist später unter **Verwaltung → System-Info** sichtbar.

### Für Vertrieb/Entwicklung – Lizenzschlüssel ausstellen

Schlüssel werden mit einem lokalen CLI-Tool erzeugt (nicht Teil der ausgelieferten App):

```bash
# Einmalig: Schlüsselpaar erzeugen. Den ausgegebenen Public Key in
# electron/licenseKey.js eintragen. Der Private Key landet unter
# scripts/license/private-key.pem (gitignored).
node scripts/license/generate-license.mjs keygen

# Pro Kunde einen Lizenzschlüssel signieren:
node scripts/license/generate-license.mjs sign --name "KiGa Mitte" --out kiga-mitte.lic
```

> ⚠️ **Wichtig:** `scripts/license/private-key.pem` ist der einzige Weg, neue Schlüssel für den in der App eingebetteten Public Key auszustellen. Die Datei ist gitignored – unbedingt sicher und **außerhalb des Repos** aufbewahren. Geht sie verloren, können keine neuen Lizenzen mehr erzeugt werden.

### Hinweise & Grenzen

- **Verschlüsselung:** Der Datendatei-Schlüssel wird aus dem Lizenzschlüssel abgeleitet und nie im Klartext gespeichert. Ein **Lizenzwechsel** macht bestehende Daten unlesbar – die Aktivierung blockiert das daher; ein Wechsel ist nur über Vollbackup-Export → Zurücksetzen → Re-Import möglich.
- **Schutzgrad:** Als ausgeliefertes JavaScript ist eine Electron-App nicht manipulationssicher. Es handelt sich um einen wirksamen **Zugangs-/Abschreckungsschutz** gegen gelegenheitsmäßige unbefugte Nutzung/Weitergabe, nicht um Schutz gegen einen entschlossenen Angreifer. Fälschungssicher ist hingegen das Ausstellen der Schlüssel (der Private Key bleibt beim Herausgeber).
- **Entwicklung/Tests:** Außerhalb von Electron (Browser/Dev/Tests) fehlt die Lizenz-API – dort läuft die App ohne Gate (Entwicklermodus).

## Keyboard-Shortcuts

| Tastenkombination | Aktion |
|---|---|
| `Ctrl+1` | Tageserfassung |
| `Ctrl+2` | Stammdaten |
| `Ctrl+3` | Monatsübersicht |
| `Ctrl+4` | Jahresübersicht |
| `Ctrl+5` | Auswertung |
| `Ctrl+6` | Verwaltung |

## App-Icon

Um ein eigenes App-Icon zu verwenden, die Icon-Dateien im Ordner `build/` ablegen:

- `build/icon.ico` - Windows (mindestens 256x256 px)
- `build/icon.icns` - macOS

Ohne diese Dateien verwendet electron-builder das Standard-Electron-Icon.

## Lizenz

MIT License - Copyright (c) 2026 Nils Lutz

Siehe [LICENSE](LICENSE) für Details.
