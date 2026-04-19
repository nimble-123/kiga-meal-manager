import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../../src/App';
import { resetStore, seedStore } from '../setup';

const testDate = '2026-04-08'; // Wednesday, not a holiday
const mealKey = 'meals-2026-04';

const testChildren = [
  { id: 'c1', name: 'Müller, Emma', gruppe: 'Delfin', but: false, zahlungspfl: '', adresse: '', kassenzeichen: '', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
  { id: 'c2', name: 'Fischer, Lian', gruppe: 'Dino', but: false, zahlungspfl: '', adresse: '', kassenzeichen: '', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
  { id: 'c3', name: 'Weber, Theo', gruppe: 'Delfin', but: false, zahlungspfl: '', adresse: '', kassenzeichen: '', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
];

const withPrices = (extras = {}) => ({
  [testDate]: {
    prices: { A: 3.5, B: 4 },
    selections: {},
    abmeldungen: {},
    ...extras,
  },
});

async function setupDailyView(mealData = withPrices()) {
  seedStore({
    children: testChildren,
    gruppen: ['Delfin', 'Dino'],
    tourCompleted: true,
    [mealKey]: mealData,
  });
  const result = render(<App />);
  await waitFor(() => screen.getByText('Müller, Emma'));

  // Navigate to the test date (weekday)
  const dateInput = screen.getByDisplayValue(/\d{4}-\d{2}-\d{2}/);
  fireEvent.change(dateInput, { target: { value: testDate } });
  await waitFor(() => screen.getByText('Mi'));

  return result;
}

function getHeaderButtons() {
  const thead = document.querySelector('thead');
  return thead.querySelectorAll('.meal-btn');
}

function getHeaderButton(gericht) {
  const buttons = getHeaderButtons();
  return Array.from(buttons).find((b) => b.textContent === gericht);
}

function getRowButtons(childName) {
  const row = screen.getByText(childName).closest('tr');
  return row.querySelectorAll('.meal-btn');
}

function getRowButton(childName, gericht) {
  const buttons = getRowButtons(childName);
  return Array.from(buttons).find((b) => b.textContent === gericht);
}

describe('Bulk Meal Assignment', () => {
  beforeEach(() => {
    resetStore();
  });

  it('shows bulk assign buttons in table header', async () => {
    await setupDailyView();

    const headerButtons = getHeaderButtons();
    expect(headerButtons.length).toBe(5); // A, B, C, D, E
    expect(headerButtons[0].textContent).toBe('A');
    expect(headerButtons[1].textContent).toBe('B');
  });

  it('assigns meal to all children on header button click', async () => {
    await setupDailyView();

    const btnA = getHeaderButton('A');
    fireEvent.click(btnA);

    await waitFor(() => {
      // All three children should now have meal A selected (active button)
      for (const name of ['Müller, Emma', 'Fischer, Lian', 'Weber, Theo']) {
        const rowBtn = getRowButton(name, 'A');
        expect(rowBtn.className).toContain('active');
      }
    });
  });

  it('toggles off when all children already have the meal', async () => {
    const mealData = withPrices({
      selections: { c1: 'A', c2: 'A', c3: 'A' },
    });
    await setupDailyView(mealData);

    // All should be selected initially
    for (const name of ['Müller, Emma', 'Fischer, Lian', 'Weber, Theo']) {
      expect(getRowButton(name, 'A').className).toContain('active');
    }

    // Click header A again to remove
    fireEvent.click(getHeaderButton('A'));

    await waitFor(() => {
      for (const name of ['Müller, Emma', 'Fischer, Lian', 'Weber, Theo']) {
        expect(getRowButton(name, 'A').className).not.toContain('active');
      }
    });
  });

  it('skips absent children during bulk assignment', async () => {
    const mealData = withPrices({
      abmeldungen: { c2: { active: true, grund: 'krank' } },
    });
    await setupDailyView(mealData);

    fireEvent.click(getHeaderButton('A'));

    await waitFor(() => {
      // c1 and c3 should have meal A
      expect(getRowButton('Müller, Emma', 'A').className).toContain('active');
      expect(getRowButton('Weber, Theo', 'A').className).toContain('active');
      // c2 (absent) should NOT have meal A
      expect(getRowButton('Fischer, Lian', 'A').className).not.toContain('active');
    });
  });

  it('does not trigger for meals without a price', async () => {
    await setupDailyView();

    // Meal C has no price set
    const btnC = getHeaderButton('C');
    fireEvent.click(btnC);

    await waitFor(() => {
      for (const name of ['Müller, Emma', 'Fischer, Lian', 'Weber, Theo']) {
        expect(getRowButton(name, 'C').className).not.toContain('active');
      }
    });
  });

  it('allows individual override after bulk assignment', async () => {
    await setupDailyView();

    // Bulk assign A to all
    fireEvent.click(getHeaderButton('A'));
    await waitFor(() => {
      expect(getRowButton('Müller, Emma', 'A').className).toContain('active');
    });

    // Override one child to B
    fireEvent.click(getRowButton('Müller, Emma', 'B'));

    await waitFor(() => {
      expect(getRowButton('Müller, Emma', 'B').className).toContain('active');
      expect(getRowButton('Müller, Emma', 'A').className).not.toContain('active');
      // Others still have A
      expect(getRowButton('Fischer, Lian', 'A').className).toContain('active');
      expect(getRowButton('Weber, Theo', 'A').className).toContain('active');
    });
  });

  it('respects group filter for bulk assignment', async () => {
    await setupDailyView();

    // Filter to Delfin (c1 and c3)
    const select = screen.getAllByRole('combobox')[0];
    fireEvent.change(select, { target: { value: 'Delfin' } });

    await waitFor(() => {
      expect(screen.queryByText('Fischer, Lian')).not.toBeInTheDocument();
    });

    // Bulk assign A
    fireEvent.click(getHeaderButton('A'));
    await waitFor(() => {
      expect(getRowButton('Müller, Emma', 'A').className).toContain('active');
      expect(getRowButton('Weber, Theo', 'A').className).toContain('active');
    });

    // Switch back to Alle - Fischer should NOT have meal A
    fireEvent.change(select, { target: { value: 'Alle' } });
    await waitFor(() => {
      expect(getRowButton('Fischer, Lian', 'A').className).not.toContain('active');
    });
  });

  it('does not show bulk buttons on closed days', async () => {
    await setupDailyView();

    // Navigate to a Sunday (2026-04-12)
    const dateInput = screen.getByDisplayValue(testDate);
    fireEvent.change(dateInput, { target: { value: '2026-04-12' } });

    await waitFor(() => {
      const thead = document.querySelector('thead');
      const headerMealBtns = thead.querySelectorAll('.meal-btn');
      expect(headerMealBtns.length).toBe(0);
    });
  });
});
