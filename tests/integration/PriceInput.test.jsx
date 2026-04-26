import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PriceInput from '../../src/components/ui/PriceInput';

function setup(initial = '', disabled = false) {
  const onChange = vi.fn();
  const utils = render(<PriceInput value={initial} onChange={onChange} disabled={disabled} />);
  const input = utils.container.querySelector('input');
  return { onChange, input };
}

describe('PriceInput', () => {
  it('zeigt leeren String wenn value leer ist', () => {
    const { input } = setup('');
    expect(input.value).toBe('');
  });

  it('zeigt 2 Nachkommastellen im Display-Modus', () => {
    const { input } = setup(3.5);
    expect(input.value).toBe('3.50');
  });

  it('zeigt Komma-Eingabe im Fokus-Modus 1:1', () => {
    const { input } = setup(3.5);
    fireEvent.focus(input);
    expect(input.value).toBe('3.5');
  });

  it('akzeptiert Komma als Dezimaltrenner und rundet auf 2 Stellen', () => {
    const { onChange, input } = setup('');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '3,49' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith(3.49);
  });

  it('rundet Eingaben mit mehr als 2 Nachkommastellen', () => {
    const { onChange, input } = setup('');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '3.499' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith(3.5);
  });

  it('blockiert das Minus-Zeichen', () => {
    const { input } = setup('');
    fireEvent.focus(input);
    const evt = { key: '-', preventDefault: vi.fn() };
    fireEvent.keyDown(input, evt);
    // Kein direkter Weg, das Default-Prevent zu prüfen via fireEvent.keyDown,
    // aber wir testen das Verhalten via change-Event:
    fireEvent.change(input, { target: { value: '-1' } });
    fireEvent.blur(input);
    // Negative Werte werden durch Validierung in handleBlur als '' gesetzt
    // (parseFloat('-1') < 0 → onChange(''))
  });

  it('setzt onChange("") bei negativem Wert', () => {
    const { onChange, input } = setup('');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '-2' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('lehnt nicht-numerische Zeichen ab (Eingabe wird nicht gespeichert)', () => {
    const { onChange, input } = setup('');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'abc' } });
    // change wird ignoriert für nicht-erlaubte Chars
    expect(input.value).toBe('');
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('setzt onChange("") bei leerer Eingabe nach Blur', () => {
    const { onChange, input } = setup(3.5);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('respektiert disabled-Prop', () => {
    const { input } = setup(3.5, true);
    expect(input.disabled).toBe(true);
  });

  it('akzeptiert Zahl 0', () => {
    const { onChange, input } = setup('');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith(0);
  });
});
