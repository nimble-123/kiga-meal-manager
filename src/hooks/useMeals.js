import { useState, useEffect, useCallback, useMemo } from 'react';
import { storageGet, storageSet, subscribeStorage } from '../utils/storage';
import { daysInMonth, fmtDate, GERICHTE } from '../utils/dates';

export function useMeals(selectedDate, activeChildren) {
  const [dailyData, setDailyData] = useState({});

  const monthKey = useMemo(() => {
    const d = new Date(selectedDate + 'T12:00:00');
    return `meals-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, [selectedDate]);

  useEffect(() => {
    let cancelled = false;
    const reload = async () => {
      const data = await storageGet(monthKey);
      if (!cancelled) setDailyData(data || {});
    };
    reload();
    const unsub = subscribeStorage((key) => {
      if (key === monthKey) reload();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [monthKey]);

  const saveDailyData = useCallback(
    async (newData) => {
      setDailyData(newData);
      await storageSet(monthKey, newData);
    },
    [monthKey]
  );

  const todayData = dailyData[selectedDate] || { prices: {}, selections: {}, abmeldungen: {} };

  const setTodayPrices = (gericht, val) => {
    const nd = { ...dailyData };
    if (!nd[selectedDate]) nd[selectedDate] = { prices: {}, selections: {}, abmeldungen: {} };
    nd[selectedDate] = { ...nd[selectedDate], prices: { ...nd[selectedDate].prices, [gericht]: val } };
    saveDailyData(nd);
  };

  const setTodaySelection = (childId, val) => {
    const nd = { ...dailyData };
    if (!nd[selectedDate]) nd[selectedDate] = { prices: {}, selections: {}, abmeldungen: {} };
    nd[selectedDate] = { ...nd[selectedDate], selections: { ...nd[selectedDate].selections, [childId]: val } };
    saveDailyData(nd);
  };

  const setBulkTodaySelection = (entries) => {
    const nd = { ...dailyData };
    if (!nd[selectedDate]) nd[selectedDate] = { prices: {}, selections: {}, abmeldungen: {} };
    nd[selectedDate] = { ...nd[selectedDate], selections: { ...nd[selectedDate].selections, ...entries } };
    saveDailyData(nd);
  };

  const setTodayAbmeldung = (childId, abmeldung) => {
    const nd = { ...dailyData };
    if (!nd[selectedDate]) nd[selectedDate] = { prices: {}, selections: {}, abmeldungen: {} };
    if (!nd[selectedDate].abmeldungen) nd[selectedDate].abmeldungen = {};
    nd[selectedDate] = { ...nd[selectedDate], abmeldungen: { ...nd[selectedDate].abmeldungen, [childId]: abmeldung } };
    saveDailyData(nd);
  };

  const getMonthSummary = useCallback(
    async (year, month) => {
      const key = `meals-${year}-${String(month + 1).padStart(2, '0')}`;
      const dateObj = new Date(selectedDate + 'T12:00:00');
      const data = year === dateObj.getFullYear() && month === dateObj.getMonth() ? dailyData : (await storageGet(key)) || {};
      const days = daysInMonth(year, month);
      const summary = {};
      const byMealInit = {};
      GERICHTE.forEach((g) => (byMealInit[g] = 0));
      activeChildren.forEach((c) => {
        summary[c.id] = { count: 0, total: 0, byMeal: { ...byMealInit } };
      });
      for (let d = 1; d <= days; d++) {
        const ds = fmtDate(year, month, d);
        const dd = data[ds];
        if (!dd) continue;
        activeChildren.forEach((c) => {
          const sel = dd.selections?.[c.id];
          if (sel && dd.prices?.[sel]) {
            summary[c.id].count++;
            summary[c.id].total += parseFloat(dd.prices[sel]) || 0;
            if (summary[c.id].byMeal[sel] !== undefined) summary[c.id].byMeal[sel]++;
          }
        });
      }
      return summary;
    },
    [activeChildren, dailyData, selectedDate]
  );

  return { dailyData, todayData, setTodayPrices, setTodaySelection, setBulkTodaySelection, setTodayAbmeldung, getMonthSummary };
}
