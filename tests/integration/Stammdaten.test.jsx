import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Stammdaten from '../../src/components/Stammdaten';

const gruppen = ['Delfin', 'Dino'];

// Sorted by name ascending: Fischer before Müller
const testChildren = [
  { id: 'c1', name: 'Müller, Emma', gruppe: 'Delfin', but: false, zahlungspfl: 'Müller, Sandra', kassenzeichen: '10.001', hinweise: '', status: 'aktiv', eintritt: '', austritt: '' },
  { id: 'c2', name: 'Fischer, Lian', gruppe: 'Dino', but: true, zahlungspfl: 'Fischer, Tom', kassenzeichen: '10.002', hinweise: 'vegetarisch', status: 'inaktiv', eintritt: '', austritt: '' },
];

const defaultProps = () => ({
  filteredChildren: testChildren,
  gruppeFilter: 'Alle',
  setGruppeFilter: vi.fn(),
  gruppen,
  addChild: vi.fn(),
  updateChild: vi.fn(),
  deleteChild: vi.fn(),
  addGruppe: vi.fn(),
  removeGruppe: vi.fn(),
  children: testChildren,
});

describe('Stammdaten', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Scroll-to-top beim Bearbeiten', () => {
    it('scrolls to top when edit button is clicked', () => {
      const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      render(<Stammdaten {...defaultProps()} />);

      const editButtons = screen.getAllByText('✏️');
      fireEvent.click(editButtons[0]);

      expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });
  });

  describe('Kind löschen', () => {
    it('shows confirmation dialog when delete button is clicked', () => {
      render(<Stammdaten {...defaultProps()} />);

      const deleteButtons = screen.getAllByText('🗑️');
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText('Kind löschen')).toBeInTheDocument();
      expect(screen.getByText(/unwiderruflich löschen/)).toBeInTheDocument();
    });

    it('does not delete when cancel is clicked', () => {
      const props = defaultProps();
      render(<Stammdaten {...props} />);

      const deleteButtons = screen.getAllByText('🗑️');
      fireEvent.click(deleteButtons[0]);

      fireEvent.click(screen.getByText('Abbrechen'));

      expect(props.deleteChild).not.toHaveBeenCalled();
      expect(screen.queryByText('Kind löschen')).not.toBeInTheDocument();
    });

    it('deletes child when confirm is clicked', () => {
      const props = defaultProps();
      render(<Stammdaten {...props} />);

      // Default sort: name ascending → Fischer (c2) is first
      const deleteButtons = screen.getAllByText('🗑️');
      fireEvent.click(deleteButtons[0]);

      fireEvent.click(screen.getByText('Löschen'));

      expect(props.deleteChild).toHaveBeenCalledWith('c2');
      expect(screen.queryByText('Kind löschen')).not.toBeInTheDocument();
    });
  });

  describe('Ungespeicherte Änderungen beim Wechsel', () => {
    it('switches directly when no changes were made', () => {
      const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      render(<Stammdaten {...defaultProps()} />);

      const editButtons = screen.getAllByText('✏️');
      fireEvent.click(editButtons[0]);
      expect(screen.getByText(/Kind bearbeiten/)).toBeInTheDocument();

      fireEvent.click(editButtons[1]);
      expect(screen.queryByText('Ungespeicherte Änderungen')).not.toBeInTheDocument();
      expect(scrollTo).toHaveBeenCalledTimes(2);
    });

    it('shows dialog when switching with unsaved changes', () => {
      vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      render(<Stammdaten {...defaultProps()} />);

      const editButtons = screen.getAllByText('✏️');
      fireEvent.click(editButtons[0]);

      fireEvent.change(screen.getByPlaceholderText('Nachname, Vorname'), { target: { value: 'Geändert' } });

      fireEvent.click(editButtons[1]);
      expect(screen.getByText('Ungespeicherte Änderungen')).toBeInTheDocument();
      expect(screen.getByText(/ungespeicherte Änderungen bei/)).toBeInTheDocument();
    });

    it('saves changes when "Speichern" is clicked', () => {
      vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      const props = defaultProps();
      render(<Stammdaten {...props} />);

      // First row after sort is Fischer (c2)
      const editButtons = screen.getAllByText('✏️');
      fireEvent.click(editButtons[0]);

      fireEvent.change(screen.getByPlaceholderText('Nachname, Vorname'), { target: { value: 'Geändert' } });

      fireEvent.click(editButtons[1]);
      fireEvent.click(screen.getByText('Speichern'));

      expect(props.updateChild).toHaveBeenCalledWith('c2', expect.objectContaining({ name: 'Geändert' }));
      expect(screen.queryByText('Ungespeicherte Änderungen')).not.toBeInTheDocument();
    });

    it('discards changes when "Verwerfen" is clicked', () => {
      vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      const props = defaultProps();
      render(<Stammdaten {...props} />);

      const editButtons = screen.getAllByText('✏️');
      fireEvent.click(editButtons[0]);

      fireEvent.change(screen.getByPlaceholderText('Nachname, Vorname'), { target: { value: 'Geändert' } });

      fireEvent.click(editButtons[1]);
      fireEvent.click(screen.getByText('Verwerfen'));

      expect(props.updateChild).not.toHaveBeenCalled();
      expect(screen.queryByText('Ungespeicherte Änderungen')).not.toBeInTheDocument();
    });
  });

  describe('Sortierung', () => {
    it('sorts by name ascending by default', () => {
      render(<Stammdaten {...defaultProps()} />);
      const rows = screen.getAllByRole('row');
      // Row 0 is header, row 1 is first data row
      expect(rows[1]).toHaveTextContent('Fischer, Lian');
      expect(rows[2]).toHaveTextContent('Müller, Emma');
    });

    it('toggles sort direction on click', () => {
      render(<Stammdaten {...defaultProps()} />);

      // Click Name header to switch to descending
      fireEvent.click(screen.getByText('Name'));
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Müller, Emma');
      expect(rows[2]).toHaveTextContent('Fischer, Lian');
    });

    it('sorts by Gruppe column', () => {
      render(<Stammdaten {...defaultProps()} />);

      fireEvent.click(screen.getByText('Gruppe'));
      const rows = screen.getAllByRole('row');
      // Delfin before Dino
      expect(rows[1]).toHaveTextContent('Delfin');
      expect(rows[2]).toHaveTextContent('Dino');
    });
  });

  describe('Gruppen verwalten', () => {
    it('shows Gruppen panel when toggled', () => {
      render(<Stammdaten {...defaultProps()} />);

      expect(screen.queryByPlaceholderText('Neue Gruppe...')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText(/Gruppen verwalten/));
      expect(screen.getByPlaceholderText('Neue Gruppe...')).toBeInTheDocument();
    });

    it('calls addGruppe when adding a new group', () => {
      const props = defaultProps();
      props.addGruppe.mockReturnValue(true);
      render(<Stammdaten {...props} />);

      fireEvent.click(screen.getByText(/Gruppen verwalten/));
      fireEvent.change(screen.getByPlaceholderText('Neue Gruppe...'), { target: { value: 'Pinguin' } });
      fireEvent.click(screen.getByText('+ Hinzufügen'));

      expect(props.addGruppe).toHaveBeenCalledWith('Pinguin');
    });

    it('shows error when group has children on delete', () => {
      const props = defaultProps();
      render(<Stammdaten {...props} />);

      fireEvent.click(screen.getByText(/Gruppen verwalten/));

      // Click delete on "Delfin" — has children assigned
      const deleteButtons = screen.getAllByText('✕');
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText(/kann nicht gelöscht werden/)).toBeInTheDocument();
    });
  });
});
