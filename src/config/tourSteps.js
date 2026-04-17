export function createTourSteps(setTab) {
  return [
    // Willkommen
    {
      popover: {
        title: 'Willkommen bei KiGa Essenverwaltung!',
        description: 'Diese kurze Tour zeigt dir die wichtigsten Funktionen der App. Du kannst sie jederzeit mit \u201E\u00DCberspringen\u201C beenden.',
      },
    },

    // Tab-Leiste
    {
      element: '#tour-tabs',
      popover: {
        title: 'Navigation',
        description: 'Hier wechselst du zwischen den 6 Bereichen der App. Du kannst auch die Tastenkombinationen Strg+1 bis Strg+6 verwenden.',
        side: 'bottom',
      },
    },

    // Tageserfassung
    {
      element: '#tour-tab-daily',
      popover: {
        title: 'Tageserfassung',
        description: 'Der Hauptbereich der App. Hier erfasst du t\u00E4glich die Essenauswahl f\u00FCr jedes Kind.',
        side: 'bottom',
      },
      onHighlightStarted: () => setTab('daily'),
    },
    {
      element: '#tour-date',
      popover: {
        title: 'Datumsauswahl',
        description: 'W\u00E4hle das Datum f\u00FCr die Tageserfassung. An Feiertagen und Schlie\u00DFtagen wird die Eingabe automatisch gesperrt.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-group-filter',
      popover: {
        title: 'Gruppenfilter',
        description: 'Filtere die Ansicht nach einzelnen Gruppen oder zeige alle Kinder an.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-meal-prices',
      popover: {
        title: 'Gerichtpreise',
        description: 'Trage hier die Tagespreise f\u00FCr die verschiedenen Gerichte (A\u2013E) ein. Nur Gerichte mit Preis k\u00F6nnen ausgew\u00E4hlt werden.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-meal-table',
      popover: {
        title: 'Essenauswahl',
        description: 'In der Tabelle w\u00E4hlst du pro Kind das Gericht aus. Klicke auf den Buchstaben (A\u2013E) um ein Gericht zuzuweisen.',
        side: 'top',
      },
    },
    {
      element: '#tour-daily-summary',
      popover: {
        title: 'Tageszusammenfassung',
        description: 'Hier siehst du die Gesamtanzahl der Essen, die Aufschl\u00FCsselung nach Gerichttyp und den Tagesbetrag.',
        side: 'top',
      },
    },

    // Stammdaten
    {
      element: '#tour-tab-stamm',
      popover: {
        title: 'Stammdaten',
        description: 'Hier verwaltest du alle Kinder: Anlegen, Bearbeiten, L\u00F6schen und den Status \u00E4ndern (aktiv/inaktiv).',
        side: 'bottom',
      },
      onHighlightStarted: () => setTab('stamm'),
    },
    {
      element: '#tour-add-child',
      popover: {
        title: 'Kind hinzuf\u00FCgen',
        description: 'Lege neue Kinder einzeln an. \u00DCber den Verwaltungs-Tab kannst du auch mehrere Kinder per CSV importieren.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-gruppen',
      popover: {
        title: 'Gruppen verwalten',
        description: 'Erstelle und verwalte die Gruppen deiner Einrichtung. Kinder werden den Gruppen zugeordnet.',
        side: 'bottom',
      },
    },

    // Monats\u00FCbersicht
    {
      element: '#tour-tab-month',
      popover: {
        title: 'Monats\u00FCbersicht',
        description: 'Die monatliche Abrechnung: Anzahl Essen und Gesamtbetrag pro Kind. Mit CSV-Export und E-Mail-Versand.',
        side: 'bottom',
      },
      onHighlightStarted: () => setTab('month'),
    },

    // Jahres\u00FCbersicht
    {
      element: '#tour-tab-year',
      popover: {
        title: 'Jahres\u00FCbersicht',
        description: 'Die 12-Monats-Matrix zeigt alle Betr\u00E4ge im Jahres\u00FCberblick mit Monats- und Jahressummen.',
        side: 'bottom',
      },
      onHighlightStarted: () => setTab('year'),
    },

    // Auswertung
    {
      element: '#tour-tab-analytics',
      popover: {
        title: 'Auswertung',
        description: 'Charts und Analysen zu Essensdaten, Kosten-Trends, Gerichtverteilung und Gruppenvergleichen.',
        side: 'bottom',
      },
      onHighlightStarted: () => setTab('analytics'),
    },

    // Verwaltung
    {
      element: '#tour-tab-admin',
      popover: {
        title: 'Verwaltung',
        description: 'Import/Export von Stamm- und Bewegungsdaten, Testdaten-Generator, Backup/Restore und System-Infos.',
        side: 'bottom',
      },
      onHighlightStarted: () => setTab('admin'),
    },

    // Help-Button
    {
      element: '#tour-help-btn',
      popover: {
        title: 'Tour erneut starten',
        description: 'Du kannst diese Tour jederzeit \u00FCber diesen Button erneut starten.',
        side: 'bottom',
      },
      onHighlightStarted: () => setTab('daily'),
    },

    // Abschluss
    {
      popover: {
        title: 'Alles klar!',
        description: 'Du kennst jetzt die wichtigsten Bereiche der App. Viel Erfolg mit der KiGa Essenverwaltung!',
      },
    },
  ];
}
