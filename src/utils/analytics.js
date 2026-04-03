import { storageGet } from './storage';
import { daysInMonth, fmtDate, GERICHTE, MONATE } from './dates';
import { isClosedDay } from '../data/holidays';

export async function aggregateYearData(year, children) {
  // Alle 12 Monate parallel laden
  const monthDataArr = await Promise.all(
    Array.from({ length: 12 }, (_, m) =>
      storageGet(`meals-${year}-${String(m + 1).padStart(2, '0')}`)
    )
  );

  const pricesByMonth = []; // [{A: avg, B: avg, ...}, ...]
  const costsByMonth = []; // [{A: total, B: total, ..., total: X}, ...]
  const participationByMonth = []; // [percent, ...]
  const mealDistribution = {}; // {A: count, B: count, ...}
  const groupMeals = {}; // {groupName: {totalMeals, childCount}}
  let butMeals = 0;
  let nonButMeals = 0;

  GERICHTE.forEach((g) => (mealDistribution[g] = 0));

  const activeChildren = children.filter((c) => c.status === 'aktiv');
  const butChildIds = new Set(activeChildren.filter((c) => c.but).map((c) => c.id));

  // Gruppen-Tracking initialisieren
  activeChildren.forEach((c) => {
    if (!groupMeals[c.gruppe]) groupMeals[c.gruppe] = { totalMeals: 0, childCount: 0 };
    groupMeals[c.gruppe].childCount++;
  });

  for (let m = 0; m < 12; m++) {
    const data = monthDataArr[m] || {};
    const days = daysInMonth(year, m);

    const monthPrices = {}; // {A: [prices], B: [prices], ...}
    const monthCosts = {}; // {A: totalEur, B: totalEur, ...}
    let monthMeals = 0;
    let monthWorkDays = 0;
    let monthParticipants = 0;

    GERICHTE.forEach((g) => { monthPrices[g] = []; monthCosts[g] = 0; });

    for (let d = 1; d <= days; d++) {
      const ds = fmtDate(year, m, d);
      if (isClosedDay(ds)) continue;
      monthWorkDays++;

      const dd = data[ds];
      if (!dd) continue;

      // Preise sammeln
      GERICHTE.forEach((g) => {
        if (dd.prices?.[g] > 0) monthPrices[g].push(dd.prices[g]);
      });

      // Auswertung pro Kind
      let dayParticipants = 0;
      activeChildren.forEach((c) => {
        const sel = dd.selections?.[c.id];
        if (sel && dd.prices?.[sel] > 0) {
          const price = parseFloat(dd.prices[sel]);
          monthCosts[sel] += price;
          mealDistribution[sel]++;
          monthMeals++;
          dayParticipants++;

          if (groupMeals[c.gruppe]) groupMeals[c.gruppe].totalMeals++;
          if (butChildIds.has(c.id)) butMeals++;
          else nonButMeals++;
        }
      });
      if (monthWorkDays > 0 && activeChildren.length > 0) {
        monthParticipants += dayParticipants;
      }
    }

    // Durchschnittspreise
    const avgPrices = {};
    GERICHTE.forEach((g) => {
      avgPrices[g] = monthPrices[g].length > 0
        ? Math.round((monthPrices[g].reduce((s, v) => s + v, 0) / monthPrices[g].length) * 100) / 100
        : null;
    });
    pricesByMonth.push(avgPrices);

    // Kosten
    let totalCost = 0;
    GERICHTE.forEach((g) => (totalCost += monthCosts[g]));
    costsByMonth.push({ ...monthCosts, total: Math.round(totalCost * 100) / 100 });

    // Teilnahmequote
    const workDaysWithData = Object.keys(data).filter((ds) => !isClosedDay(ds)).length;
    const participation = workDaysWithData > 0 && activeChildren.length > 0
      ? Math.round((monthParticipants / (workDaysWithData * activeChildren.length)) * 100)
      : 0;
    participationByMonth.push(participation);
  }

  // Gruppenvergleich: Ø Essen pro Kind pro Monat
  const groupComparison = {};
  for (const [gruppe, data] of Object.entries(groupMeals)) {
    groupComparison[gruppe] = data.childCount > 0
      ? Math.round((data.totalMeals / data.childCount / 12) * 10) / 10
      : 0;
  }

  const totalMeals = butMeals + nonButMeals;
  const butShare = totalMeals > 0 ? Math.round((butMeals / totalMeals) * 100) : 0;

  return {
    pricesByMonth,
    costsByMonth,
    participationByMonth,
    mealDistribution,
    groupComparison,
    butShare: { butMeals, nonButMeals, percentage: butShare },
    months: MONATE,
  };
}
