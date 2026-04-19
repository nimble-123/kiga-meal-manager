import { useState, useMemo, useEffect, useCallback } from 'react';
import Header from './components/Header';
import DailyEntry from './components/DailyEntry';
import Stammdaten from './components/Stammdaten';
import MonthlyReport from './components/MonthlyReport';
import YearlyReport from './components/YearlyReport';
import Analytics from './components/Analytics';
import Administration from './components/Administration';
import EmptyState from './components/EmptyState';
import { useChildren } from './hooks/useChildren';
import { useMeals } from './hooks/useMeals';
import { useTour } from './hooks/useTour';

const TAB_IDS = ['daily', 'stamm', 'month', 'year', 'analytics', 'admin'];

export default function App() {
  const [tab, setTab] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [gruppeFilter, setGruppeFilter] = useState('Alle');

  const { children, activeChildren, gruppen, loading, saveIndicator, addChild, updateChild, deleteChild, setChildrenBulk, setGruppenBulk, addGruppe, removeGruppe, renameGruppe } = useChildren();
  const { todayData, setTodayPrices, setTodaySelection, setBulkTodaySelection, setTodayAbmeldung, getMonthSummary } = useMeals(selectedDate, activeChildren);
  const { startTour, checkFirstUse } = useTour();

  const handleStartTour = useCallback(() => startTour(setTab), [startTour]);

  // Auto-start tour on first use
  useEffect(() => {
    if (loading) return;
    checkFirstUse().then((isFirstUse) => {
      if (isFirstUse) {
        // Small delay so the UI is fully rendered
        setTimeout(() => startTour(setTab), 500);
      }
    });
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredChildren = useMemo(() => {
    let list = tab === 'stamm' ? children : activeChildren;
    if (gruppeFilter !== 'Alle') list = list.filter((c) => c.gruppe === gruppeFilter);
    return list;
  }, [children, activeChildren, gruppeFilter, tab]);

  // Keyboard shortcuts: Ctrl+1..6 für Tab-Wechsel
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        setTab(TAB_IDS[parseInt(e.key) - 1]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleEmptyImport = useCallback((importedChildren, importedGruppen) => {
    setChildrenBulk(importedChildren);
    if (importedGruppen.length > 0) setGruppenBulk(importedGruppen);
  }, [setChildrenBulk, setGruppenBulk]);

  const handleEmptyAddChild = useCallback(() => {
    setTab('stamm');
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: '#FAF7F2' }}>
        <div className="text-xl" style={{ color: '#2D9F93', fontFamily: 'system-ui' }}>
          Laden...
        </div>
      </div>
    );
  }

  const isEmpty = children.length === 0;

  return (
    <div style={{ background: '#FAF7F2', fontFamily: '-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif', minHeight: '100vh', color: '#1F2937' }}>
      {saveIndicator && <div className="save-dot">{'\u2713'} Gespeichert</div>}

      <Header tab={tab} setTab={setTab} activeCount={activeChildren.length} onStartTour={handleStartTour} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px' }}>
        {isEmpty && tab === 'daily' ? (
          <EmptyState onImport={handleEmptyImport} onAddChild={handleEmptyAddChild} onStartTour={handleStartTour} />
        ) : (
          <>
            {tab === 'daily' && (
              <DailyEntry
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                gruppeFilter={gruppeFilter}
                setGruppeFilter={setGruppeFilter}
                gruppen={gruppen}
                filteredChildren={filteredChildren}
                todayData={todayData}
                setTodayPrices={setTodayPrices}
                setTodaySelection={setTodaySelection}
                setBulkTodaySelection={setBulkTodaySelection}
                setTodayAbmeldung={setTodayAbmeldung}
              />
            )}

            {tab === 'stamm' && (
              <Stammdaten
                filteredChildren={filteredChildren}
                gruppeFilter={gruppeFilter}
                setGruppeFilter={setGruppeFilter}
                gruppen={gruppen}
                addChild={addChild}
                updateChild={updateChild}
                deleteChild={deleteChild}
                addGruppe={addGruppe}
                removeGruppe={removeGruppe}
                children={children}
              />
            )}

            {tab === 'month' && (
              <MonthlyReport
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                gruppeFilter={gruppeFilter}
                setGruppeFilter={setGruppeFilter}
                gruppen={gruppen}
                filteredChildren={filteredChildren}
                getMonthSummary={getMonthSummary}
              />
            )}

            {tab === 'year' && (
              <YearlyReport
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                gruppeFilter={gruppeFilter}
                setGruppeFilter={setGruppeFilter}
                gruppen={gruppen}
                filteredChildren={filteredChildren}
                activeChildren={activeChildren}
                getMonthSummary={getMonthSummary}
              />
            )}

            {tab === 'analytics' && (
              <Analytics
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                activeChildren={activeChildren}
                children={children}
                gruppen={gruppen}
              />
            )}

            {tab === 'admin' && (
              <Administration
                children={children}
                activeChildren={activeChildren}
                gruppen={gruppen}
                setChildrenBulk={setChildrenBulk}
                setGruppenBulk={setGruppenBulk}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
