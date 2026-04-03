import { useState } from 'react';
import Badge from './ui/Badge';
import ChildForm from './ChildForm';
import { getGruppeColor } from '../utils/dates';

export default function Stammdaten({ filteredChildren, gruppeFilter, setGruppeFilter, gruppen, addChild, updateChild, setTab }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editChild, setEditChild] = useState(null);

  const handleSave = (data) => {
    if (editChild) {
      updateChild(editChild.id, data);
      setEditChild(null);
    } else {
      addChild(data);
      setShowAddForm(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select className="input" value={gruppeFilter} onChange={(e) => setGruppeFilter(e.target.value)}>
            <option>Alle</option>
            {gruppen.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          <span style={{ fontSize: 13, color: '#6B7280' }}>{filteredChildren.length} Kinder</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setTab('admin')} data-tooltip="Gruppen im Verwaltungsbereich bearbeiten">
            Gruppen verwalten {'\u2192'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            + Kind hinzufügen
          </button>
        </div>
      </div>

      {(showAddForm || editChild) && (
        <ChildForm
          child={editChild}
          gruppen={gruppen}
          onSave={handleSave}
          onCancel={() => {
            setShowAddForm(false);
            setEditChild(null);
          }}
        />
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        <table>
          <thead>
            <tr style={{ background: '#FAFAF7' }}>
              <th>#</th>
              <th>Name</th>
              <th>Gruppe</th>
              <th>Zahlungspflichtiger</th>
              <th>Kassenzeichen</th>
              <th>Hinweise</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredChildren.map((c, i) => (
              <tr key={c.id} style={c.status === 'inaktiv' ? { opacity: 0.45 } : {}}>
                <td style={{ color: '#9CA3AF', fontSize: 12 }}>{i + 1}</td>
                <td style={{ fontWeight: 600 }}>
                  {c.name} {c.but && <Badge color="#D97706">BUT</Badge>}
                </td>
                <td>
                  <Badge color={getGruppeColor(c.gruppe)}>{c.gruppe}</Badge>
                </td>
                <td style={{ fontSize: 12 }}>{c.zahlungspfl}</td>
                <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{c.kassenzeichen}</td>
                <td style={{ fontSize: 12, color: '#6B7280' }}>{c.hinweise || '\u2013'}</td>
                <td>{c.status === 'aktiv' ? <Badge color="#059669">aktiv</Badge> : <Badge color="#DC2626">inaktiv</Badge>}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-secondary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => setEditChild(c)} data-tooltip="Bearbeiten">
                      {'\u270F\uFE0F'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: 11, padding: '3px 8px' }}
                      onClick={() => updateChild(c.id, { status: c.status === 'aktiv' ? 'inaktiv' : 'aktiv' })}
                      data-tooltip={c.status === 'aktiv' ? 'Deaktivieren' : 'Aktivieren'}
                    >
                      {c.status === 'aktiv' ? '\u23F8' : '\u25B6'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
