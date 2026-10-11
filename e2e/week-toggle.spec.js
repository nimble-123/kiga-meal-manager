import { test, expect } from '@playwright/test';

async function seed(page) {
  await page.evaluate(() => {
    localStorage.setItem('children', JSON.stringify([
      { id: 'c1', name: 'Müller, Emma', gruppe: 'Delfin', but: false, zahlungspfl: '', adresse: '', kassenzeichen: '', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
    ]));
    localStorage.setItem('gruppen', JSON.stringify(['Delfin']));
    localStorage.setItem('tourCompleted', JSON.stringify(true));
  });
}

test.describe('Wochenerfassung-Toggle', () => {
  test('Tab ist standardmäßig aus, über die Verwaltung aktivierbar und persistiert', async ({ page }) => {
    await page.goto('/');
    await seed(page);
    await page.reload();
    await expect(page.getByText('Müller, Emma')).toBeVisible();

    // Standard: kein Wochenerfassungs-Tab
    await expect(page.getByRole('button', { name: /Wochenerfassung/ })).toHaveCount(0);

    // Verwaltung → Ansichten → aktivieren
    await page.getByRole('button', { name: /Verwaltung/ }).click();
    await page.getByRole('button', { name: /Ansichten/ }).click();
    const ansichten = page.locator('.card', { hasText: 'Ansichten' });
    await ansichten.getByRole('checkbox').check();

    // Tab erscheint
    await expect(page.getByRole('button', { name: /Wochenerfassung/ })).toBeVisible();

    // Persistenz: nach Reload weiterhin sichtbar
    await page.reload();
    await expect(page.getByRole('button', { name: /Wochenerfassung/ })).toBeVisible();

    // Wieder deaktivieren -> Tab verschwindet
    await page.getByRole('button', { name: /Verwaltung/ }).click();
    await page.getByRole('button', { name: /Ansichten/ }).click();
    await page.locator('.card', { hasText: 'Ansichten' }).getByRole('checkbox').uncheck();
    await expect(page.getByRole('button', { name: /Wochenerfassung/ })).toHaveCount(0);
  });
});
