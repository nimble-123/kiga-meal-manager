import { useState, useEffect } from 'react';
import Badge from './ui/Badge';
import SortHeader from './ui/SortHeader';
import { MONATE, getGruppeColor, fmtEuro } from '../utils/dates';
import { downloadCSV } from '../utils/csv';
import { sendEmailWithCSV } from '../utils/email';
import { useSortableTable } from '../hooks/useSortableTable';
import { getSummaryBreakdown, BreakdownDisplay } from '../utils/mealBreakdown';

export default function MonthlyReport({ selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, gruppeFilter, setGruppeFilter, gruppen, filteredChildren, getMonthSummary }) {
  const [monthSummary, setMonthSummary] = useState({});

  useEffect(() => {
    getMonthSummary(selectedYear, selectedMonth).then(setMonthSummary);
  }, [selectedYear, selectedMonth, getMonthSummary]);

  const { sortedData, sortConfig, requestSort } = useSortableTable(filteredChildren, 'name');

  const generateCSV = () => {
    let csv = 'Nr;Name;Gruppe;Zahlungspflichtiger;Kassenzeichen;Anzahl Essen;Betrag\n';
    filteredChildren.forEach((c, i) => {
      const s = monthSummary[c.id] || { count: 0, total: 0 };
      csv += `${i + 1};${c.name};${c.gruppe};${c.zahlungspfl};${c.kassenzeichen};${s.count};${s.total.toFixed(2).replace('.', ',')}\n`;
    });
    return csv;
  };

  const exportMonthCSV = () => {
    downloadCSV(`Essensabrechnung_${MONATE[selectedMonth]}_${selectedYear}.csv`, generateCSV());
  };

  const handleEmail = () => {
    const csvContent = generateCSV();
    const csvFilename = `Essensabrechnung_${MONATE[selectedMonth]}_${selectedYear}.csv`;
    sendEmailWithCSV(
      `Essensabrechnung ${MONATE[selectedMonth]} ${selectedYear} - KiGa Mitte`,
      `Anbei die Essensabrechnung für ${MONATE[selectedMonth]} ${selectedYear}.\n\nMit freundlichen Grüßen\nKiGa Mitte`,
      csvFilename,
      csvContent
    );
  };

  const totalCount = filteredChildren.reduce((s, c) => s + (monthSummary[c.id]?.count || 0), 0);
  const totalSum = filteredChildren.reduce((s, c) => s + (monthSummary[c.id]?.total || 0), 0);
  const breakdown = getSummaryBreakdown(filteredChildren, monthSummary);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="input" value={selectedMonth} onChange={(e) => setSelectedMonth(+e.target.value)}>
          {MONATE.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
        <input type="number" className="input" style={{ width: 80 }} value={selectedYear} onChange={(e) => setSelectedYear(+e.target.value)} />
        <select className="input" value={gruppeFilter} onChange={(e) => setGruppeFilter(e.target.value)}>
          <option>Alle</option>
          {gruppen.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={exportMonthCSV} data-tooltip="Als CSV-Datei herunterladen">
            {'\uD83D\uDCE5'} CSV Export
          </button>
          <button className="btn btn-secondary" onClick={handleEmail} data-tooltip="E-Mail mit CSV-Anhang öffnen">
            {'\u2709\uFE0F'} Per E-Mail
          </button>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table>
          <thead>
            <tr style={{ background: '#FAFAF7' }}>
              <th>#</th>
              <SortHeader column="name" label="Name" sortConfig={sortConfig} onSort={requestSort} />
              <SortHeader column="gruppe" label="Gruppe" sortConfig={sortConfig} onSort={requestSort} />
              <th>Zahlungspflichtiger</th>
              <th>Kassenzeichen</th>
              <SortHeader column="essen" label="Essen" sortConfig={sortConfig} onSort={requestSort} style={{ textAlign: 'center' }} accessor={(c) => monthSummary[c.id]?.count || 0} />
              <SortHeader column="betrag" label="Betrag" sortConfig={sortConfig} onSort={requestSort} style={{ textAlign: 'right' }} accessor={(c) => monthSummary[c.id]?.total || 0} />
            </tr>
          </thead>
          <tbody>
            {sortedData.map((c, i) => {
              const s = monthSummary[c.id] || { count: 0, total: 0 };
              return (
                <tr key={c.id}>
                  <td style={{ color: '#9CA3AF', fontSize: 12 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>
                    <Badge color={getGruppeColor(c.gruppe)}>{c.gruppe}</Badge>
                  </td>
                  <td style={{ fontSize: 12 }}>{c.zahlungspfl}</td>
                  <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{c.kassenzeichen}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{s.count || '\u2013'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: s.total > 0 ? '#059669' : '#9CA3AF' }}>
                    {s.total > 0 ? fmtEuro(s.total) : '\u2013'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: '12px 16px', background: '#F9F7F3', borderTop: '2px solid #E5E1DA', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
          <span>
            Gesamt: {totalCount} Essen
            <BreakdownDisplay counts={breakdown} />
          </span>
          <span style={{ color: '#059669' }}>{fmtEuro(totalSum)}</span>
        </div>
      </div>
    </div>
  );
}
