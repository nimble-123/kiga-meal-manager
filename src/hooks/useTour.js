import { useCallback, useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { createTourSteps } from '../config/tourSteps';
import { storageGet, storageSet } from '../utils/storage';

export function useTour() {
  const driverRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, []);

  const startTour = useCallback((setTab) => {
    // Destroy previous instance if running
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    const steps = createTourSteps(setTab);

    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Weiter',
      prevBtnText: 'Zurück',
      doneBtnText: 'Fertig',
      popoverClass: 'kiga-tour',
      overlayColor: 'rgba(0,0,0,0.5)',
      steps,
      onDestroyed: () => {
        storageSet('tourCompleted', true);
        // Return to daily tab when tour ends
        setTab('daily');
      },
    });

    driverRef.current = driverObj;
    driverObj.drive();
  }, []);

  const checkFirstUse = useCallback(async () => {
    const completed = await storageGet('tourCompleted');
    return !completed;
  }, []);

  return { startTour, checkFirstUse };
}
