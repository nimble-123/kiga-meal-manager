import { useState, useRef } from 'react';

export default function PriceInput({ value, onChange, disabled }) {
  const [focused, setFocused] = useState(false);
  const [localVal, setLocalVal] = useState('');
  const ref = useRef();

  const displayValue = () => {
    if (value === '' || value == null) return '';
    const num = parseFloat(value);
    return isNaN(num) ? '' : num.toFixed(2);
  };

  const handleFocus = () => {
    setFocused(true);
    setLocalVal(value === '' || value == null ? '' : String(value));
  };

  const handleBlur = () => {
    setFocused(false);
    if (localVal === '') {
      onChange('');
      return;
    }
    const parsed = parseFloat(localVal.replace(',', '.'));
    if (isNaN(parsed) || parsed < 0) {
      onChange('');
    } else {
      onChange(Math.round(parsed * 100) / 100);
    }
  };

  const handleChange = (e) => {
    const v = e.target.value;
    // Nur Zahlen, Punkt, Komma erlauben
    if (v !== '' && !/^[\d.,]*$/.test(v)) return;
    setLocalVal(v);
  };

  const handleKeyDown = (e) => {
    // Negative Werte blockieren
    if (e.key === '-') e.preventDefault();
  };

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      className="input"
      style={{ width: 80, textAlign: 'right' }}
      placeholder="0,00"
      disabled={disabled}
      value={focused ? localVal : displayValue()}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  );
}
