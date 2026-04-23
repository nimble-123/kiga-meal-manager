export default function UpdateBanner({ update }) {
  const { status, updateInfo, progress, error, dismissed, downloadUpdate, installUpdate, dismiss } = update;

  // Nichts anzeigen wenn kein relevanter Status oder vom Nutzer geschlossen
  if (status === 'idle' || status === 'checking' || status === 'up-to-date') return null;
  if (status === 'error' && !error) return null;
  if (dismissed && status !== 'downloaded') return null;

  const bannerStyle = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '10px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 13,
  };

  const btnStyle = {
    padding: '4px 12px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  };

  if (status === 'available') {
    return (
      <div style={{ background: '#E6F7F5', borderBottom: '1px solid #B2E4DF' }}>
        <div style={bannerStyle}>
          <span style={{ flex: 1, color: '#1F2937' }}>
            {'\u2B06\uFE0F'} Version <strong>{updateInfo?.version}</strong> ist verfügbar
          </span>
          <button onClick={downloadUpdate} style={{ ...btnStyle, background: '#2D9F93', color: 'white' }}>
            Herunterladen
          </button>
          <button onClick={dismiss} style={{ ...btnStyle, background: 'transparent', color: '#6B7280' }}>
            Später
          </button>
        </div>
      </div>
    );
  }

  if (status === 'downloading') {
    return (
      <div style={{ background: '#E6F7F5', borderBottom: '1px solid #B2E4DF' }}>
        <div style={bannerStyle}>
          <span style={{ color: '#1F2937' }}>Update wird heruntergeladen… {progress}%</span>
          <div style={{ flex: 1, height: 6, background: '#B2E4DF', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#2D9F93', borderRadius: 3, transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'downloaded') {
    return (
      <div style={{ background: '#D1FAE5', borderBottom: '1px solid #A7F3D0' }}>
        <div style={bannerStyle}>
          <span style={{ flex: 1, color: '#1F2937' }}>
            {'\u2705'} Version <strong>{updateInfo?.version}</strong> ist bereit!
          </span>
          <button onClick={installUpdate} style={{ ...btnStyle, background: '#2D9F93', color: 'white' }}>
            Neu starten
          </button>
          <button onClick={dismiss} style={{ ...btnStyle, background: 'transparent', color: '#6B7280' }}>
            Später
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA' }}>
        <div style={bannerStyle}>
          <span style={{ flex: 1, color: '#991B1B' }}>Update-Prüfung fehlgeschlagen: {error}</span>
          <button onClick={dismiss} style={{ ...btnStyle, background: 'transparent', color: '#6B7280' }}>
            Schließen
          </button>
        </div>
      </div>
    );
  }

  return null;
}
