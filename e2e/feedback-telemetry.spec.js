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

test.describe('Feedback', () => {
  test('Dialog erstellt eine vorausgefüllte E-Mail an info@nilslutz.de', async ({ page }) => {
    // openEmail simulieren (im Browser fehlt window.api); Aufruf-Argumente festhalten
    await page.addInitScript(() => {
      window.api = window.api || {};
      window.api.openEmail = (data) => { window.__lastEmail = data; };
    });
    await page.goto('/');
    await seed(page);
    await page.reload();
    await expect(page.getByText('Müller, Emma')).toBeVisible();

    await page.locator('#feedback-btn').click();
    await expect(page.getByText(/Feedback \/ Feature-Wunsch/)).toBeVisible();

    await page.getByPlaceholder(/mitteilen/i).fill('Bitte einen Export nach Excel');
    await page.getByRole('button', { name: /E-Mail erstellen/ }).click();

    const email = await page.evaluate(() => window.__lastEmail);
    expect(email.to).toBe('info@nilslutz.de');
    expect(email.subject).toContain('Feedback');
    expect(email.body).toContain('Bitte einen Export nach Excel');
  });
});

test.describe('Telemetrie-Einwilligung', () => {
  test('ist standardmäßig aus und bleibt nach Aktivierung erhalten', async ({ page }) => {
    await page.goto('/');
    await seed(page);
    await page.reload();
    await expect(page.getByText('Müller, Emma')).toBeVisible();

    await page.getByRole('button', { name: /Verwaltung/ }).click();
    await page.getByRole('button', { name: /Datenschutz & Nutzungsstatistiken/ }).click();
    const section = page.locator('.card', { hasText: 'Datenschutz & Nutzungsstatistiken' });
    const cb = section.getByRole('checkbox');
    await expect(cb).not.toBeChecked();
    await cb.check();
    await expect(cb).toBeChecked();

    // Persistenz nach Reload
    await page.reload();
    await page.getByRole('button', { name: /Verwaltung/ }).click();
    await page.getByRole('button', { name: /Datenschutz & Nutzungsstatistiken/ }).click();
    await expect(page.locator('.card', { hasText: 'Datenschutz & Nutzungsstatistiken' }).getByRole('checkbox')).toBeChecked();
  });
});
