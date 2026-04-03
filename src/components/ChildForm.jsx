import { useState } from 'react';
import { DEFAULT_GRUPPEN } from '../utils/dates';

export default function ChildForm({ child, gruppen = DEFAULT_GRUPPEN, onSave, onCancel }) {
  const [form, setForm] = useState(
    child || {
      name: '',
      gruppe: gruppen[0],
      but: false,
      zahlungspfl: '',
      adresse: '',
      kassenzeichen: '',
      hinweise: '',
      status: 'aktiv',
      eintritt: '',
      austritt: '',
    }
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const Field = ({ label, k, type = 'text', children: fieldChildren, ...props }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
        {label}
      </label>
      {type === 'select' ? (
        <select className="input" value={form[k]} onChange={(e) => set(k, e.target.value)} {...props}>
          {fieldChildren}
        </select>
      ) : (
        <input
          type={type}
          className="input"
          value={form[k]}
          onChange={(e) => set(k, type === 'checkbox' ? e.target.checked : e.target.value)}
          {...props}
        />
      )}
    </div>
  );

  return (
    <div className="card fade-in" style={{ padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
        {child ? '\u270F\uFE0F Kind bearbeiten' : '\u2795 Neues Kind'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Field label="Name" k="name" placeholder="Nachname, Vorname" />
        <Field label="Gruppe" k="gruppe" type="select">
          {gruppen.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </Field>
        <Field label="Zahlungspflichtiger" k="zahlungspfl" />
        <Field label="Adresse" k="adresse" />
        <Field label="Kassenzeichen" k="kassenzeichen" />
        <Field label="Ernährungshinweise" k="hinweise" placeholder="z.B. vegetarisch, laktosefrei" />
        <div style={{ display: 'flex', alignItems: 'end', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.but} onChange={(e) => set('but', e.target.checked)} /> Bildungskarte (BUT)
          </label>
        </div>
        <Field label="Eintritt" k="eintritt" type="date" />
        <Field label="Austritt" k="austritt" type="date" />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary" onClick={onCancel}>
          Abbrechen
        </button>
        <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.name}>
          {'\uD83D\uDCBE'} Speichern
        </button>
      </div>
    </div>
  );
}
