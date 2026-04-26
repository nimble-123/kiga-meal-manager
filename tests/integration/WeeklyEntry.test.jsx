import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../../src/App';
import { resetStore, seedStore } from '../setup';

// KW16/2026 = 2026-04-13 (Mo) – 2026-04-17 (Fr), keine Feiertage, ein Monat
const TODAY = '2026-04-15'; // Mittwoch in KW16
const MONDAY_KW16 = '2026-04-13';
const FRIDAY_KW16 = '2026-04-17';
const APRIL_KEY = 'meals-2026-04';
const MAY_KEY = 'meals-2026-05';

const testChildren = [
  { id: 'c1', name: 'Müller, Emma', gruppe: 'Delfin', but: false, zahlungspfl: '', adresse: '', kassenzeichen: '', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
  { id: 'c2', name: 'Fischer, Lian', gruppe: 'Dino', but: false, zahlungspfl: '', adresse: '', kassenzeichen: '', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
  { id: 'c3', name: 'Weber, Theo', gruppe: 'Delfin', but: false, zahlungspfl: '', adresse: '', kassenzeichen: '', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
];

async function setupWeekView(extraStore = {}) {
  seedStore({
    children: testChildren,
    gruppen: ['Delfin', 'Dino'],
    tourCompleted: true,
    [APRIL_KEY]: {
      [MONDAY_KW16]: { prices: { A: 3.5, B: 4 }, selections: {}, abmeldungen: {} },
    },
    ...extraStore,
  });
  const result = render(<App />);
  await waitFor(() => screen.getByText('Müller, Emma'));

  // Wechsel zum Wochenerfassungs-Tab
  fireEvent.click(screen.getByText(/Wochenerfassung/));
  await waitFor(() => screen.getByText(/Gerichtpreise diese Woche/));

  return result;
}

function getColumnHeaderForDate(date) {
  // ISO YYYY-MM-DD -> Tag (DD.MM.) wird im Header angezeigt
  const [y, m, d] = date.split('-');
  const label = `${d}.${m}.`;
  // suche im thead nach Zelle mit diesem Label
  const heads = document.querySelectorAll('thead th');
  return Array.from(heads).find((h) => h.textContent.includes(label));
}

function getColumnBulkButton(date, gericht) {
  const th = getColumnHeaderForDate(date);
  if (!th) return null;
  const buttons = th.querySelectorAll('.meal-btn');
  return Array.from(buttons).find((b) => b.textContent === gericht);
}

function getRowCellsForChild(name) {
  const row = screen.getByText(name).closest('tr');
  return row.querySelectorAll('td');
}

function getCellButtonsForChildAtColumn(childName, columnIndex) {
  const cells = getRowCellsForChild(childName);
  // Spalten: 0=#, 1=Name, 2=Gruppe, 3..7=Tage Mo-Fr, 8=Betrag
  const cell = cells[3 + columnIndex];
  return cell.querySelectorAll('.meal-btn');
}

describe('WeeklyEntry', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(TODAY + 'T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rendert Wochenmatrix mit Mo-Fr', async () => {
    await setupWeekView();
    expect(getColumnHeaderForDate(MONDAY_KW16)).toBeTruthy();
    expect(getColumnHeaderForDate('2026-04-14')).toBeTruthy();
    expect(getColumnHeaderForDate('2026-04-15')).toBeTruthy();
    expect(getColumnHeaderForDate('2026-04-16')).toBeTruthy();
    expect(getColumnHeaderForDate(FRIDAY_KW16)).toBeTruthy();
  });

  it('Spalten-Bulk weist allen Kindern eines Tages Gericht zu', async () => {
    await setupWeekView();
    const btnA = getColumnBulkButton(MONDAY_KW16, 'A');
    expect(btnA).toBeTruthy();
    fireEvent.click(btnA);

    await waitFor(() => {
      for (const name of ['Müller, Emma', 'Fischer, Lian', 'Weber, Theo']) {
        const buttons = getCellButtonsForChildAtColumn(name, 0); // Mo
        const btn = Array.from(buttons).find((b) => b.textContent === 'A');
        expect(btn.className).toContain('active');
      }
    });
  });

  it('Spalten-Bulk respektiert Gruppen-Filter', async () => {
    await setupWeekView();
    const select = screen.getAllByRole('combobox')[0];
    fireEvent.change(select, { target: { value: 'Delfin' } });

    await waitFor(() => {
      expect(screen.queryByText('Fischer, Lian')).not.toBeInTheDocument();
    });

    fireEvent.click(getColumnBulkButton(MONDAY_KW16, 'A'));

    await waitFor(() => {
      const buttons = getCellButtonsForChildAtColumn('Müller, Emma', 0);
      const btnA = Array.from(buttons).find((b) => b.textContent === 'A');
      expect(btnA.className).toContain('active');
    });

    // Wechsel zurück zu Alle - Fischer hat A nicht
    fireEvent.change(select, { target: { value: 'Alle' } });
    await waitFor(() => {
      const buttons = getCellButtonsForChildAtColumn('Fischer, Lian', 0);
      const btnA = Array.from(buttons).find((b) => b.textContent === 'A');
      expect(btnA.className).not.toContain('active');
    });
  });

  it('Zellen-Klick setzt Auswahl nur für diesen Tag', async () => {
    await setupWeekView();
    const buttons = getCellButtonsForChildAtColumn('Müller, Emma', 0); // Mo
    const btnA = Array.from(buttons).find((b) => b.textContent === 'A');
    fireEvent.click(btnA);

    await waitFor(() => {
      const recheck = getCellButtonsForChildAtColumn('Müller, Emma', 0);
      const a = Array.from(recheck).find((b) => b.textContent === 'A');
      expect(a.className).toContain('active');
    });

    // Dienstag bleibt unverändert
    const tueButtons = getCellButtonsForChildAtColumn('Müller, Emma', 1);
    const tueA = Array.from(tueButtons).find((b) => b.textContent === 'A');
    expect(tueA.className).not.toContain('active');
  });

  it('geschlossene Tage zeigen keine Bulk-Buttons (Sonntag oder Feiertag)', async () => {
    // Wochen-Anchor auf KW18/2026 setzen, wo Fr=01.05. Tag der Arbeit ist (Feiertag)
    vi.setSystemTime(new Date('2026-04-29T12:00:00'));
    seedStore({
      children: testChildren,
      gruppen: ['Delfin', 'Dino'],
      tourCompleted: true,
    });
    render(<App />);
    await waitFor(() => screen.getByText('Müller, Emma'));
    fireEvent.click(screen.getByText(/Wochenerfassung/));
    await waitFor(() => screen.getByText(/Gerichtpreise diese Woche/));

    const fridayHeader = getColumnHeaderForDate('2026-05-01');
    expect(fridayHeader).toBeTruthy();
    expect(fridayHeader.textContent).toContain('Geschlossen');
    // keine Bulk-Buttons in dieser Spalte
    const buttons = fridayHeader.querySelectorAll('.meal-btn');
    expect(buttons.length).toBe(0);
  });

  it('Cross-Month: Auswahl in Mo (Dez) und Fr (Jan) wird in beide Stores geschrieben', async () => {
    // KW19/2026 = 2026-05-04 bis 2026-05-08 — alle im Mai. Brauchen also andere Woche.
    // Stattdessen: KW18 mit Auswahl für Mo (27.04, April). Und in einer anderen Woche teste ich Mai.
    // Pragmatisch: KW18 hat Mo–Do im April und Fr-Feiertag. Schreibe daher manuell selektion in
    // April und prüfe, dass writeStores beide Monate hält. Alternative: KW53/2025-Übergang.
    // 2025-12-29 (Mo) bis 2026-01-02 (Fr) wäre KW1/2026 mit Mo+Di+Mi im Dezember, Do+Fr im Januar.
    vi.setSystemTime(new Date('2025-12-30T12:00:00'));
    seedStore({
      children: testChildren,
      gruppen: ['Delfin', 'Dino'],
      tourCompleted: true,
      'meals-2025-12': {
        '2025-12-29': { prices: { A: 3.5 }, selections: {}, abmeldungen: {} },
      },
      'meals-2026-01': {
        '2026-01-02': { prices: { A: 3.5 }, selections: {}, abmeldungen: {} },
      },
    });
    render(<App />);
    await waitFor(() => screen.getByText('Müller, Emma'));
    fireEvent.click(screen.getByText(/Wochenerfassung/));
    await waitFor(() => screen.getByText(/Gerichtpreise diese Woche/));

    // 2025-12-29 ist Mo (Dezember), 2026-01-02 ist Fr (Januar) und kein Feiertag
    // (Neujahr 2026-01-01 = Donnerstag, Feiertag)
    const monBtn = getColumnBulkButton('2025-12-29', 'A');
    const friBtn = getColumnBulkButton('2026-01-02', 'A');
    expect(monBtn).toBeTruthy();
    expect(friBtn).toBeTruthy();

    fireEvent.click(monBtn);
    await waitFor(async () => {
      const dec = await window.api.store.get('meals-2025-12');
      expect(dec['2025-12-29']?.selections?.c1).toBe('A');
    });

    fireEvent.click(friBtn);
    await waitFor(async () => {
      const jan = await window.api.store.get('meals-2026-01');
      expect(jan['2026-01-02']?.selections?.c1).toBe('A');
    });
  });

  it('Vorwoche übernehmen kopiert selections', async () => {
    // KW16 = aktuelle Woche, KW15 = Vorwoche (2026-04-06 bis 2026-04-10).
    // 2026-04-06 ist Ostermontag (Feiertag) - kein Problem, Mo wird übersprungen
    seedStore({
      children: testChildren,
      gruppen: ['Delfin', 'Dino'],
      tourCompleted: true,
      [APRIL_KEY]: {
        '2026-04-07': { prices: { A: 3.5 }, selections: { c1: 'A', c2: 'A' }, abmeldungen: {} },
        '2026-04-08': { prices: { A: 3.5 }, selections: { c1: 'A', c2: 'A', c3: 'A' }, abmeldungen: {} },
        // KW16 leer
        '2026-04-13': { prices: { A: 3.5 }, selections: {}, abmeldungen: {} },
      },
    });
    render(<App />);
    await waitFor(() => screen.getByText('Müller, Emma'));
    fireEvent.click(screen.getByText(/Wochenerfassung/));
    await waitFor(() => screen.getByText(/Gerichtpreise diese Woche/));

    // KW16 sollte aktiv sein; "Vorwoche übernehmen" klicken
    fireEvent.click(screen.getByText(/Vorwoche übernehmen/));

    await waitFor(async () => {
      const data = await window.api.store.get(APRIL_KEY);
      // Di KW16 (14.04.) bekommt selections von Di KW15 (07.04.)
      expect(data['2026-04-14']?.selections?.c1).toBe('A');
      expect(data['2026-04-14']?.selections?.c2).toBe('A');
      // Mi KW16 (15.04.) bekommt selections von Mi KW15 (08.04.)
      expect(data['2026-04-15']?.selections?.c3).toBe('A');
    });
  });

  it('Heute-Modus zeigt nur eingeplante Kinder', async () => {
    seedStore({
      children: testChildren,
      gruppen: ['Delfin', 'Dino'],
      tourCompleted: true,
      [APRIL_KEY]: {
        [TODAY]: {
          prices: { A: 3.5 },
          selections: { c1: 'A', c2: 'A' }, // Weber c3 nicht eingeplant
          abmeldungen: {},
        },
      },
    });
    render(<App />);
    await waitFor(() => screen.getByText('Müller, Emma'));
    fireEvent.click(screen.getByText(/Wochenerfassung/));
    await waitFor(() => screen.getByText(/Gerichtpreise diese Woche/));

    // Wechsel zu Heute-Modus
    fireEvent.click(screen.getByText(/Heute \(Abmeldungen\)/));
    await waitFor(() => screen.getByText(/Schnellansicht/));

    // c1 und c2 sichtbar, c3 nicht
    expect(screen.getByText('Müller, Emma')).toBeInTheDocument();
    expect(screen.getByText('Fischer, Lian')).toBeInTheDocument();
    expect(screen.queryByText('Weber, Theo')).not.toBeInTheDocument();
  });

  it('Abmeldung zieht Kosten NICHT vom Wochenbetrag ab (konsistent zu Tageserfassung)', async () => {
    seedStore({
      children: testChildren,
      gruppen: ['Delfin', 'Dino'],
      tourCompleted: true,
      [APRIL_KEY]: {
        // Mo: alle drei A (3,50 € * 3 = 10,50 €), c2 abgemeldet
        [MONDAY_KW16]: {
          prices: { A: 3.5 },
          selections: { c1: 'A', c2: 'A', c3: 'A' },
          abmeldungen: { c2: { active: true, grund: 'krank' } },
        },
      },
    });
    render(<App />);
    await waitFor(() => screen.getByText('Müller, Emma'));
    fireEvent.click(screen.getByText(/Wochenerfassung/));
    await waitFor(() => screen.getByText(/Gerichtpreise diese Woche/));

    // Wochen-Footer: 10,50 € (Abmeldung wird NICHT abgezogen)
    await waitFor(() => {
      expect(screen.getByText(/Wochen-Gesamt/).textContent).toContain('3 Essen');
    });
    expect(screen.getByText(/Wochen-Gesamt/).textContent).toContain('1 abgemeldet');
    // Betrag-Span (separater span mit color #059669)
    const totalText = document.body.textContent;
    expect(totalText).toContain('10,50');
  });

  it('Heute-Modus: Tagesbetrag inkl. abgemeldete (konsistent zu Tageserfassung)', async () => {
    seedStore({
      children: testChildren,
      gruppen: ['Delfin', 'Dino'],
      tourCompleted: true,
      [APRIL_KEY]: {
        [TODAY]: {
          prices: { A: 3.5 },
          selections: { c1: 'A', c2: 'A' },
          abmeldungen: { c1: { active: true, grund: 'krank' } },
        },
      },
    });
    render(<App />);
    await waitFor(() => screen.getByText('Müller, Emma'));
    fireEvent.click(screen.getByText(/Wochenerfassung/));
    await waitFor(() => screen.getByText(/Gerichtpreise diese Woche/));
    fireEvent.click(screen.getByText(/Heute \(Abmeldungen\)/));
    await waitFor(() => screen.getByText(/Schnellansicht/));

    // Footer: 7,00 € (2 Essen, eines abgemeldet aber Kosten bleiben)
    await waitFor(() => {
      const footers = document.querySelectorAll('div[style*="border-top"]');
      const summary = Array.from(footers).find((f) => f.textContent.includes('Essen'));
      expect(summary?.textContent).toContain('2 Essen');
      expect(summary?.textContent).toContain('1 abgemeldet');
      expect(summary?.textContent).toContain('7,00');
    });
  });

  it('Konsistenz: identische Tagesdaten ergeben identische Footer-Beträge in Tages- und Wochen-Heute', async () => {
    const dayPayload = {
      prices: { A: 3.5, B: 4 },
      selections: { c1: 'A', c2: 'B', c3: 'A' }, // 3,50 + 4,00 + 3,50 = 11,00 €
      abmeldungen: { c2: { active: true, grund: 'krank' } },
    };
    seedStore({
      children: testChildren,
      gruppen: ['Delfin', 'Dino'],
      tourCompleted: true,
      [APRIL_KEY]: { [TODAY]: dayPayload },
    });
    render(<App />);
    await waitFor(() => screen.getByText('Müller, Emma'));

    // 1) Tageserfassung-Footer für TODAY
    const dateInput = screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}/);
    fireEvent.change(dateInput, { target: { value: TODAY } });
    await waitFor(() => screen.getByText('Gerichtpreise heute'));
    const dailyFooter = document.querySelector('#tour-daily-summary');
    expect(dailyFooter.textContent).toContain('11,00');
    expect(dailyFooter.textContent).toContain('1 abgemeldet');

    // 2) Wechsel zu Wochenerfassung > Heute
    fireEvent.click(screen.getByText(/Wochenerfassung/));
    await waitFor(() => screen.getByText(/Gerichtpreise diese Woche/));
    fireEvent.click(screen.getByText(/Heute \(Abmeldungen\)/));
    await waitFor(() => screen.getByText(/Schnellansicht/));

    // Footer der Heute-Schnellansicht muss denselben Betrag zeigen
    const todayFooters = document.querySelectorAll('div[style*="border-top"]');
    const todaySummary = Array.from(todayFooters).find((f) => /Essen/.test(f.textContent));
    expect(todaySummary?.textContent).toContain('11,00');
    expect(todaySummary?.textContent).toContain('1 abgemeldet');
  });

  it('Auswahl in Wochenerfassung ist sofort in Tageserfassung sichtbar', async () => {
    seedStore({
      children: testChildren,
      gruppen: ['Delfin', 'Dino'],
      tourCompleted: true,
      [APRIL_KEY]: {
        [TODAY]: { prices: { A: 3.5, B: 4 }, selections: {}, abmeldungen: {} },
      },
    });
    render(<App />);
    await waitFor(() => screen.getByText('Müller, Emma'));

    // In Wochenerfassung Mittwoch (heute) per Spalten-Bulk auf A
    fireEvent.click(screen.getByText(/Wochenerfassung/));
    await waitFor(() => screen.getByText(/Gerichtpreise diese Woche/));
    const colA = getColumnBulkButton(TODAY, 'A');
    fireEvent.click(colA);

    // Wechsel zu Tageserfassung
    fireEvent.click(screen.getByText(/Tageserfassung/));
    await waitFor(() => screen.getByText('Gerichtpreise heute'));

    // Im Tageserfassungs-Tab sollte für Müller, Emma das Gericht A aktiv sein
    await waitFor(() => {
      const row = screen.getByText('Müller, Emma').closest('tr');
      const buttons = row.querySelectorAll('.meal-btn');
      const btnA = Array.from(buttons).find((b) => b.textContent === 'A');
      expect(btnA.className).toContain('active');
    });
  });

  it('Abmeldung in Heute-Modus schreibt korrekt in Storage', async () => {
    seedStore({
      children: testChildren,
      gruppen: ['Delfin', 'Dino'],
      tourCompleted: true,
      [APRIL_KEY]: {
        [TODAY]: {
          prices: { A: 3.5 },
          selections: { c1: 'A' },
          abmeldungen: {},
        },
      },
    });
    render(<App />);
    await waitFor(() => screen.getByText('Müller, Emma'));
    fireEvent.click(screen.getByText(/Wochenerfassung/));
    await waitFor(() => screen.getByText(/Gerichtpreise diese Woche/));
    fireEvent.click(screen.getByText(/Heute \(Abmeldungen\)/));
    await waitFor(() => screen.getByText(/Schnellansicht/));

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    await waitFor(async () => {
      const data = await window.api.store.get(APRIL_KEY);
      expect(data[TODAY]?.abmeldungen?.c1?.active).toBe(true);
    });
  });
});
