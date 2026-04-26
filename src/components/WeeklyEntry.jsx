import { useState, useMemo } from 'react';
import Badge from './ui/Badge';
import PriceInput from './ui/PriceInput';
import SortHeader from './ui/SortHeader';
import ConfirmDialog from './ui/ConfirmDialog';
import WeekTodayView from './WeekTodayView';
import {
  GERICHTE,
  WOCHENTAGE,
  GERICHT_COLORS,
  getGruppeColor,
  fmtEuro,
  getWeekMonday,
  getWeekDates,
  getWeekNumber,
  getWeekYear,
  addDaysToISO,
} from '../utils/dates';
import { isClosedDay } from '../data/holidays';
import { useSortableTable } from '../hooks/useSortableTable';
import { BreakdownDisplay } from '../utils/mealBreakdown';

const TODAY_ISO = () => new Date().toISOString().split('T')[0];

function fmtDayShort(isoDate) {
  const d = new Date(isoDate + 'T12:00:00');
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
}

export default function WeeklyEntry({
  weekAnchor,
  setWeekAnchor,
  gruppeFilter,
  setGruppeFilter,
  gruppen,
  filteredChildren,
  weekDates,
  weekData,
  setSelectionForDate,
  setBulkSelectionForDate,
  setBulkSelectionForChild,
  setAbmeldungForDate,
  setWeekPrices,
  copyPreviousWeek,
  weekSummary,
  hasAnySelection,
}) {
  const [mode, setMode] = useState('plan');
  const [confirmCopy, setConfirmCopy] = useState(false);

  const monday = getWeekMonday(weekAnchor);
  const kw = getWeekNumber(monday);
  const kwYear = getWeekYear(monday);
  const today = TODAY_ISO();
  const todayInWeek = weekDates.includes(today);

  const { sortedData, sortConfig, requestSort } = useSortableTable(filteredChildren, 'name');

  // Preise: zeige Preise des ersten offenen Tages der Woche
  const priceSourceDate = weekDates.find((d) => !isClosedDay(d));
  const weekPrices = priceSourceDate ? weekData[priceSourceDate]?.prices || {} : {};

  const handlePrev = () => setWeekAnchor(addDaysToISO(monday, -7));
  const handleNext = () => setWeekAnchor(addDaysToISO(monday, 7));
  const handleToday = () => setWeekAnchor(today);

  const handleColumnBulk = (date, gericht) => {
    if (isClosedDay(date)) return;
    const day = weekData[date] || { selections: {}, abmeldungen: {} };
    const eligible = filteredChildren.filter((c) => !day.abmeldungen?.[c.id]?.active);
    const allHave = eligible.length > 0 && eligible.every((c) => day.selections?.[c.id] === gericht);
    const entries = {};
    eligible.forEach((c) => {
      entries[c.id] = allHave ? '' : gericht;
    });
    setBulkSelectionForDate(date, entries);
  };

  const handleRowBulk = (childId, gericht) => {
    // Toggle: wenn das Kind an allen offenen Tagen schon dieses Gericht hat, entfernen
    const openDates = weekDates.filter((d) => !isClosedDay(d));
    const allHave = openDates.length > 0 && openDates.every((d) => weekData[d]?.selections?.[childId] === gericht);
    setBulkSelectionForChild(childId, allHave ? '' : gericht);
  };

  const handleCopyPrevious = () => {
    if (hasAnySelection) {
      setConfirmCopy(true);
    } else {
      copyPreviousWeek();
    }
  };

  const totalSum = useMemo(() => {
    return filteredChildren.reduce((s, c) => s + (weekSummary[c.id]?.total || 0), 0);
  }, [filteredChildren, weekSummary]);

  const totalCount = useMemo(() => {
    return filteredChildren.reduce((s, c) => s + (weekSummary[c.id]?.count || 0), 0);
  }, [filteredChildren, weekSummary]);

  const totalAbmeldungen = useMemo(() => {
    return filteredChildren.reduce((s, c) => s + (weekSummary[c.id]?.abmeldungen || 0), 0);
  }, [filteredChildren, weekSummary]);

  const breakdown = useMemo(() => {
    const counts = {};
    GERICHTE.forEach((g) => (counts[g] = 0));
    filteredChildren.forEach((c) => {
      const bm = weekSummary[c.id]?.byMeal;
      if (bm) GERICHTE.forEach((g) => (counts[g] += bm[g] || 0));
    });
    return counts;
  }, [filteredChildren, weekSummary]);

  return (
    <div className="fade-in">
      {confirmCopy && (
        <ConfirmDialog
          title="Vorwoche übernehmen?"
          message="In dieser Woche sind bereits Auswahlen vorhanden. Beim Übernehmen aus der Vorwoche werden bestehende Auswahlen pro Tag/Kind überschrieben (nicht eingetragene bleiben unverändert). Fortfahren?"
          confirmLabel="Übernehmen"
          onConfirm={() => {
            setConfirmCopy(false);
            copyPreviousWeek();
          }}
          onCancel={() => setConfirmCopy(false)}
        />
      )}

      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-secondary" style={{ padding: '4px 10px' }} onClick={handlePrev} data-tooltip="Vorherige Woche">
            {'\u25C0'}
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 110 }}>
            <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>KW {kw} / {kwYear}</span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>
              {fmtDayShort(weekDates[0])} – {fmtDayShort(weekDates[4])}
            </span>
          </div>
          <button className="btn btn-secondary" style={{ padding: '4px 10px' }} onClick={handleNext} data-tooltip="Nächste Woche">
            {'\u25B6'}
          </button>
          {!todayInWeek && (
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={handleToday}>
              Heute
            </button>
          )}
        </div>

        <select className="input" value={gruppeFilter} onChange={(e) => setGruppeFilter(e.target.value)}>
          <option>Alle</option>
          {gruppen.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>

        <button
          className="btn btn-secondary"
          onClick={handleCopyPrevious}
          data-tooltip="Auswahlen aus der Vorwoche übernehmen (Abmeldungen und Feiertage werden ausgelassen)"
        >
          {'\u21BA'} Vorwoche übernehmen
        </button>

        {todayInWeek && (
          <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 8, padding: 3 }}>
            <button
              onClick={() => setMode('plan')}
              style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: mode === 'plan' ? 'white' : 'transparent',
                color: mode === 'plan' ? '#2D9F93' : '#6B7280',
                boxShadow: mode === 'plan' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              Wochenplan
            </button>
            <button
              onClick={() => setMode('today')}
              style={{
                padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: mode === 'today' ? 'white' : 'transparent',
                color: mode === 'today' ? '#2D9F93' : '#6B7280',
                boxShadow: mode === 'today' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
            >
              Heute (Abmeldungen)
            </button>
          </div>
        )}
      </div>

      {mode === 'today' && todayInWeek ? (
        <WeekTodayView
          today={today}
          dayData={weekData[today] || { prices: {}, selections: {}, abmeldungen: {} }}
          filteredChildren={filteredChildren}
          setAbmeldungForDate={setAbmeldungForDate}
        />
      ) : (
        <>
          <div className="card" style={{ padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Gerichtpreise diese Woche
              <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 8, color: '#9CA3AF', textTransform: 'none', letterSpacing: 0 }}>
                (gilt für alle Werktage der Woche)
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {GERICHTE.map((g) => (
                <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 13, color: 'white', background: GERICHT_COLORS[g],
                    }}
                  >
                    {g}
                  </span>
                  <PriceInput value={weekPrices[g] || ''} onChange={(val) => setWeekPrices(g, val)} />
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>{'\u20AC'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ overflow: 'auto' }}>
            <table style={{ minWidth: 900 }}>
              <thead>
                <tr style={{ background: '#FAFAF7' }}>
                  <th style={{ width: 30 }}>#</th>
                  <SortHeader column="name" label="Name" sortConfig={sortConfig} onSort={requestSort} />
                  <SortHeader column="gruppe" label="Gruppe" sortConfig={sortConfig} onSort={requestSort} />
                  {weekDates.map((date) => {
                    const closed = isClosedDay(date);
                    const isToday = date === today;
                    const dObj = new Date(date + 'T12:00:00');
                    return (
                      <th
                        key={date}
                        style={{
                          textAlign: 'center',
                          minWidth: 160,
                          background: isToday ? '#ECFDF5' : undefined,
                          borderBottom: isToday ? '2px solid #2D9F93' : undefined,
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 12 }}>
                            {WOCHENTAGE[dObj.getDay()]} {fmtDayShort(date)}
                            {isToday && <span style={{ marginLeft: 4, fontSize: 10, color: '#2D9F93', fontWeight: 700 }}>HEUTE</span>}
                          </span>
                          {closed ? (
                            <Badge color="#DC2626">Geschlossen</Badge>
                          ) : (
                            <div style={{ display: 'flex', gap: 2 }}>
                              {GERICHTE.map((g) => {
                                const hasPrice = weekData[date]?.prices?.[g] > 0;
                                const eligible = filteredChildren.filter((c) => !weekData[date]?.abmeldungen?.[c.id]?.active);
                                const allSelected =
                                  eligible.length > 0 && eligible.every((c) => weekData[date]?.selections?.[c.id] === g);
                                return (
                                  <button
                                    key={g}
                                    className={`meal-btn ${allSelected ? 'active' : ''}`}
                                    style={{
                                      width: 22, height: 20, fontSize: 9,
                                      ...(allSelected
                                        ? { background: GERICHT_COLORS[g], borderColor: GERICHT_COLORS[g] }
                                        : hasPrice
                                        ? { opacity: 0.7 }
                                        : { opacity: 0.3, cursor: 'default' }),
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (hasPrice) handleColumnBulk(date, g);
                                    }}
                                    data-tooltip={
                                      hasPrice
                                        ? `${g} ${allSelected ? 'von allen entfernen' : 'an alle zuweisen'}`
                                        : `${g} \u2013 kein Preis`
                                    }
                                  >
                                    {g}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th style={{ textAlign: 'right' }}>Betrag</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((c, i) => {
                  const childTotal = weekSummary[c.id]?.total || 0;
                  return (
                    <tr key={c.id}>
                      <td style={{ color: '#9CA3AF', fontSize: 12 }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>
                        {c.name} {c.but && <Badge color="#D97706">BUT</Badge>}
                      </td>
                      <td>
                        <Badge color={getGruppeColor(c.gruppe)}>{c.gruppe}</Badge>
                      </td>
                      {weekDates.map((date) => {
                        const closed = isClosedDay(date);
                        const isToday = date === today;
                        const day = weekData[date] || { selections: {}, abmeldungen: {} };
                        const sel = day.selections?.[c.id] || '';
                        const abm = day.abmeldungen?.[c.id];
                        if (closed) {
                          return (
                            <td key={date} style={{ textAlign: 'center', background: '#F3F4F6' }}>
                              <span style={{ fontSize: 12, color: '#9CA3AF' }}>{'\u2013'}</span>
                            </td>
                          );
                        }
                        return (
                          <td
                            key={date}
                            style={{
                              textAlign: 'center',
                              background: isToday ? '#F0FDF4' : abm?.active ? '#FEF3C7' : undefined,
                              opacity: abm?.active ? 0.75 : 1,
                            }}
                          >
                            <div style={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
                              {GERICHTE.map((g) => {
                                const hasPrice = day.prices?.[g] > 0;
                                return (
                                  <button
                                    key={g}
                                    className={`meal-btn ${sel === g ? 'active' : ''}`}
                                    style={{
                                      width: 20, height: 20, fontSize: 10,
                                      ...(sel === g
                                        ? { background: GERICHT_COLORS[g], borderColor: GERICHT_COLORS[g] }
                                        : hasPrice
                                        ? {}
                                        : { opacity: 0.3, cursor: 'default' }),
                                    }}
                                    onClick={() => {
                                      if (!hasPrice) return;
                                      setSelectionForDate(date, c.id, sel === g ? '' : g);
                                    }}
                                    data-tooltip={
                                      hasPrice
                                        ? `${g} \u2013 ${fmtEuro(day.prices[g])}`
                                        : `${g} \u2013 kein Preis`
                                    }
                                  >
                                    {g}
                                  </button>
                                );
                              })}
                              <button
                                className="meal-btn"
                                style={{
                                  width: 20, height: 20, fontSize: 11,
                                  marginLeft: 2,
                                  ...(abm?.active
                                    ? { background: '#D97706', borderColor: '#D97706', color: 'white' }
                                    : { opacity: 0.5 }),
                                }}
                                onClick={() => {
                                  const cur = abm || {};
                                  setAbmeldungForDate(date, c.id, { ...cur, active: !cur.active });
                                }}
                                data-tooltip={abm?.active ? 'Abmeldung aufheben' : 'Abmelden'}
                              >
                                {'\u2715'}
                              </button>
                            </div>
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                        {childTotal > 0 ? fmtEuro(childTotal) : '\u2013'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ padding: '12px 16px', background: '#F9F7F3', borderTop: '2px solid #E5E1DA', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
              <span>
                Wochen-Gesamt: {totalCount} Essen
                <BreakdownDisplay counts={breakdown} />
                {totalAbmeldungen > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 8, color: '#D97706' }}>
                    ({totalAbmeldungen} abgemeldet)
                  </span>
                )}
              </span>
              <span style={{ color: '#059669' }}>{fmtEuro(totalSum)}</span>
            </div>
          </div>

          <div style={{ marginTop: 16, fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>
            <strong>Tipps:</strong> Spalten-Buttons (im Tageskopf) weisen ein Gericht allen Kindern dieses Tages zu.
            {' '}Klick auf ein Gericht in einer Zelle setzt nur diesen Tag.
            {' '}Über das X in der Zelle kann ein Kind für diesen Tag abgemeldet werden.
            {' '}Heute-Modus rechts oben zeigt eine Schnellansicht für tagesaktuelle Abmeldungen.
          </div>
        </>
      )}
    </div>
  );
}
