import { test, expect } from '@playwright/test';

// Helper: seed localStorage with test data
async function seedData(page) {
  await page.evaluate(() => {
    const children = [
      { id: 'c1', name: 'Müller, Emma', gruppe: 'Delfin', but: false, zahlungspfl: 'Müller, Sandra', adresse: 'Gartenweg 3', kassenzeichen: '10.001', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
      { id: 'c2', name: 'Fischer, Lian', gruppe: 'Dino', but: true, zahlungspfl: 'Fischer, Maria', adresse: 'Birkenstr. 24', kassenzeichen: '10.002', hinweise: 'vegetarisch', status: 'aktiv', eintritt: '', austritt: '' },
      { id: 'c3', name: 'Weber, Mathis', gruppe: 'Delfin', but: false, zahlungspfl: 'Weber, Stefan', adresse: 'Lindenallee 5', kassenzeichen: '10.003', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
    ];
    const gruppen = ['Delfin', 'Dino'];
    localStorage.setItem('children', JSON.stringify(children));
    localStorage.setItem('gruppen', JSON.stringify(gruppen));
    localStorage.setItem('tourCompleted', JSON.stringify(true));
  });
}

test.describe('Empty State', () => {
  test('shows welcome screen on first launch', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Willkommen bei KiGa Essenverwaltung')).toBeVisible();
    await expect(page.getByText('Kinder aus CSV importieren')).toBeVisible();
    await expect(page.getByText('Kind manuell anlegen')).toBeVisible();
  });

  test('clicking "Kind manuell anlegen" navigates to Stammdaten', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Kind manuell anlegen').click();
    await expect(page.getByText('Kind hinzufügen')).toBeVisible();
  });

  test('other tabs are accessible from empty state', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Verwaltung/ }).click();
    await expect(page.getByText('Stammdaten Import / Export')).toBeVisible();
  });
});

test.describe('Tageserfassung', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await seedData(page);
    await page.reload();
  });

  test('shows children table', async ({ page }) => {
    await expect(page.getByText('Müller, Emma')).toBeVisible();
    await expect(page.getByText('Fischer, Lian')).toBeVisible();
  });

  test('shows date picker and group filter', async ({ page }) => {
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('select.input').first()).toBeVisible();
  });

  test('can filter by group', async ({ page }) => {
    await page.locator('select.input').first().selectOption('Delfin');
    await expect(page.getByText('Müller, Emma')).toBeVisible();
    await expect(page.getByText('Fischer, Lian')).not.toBeVisible();
  });

  test('shows price inputs for meals', async ({ page }) => {
    // Set date to a weekday that is not a holiday
    await page.locator('input[type="date"]').fill('2026-04-08');
    await expect(page.getByText('Gerichtpreise heute')).toBeVisible();
  });

  test('total shows meal breakdown', async ({ page }) => {
    await expect(page.getByText(/Gesamt:.*Essen/)).toBeVisible();
  });
});

test.describe('Stammdaten', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await seedData(page);
    await page.reload();
    await page.getByRole('button', { name: /Stammdaten/ }).click();
  });

  test('shows children list with all columns', async ({ page }) => {
    await expect(page.getByText('Müller, Emma')).toBeVisible();
    await expect(page.getByText('aktiv').first()).toBeVisible();
  });

  test('can add a new child', async ({ page }) => {
    await page.getByText('+ Kind hinzufügen').click();
    await page.getByPlaceholder('Nachname, Vorname').fill('Testmann, Max');
    await page.getByText('Speichern').click();
    await expect(page.getByText('Testmann, Max')).toBeVisible();
  });

  test('has inline group management', async ({ page }) => {
    await page.getByText('Gruppen verwalten').click();
    await expect(page.getByPlaceholder('Neue Gruppe...')).toBeVisible();
    // Groups are shown as badges inside the Gruppen panel
    await expect(page.locator('.inline-block', { hasText: 'Delfin' }).first()).toBeVisible();
    await expect(page.locator('.inline-block', { hasText: 'Dino' }).first()).toBeVisible();
  });

  test('can add a new group in Stammdaten', async ({ page }) => {
    await page.getByText('Gruppen verwalten').click();
    await page.getByPlaceholder('Neue Gruppe...').fill('Pinguin');
    await page.getByText('+ Hinzufügen').click();
    await expect(page.locator('.inline-block', { hasText: 'Pinguin' })).toBeVisible();
  });

  test('sortable table headers work', async ({ page }) => {
    // Click Name header to sort
    await page.locator('th.sortable').first().click();
    await expect(page.locator('.sort-indicator.active')).toBeVisible();
  });

  test('can delete a child with confirmation', async ({ page }) => {
    // Click delete button on first child
    await page.locator('[data-tooltip="Löschen"]').first().click();
    await expect(page.getByText('Kind löschen')).toBeVisible();
    await expect(page.getByText(/unwiderruflich löschen/)).toBeVisible();

    // Cancel first
    await page.getByText('Abbrechen').click();
    await expect(page.getByText('Kind löschen')).not.toBeVisible();

    // Delete for real
    await page.locator('[data-tooltip="Löschen"]').first().click();
    await page.getByRole('button', { name: 'Löschen', exact: true }).click();
    await expect(page.getByText('Kind löschen')).not.toBeVisible();
  });

  test('scrolls to top when editing', async ({ page }) => {
    await page.locator('[data-tooltip="Bearbeiten"]').first().click();
    await expect(page.getByText('Kind bearbeiten')).toBeVisible();
  });
});

test.describe('Monatsübersicht', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await seedData(page);
    await page.reload();
    await page.getByRole('button', { name: /Monatsübersicht/ }).click();
  });

  test('shows month and year selectors', async ({ page }) => {
    await expect(page.locator('select.input').first()).toBeVisible();
    await expect(page.locator('input[type="number"]')).toBeVisible();
  });

  test('shows CSV export and email buttons', async ({ page }) => {
    await expect(page.getByText('CSV Export')).toBeVisible();
    await expect(page.getByText('Per E-Mail')).toBeVisible();
  });

  test('shows total footer', async ({ page }) => {
    await expect(page.getByText(/Gesamt:.*Essen/)).toBeVisible();
  });
});

test.describe('Jahresübersicht', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await seedData(page);
    await page.reload();
    await page.getByRole('button', { name: /Jahresübersicht/ }).click();
  });

  test('shows 12 month columns', async ({ page }) => {
    await expect(page.getByText('Jan')).toBeVisible();
    await expect(page.getByText('Dez')).toBeVisible();
  });

  test('shows yearly total footer', async ({ page }) => {
    await expect(page.getByText(/Jahressumme/)).toBeVisible();
  });
});

test.describe('Auswertung', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await seedData(page);
    await page.reload();
    await page.getByRole('button', { name: /Auswertung/ }).click();
  });

  test('shows empty state when no meal data', async ({ page }) => {
    await expect(page.getByText(/Keine Essensdaten/)).toBeVisible();
  });

  test('shows year selector', async ({ page }) => {
    await expect(page.locator('input[type="number"]')).toBeVisible();
  });
});

test.describe('Verwaltung', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await seedData(page);
    await page.reload();
    await page.getByRole('button', { name: /Verwaltung/ }).click();
  });

  test('shows all admin sections', async ({ page }) => {
    await expect(page.getByText('Stammdaten Import / Export')).toBeVisible();
    await expect(page.getByText('Bewegungsdaten Import / Export')).toBeVisible();
    await expect(page.getByText('Testdaten generieren')).toBeVisible();
    await expect(page.getByText('Backup / Restore')).toBeVisible();
    await expect(page.getByText('System-Info')).toBeVisible();
  });

  test('shows description texts in panels', async ({ page }) => {
    // Stammdaten section is defaultOpen
    await expect(page.getByText('Exportiere oder importiere Kinderdaten')).toBeVisible();
  });

  test('shows system info when expanded', async ({ page }) => {
    await page.getByText('System-Info').click();
    await expect(page.getByText(/Version:/)).toBeVisible();
    await expect(page.getByText('Kinder (gesamt / aktiv):')).toBeVisible();
  });

  test('stammdaten section shows CSV and JSON buttons', async ({ page }) => {
    // Stammdaten is now defaultOpen
    await expect(page.getByText('CSV exportieren').first()).toBeVisible();
    await expect(page.getByText('JSON exportieren').first()).toBeVisible();
  });

  test('shows "Alle löschen" button for Stammdaten', async ({ page }) => {
    await expect(page.getByText(/Alle löschen.*Kinder/)).toBeVisible();
  });

  test('bewegungsdaten section has CSV and JSON buttons', async ({ page }) => {
    await page.getByText('Bewegungsdaten Import / Export').click();
    await expect(page.getByText('CSV exportieren').first()).toBeVisible();
    await expect(page.getByText('JSON exportieren').first()).toBeVisible();
    await expect(page.getByText('CSV importieren').first()).toBeVisible();
    await expect(page.getByText('JSON importieren').first()).toBeVisible();
  });

  test('bewegungsdaten shows CSV format hint', async ({ page }) => {
    await page.getByText('Bewegungsdaten Import / Export').click();
    await expect(page.getByText(/Datum;Name;Gericht;Preis/)).toBeVisible();
  });

  test('backup section shows auto-backup settings', async ({ page }) => {
    await page.getByText('Backup / Restore').click();
    await expect(page.getByText('Automatisches Backup')).toBeVisible();
    // In browser mode, auto-backup is not available
    await expect(page.getByText(/Desktop-Version/)).toBeVisible();
  });
});

test.describe('Keyboard Shortcuts', () => {
  test('Ctrl+1-7 switches tabs', async ({ page }) => {
    await page.goto('/');
    await seedData(page);
    await page.reload();
    await expect(page.getByText('Müller, Emma')).toBeVisible();

    // Ctrl+3 → Stammdaten (verschoben durch neuen Wochen-Tab auf Position 2)
    await page.keyboard.press('Control+3');
    await expect(page.getByText('Kind hinzufügen')).toBeVisible();

    // Ctrl+7 → Verwaltung
    await page.keyboard.press('Control+7');
    await expect(page.getByText('Stammdaten Import / Export')).toBeVisible();

    // Ctrl+2 → Wochenerfassung
    await page.keyboard.press('Control+2');
    await expect(page.getByText('Gerichtpreise diese Woche')).toBeVisible();

    // Ctrl+1 → Tageserfassung
    await page.keyboard.press('Control+1');
    await expect(page.getByText('Müller, Emma')).toBeVisible();
  });
});

// Helper: pin the system clock so the rendered week is deterministic.
// 2026-04-15 ist Mittwoch in KW16 (Mo 13.04. – Fr 17.04.), kein Feiertag, ein Monat.
async function pinDate(page, iso = '2026-04-15T12:00:00') {
  await page.addInitScript((isoStr) => {
    const FIXED = new Date(isoStr).getTime();
    const RealDate = Date;
    function FakeDate(...args) {
      if (!(this instanceof FakeDate)) return new RealDate(FIXED).toString();
      return args.length === 0 ? new RealDate(FIXED) : new RealDate(...args);
    }
    FakeDate.prototype = RealDate.prototype;
    FakeDate.now = () => FIXED;
    FakeDate.parse = RealDate.parse;
    FakeDate.UTC = RealDate.UTC;
    // eslint-disable-next-line no-global-assign
    Date = FakeDate;
  }, iso);
}

async function seedWeekData(page, mealsApr = {}) {
  await page.evaluate((meals) => {
    localStorage.setItem('meals-2026-04', JSON.stringify(meals));
  }, mealsApr);
}

test.describe('Wochenerfassung', () => {
  test.beforeEach(async ({ page }) => {
    await pinDate(page);
    await page.goto('/');
    await seedData(page);
    await seedWeekData(page, {
      '2026-04-13': { prices: { A: 3.5, B: 4 }, selections: {}, abmeldungen: {} },
      '2026-04-14': { prices: { A: 3.5, B: 4 }, selections: {}, abmeldungen: {} },
      '2026-04-15': { prices: { A: 3.5, B: 4 }, selections: {}, abmeldungen: {} },
      '2026-04-16': { prices: { A: 3.5, B: 4 }, selections: {}, abmeldungen: {} },
      '2026-04-17': { prices: { A: 3.5, B: 4 }, selections: {}, abmeldungen: {} },
    });
    await page.reload();
    await page.getByRole('button', { name: /Wochenerfassung/ }).click();
    await expect(page.getByText('Gerichtpreise diese Woche')).toBeVisible();
  });

  test('zeigt KW und Datumsbereich an', async ({ page }) => {
    await expect(page.getByText(/KW 16 \/ 2026/)).toBeVisible();
    await expect(page.getByText(/13\.04\.\s*–\s*17\.04\./)).toBeVisible();
  });

  test('rendert Mo-Fr Spaltenheader mit Datum', async ({ page }) => {
    const thead = page.locator('thead');
    await expect(thead.getByText(/Mo 13\.04\./)).toBeVisible();
    await expect(thead.getByText(/Di 14\.04\./)).toBeVisible();
    await expect(thead.getByText(/Mi 15\.04\./)).toBeVisible();
    await expect(thead.getByText(/Do 16\.04\./)).toBeVisible();
    await expect(thead.getByText(/Fr 17\.04\./)).toBeVisible();
    // Heute ist Mi 15.04.
    await expect(thead.getByText('HEUTE')).toBeVisible();
  });

  test('Spalten-Bulk weist Gericht allen Kindern eines Tages zu', async ({ page }) => {
    // Klicke den A-Bulk-Button im Header der Mo-Spalte (13.04.)
    const monHeader = page.locator('thead th', { hasText: '13.04.' });
    await monHeader.locator('.meal-btn', { hasText: 'A' }).click();

    // Überprüfe alle drei Kinder haben in Mo-Spalte A aktiv
    for (const name of ['Müller, Emma', 'Fischer, Lian', 'Weber, Mathis']) {
      const row = page.getByRole('row', { name: new RegExp(name) });
      // Zellen pro Zeile: 0=#, 1=Name, 2=Gruppe, 3=Mo, 4=Di, 5=Mi, 6=Do, 7=Fr, 8=Betrag
      const monCell = row.locator('td').nth(3);
      await expect(monCell.locator('.meal-btn.active', { hasText: 'A' })).toBeVisible();
    }
  });

  test('Zellen-Klick setzt Auswahl nur für diesen Tag', async ({ page }) => {
    const row = page.getByRole('row', { name: /Müller, Emma/ });
    const monCell = row.locator('td').nth(3);
    await monCell.locator('.meal-btn', { hasText: 'A' }).click();
    await expect(monCell.locator('.meal-btn.active', { hasText: 'A' })).toBeVisible();

    // Dienstag-Spalte ist unverändert
    const tueCell = row.locator('td').nth(4);
    await expect(tueCell.locator('.meal-btn.active')).toHaveCount(0);
  });

  test('Heute-Modus zeigt Schnellansicht für tagesaktuelle Abmeldungen', async ({ page }) => {
    // Erst eine Auswahl für Mittwoch (heute) setzen
    const row = page.getByRole('row', { name: /Müller, Emma/ });
    const wedCell = row.locator('td').nth(5);
    await wedCell.locator('.meal-btn', { hasText: 'A' }).click();

    // In Heute-Modus wechseln
    await page.getByRole('button', { name: /Heute \(Abmeldungen\)/ }).click();
    await expect(page.getByText(/Schnellansicht/)).toBeVisible();
    await expect(page.getByText('Müller, Emma')).toBeVisible();
    // Weber hat keine Auswahl für heute -> nicht in Schnellansicht
    await expect(page.getByText('Weber, Mathis')).not.toBeVisible();
  });

  test('Wochennavigation: Vor/Zurück wechselt Wochen', async ({ page }) => {
    await expect(page.getByText(/KW 16 \/ 2026/)).toBeVisible();

    await page.locator('button[data-tooltip="Vorherige Woche"]').click();
    await expect(page.getByText(/KW 15 \/ 2026/)).toBeVisible();

    await page.locator('button[data-tooltip="Nächste Woche"]').click();
    await expect(page.getByText(/KW 16 \/ 2026/)).toBeVisible();

    await page.locator('button[data-tooltip="Nächste Woche"]').click();
    await expect(page.getByText(/KW 17 \/ 2026/)).toBeVisible();
  });

  test('Vorwoche-Button kopiert Auswahlen aus der vorherigen Werkwoche', async ({ page }) => {
    // Befülle KW15 (06.04. - 10.04.) - 06.04. ist Ostermontag (Feiertag, übersprungen)
    await page.evaluate(() => {
      const apr = JSON.parse(localStorage.getItem('meals-2026-04') || '{}');
      apr['2026-04-07'] = { prices: { A: 3.5 }, selections: { c1: 'A', c2: 'B' }, abmeldungen: {} };
      apr['2026-04-08'] = { prices: { A: 3.5 }, selections: { c1: 'A' }, abmeldungen: {} };
      localStorage.setItem('meals-2026-04', JSON.stringify(apr));
    });
    await page.reload();
    await page.getByRole('button', { name: /Wochenerfassung/ }).click();
    await expect(page.getByText('Gerichtpreise diese Woche')).toBeVisible();

    // Vorwoche übernehmen
    await page.getByRole('button', { name: /Vorwoche übernehmen/ }).click();

    // KW16 Di (14.04.) sollte c1=A und c2=B haben (kopiert von 07.04.)
    const emmaRow = page.getByRole('row', { name: /Müller, Emma/ });
    await expect(emmaRow.locator('td').nth(4).locator('.meal-btn.active', { hasText: 'A' })).toBeVisible();
    const lianRow = page.getByRole('row', { name: /Fischer, Lian/ });
    await expect(lianRow.locator('td').nth(4).locator('.meal-btn.active', { hasText: 'B' })).toBeVisible();
  });

  test('Cross-Hook-Sync: Eingabe in Wochenerfassung ist sofort in Tageserfassung sichtbar', async ({ page }) => {
    // Spalten-Bulk A für Mittwoch (heute, 15.04.)
    const wedHeader = page.locator('thead th', { hasText: '15.04.' });
    await wedHeader.locator('.meal-btn', { hasText: 'A' }).click();

    // Wechsel zu Tageserfassung
    await page.getByRole('button', { name: /Tageserfassung/ }).click();
    await expect(page.getByText('Gerichtpreise heute')).toBeVisible();

    // Datum auf 2026-04-15 setzen (heute ist eh Mittwoch, sollte default sein)
    await page.locator('input[type="date"]').fill('2026-04-15');

    // Müller, Emma sollte A aktiv haben
    const emmaRow = page.getByRole('row', { name: /Müller, Emma/ });
    await expect(emmaRow.locator('.meal-btn.active', { hasText: 'A' })).toBeVisible();
  });

  test('Cross-Hook-Sync: Wochen-Eingaben tauchen in Monatsübersicht auf', async ({ page }) => {
    // In Wochenerfassung: A für Mo allen zuweisen
    const monHeader = page.locator('thead th', { hasText: '13.04.' });
    await monHeader.locator('.meal-btn', { hasText: 'A' }).click();

    // Wechsel zu Monatsübersicht
    await page.getByRole('button', { name: /Monatsübersicht/ }).click();
    // April 2026 sollte default sein, sonst auswählen
    await page.locator('select.input').first().selectOption({ label: 'April' });
    await page.locator('input[type="number"]').fill('2026');

    // Gesamt-Footer sollte 3 Essen anzeigen (Müller + Fischer + Weber)
    await expect(page.getByText(/Gesamt:\s*3\s*Essen/)).toBeVisible();
  });

  test('Abmeldung: Betrag bleibt erhalten (konsistent zu Tageserfassung)', async ({ page }) => {
    // Setze für Mi (heute) Daten mit Abmeldung
    await page.evaluate(() => {
      const apr = {
        '2026-04-15': {
          prices: { A: 3.5, B: 4 },
          selections: { c1: 'A', c2: 'B', c3: 'A' }, // 3,50 + 4,00 + 3,50 = 11,00 €
          abmeldungen: { c2: { active: true, grund: 'krank' } },
        },
      };
      localStorage.setItem('meals-2026-04', JSON.stringify(apr));
    });
    await page.reload();

    // Tageserfassung: Footer mit 11,00 € + "1 abgemeldet"
    await page.locator('input[type="date"]').fill('2026-04-15');
    const dailyFooter = page.locator('#tour-daily-summary');
    await expect(dailyFooter).toContainText('11,00');
    await expect(dailyFooter).toContainText('1 abgemeldet');

    // Wochenerfassung-Footer (KW16): Wochen-Gesamt zeigt denselben Betrag (nur ein Tag befüllt)
    await page.getByRole('button', { name: /Wochenerfassung/ }).click();
    await expect(page.getByText('Gerichtpreise diese Woche')).toBeVisible();
    const weekFooter = page.locator('div', { hasText: /Wochen-Gesamt/ }).last();
    await expect(weekFooter).toContainText('11,00');
    await expect(weekFooter).toContainText('1 abgemeldet');

    // Heute-Modus: gleicher Betrag
    await page.getByRole('button', { name: /Heute \(Abmeldungen\)/ }).click();
    await expect(page.getByText(/Schnellansicht/)).toBeVisible();
    // Footer der Heute-Ansicht
    const todayFooter = page.locator('div', { hasText: /Gesamt:.*Essen/ }).last();
    await expect(todayFooter).toContainText('11,00');
    await expect(todayFooter).toContainText('1 abgemeldet');
  });

  test('Abmeldung in Wochenerfassung wirkt sich nicht auf Monatsbetrag aus', async ({ page }) => {
    // Spalten-Bulk A für Mo, dann ein Kind in Mo abmelden
    const monHeader = page.locator('thead th', { hasText: '13.04.' });
    await monHeader.locator('.meal-btn', { hasText: 'A' }).click();

    // c1 (Müller) für Mo abmelden via X-Button in der Mo-Zelle
    const emmaRow = page.getByRole('row', { name: /Müller, Emma/ });
    const monCell = emmaRow.locator('td').nth(3);
    // X-Button ist der 6. Button in der Zelle (5x A-E + 1x X)
    await monCell.locator('.meal-btn').nth(5).click();

    // Wechsel zu Monatsübersicht
    await page.getByRole('button', { name: /Monatsübersicht/ }).click();
    await page.locator('select.input').first().selectOption({ label: 'April' });
    await page.locator('input[type="number"]').fill('2026');

    // Müller hat trotz Abmeldung 1 Essen + 3,50 € (konsistent: Abmeldung zieht nicht ab)
    const emmaRowMonth = page.getByRole('row', { name: /Müller, Emma/ });
    await expect(emmaRowMonth).toContainText('3,50');
    // Gesamtbetrag: 3 Essen je 3,50 € = 10,50 €
    await expect(page.getByText(/Gesamt:.*3.*Essen/)).toBeVisible();
  });

  test('geschlossene Tage: KW18 zeigt Tag der Arbeit (Fr 01.05.) als geschlossen', async ({ page }) => {
    // Navigiere zu KW18
    await page.locator('button[data-tooltip="Nächste Woche"]').click();
    await page.locator('button[data-tooltip="Nächste Woche"]').click();
    await expect(page.getByText(/KW 18 \/ 2026/)).toBeVisible();

    const fridayHeader = page.locator('thead th', { hasText: '01.05.' });
    await expect(fridayHeader.getByText('Geschlossen')).toBeVisible();
    // Keine Bulk-Buttons in der Spalte
    await expect(fridayHeader.locator('.meal-btn')).toHaveCount(0);
  });
});

test.describe('Version Info', () => {
  test('shows version in header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Essenverwaltung v/)).toBeVisible();
  });
});

test.describe('App Tour', () => {
  test('shows help button in header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#tour-help-btn')).toBeVisible();
  });

  test('shows tour button in empty state', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('App-Tour starten')).toBeVisible();
  });

  test('tour starts when clicking help button', async ({ page }) => {
    await page.goto('/');
    await seedData(page);
    await page.reload();
    // Mark tour as completed to prevent auto-start
    await page.evaluate(() => localStorage.setItem('tourCompleted', 'true'));
    await page.reload();

    await page.locator('#tour-help-btn').click();
    await expect(page.locator('.driver-popover')).toBeVisible();
    await expect(page.getByText('Willkommen bei KiGa Essenverwaltung!')).toBeVisible();
  });

  test('tour can be skipped', async ({ page }) => {
    await page.goto('/');
    await seedData(page);
    await page.reload();
    await page.evaluate(() => localStorage.setItem('tourCompleted', 'true'));
    await page.reload();

    await page.locator('#tour-help-btn').click();
    await expect(page.locator('.driver-popover')).toBeVisible();

    // Close/skip the tour
    await page.locator('.driver-popover-close-btn').click();
    await expect(page.locator('.driver-popover')).not.toBeVisible();
  });

  test('tour navigates through steps', async ({ page }) => {
    await page.goto('/');
    await seedData(page);
    await page.reload();
    await page.evaluate(() => localStorage.setItem('tourCompleted', 'true'));
    await page.reload();

    await page.locator('#tour-help-btn').click();
    await expect(page.getByText('Willkommen bei KiGa Essenverwaltung!')).toBeVisible();

    // Click Next
    await page.getByText('Weiter').click();
    await expect(page.getByText('Navigation')).toBeVisible();

    // Click Next again
    await page.getByText('Weiter').click();
    await expect(page.locator('.driver-popover-title', { hasText: 'Tageserfassung' })).toBeVisible();
  });
});
