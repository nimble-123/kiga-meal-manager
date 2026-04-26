import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { storageGet, storageSet, subscribeStorage } from '../utils/storage';
import { getWeekDates, getMonthKey, getPreviousWeekMonday, GERICHTE } from '../utils/dates';
import { isClosedDay } from '../data/holidays';

const emptyDay = () => ({ prices: {}, selections: {}, abmeldungen: {} });

export function useWeekMeals(weekMonday, activeChildren) {
  const weekDates = useMemo(() => getWeekDates(weekMonday), [weekMonday]);

  const monthKeys = useMemo(() => {
    const keys = new Set();
    weekDates.forEach((d) => keys.add(getMonthKey(d)));
    return [...keys];
  }, [weekDates]);

  const [monthStores, setMonthStores] = useState({});
  const monthStoresRef = useRef(monthStores);
  monthStoresRef.current = monthStores;

  useEffect(() => {
    let cancelled = false;
    const reload = async () => {
      const entries = await Promise.all(
        monthKeys.map(async (k) => [k, (await storageGet(k)) || {}])
      );
      if (cancelled) return;
      setMonthStores(Object.fromEntries(entries));
    };
    reload();
    const unsub = subscribeStorage((key) => {
      if (monthKeys.includes(key)) reload();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [monthKeys]);

  const weekData = useMemo(() => {
    const out = {};
    weekDates.forEach((d) => {
      const mk = getMonthKey(d);
      out[d] = monthStores[mk]?.[d] || emptyDay();
    });
    return out;
  }, [monthStores, weekDates]);

  const writeStores = useCallback(async (next) => {
    setMonthStores(next);
    await Promise.all(Object.entries(next).map(([k, v]) => storageSet(k, v)));
  }, []);

  const updateDay = useCallback(
    (date, mutator) => {
      const mk = getMonthKey(date);
      const current = monthStoresRef.current;
      const monthData = { ...(current[mk] || {}) };
      const day = monthData[date] ? { ...monthData[date] } : emptyDay();
      const updated = mutator(day);
      monthData[date] = updated;
      const next = { ...current, [mk]: monthData };
      writeStores(next);
    },
    [writeStores]
  );

  const setSelectionForDate = useCallback(
    (date, childId, val) => {
      updateDay(date, (day) => ({
        ...day,
        selections: { ...day.selections, [childId]: val },
      }));
    },
    [updateDay]
  );

  const setBulkSelectionForDate = useCallback(
    (date, entries) => {
      updateDay(date, (day) => ({
        ...day,
        selections: { ...day.selections, ...entries },
      }));
    },
    [updateDay]
  );

  const setAbmeldungForDate = useCallback(
    (date, childId, abmeldung) => {
      updateDay(date, (day) => ({
        ...day,
        abmeldungen: { ...(day.abmeldungen || {}), [childId]: abmeldung },
      }));
    },
    [updateDay]
  );

  const setBulkSelectionForChild = useCallback(
    (childId, gericht) => {
      const current = monthStoresRef.current;
      const next = { ...current };
      weekDates.forEach((date) => {
        if (isClosedDay(date)) return;
        const mk = getMonthKey(date);
        const monthData = { ...(next[mk] || current[mk] || {}) };
        const day = monthData[date] ? { ...monthData[date] } : emptyDay();
        day.selections = { ...day.selections, [childId]: gericht };
        monthData[date] = day;
        next[mk] = monthData;
      });
      writeStores(next);
    },
    [weekDates, writeStores]
  );

  const setWeekPrices = useCallback(
    (gericht, val) => {
      const current = monthStoresRef.current;
      const next = { ...current };
      weekDates.forEach((date) => {
        if (isClosedDay(date)) return;
        const mk = getMonthKey(date);
        const monthData = { ...(next[mk] || current[mk] || {}) };
        const day = monthData[date] ? { ...monthData[date] } : emptyDay();
        day.prices = { ...day.prices, [gericht]: val };
        monthData[date] = day;
        next[mk] = monthData;
      });
      writeStores(next);
    },
    [weekDates, writeStores]
  );

  const setPriceForDate = useCallback(
    (date, gericht, val) => {
      updateDay(date, (day) => ({
        ...day,
        prices: { ...day.prices, [gericht]: val },
      }));
    },
    [updateDay]
  );

  const copyPreviousWeek = useCallback(async () => {
    const prevMonday = getPreviousWeekMonday(weekMonday);
    const prevDates = getWeekDates(prevMonday);
    const prevMonthKeys = [...new Set(prevDates.map(getMonthKey))];
    const prevStores = Object.fromEntries(
      await Promise.all(prevMonthKeys.map(async (k) => [k, (await storageGet(k)) || {}]))
    );

    const current = monthStoresRef.current;
    const next = { ...current };
    weekDates.forEach((date, idx) => {
      if (isClosedDay(date)) return;
      const prevDate = prevDates[idx];
      const prevDay = prevStores[getMonthKey(prevDate)]?.[prevDate];
      if (!prevDay?.selections) return;
      const mk = getMonthKey(date);
      const monthData = { ...(next[mk] || current[mk] || {}) };
      const day = monthData[date] ? { ...monthData[date] } : emptyDay();
      day.selections = { ...day.selections, ...prevDay.selections };
      monthData[date] = day;
      next[mk] = monthData;
    });
    writeStores(next);
  }, [weekMonday, weekDates, writeStores]);

  // Konsistent mit useMeals.getMonthSummary und DailyEntry: Abmeldungen werden NICHT
  // vom Betrag abgezogen. Sie sind eine separate Information (Anzahl), die Mahlzeit
  // wird trotzdem berechnet (Tagesgenau-Stornierung in der Praxis nicht möglich).
  const weekSummary = useMemo(() => {
    const byMealInit = {};
    GERICHTE.forEach((g) => (byMealInit[g] = 0));
    const summary = {};
    activeChildren.forEach((c) => {
      summary[c.id] = { count: 0, total: 0, byMeal: { ...byMealInit }, abmeldungen: 0 };
    });
    weekDates.forEach((date) => {
      const dd = weekData[date];
      if (!dd) return;
      activeChildren.forEach((c) => {
        const sel = dd.selections?.[c.id];
        const ab = dd.abmeldungen?.[c.id];
        if (sel && dd.prices?.[sel]) {
          summary[c.id].count++;
          summary[c.id].total += parseFloat(dd.prices[sel]) || 0;
          if (summary[c.id].byMeal[sel] !== undefined) summary[c.id].byMeal[sel]++;
        }
        if (ab?.active) summary[c.id].abmeldungen++;
      });
    });
    return summary;
  }, [weekData, weekDates, activeChildren]);

  const hasAnySelection = useMemo(() => {
    return weekDates.some((date) => {
      const sel = weekData[date]?.selections || {};
      return Object.values(sel).some((v) => v);
    });
  }, [weekData, weekDates]);

  return {
    weekDates,
    weekData,
    setSelectionForDate,
    setBulkSelectionForDate,
    setBulkSelectionForChild,
    setAbmeldungForDate,
    setWeekPrices,
    setPriceForDate,
    copyPreviousWeek,
    weekSummary,
    hasAnySelection,
  };
}
