import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSortableTable } from '../../src/hooks/useSortableTable';

const data = [
  { id: 1, name: 'Müller', age: 5, betrag: 12.5 },
  { id: 2, name: 'Äpfel', age: 3, betrag: 8 },
  { id: 3, name: 'Zebra', age: 7, betrag: null },
];

describe('useSortableTable', () => {
  it('liefert die Daten unverändert ohne Sortierung', () => {
    const { result } = renderHook(() => useSortableTable(data));
    expect(result.current.sortedData).toEqual(data);
  });

  it('sortiert Strings locale-aware (deutsch: Ä vor M)', () => {
    const { result } = renderHook(() => useSortableTable(data, 'name'));
    expect(result.current.sortedData.map((d) => d.name)).toEqual(['Äpfel', 'Müller', 'Zebra']);
  });

  it('sortiert Zahlen numerisch', () => {
    const { result } = renderHook(() => useSortableTable(data, 'age'));
    expect(result.current.sortedData.map((d) => d.age)).toEqual([3, 5, 7]);
  });

  it('null-Werte landen am Ende', () => {
    const { result } = renderHook(() => useSortableTable(data, 'betrag'));
    expect(result.current.sortedData.map((d) => d.betrag)).toEqual([8, 12.5, null]);
  });

  it('toggle: requestSort dreht Richtung um', () => {
    const { result } = renderHook(() => useSortableTable(data, 'age'));
    act(() => result.current.requestSort('age'));
    expect(result.current.sortConfig.direction).toBe('desc');
    expect(result.current.sortedData.map((d) => d.age)).toEqual([7, 5, 3]);

    act(() => result.current.requestSort('age'));
    expect(result.current.sortConfig.direction).toBe('asc');
  });

  it('Klick auf andere Spalte resettet Direction auf asc', () => {
    const { result } = renderHook(() => useSortableTable(data, 'age', 'desc'));
    act(() => result.current.requestSort('name'));
    expect(result.current.sortConfig.direction).toBe('asc');
  });

  it('benutzt einen benutzerdefinierten Accessor', () => {
    const { result } = renderHook(() => useSortableTable(data));
    act(() => result.current.requestSort('reverse', (item) => -item.age));
    // -3, -5, -7 -> aufsteigend: -7, -5, -3 → age 7, 5, 3
    expect(result.current.sortedData.map((d) => d.age)).toEqual([7, 5, 3]);
  });

  it('toleriert undefined data', () => {
    const { result } = renderHook(() => useSortableTable(undefined, 'name'));
    expect(result.current.sortedData).toBeUndefined();
  });
});
