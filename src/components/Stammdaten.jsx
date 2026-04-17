import { useState } from 'react';
import Badge from './ui/Badge';
import SortHeader from './ui/SortHeader';
import ChildForm from './ChildForm';
import ConfirmDialog from './ui/ConfirmDialog';
import { getGruppeColor } from '../utils/dates';
import { useSortableTable } from '../hooks/useSortableTable';

const FORM_FIELDS = ['name', 'gruppe', 'but', 'zahlungspfl', 'adresse', 'kassenzeichen', 'hinweise', 'eintritt', 'austritt'];

export default function Stammdaten({ filteredChildren, gruppeFilter, setGruppeFilter, gruppen, addChild, updateChild, deleteChild, addGruppe, removeGruppe, children }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editChild, setEditChild] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [currentFormData, setCurrentFormData] = useState(null);
  const [pendingEdit, setPendingEdit] = useState(null);
  const [showGruppen, setShowGruppen] = useState(false);
  const [newGruppeName, setNewGruppeName] = useState('');
  const [gruppenError, setGruppenError] = useState('');
  const [gruppenConfirm, setGruppenConfirm] = useState(null);

  const { sortedData, sortConfig, requestSort } = useSortableTable(filteredChildren, 'name');

  const hasUnsavedChanges = () => {
    if (!editChild || !currentFormData) return false;
    return FORM_FIELDS.some((f) => currentFormData[f] !== editChild[f]);
  };

  const switchToChild = (c) => {
    setEditChild(c);
    setPendingEdit(null);
    setCurrentFormData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditClick = (c) => {
    if (editChild && editChild.id !== c.id && hasUnsavedChanges()) {
      setPendingEdit(c);
    } else {
      switchToChild(c);
    }
  };

  // --- Gruppen ---
  const handleAddGruppe = () => {
    setGruppenError('');
    if (!newGruppeName.trim()) return;
    const ok = addGruppe(newGruppeName);
    if (ok) { setNewGruppeName(''); } else { setGruppenError('Gruppe existiert bereits.'); }
  };

  const handleRemoveGruppe = (name) => {
    setGruppenError('');
    const hasKids = children.some((c) => c.gruppe === name);
    if (hasKids) {
      setGruppenError(`"${name}" kann nicht gelöscht werden, da noch Kinder zugeordnet sind.`);
      return;
    }
    setGruppenConfirm({
      name,
      title: 'Gruppe löschen?',
      message: `Die Gruppe \u201E${name}\u201C wird unwiderruflich gelöscht.`,
      confirmLabel: 'Löschen',
    });
  };

  const handleSave = (data) => {
    if (editChild) {
      updateChild(editChild.id, data);
      setEditChild(null);
      setCurrentFormData(null);
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
        <button id="tour-add-child" className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          + Kind hinzufügen
        </button>
      </div>

      {/* Gruppen verwalten */}
      <div id="tour-gruppen" className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
        <button
          onClick={() => setShowGruppen(!showGruppen)}
          style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#1F2937' }}
        >
          <span>{'\uD83C\uDFE8'} Gruppen verwalten</span>
          <span style={{ fontSize: 12, color: '#9CA3AF', transition: 'transform 0.2s', transform: showGruppen ? 'rotate(180deg)' : 'none' }}>{'\u25BC'}</span>
        </button>
        {showGruppen && (
          <div style={{ padding: '0 18px 18px' }}>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12, lineHeight: 1.6 }}>
              Verwalte die Gruppen deiner Einrichtung. Gruppen können nur gelöscht werden, wenn keine Kinder mehr zugeordnet sind.
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
              <input
                className="input"
                placeholder="Neue Gruppe..."
                value={newGruppeName}
                onChange={(e) => setNewGruppeName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGruppe()}
              />
              <button className="btn btn-primary" onClick={handleAddGruppe} disabled={!newGruppeName.trim()}>+ Hinzufügen</button>
            </div>
            {gruppenError && <div style={{ color: '#DC2626', fontSize: 12, marginBottom: 8 }}>{gruppenError}</div>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {gruppen.map((g) => (
                <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F0EB', borderRadius: 8, padding: '5px 10px' }}>
                  <Badge color={getGruppeColor(g)}>{g}</Badge>
                  <button className="btn btn-danger" style={{ fontSize: 10, padding: '2px 6px', lineHeight: 1 }} onClick={() => handleRemoveGruppe(g)} data-tooltip={`"${g}" löschen`}>
                    {'\u2715'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {(showAddForm || editChild) && (
        <ChildForm
          child={editChild}
          gruppen={gruppen}
          onSave={handleSave}
          onCancel={() => {
            setShowAddForm(false);
            setEditChild(null);
            setCurrentFormData(null);
          }}
          onFormChange={setCurrentFormData}
        />
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        <table>
          <thead>
            <tr style={{ background: '#FAFAF7' }}>
              <th>#</th>
              <SortHeader column="name" label="Name" sortConfig={sortConfig} onSort={requestSort} />
              <SortHeader column="gruppe" label="Gruppe" sortConfig={sortConfig} onSort={requestSort} />
              <SortHeader column="zahlungspfl" label="Zahlungspflichtiger" sortConfig={sortConfig} onSort={requestSort} />
              <SortHeader column="kassenzeichen" label="Kassenzeichen" sortConfig={sortConfig} onSort={requestSort} />
              <SortHeader column="hinweise" label="Hinweise" sortConfig={sortConfig} onSort={requestSort} />
              <SortHeader column="status" label="Status" sortConfig={sortConfig} onSort={requestSort} />
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((c, i) => (
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
                    <button className="btn btn-secondary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => handleEditClick(c)} data-tooltip="Bearbeiten">
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
                    <button
                      className="btn btn-danger"
                      style={{ fontSize: 11, padding: '3px 8px' }}
                      onClick={() => setDeleteConfirm(c)}
                      data-tooltip="Löschen"
                    >
                      {'\uD83D\uDDD1\uFE0F'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {gruppenConfirm && (
        <ConfirmDialog
          title={gruppenConfirm.title}
          message={gruppenConfirm.message}
          confirmLabel={gruppenConfirm.confirmLabel}
          onConfirm={() => {
            removeGruppe(gruppenConfirm.name);
            setGruppenConfirm(null);
          }}
          onCancel={() => setGruppenConfirm(null)}
          danger
        />
      )}

      {pendingEdit && (
        <ConfirmDialog
          title="Ungespeicherte Änderungen"
          message={`Du hast ungespeicherte Änderungen bei „${editChild.name}". Möchtest du diese speichern?`}
          confirmLabel="Speichern"
          cancelLabel="Verwerfen"
          onConfirm={() => {
            updateChild(editChild.id, currentFormData);
            switchToChild(pendingEdit);
          }}
          onCancel={() => {
            switchToChild(pendingEdit);
          }}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Kind löschen"
          message={`Bist du sicher, dass du „${deleteConfirm.name}" unwiderruflich löschen möchtest?`}
          confirmLabel="Löschen"
          danger
          onConfirm={() => {
            deleteChild(deleteConfirm.id);
            setDeleteConfirm(null);
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
