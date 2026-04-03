import { GERICHTE, GERICHT_COLORS } from './dates';

// Berechnet die Aufschlüsselung nach Gerichttyp aus täglichen Selections
export function getDailyBreakdown(filteredChildren, selections) {
  const counts = {};
  GERICHTE.forEach((g) => (counts[g] = 0));
  filteredChildren.forEach((c) => {
    const sel = selections?.[c.id];
    if (sel && counts[sel] !== undefined) counts[sel]++;
  });
  return counts;
}

// Aggregiert byMeal-Daten aus Monats-Summary für gefilterte Kinder
export function getSummaryBreakdown(filteredChildren, summary) {
  const counts = {};
  GERICHTE.forEach((g) => (counts[g] = 0));
  filteredChildren.forEach((c) => {
    const byMeal = summary[c.id]?.byMeal;
    if (byMeal) {
      GERICHTE.forEach((g) => (counts[g] += byMeal[g] || 0));
    }
  });
  return counts;
}

// Formatiert Breakdown als React-Elemente mit Farbcodes
export function BreakdownDisplay({ counts }) {
  const parts = GERICHTE.filter((g) => counts[g] > 0);
  if (parts.length === 0) return null;

  return (
    <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 6 }}>
      (
      {parts.map((g, i) => (
        <span key={g}>
          {i > 0 && ', '}
          <span style={{ color: GERICHT_COLORS[g], fontWeight: 700 }}>{counts[g]}</span>
          <span style={{ color: '#9CA3AF' }}>{'\u00A0'}{g}</span>
        </span>
      ))}
      )
    </span>
  );
}
