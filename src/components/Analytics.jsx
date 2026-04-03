import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { GERICHTE, GERICHT_COLORS, MONATE, getGruppeColor, fmtEuro } from '../utils/dates';
import { aggregateYearData } from '../utils/analytics';

const SHORT_MONTHS = MONATE.map((m) => m.substring(0, 3));

function ChartCard({ title, children: ch }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#1F2937' }}>{title}</div>
      {ch}
    </div>
  );
}

const euroFormatter = (v) => fmtEuro(v);
const pctFormatter = (v) => `${v}%`;

export default function Analytics({ selectedYear, setSelectedYear, activeChildren, children, gruppen }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    aggregateYearData(selectedYear, children).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [selectedYear, children]);

  if (loading || !data) {
    return (
      <div className="fade-in" style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
        Daten werden geladen...
      </div>
    );
  }

  // Preis-Trend Daten
  const priceData = SHORT_MONTHS.map((m, i) => {
    const row = { name: m };
    GERICHTE.forEach((g) => { row[g] = data.pricesByMonth[i]?.[g] ?? null; });
    return row;
  });

  // Kosten pro Monat
  const costData = SHORT_MONTHS.map((m, i) => ({
    name: m,
    ...Object.fromEntries(GERICHTE.map((g) => [g, Math.round((data.costsByMonth[i]?.[g] || 0) * 100) / 100])),
    total: data.costsByMonth[i]?.total || 0,
  }));

  // Teilnahmequote
  const participationData = SHORT_MONTHS.map((m, i) => ({
    name: m,
    quote: data.participationByMonth[i] || 0,
  }));

  // Essenverteilung
  const distData = GERICHTE.map((g) => ({
    name: `Gericht ${g}`,
    value: data.mealDistribution[g] || 0,
    color: GERICHT_COLORS[g],
  })).filter((d) => d.value > 0);
  const totalDist = distData.reduce((s, d) => s + d.value, 0);

  // Gruppenvergleich
  const groupData = gruppen.map((g) => ({
    name: g,
    wert: data.groupComparison[g] || 0,
    color: getGruppeColor(g),
  }));

  // BUT-Anteil
  const butData = [
    { name: 'BUT-Kinder', value: data.butShare.butMeals, color: '#D97706' },
    { name: 'Nicht-BUT', value: data.butShare.nonButMeals, color: '#2D9F93' },
  ].filter((d) => d.value > 0);

  const hasData = totalDist > 0;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <input type="number" className="input" style={{ width: 80 }} value={selectedYear} onChange={(e) => setSelectedYear(+e.target.value)} />
        <span style={{ fontSize: 13, color: '#6B7280' }}>
          {hasData ? `${totalDist} Essen gesamt` : 'Keine Daten für dieses Jahr'}
        </span>
      </div>

      {!hasData ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
          Keine Essensdaten für {selectedYear} vorhanden. Generieren Sie Testdaten im Verwaltungsbereich.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))', gap: 16 }}>
          {/* Preisentwicklung */}
          <ChartCard title="Preisentwicklung pro Gericht">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E1DA" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `${v.toFixed(2)} \u20AC`} />
                <Tooltip formatter={euroFormatter} />
                <Legend />
                {GERICHTE.map((g) => (
                  <Line key={g} type="monotone" dataKey={g} stroke={GERICHT_COLORS[g]} strokeWidth={2} dot={{ r: 3 }} connectNulls name={`Gericht ${g}`} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Monatliche Kosten */}
          <ChartCard title="Monatliche Gesamtkosten">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E1DA" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `${v} \u20AC`} />
                <Tooltip formatter={euroFormatter} />
                <Legend />
                {GERICHTE.map((g) => (
                  <Bar key={g} dataKey={g} stackId="a" fill={GERICHT_COLORS[g]} name={`Gericht ${g}`} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Teilnahmequote */}
          <ChartCard title="Teilnahmequote pro Monat">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={participationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E1DA" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} domain={[0, 100]} tickFormatter={pctFormatter} />
                <Tooltip formatter={pctFormatter} />
                <Line type="monotone" dataKey="quote" stroke="#2D9F93" strokeWidth={2} dot={{ r: 4 }} name="Teilnahme" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Essenverteilung */}
          <ChartCard title="Essenverteilung">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={distData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                  {distData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Gruppenvergleich */}
          <ChartCard title={'\u00D8 Essen pro Kind / Monat nach Gruppe'}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={groupData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E1DA" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="wert" name="\u00D8 Essen/Kind/Monat" radius={[4, 4, 0, 0]}>
                  {groupData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* BUT-Anteil */}
          <ChartCard title="BUT-Anteil an Gesamtessen">
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <ResponsiveContainer width="60%" height={250}>
                <PieChart>
                  <Pie data={butData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                    {butData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 13, lineHeight: 2 }}>
                <div><strong style={{ color: '#D97706' }}>{data.butShare.butMeals}</strong> BUT-Essen</div>
                <div><strong style={{ color: '#2D9F93' }}>{data.butShare.nonButMeals}</strong> Nicht-BUT</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#D97706', marginTop: 8 }}>{data.butShare.percentage}%</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>BUT-Anteil</div>
              </div>
            </div>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
