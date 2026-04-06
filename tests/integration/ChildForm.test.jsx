import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChildForm from '../../src/components/ChildForm';

const gruppen = ['Delfin', 'Dino', 'Pinguin'];

describe('ChildForm', () => {
  it('input fields retain focus while typing', () => {
    render(<ChildForm gruppen={gruppen} onSave={vi.fn()} onCancel={vi.fn()} />);

    const nameInput = screen.getByPlaceholderText('Nachname, Vorname');
    nameInput.focus();
    expect(nameInput).toHaveFocus();

    fireEvent.change(nameInput, { target: { value: 'M' } });
    expect(nameInput).toHaveFocus();

    fireEvent.change(nameInput, { target: { value: 'Mü' } });
    expect(nameInput).toHaveFocus();

    fireEvent.change(nameInput, { target: { value: 'Müller' } });
    expect(nameInput).toHaveFocus();
    expect(nameInput.value).toBe('Müller');
  });

  it('all text fields retain focus after input', () => {
    render(<ChildForm gruppen={gruppen} onSave={vi.fn()} onCancel={vi.fn()} />);

    // Get all text inputs (excluding date inputs and select)
    const textInputs = screen.getAllByRole('textbox');
    expect(textInputs.length).toBeGreaterThanOrEqual(5);

    for (const input of textInputs) {
      input.focus();
      fireEvent.change(input, { target: { value: 'test' } });
      expect(input).toHaveFocus();
    }
  });

  it('saves form data correctly', () => {
    const onSave = vi.fn();
    render(<ChildForm gruppen={gruppen} onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Nachname, Vorname'), { target: { value: 'Müller, Emma' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Dino' } });

    fireEvent.click(screen.getByText(/Speichern/));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Müller, Emma', gruppe: 'Dino' })
    );
  });

  it('populates form when editing existing child', () => {
    const child = {
      name: 'Fischer, Lian', gruppe: 'Dino', but: true, zahlungspfl: 'Fischer',
      adresse: 'Str. 2', kassenzeichen: '10.002', hinweise: 'vegetarisch',
      status: 'aktiv', eintritt: '', austritt: '',
    };
    render(<ChildForm child={child} gruppen={gruppen} onSave={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText(/Kind bearbeiten/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nachname, Vorname').value).toBe('Fischer, Lian');
  });

  it('disables save button when name is empty', () => {
    render(<ChildForm gruppen={gruppen} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(/Speichern/).closest('button')).toBeDisabled();
  });

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<ChildForm gruppen={gruppen} onSave={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Abbrechen'));
    expect(onCancel).toHaveBeenCalled();
  });
});
