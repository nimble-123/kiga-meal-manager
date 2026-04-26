import Badge from './ui/Badge';
import { GERICHT_COLORS, getGruppeColor, fmtEuro, WOCHENTAGE } from '../utils/dates';

function fmtFull(isoDate) {
  const d = new Date(isoDate + 'T12:00:00');
  return `${WOCHENTAGE[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

export default function WeekTodayView({ today, dayData, filteredChildren, setAbmeldungForDate }) {
  const planned = filteredChildren.filter((c) => dayData.selections?.[c.id]);
  const noPlan = filteredChildren.filter((c) => !dayData.selections?.[c.id]);

  // Konsistent mit DailyEntry: Abmeldungen werden NICHT vom Betrag abgezogen.
  // Sie sind eine separate Information.
  const abmeldungenCount = filteredChildren.filter((c) => dayData.abmeldungen?.[c.id]?.active).length;
  const totalBetrag = planned.reduce((s, c) => {
    const sel = dayData.selections?.[c.id];
    return s + (parseFloat(dayData.prices?.[sel]) || 0);
  }, 0);

  return (
    <div className="fade-in">
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
          Heute &middot; {fmtFull(today)}
        </div>
        <div style={{ fontSize: 14, color: '#374151' }}>
          Schnellansicht für tagesaktuelle Abmeldungen. Eingeplant: <strong>{planned.length}</strong> Kinder
          {abmeldungenCount > 0 && <>, davon <strong>{abmeldungenCount}</strong> abgemeldet</>}.
          {' '}<span style={{ fontSize: 12, color: '#9CA3AF' }}>Abmeldungen werden zur Information erfasst, der Tagesbetrag bleibt erhalten (analog Tageserfassung).</span>
        </div>
      </div>

      {planned.length === 0 ? (
        <div className="card" style={{ padding: 20, textAlign: 'center', color: '#6B7280' }}>
          Für heute sind keine Kinder zum Essen eingeplant. Wechsle in den Wochenplan, um Auswahlen einzutragen.
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table>
            <thead>
              <tr style={{ background: '#FAFAF7' }}>
                <th style={{ width: 30 }}>#</th>
                <th>Name</th>
                <th>Gruppe</th>
                <th style={{ textAlign: 'center' }}>Gericht</th>
                <th style={{ textAlign: 'center' }}>Abgemeldet</th>
                <th>Grund</th>
                <th style={{ textAlign: 'right' }}>Betrag</th>
              </tr>
            </thead>
            <tbody>
              {planned.map((c, i) => {
                const sel = dayData.selections?.[c.id];
                const abm = dayData.abmeldungen?.[c.id];
                const price = sel && dayData.prices?.[sel] ? parseFloat(dayData.prices[sel]) : 0;
                return (
                  <tr key={c.id} style={abm?.active ? { background: '#FEF3C7', opacity: 0.75 } : undefined}>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>
                      {c.name} {c.but && <Badge color="#D97706">BUT</Badge>}
                    </td>
                    <td>
                      <Badge color={getGruppeColor(c.gruppe)}>{c.gruppe}</Badge>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 30, height: 26, borderRadius: 6,
                          fontWeight: 800, fontSize: 13, color: 'white',
                          background: GERICHT_COLORS[sel] || '#9CA3AF',
                        }}
                      >
                        {sel}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: 6 }}>
                        <input
                          type="checkbox"
                          checked={!!abm?.active}
                          onChange={(e) => {
                            const cur = abm || {};
                            setAbmeldungForDate(today, c.id, { ...cur, active: e.target.checked });
                          }}
                          style={{ width: 22, height: 22, cursor: 'pointer', accentColor: '#D97706' }}
                        />
                      </label>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={abm?.grund || ''}
                        onChange={(e) => {
                          const cur = abm || {};
                          setAbmeldungForDate(today, c.id, { ...cur, grund: e.target.value });
                        }}
                        placeholder="z.B. krank"
                        className="input"
                        style={{ width: '100%', fontSize: 12, padding: '4px 8px' }}
                        disabled={!abm?.active}
                      />
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
              Gesamt: {planned.length} Essen
              {abmeldungenCount > 0 && (
                <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 8, color: '#D97706' }}>
                  ({abmeldungenCount} abgemeldet)
                </span>
              )}
            </span>
            <span style={{ color: '#059669' }}>{fmtEuro(totalBetrag)}</span>
          </div>
        </div>
      )}

      {noPlan.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: '#9CA3AF' }}>
          Hinweis: {noPlan.length} weiteres/weitere Kind(er) sind heute nicht zum Essen eingeplant und werden hier nicht angezeigt.
        </div>
      )}
    </div>
  );
}
