import { useState } from 'react';
import { openFile } from '../utils/storage';

// Full-Screen-Aktivierung. Wird angezeigt, solange keine gültige Lizenz vorliegt.
export default function LicenseGate({ activate }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const handleImport = async () => {
    const result = await openFile([{ name: 'Lizenzdatei', extensions: ['lic', 'txt'] }]);
    if (result.success && result.content) {
      setKey(result.content.trim());
      setError('');
    }
  };

  const handleActivate = async () => {
    const trimmed = key.trim();
    if (!trimmed) {
      setError('Bitte einen Lizenzschlüssel eingeben.');
      return;
    }
    setPending(true);
    setError('');
    const res = await activate(trimmed);
    if (res && res.success) {
      // Nach Aktivierung neu laden: der entsperrte Daten-Store wird beim Start geöffnet.
      window.location.reload();
    } else {
      setError((res && res.error) || 'Aktivierung fehlgeschlagen.');
      setPending(false);
    }
  };

  return (
    <div style={{ background: '#FAF7F2', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card fade-in" style={{ padding: 36, maxWidth: 520, width: '100%' }}>
        <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>{'🔒'}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#2D9F93', textAlign: 'center', marginBottom: 8 }}>
          KiGa Essenverwaltung aktivieren
        </div>
        <div style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
          Diese App ist lizenzpflichtig. Bitte geben Sie Ihren Lizenzschlüssel ein oder importieren Sie die erhaltene Lizenzdatei (.lic).
        </div>

        <textarea
          className="input"
          value={key}
          onChange={(e) => { setKey(e.target.value); setError(''); }}
          placeholder="Lizenzschlüssel hier einfügen…"
          rows={4}
          style={{ width: '100%', fontFamily: 'monospace', fontSize: 12, resize: 'vertical', wordBreak: 'break-all' }}
        />

        {error && (
          <div style={{ color: '#DC2626', fontSize: 13, marginTop: 10 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-secondary" style={{ padding: '10px 20px' }} onClick={handleImport} disabled={pending}>
            {'📂'} Aus Datei importieren
          </button>
          <button className="btn btn-primary" style={{ padding: '10px 20px' }} onClick={handleActivate} disabled={pending || !key.trim()}>
            {pending ? 'Aktiviere…' : 'Aktivieren'}
          </button>
        </div>
      </div>
    </div>
  );
}
