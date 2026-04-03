export function getEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function getHolidays(year) {
  const easter = getEasterDate(year);
  const addDays = (d, n) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  };
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return new Set([
    fmt(new Date(year, 0, 1)),      // Neujahr
    fmt(addDays(easter, -2)),        // Karfreitag
    fmt(addDays(easter, 1)),         // Ostermontag
    fmt(new Date(year, 4, 1)),       // Tag der Arbeit
    fmt(addDays(easter, 39)),        // Christi Himmelfahrt
    fmt(addDays(easter, 50)),        // Pfingstmontag
    fmt(new Date(year, 9, 3)),       // Tag der Deutschen Einheit
    fmt(new Date(year, 9, 31)),      // Reformationstag
    fmt(new Date(year, 11, 25)),     // 1. Weihnachtstag
    fmt(new Date(year, 11, 26)),     // 2. Weihnachtstag
  ]);
}

export function isClosedDay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  if (d.getDay() === 0 || d.getDay() === 6) return true;
  return getHolidays(d.getFullYear()).has(dateStr);
}
