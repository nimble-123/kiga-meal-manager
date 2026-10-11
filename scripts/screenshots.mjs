// Erzeugt die README-Screenshots in docs/assets/screenshots/.
//
// Startet einen eigenen Vite-Dev-Server, seedet localStorage mit den Sample-Kindern
// aus data/sample/kinder.csv und reproduzierbaren Testdaten (fester Zufalls-Seed,
// festes Datum) und fotografiert jeden Tab.
//
//   npm run screenshots
//   CHROMIUM_PATH=/pfad/zu/chrome npm run screenshots   # eigener Browser
import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from '@playwright/test';

const PORT = 5179;
const BASE = `http://localhost:${PORT}`;
const OUT = 'docs/assets/screenshots';
const FIXED_NOW = new Date('2025-11-26T09:30:00');
const SEED = 20251126;

function parseChildren(csv) {
  const [, ...rows] = csv.trim().split(/\r?\n/);
  return rows.map((row, i) => {
    const [name, gruppe, but, zahlungspfl, adresse, kassenzeichen] = row.split(';');
    return {
      id: `c${i + 1}`, name, gruppe, but: but === 'Ja', zahlungspfl, adresse, kassenzeichen,
      hinweise: '', status: 'aktiv', eintritt: '', austritt: '',
    };
  });
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch { /* Server startet noch */ }
    await sleep(500);
  }
  throw new Error(`Vite-Server auf ${BASE} nicht erreichbar`);
}

const children = parseChildren(await readFile('data/sample/kinder.csv', 'utf8'));
const gruppen = (await readFile('data/sample/gruppen.csv', 'utf8')).trim().split(/\r?\n/).slice(1);

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const browser = await chromium.launch({
  args: ['--lang=de-DE'],
  env: { ...process.env, LANG: 'de_DE.UTF-8', LANGUAGE: 'de' },
  ...(process.env.CHROMIUM_PATH && { executablePath: process.env.CHROMIUM_PATH }),
});

try {
  await waitForServer();
  await mkdir(OUT, { recursive: true });

  const page = await browser.newPage({ viewport: { width: 1320, height: 860 }, deviceScaleFactor: 2, locale: 'de-DE', timezoneId: 'Europe/Berlin' });
  await page.clock.setFixedTime(FIXED_NOW);
  // Deterministischer Zufall, damit die Testdaten bei jedem Lauf gleich aussehen
  await page.addInitScript((seed) => {
    let a = seed;
    Math.random = () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }, SEED);

  await page.goto(BASE);
  await page.evaluate(async ({ children, gruppen }) => {
    const { generateTestData } = await import('/src/utils/testData.js');
    localStorage.clear();
    localStorage.setItem('children', JSON.stringify(children));
    localStorage.setItem('gruppen', JSON.stringify(gruppen));
    localStorage.setItem('tourCompleted', 'true');
    localStorage.setItem('weekViewEnabled', 'true');
    const data = generateTestData(children, 2025, 0, 12); // Januar – Dezember 2025
    for (const [key, value] of Object.entries(data)) localStorage.setItem(key, JSON.stringify(value));
  }, { children, gruppen });
  await page.reload();
  await page.getByText('Müller, Emma').first().waitFor();
  await page.getByText('Gespeichert').waitFor({ state: 'hidden' }).catch(() => {});

  const shots = [
    ['daily', 'tageserfassung'],
    ['week', 'wochenerfassung'],
    ['stamm', 'stammdaten'],
    ['month', 'monatsuebersicht'],
    ['year', 'jahresuebersicht'],
    ['analytics', 'auswertung'],
    ['admin', 'verwaltung'],
  ];
  for (const [tab, file] of shots) {
    await page.locator(`#tour-tab-${tab}`).click();
    await sleep(tab === 'analytics' ? 2000 : 600); // recharts-Animationen abwarten
    await page.getByText('Gespeichert').waitFor({ state: 'hidden' }).catch(() => {});
    await page.screenshot({ path: `${OUT}/${file}.png` });
    console.log(`✓ ${OUT}/${file}.png`);
  }
} finally {
  await browser.close();
  server.kill();
}
