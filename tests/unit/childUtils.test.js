import { describe, it, expect } from 'vitest';
import { createChild } from '../../src/data/childUtils';

describe('createChild', () => {
  it('creates a child with defaults', () => {
    const child = createChild({ name: 'Test' });
    expect(child.name).toBe('Test');
    expect(child.status).toBe('aktiv');
    expect(child.but).toBe(false);
    expect(child.id).toMatch(/^c\d+_0$/);
  });

  it('preserves existing id', () => {
    const child = createChild({ id: 'existing', name: 'A' });
    expect(child.id).toBe('existing');
  });

  it('uses index for unique ids', () => {
    const a = createChild({ name: 'A' }, 0);
    const b = createChild({ name: 'B' }, 1);
    expect(a.id).not.toBe(b.id);
  });
});
