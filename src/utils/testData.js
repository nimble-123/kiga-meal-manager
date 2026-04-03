import { daysInMonth, fmtDate, GERICHTE } from './dates';
import { isClosedDay } from '../data/holidays';

// Generiert realistische Essensdaten für Tests
export function generateTestData(children, startYear, startMonth, numMonths) {
  const result = {};
  const basePrices = { A: 3.50, B: 4.00, C: 3.25, D: 4.50, E: 2.80 };
  // Leichte monatliche Preis-Drift
  const drift = () => (Math.random() - 0.5) * 0.30;

  // Kind-spezifische Vorlieben (Bias)
  const childPrefs = {};
  children.forEach((c) => {
    const prefs = {};
    GERICHTE.forEach((g) => (prefs[g] = Math.random()));
    const sum = Object.values(prefs).reduce((s, v) => s + v, 0);
    GERICHTE.forEach((g) => (prefs[g] /= sum));
    childPrefs[c.id] = prefs;
  });

  // Basis-Verteilung: A 35%, B 25%, C 20%, D 12%, E 8%
  const baseWeights = { A: 0.35, B: 0.25, C: 0.20, D: 0.12, E: 0.08 };

  for (let m = 0; m < numMonths; m++) {
    let month = startMonth + m;
    let year = startYear;
    while (month > 11) { month -= 12; year++; }

    const key = `meals-${year}-${String(month + 1).padStart(2, '0')}`;
    const days = daysInMonth(year, month);
    const monthData = {};

    // Monatliche Preis-Anpassung
    const monthPrices = {};
    GERICHTE.forEach((g) => {
      monthPrices[g] = Math.round((basePrices[g] + drift() + m * 0.02) * 100) / 100;
    });

    for (let d = 1; d <= days; d++) {
      const dateStr = fmtDate(year, month, d);
      if (isClosedDay(dateStr)) continue;

      // Tagespreise (leichte Schwankung)
      const prices = {};
      GERICHTE.forEach((g) => {
        prices[g] = Math.round((monthPrices[g] + (Math.random() - 0.5) * 0.10) * 100) / 100;
      });

      const selections = {};
      children.forEach((c) => {
        if (c.status !== 'aktiv') return;
        // ~80% Teilnahme
        if (Math.random() > 0.82) return;

        // Gewichtete Auswahl basierend auf Kind-Vorlieben + Basis-Verteilung
        const combined = {};
        let total = 0;
        GERICHTE.forEach((g) => {
          combined[g] = baseWeights[g] * 0.6 + (childPrefs[c.id]?.[g] || 0.2) * 0.4;
          total += combined[g];
        });

        let rand = Math.random() * total;
        let chosen = 'A';
        for (const g of GERICHTE) {
          rand -= combined[g];
          if (rand <= 0) { chosen = g; break; }
        }
        selections[c.id] = chosen;
      });

      if (Object.keys(selections).length > 0) {
        monthData[dateStr] = { prices, selections };
      }
    }

    result[key] = monthData;
  }

  return result;
}
