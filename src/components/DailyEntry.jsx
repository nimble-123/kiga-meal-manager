import Badge from './ui/Badge';
import PriceInput from './ui/PriceInput';
import SortHeader from './ui/SortHeader';
import { GERICHTE, WOCHENTAGE, GERICHT_COLORS, getGruppeColor, fmtEuro } from '../utils/dates';
import { isClosedDay } from '../data/holidays';
import { useSortableTable } from '../hooks/useSortableTable';
import { getDailyBreakdown, BreakdownDisplay } from '../utils/mealBreakdown';

export default function DailyEntry({ selectedDate, setSelectedDate, gruppeFilter, setGruppeFilter, gruppen, filteredChildren, todayData, setTodayPrices, setTodaySelection, setTodayAbmeldung }) {
  const isClosed = isClosedDay(selectedDate);
  const dateObj = new Date(selectedDate + 'T12:00:00');

  const { sortedData, sortConfig, requestSort } = useSortableTable(filteredChildren, 'name');

  const getPrice = (c) => {
    const sel = todayData.selections?.[c.id] || '';
    return sel && todayData.prices?.[sel] ? parseFloat(todayData.prices[sel]) : 0;
  };

  const totalCount = filteredChildren.filter((c) => todayData.selections?.[c.id]).length;
  const totalSum = filteredChildren.reduce((s, c) => s + getPrice(c), 0);
  const breakdown = getDailyBreakdown(filteredChildren, todayData.selections);
  const abmeldungenCount = filteredChildren.filter((c) => todayData.abmeldungen?.[c.id]?.active).length;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="card" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>Datum:</span>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input" style={{ fontWeight: 600 }} />
          <span style={{ fontSize: 14 }}>{WOCHENTAGE[dateObj.getDay()]}</span>
          {isClosed && <Badge color="#DC2626">Geschlossen</Badge>}
        </div>
        <select className="input" value={gruppeFilter} onChange={(e) => setGruppeFilter(e.target.value)}>
          <option>Alle</option>
          {gruppen.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </div>

      {!isClosed && (
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Gerichtpreise heute
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
                  data-tooltip={`Preis für Gericht ${g}`}
                >
                  {g}
                </span>
                <PriceInput
                  value={todayData.prices[g] || ''}
                  onChange={(val) => setTodayPrices(g, val)}
                />
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{'\u20AC'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        <table>
          <thead>
            <tr style={{ background: '#FAFAF7' }}>
              <th style={{ width: 30 }}>#</th>
              <SortHeader column="name" label="Name" sortConfig={sortConfig} onSort={requestSort} />
              <SortHeader column="gruppe" label="Gruppe" sortConfig={sortConfig} onSort={requestSort} />
              <th>Hinweise</th>
              <th style={{ textAlign: 'center' }}>Gericht</th>
              <th style={{ textAlign: 'center', width: 40 }} data-tooltip="Abmeldung">Abm.</th>
              <th style={{ width: 120 }}>Grund</th>
              <SortHeader column="betrag" label="Betrag" sortConfig={sortConfig} onSort={requestSort} style={{ textAlign: 'right' }} accessor={getPrice} />
            </tr>
          </thead>
          <tbody>
            {sortedData.map((c, i) => {
              const sel = todayData.selections?.[c.id] || '';
              const price = getPrice(c);
              const abm = todayData.abmeldungen?.[c.id];
              return (
                <tr key={c.id} style={abm?.active ? { background: '#FEF3C7', opacity: 0.75 } : undefined}>
                  <td style={{ color: '#9CA3AF', fontSize: 12 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>
                    {c.name} {c.but && <Badge color="#D97706">BUT</Badge>}
                  </td>
                  <td>
                    <Badge color={getGruppeColor(c.gruppe)}>{c.gruppe}</Badge>
                  </td>
                  <td style={{ fontSize: 12, color: '#6B7280', fontStyle: c.hinweise ? 'normal' : 'italic' }}>{c.hinweise || '\u2013'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {isClosed ? (
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{'\u2013'}</span>
                    ) : (
                      <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                        {GERICHTE.map((g) => {
                          const hasPrice = todayData.prices?.[g] > 0;
                          return (
                            <button
                              key={g}
                              className={`meal-btn ${sel === g ? 'active' : ''}`}
                              style={
                                sel === g
                                  ? { background: GERICHT_COLORS[g], borderColor: GERICHT_COLORS[g] }
                                  : hasPrice ? {} : { opacity: 0.3, cursor: 'default' }
                              }
                              onClick={() => { if (hasPrice) setTodaySelection(c.id, sel === g ? '' : g); }}
                              data-tooltip={hasPrice ? `Gericht ${g} \u2013 ${fmtEuro(todayData.prices[g])}` : `Gericht ${g} \u2013 kein Preis`}
                            >
                              {g}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {isClosed ? (
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{'\u2013'}</span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={!!abm?.active}
                        onChange={(e) => {
                          const current = abm || {};
                          setTodayAbmeldung(c.id, { ...current, active: e.target.checked });
                        }}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#2D9F93' }}
                        data-tooltip="Kind abgemeldet"
                      />
                    )}
                  </td>
                  <td>
                    {isClosed ? (
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{'\u2013'}</span>
                    ) : (
                      <input
                        type="text"
                        value={abm?.grund || ''}
                        onChange={(e) => {
                          const current = abm || {};
                          setTodayAbmeldung(c.id, { ...current, grund: e.target.value });
                        }}
                        placeholder="z.B. krank"
                        className="input"
                        style={{ width: '100%', fontSize: 12, padding: '3px 6px' }}
                        disabled={!abm?.active}
                      />
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {price > 0 ? fmtEuro(price) : '\u2013'}
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
            {abmeldungenCount > 0 && (
              <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 8, color: '#D97706' }}>
                ({abmeldungenCount} abgemeldet)
              </span>
            )}
          </span>
          <span style={{ color: '#059669' }}>{fmtEuro(totalSum)}</span>
        </div>
      </div>
    </div>
  );
}
