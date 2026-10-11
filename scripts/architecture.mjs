// Zeichnet die Architektur-Grafik der README (hell + dunkel) nach docs/assets/.
//
//   npm run architecture
import { mkdir, writeFile } from 'node:fs/promises';

const THEMES = {
  'architecture.svg': {
    bg: '#FAF7F2', card: '#FFFFFF', border: '#E4DED3', text: '#1F2933', muted: '#6B7280',
    accent: '#2D9F93', accentSoft: '#E6F5F3', line: '#9AA5B1', ext: '#F3EFE8',
  },
  'architecture-dark.svg': {
    bg: '#0D1117', card: '#161B22', border: '#30363D', text: '#E6EDF3', muted: '#8B949E',
    accent: '#3FC1B3', accentSoft: '#12302D', line: '#6E7681', ext: '#1C2128',
  },
};

const W = 860;
const H = 560;
const SANS = '-apple-system,Segoe UI,Helvetica,Arial,sans-serif';
const MONO = 'ui-monospace,SFMono-Regular,Menlo,monospace';

function render(c) {
  const box = (x, y, w, h, { fill = c.card, stroke = c.border, dash = false } = {}) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="1.5"${dash ? ' stroke-dasharray="5 4"' : ''}/>`;
  const text = (x, y, s, { size = 13, weight = 400, color = c.text, anchor = 'middle', mono = false } = {}) =>
    `<text x="${x}" y="${y}" font-family="${mono ? MONO : SANS}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${s}</text>`;
  const arrow = (x1, y1, x2, y2, label) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c.line}" stroke-width="1.5" marker-end="url(#a)"/>` +
    (label ? text(x1 + 10, (y1 + y2) / 2 + 4, label, { size: 11, color: c.muted, anchor: 'start', mono: true }) : '');
  const heading = (x, y, title, sub) =>
    text(x, y, title, { size: 12, weight: 700, color: c.accent, anchor: 'start' }) +
    text(x, y + 17, sub, { size: 11, color: c.muted, anchor: 'start' });
  const layer = (y, h, title, sub) =>
    box(20, y, W - 40, h, { fill: c.accentSoft, stroke: c.accentSoft }) + heading(40, y + 24, title, sub);
  const module = (x, y, w, title, sub, opts = {}) =>
    box(x, y, w, 58, opts) +
    text(x + w / 2, y + 25, title, { weight: 600, mono: true }) +
    text(x + w / 2, y + 44, sub, { size: 11, color: c.muted });
  const external = (x, title, sub) =>
    box(x, 470, 250, 70, { fill: c.ext }) +
    text(x + 125, 497, title, { size: 12, weight: 600, mono: true }) +
    text(x + 125, 517, sub, { size: 11, color: c.muted });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
    `<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${c.line}"/></marker></defs>`,
    `<rect width="${W}" height="${H}" rx="16" fill="${c.bg}"/>`,

    // Renderer
    layer(20, 200, 'RENDERER · React 19 + Vite', 'Views, Hooks und Utils – kein Node-Zugriff'),
    module(40, 74, 250, 'components/', '7 Views · Header · ui/'),
    module(305, 74, 250, 'hooks/', 'useChildren · useMeals · …'),
    module(570, 74, 250, 'utils/', 'import · csv · analytics · …'),
    arrow(290, 103, 303, 103),
    arrow(555, 103, 568, 103),
    module(305, 150, 250, 'utils/storage.js', 'einziger Weg zu den Daten'),
    arrow(430, 132, 430, 148),
    arrow(695, 132, 556, 164),
    module(640, 150, 180, 'localStorage', 'Browser · Dev · E2E', { fill: c.ext, dash: true }),
    arrow(555, 190, 638, 190),

    // Preload
    box(20, 236, W - 40, 56, { stroke: c.accent }),
    heading(40, 260, 'PRELOAD · contextBridge', 'window.api – store · Dateien · E-Mail · Ordner · updater'),
    arrow(430, 208, 430, 234, 'IPC invoke'),

    // Main Process
    layer(310, 128, 'MAIN PROCESS · Electron 41', 'IPC-Handler, Dialoge und Dateisystem'),
    module(40, 362, 250, 'store.js', 'electron-store'),
    module(305, 362, 250, 'main.js', 'IPC · Dialoge · Mail · Backups'),
    module(570, 362, 250, 'updater.js', 'electron-updater'),
    arrow(430, 292, 430, 360),
    arrow(305, 391, 292, 391),
    arrow(555, 391, 568, 391),

    // Außenwelt
    external(40, 'kiga-essenverwaltung-data.json', 'lokal im Benutzerordner'),
    external(305, 'CSV · JSON · Backups', 'Export, Import, Auto-Backup-Ordner'),
    external(570, 'GitHub Releases', 'nur für Updates'),
    arrow(165, 420, 165, 468),
    arrow(430, 420, 430, 468),
    arrow(695, 420, 695, 468),
    '</svg>',
    '',
  ].join('\n');
}

const out = new URL('../docs/assets/', import.meta.url);
await mkdir(out, { recursive: true });
for (const [name, theme] of Object.entries(THEMES)) {
  await writeFile(new URL(name, out), render(theme));
  console.log(`✓ docs/assets/${name}`);
}
