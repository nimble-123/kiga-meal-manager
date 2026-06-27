import { test, expect } from '@playwright/test';

// Im Browser/Dev fehlt window.api -> normalerweise greift der Lizenz-Bypass.
// Für diese Tests injizieren wir VOR dem Laden ein simuliertes window.api.license,
// damit die App durch den echten Gate-Pfad läuft. addInitScript läuft bei jeder
// Navigation neu, daher bildet ein localStorage-Flag den Reload-nach-Aktivierung ab.
async function installLicenseApi(page) {
  await page.addInitScript(() => {
    const FLAG = '__e2e_licensed__';
    window.api = window.api || {};
    window.api.license = {
      status: async () =>
        localStorage.getItem(FLAG) === '1'
          ? { licensed: true, licensee: 'KiGa Mitte', issuedAt: '2026-06-27' }
          : { licensed: false },
      activate: async (key) => {
        if (typeof key === 'string' && key.includes('VALID')) {
          localStorage.setItem(FLAG, '1');
          return { success: true, licensee: 'KiGa Mitte' };
        }
        return { success: false, error: 'Ungültiger oder beschädigter Lizenzschlüssel.' };
      },
    };
    // Fake-Dateiauswahl für den ".lic importieren"-Button.
    window.api.openFile = async () => ({ success: true, content: 'VALID-LIZENZ-AUS-DATEI', filename: 'kiga.lic' });
  });
}

test.describe('Lizenz-Gate', () => {
  test.beforeEach(async ({ page }) => {
    await installLicenseApi(page);
    await page.goto('/');
  });

  test('zeigt den Aktivierungs-Gate und sperrt die Haupt-App', async ({ page }) => {
    await expect(page.getByText('KiGa Essenverwaltung aktivieren')).toBeVisible();
    await expect(page.getByPlaceholder(/Lizenzschlüssel/)).toBeVisible();
    // Header/Tabs der Haupt-App dürfen nicht gerendert sein
    await expect(page.getByRole('button', { name: /Verwaltung/ })).toHaveCount(0);
  });

  test('Aktivieren-Button: deaktiviert bei leerem Feld, aktiv nach Eingabe', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Aktivieren', exact: true });
    await expect(btn).toBeDisabled();
    await page.getByPlaceholder(/Lizenzschlüssel/).fill('irgendwas');
    await expect(btn).toBeEnabled();
  });

  test('ungültiger Schlüssel zeigt Fehlermeldung, Gate bleibt bestehen', async ({ page }) => {
    await page.getByPlaceholder(/Lizenzschlüssel/).fill('KAPUTT-123');
    await page.getByRole('button', { name: 'Aktivieren', exact: true }).click();
    await expect(page.getByText(/Ungültiger oder beschädigter Lizenzschlüssel/)).toBeVisible();
    await expect(page.getByText('KiGa Essenverwaltung aktivieren')).toBeVisible();
  });

  test('gültiger Schlüssel aktiviert und lädt die Haupt-App', async ({ page }) => {
    await page.getByPlaceholder(/Lizenzschlüssel/).fill('VALID-LIZENZ-12345');
    await page.getByRole('button', { name: 'Aktivieren', exact: true }).click();
    // Nach window.location.reload(): Gate verschwunden, Haupt-App sichtbar
    await expect(page.getByRole('button', { name: /Verwaltung/ })).toBeVisible();
    await expect(page.getByText('KiGa Essenverwaltung aktivieren')).toHaveCount(0);
  });

  test('.lic-Import füllt das Schlüsselfeld und ermöglicht die Aktivierung', async ({ page }) => {
    await page.getByRole('button', { name: /Aus Datei importieren/ }).click();
    await expect(page.getByPlaceholder(/Lizenzschlüssel/)).toHaveValue('VALID-LIZENZ-AUS-DATEI');
    await page.getByRole('button', { name: 'Aktivieren', exact: true }).click();
    await expect(page.getByRole('button', { name: /Verwaltung/ })).toBeVisible();
  });

  test('Lizenzstatus erscheint in der Verwaltung → System-Info', async ({ page }) => {
    await page.getByPlaceholder(/Lizenzschlüssel/).fill('VALID-LIZENZ-12345');
    await page.getByRole('button', { name: 'Aktivieren', exact: true }).click();
    await page.getByRole('button', { name: /Verwaltung/ }).click();
    await page.getByRole('button', { name: /System-Info/ }).click();
    await expect(page.getByText('Lizenz:')).toBeVisible();
    // exact:true, da der Header-Titel "🏠 KiGa Mitte" denselben Namen enthält
    await expect(page.getByText('KiGa Mitte', { exact: true })).toBeVisible();
    await expect(page.getByText('Lizenziert seit:')).toBeVisible();
  });
});

test.describe('Lizenz-Bypass (Dev/Browser ohne Electron)', () => {
  test('ohne window.api.license lädt die App direkt ohne Gate', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Willkommen bei KiGa Essenverwaltung')).toBeVisible();
    await expect(page.getByText('KiGa Essenverwaltung aktivieren')).toHaveCount(0);
  });
});
