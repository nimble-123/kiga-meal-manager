import { useState, useEffect } from 'react';
import SortHeader from './ui/SortHeader';
import { GERICHTE, MONATE, fmtEuro } from '../utils/dates';
import { downloadCSV } from '../utils/csv';
import { useSortableTable } from '../hooks/useSortableTable';
import { BreakdownDisplay } from '../utils/mealBreakdown';

export default function YearlyReport({ selectedYear, setSelectedYear, gruppeFilter, setGruppeFilter, gruppen, filteredChildren, activeChildren, getMonthSummary }) {
  const [yearSummary, setYearSummary] = useState({});

  useEffect(() => {
    (async () => {
      const ys = {};
      const byMealTotal = {};
      GERICHTE.forEach((g) => (byMealTotal[g] = 0));
      activeChildren.forEach((c) => {
        ys[c.id] = { months: Array(12).fill(0), total: 0, count: 0, byMeal: { ...byMealTotal } };
      });
      for (let m = 0; m < 12; m++) {
        const ms = await getMonthSummary(selectedYear, m);
        activeChildren.forEach((c) => {
          if (ms[c.id]) {
            ys[c.id].months[m] = ms[c.id].total;
            ys[c.id].total += ms[c.id].total;
            ys[c.id].count += ms[c.id].count;
            if (ms[c.id].byMeal) {
              GERICHTE.forEach((g) => (ys[c.id].byMeal[g] += ms[c.id].byMeal[g] || 0));
            }
          }
        });
      }
      setYearSummary(ys);
    })();
  }, [selectedYear, activeChildren, getMonthSummary]);

  const { sortedData, sortConfig, requestSort } = useSortableTable(filteredChildren, 'name');

  const totalCount = filteredChildren.reduce((s, c) => s + (yearSummary[c.id]?.count || 0), 0);
  const totalSum = filteredChildren.reduce((s, c) => s + (yearSummary[c.id]?.total || 0), 0);

  // Breakdown aggregieren
  const breakdownCounts = {};
  GERICHTE.forEach((g) => (breakdownCounts[g] = 0));
  filteredChildren.forEach((c) => {
    const byMeal = yearSummary[c.id]?.byMeal;
    if (byMeal) GERICHTE.forEach((g) => (breakdownCounts[g] += byMeal[g] || 0));
  });

  const exportYearCSV = () => {
    let csv = 'Nr;Name;Gruppe;Kassenzeichen;' + MONATE.join(';') + ';Jahressumme\n';
    filteredChildren.forEach((c, i) => {
      const ys = yearSummary[c.id] || { months: Array(12).fill(0), total: 0 };
      csv += `${i + 1};${c.name};${c.gruppe};${c.kassenzeichen};${ys.months.map((m) => m.toFixed(2).replace('.', ',')).join(';')};${ys.total.toFixed(2).replace('.', ',')}\n`;
    });
    downloadCSV(`Jahresuebersicht_${selectedYear}.csv`, csv);
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <input type="number" className="input" style={{ width: 80 }} value={selectedYear} onChange={(e) => setSelectedYear(+e.target.value)} />
        <select className="input" value={gruppeFilter} onChange={(e) => setGruppeFilter(e.target.value)}>
          <option>Alle</option>
          {gruppen.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={exportYearCSV} data-tooltip="Jahresübersicht als CSV herunterladen">
          {'\uD83D\uDCE5'} CSV Export
        </button>
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <table style={{ fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#FAFAF7' }}>
              <th style={{ position: 'sticky', left: 0, background: '#FAFAF7', zIndex: 1 }}>#</th>
              <SortHeader column="name" label="Name" sortConfig={sortConfig} onSort={requestSort} style={{ position: 'sticky', left: 28, background: '#FAFAF7', zIndex: 1, minWidth: 140 }} />
              {MONATE.map((m, i) => (
                <SortHeader
                  key={i}
                  column={`month_${i}`}
                  label={m.slice(0, 3)}
                  sortConfig={sortConfig}
                  onSort={requestSort}
                  style={{ textAlign: 'right', minWidth: 64, padding: '8px 6px' }}
                  accessor={(c) => yearSummary[c.id]?.months[i] || 0}
                />
              ))}
              <SortHeader column="total" label="Gesamt" sortConfig={sortConfig} onSort={requestSort} style={{ textAlign: 'right', minWidth: 80 }} accessor={(c) => yearSummary[c.id]?.total || 0} />
            </tr>
          </thead>
          <tbody>
            {sortedData.map((c, i) => {
              const ys = yearSummary[c.id] || { months: Array(12).fill(0), total: 0 };
              return (
                <tr key={c.id}>
                  <td style={{ color: '#9CA3AF', position: 'sticky', left: 0, background: 'white', zIndex: 1 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, position: 'sticky', left: 28, background: 'white', zIndex: 1 }}>{c.name}</td>
                  {ys.months.map((m, mi) => (
                    <td key={mi} style={{ textAlign: 'right', padding: '7px 6px', color: m > 0 ? '#1F2937' : '#D1D5DB', fontVariantNumeric: 'tabular-nums' }}>
                      {m > 0 ? m.toFixed(2).replace('.', ',') : '\u2013'}
                    </td>
                  ))}
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#059669' }}>{ys.total > 0 ? fmtEuro(ys.total) : '\u2013'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: '12px 16px', background: '#F9F7F3', borderTop: '2px solid #E5E1DA', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
          <span>
            Gesamt: {totalCount} Essen
            <BreakdownDisplay counts={breakdownCounts} />
          </span>
          <span>Jahressumme: <span style={{ color: '#059669' }}>{fmtEuro(totalSum)}</span></span>
        </div>
      </div>
    </div>
  );
}
