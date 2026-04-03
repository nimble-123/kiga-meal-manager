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
    await expect(page.getByText('Gruppen verwalten')).toBeVisible();
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

  test('has link to group management', async ({ page }) => {
    await expect(page.getByText('Gruppen verwalten →')).toBeVisible();
  });

  test('sortable table headers work on Monatsübersicht', async ({ page }) => {
    // Navigate to Monatsübersicht which has SortHeaders
    await page.getByRole('button', { name: /Monatsübersicht/ }).click();
    await page.locator('th.sortable').first().click();
    await expect(page.locator('.sort-indicator.active')).toBeVisible();
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
    await expect(page.getByText('Gruppen verwalten')).toBeVisible();
    await expect(page.getByText('Stammdaten Import / Export')).toBeVisible();
    await expect(page.getByText('Bewegungsdaten Import / Export')).toBeVisible();
    await expect(page.getByText('Testdaten generieren')).toBeVisible();
    await expect(page.getByText('Backup / Restore')).toBeVisible();
    await expect(page.getByText('System-Info')).toBeVisible();
  });

  test('can add a new group', async ({ page }) => {
    await page.getByPlaceholder('Neue Gruppe...').fill('TestGruppe');
    await page.getByText('+ Hinzufügen').click();
    await expect(page.getByText('TestGruppe')).toBeVisible();
  });

  test('shows system info when expanded', async ({ page }) => {
    await page.getByText('System-Info').click();
    await expect(page.getByText(/Version:/)).toBeVisible();
    await expect(page.getByText('Kinder (gesamt / aktiv):')).toBeVisible();
  });

  test('can expand stammdaten section', async ({ page }) => {
    await page.getByText('Stammdaten Import / Export').click();
    await expect(page.getByText('CSV exportieren')).toBeVisible();
    await expect(page.getByText('JSON exportieren')).toBeVisible();
  });
});

test.describe('Keyboard Shortcuts', () => {
  test('Ctrl+1-6 switches tabs', async ({ page }) => {
    await page.goto('/');
    await seedData(page);
    await page.reload();
    await expect(page.getByText('Müller, Emma')).toBeVisible();

    // Ctrl+2 → Stammdaten
    await page.keyboard.press('Control+2');
    await expect(page.getByText('Kind hinzufügen')).toBeVisible();

    // Ctrl+6 → Verwaltung
    await page.keyboard.press('Control+6');
    await expect(page.getByText('Gruppen verwalten')).toBeVisible();

    // Ctrl+1 → back to Tageserfassung
    await page.keyboard.press('Control+1');
    await expect(page.getByText('Müller, Emma')).toBeVisible();
  });
});

test.describe('Version Info', () => {
  test('shows version in header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Essenverwaltung v/)).toBeVisible();
  });
});
