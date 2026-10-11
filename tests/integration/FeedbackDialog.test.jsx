import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FeedbackDialog from '../../src/components/FeedbackDialog';

describe('FeedbackDialog', () => {
  beforeEach(() => {
    window.api.openEmail.mockClear();
  });

  it('deaktiviert "E-Mail erstellen" bei leerer Nachricht', () => {
    render(<FeedbackDialog onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /E-Mail erstellen/ })).toBeDisabled();
  });

  it('komponiert eine E-Mail an info@nilslutz.de mit Version, Kategorie und Nachricht', () => {
    const onClose = vi.fn();
    render(<FeedbackDialog onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText(/mitteilen/i), { target: { value: 'Bitte einen Dark Mode!' } });
    fireEvent.click(screen.getByRole('button', { name: /E-Mail erstellen/ }));

    expect(window.api.openEmail).toHaveBeenCalledTimes(1);
    const arg = window.api.openEmail.mock.calls[0][0];
    expect(arg.to).toBe('info@nilslutz.de');
    expect(arg.subject).toMatch(/Feedback/);
    expect(arg.subject).toMatch(/v1\.0\.0-test/);
    expect(arg.body).toMatch(/Bitte einen Dark Mode!/);
    expect(onClose).toHaveBeenCalled();
  });

  it('übernimmt die gewählte Kategorie in Betreff und Text', () => {
    render(<FeedbackDialog onClose={() => {}} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'bug' } });
    fireEvent.change(screen.getByPlaceholderText(/mitteilen/i), { target: { value: 'Fehler X' } });
    fireEvent.click(screen.getByRole('button', { name: /E-Mail erstellen/ }));

    const arg = window.api.openEmail.mock.calls[0][0];
    expect(arg.subject).toMatch(/Fehler \/ Bug/);
    expect(arg.body).toMatch(/Kategorie: Fehler \/ Bug/);
  });
});
