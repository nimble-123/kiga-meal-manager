const TABS = [
  { id: 'daily', label: 'Tageserfassung', icon: '\uD83D\uDCCB', tooltip: 'Tägliche Essenauswahl (Ctrl+1)' },
  { id: 'week', label: 'Wochenerfassung', icon: '\uD83D\uDDD3\uFE0F', tooltip: 'Wochenplan eintragen (Ctrl+2)' },
  { id: 'stamm', label: 'Stammdaten', icon: '\uD83D\uDC67', tooltip: 'Kinder verwalten (Ctrl+3)' },
  { id: 'month', label: 'Monatsübersicht', icon: '\uD83D\uDCC5', tooltip: 'Monatliche Abrechnung (Ctrl+4)' },
  { id: 'year', label: 'Jahresübersicht', icon: '\uD83D\uDCC8', tooltip: 'Jahresübersicht (Ctrl+5)' },
  { id: 'analytics', label: 'Auswertung', icon: '\uD83D\uDCCA', tooltip: 'Charts & Analysen (Ctrl+6)' },
  { id: 'admin', label: 'Verwaltung', icon: '\u2699\uFE0F', tooltip: 'Import, Export & Einstellungen (Ctrl+7)' },
];

export default function Header({ tab, setTab, activeCount, onStartTour }) {
  return (
    <div style={{ background: 'linear-gradient(135deg,#2D9F93 0%,#247A71 100%)', padding: '16px 24px', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>{'\uD83C\uDFE0'} KiGa Mitte</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
              Essenverwaltung v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '?'} &middot; {activeCount} aktive Kinder
            </div>
          </div>
          <button
            id="tour-help-btn"
            onClick={onStartTour}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            data-tooltip="App-Tour starten"
          >
            ?
          </button>
        </div>
        <div id="tour-tabs" style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 3 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              id={`tour-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              title={t.tooltip}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: tab === t.id ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: tab === t.id ? 'white' : 'transparent',
                color: tab === t.id ? '#2D9F93' : 'rgba(255,255,255,0.9)',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
