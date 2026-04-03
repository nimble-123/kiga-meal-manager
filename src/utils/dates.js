export const DEFAULT_GRUPPEN = ['Delfin', 'Dino', 'Micky Maus', 'Möwen', 'Pinguin', 'Sandflöhe'];
export const GERICHTE = ['A', 'B', 'C', 'D', 'E'];
export const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export const GERICHT_COLORS = {
  A: '#059669',
  B: '#2563EB',
  C: '#D97706',
  D: '#7C3AED',
  E: '#DC2626',
};

export const GRUPPE_COLORS = {
  Delfin: '#0EA5E9',
  Dino: '#22C55E',
  'Micky Maus': '#F59E0B',
  Möwen: '#8B5CF6',
  Pinguin: '#EC4899',
  Sandflöhe: '#F97316',
};

const EXTRA_COLORS = ['#EF4444', '#14B8A6', '#6366F1', '#A855F7', '#F43F5E', '#84CC16', '#06B6D4', '#E11D48'];

export function getGruppeColor(name) {
  if (GRUPPE_COLORS[name]) return GRUPPE_COLORS[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return EXTRA_COLORS[Math.abs(hash) % EXTRA_COLORS.length];
}

export function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}

export function fmtDate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function fmtEuro(n) {
  return n.toFixed(2).replace('.', ',') + ' \u20AC';
}
