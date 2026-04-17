import { parseChildrenCSV, parseGruppenCSV } from '../utils/import';
import { openFile } from '../utils/storage';

export default function EmptyState({ onImport, onAddChild, onStartTour }) {
  const handleImportCSV = async () => {
    const result = await openFile([{ name: 'CSV-Dateien', extensions: ['csv'] }]);
    if (!result.success) return;

    const { children, errors } = parseChildrenCSV(result.content);
    if (errors.length > 0) {
      alert(`Import-Fehler:\n${errors.join('\n')}`);
    }
    if (children.length > 0) {
      // Gruppen aus den Kinderdaten extrahieren
      const gruppen = [...new Set(children.map((c) => c.gruppe).filter(Boolean))];
      onImport(children, gruppen);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 500 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{'\uD83C\uDFE0'}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#2D9F93', marginBottom: 8 }}>
          Willkommen bei KiGa Essenverwaltung
        </div>
        <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 28, lineHeight: 1.6 }}>
          Noch keine Kinder angelegt. Importieren Sie eine CSV-Datei mit den Kinderdaten oder legen Sie Kinder manuell an.
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ padding: '10px 20px' }} onClick={handleImportCSV}>
            {'\uD83D\uDCE5'} Kinder aus CSV importieren
          </button>
          <button className="btn btn-secondary" style={{ padding: '10px 20px' }} onClick={onAddChild}>
            {'\u2795'} Kind manuell anlegen
          </button>
          <button className="btn btn-secondary" style={{ padding: '10px 20px' }} onClick={onStartTour}>
            {'\uD83C\uDF93'} App-Tour starten
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 20 }}>
          CSV-Format: Name;Gruppe;BUT;Zahlungspflichtiger;Adresse;Kassenzeichen
        </div>
      </div>
    </div>
  );
}
