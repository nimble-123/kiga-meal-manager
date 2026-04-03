import '@testing-library/jest-dom';

// Mock window.api (Electron store) for all tests
const store = {};
window.api = {
  store: {
    get: vi.fn(async (key) => store[key] ?? null),
    set: vi.fn(async (key, val) => { store[key] = val; }),
    delete: vi.fn(async (key) => { delete store[key]; }),
    has: vi.fn(async (key) => key in store),
    keys: vi.fn(async () => Object.keys(store)),
    getPath: vi.fn(async () => '/tmp/test-store.json'),
  },
  saveCSV: vi.fn(async () => ({ success: true })),
  saveFile: vi.fn(async () => ({ success: true })),
  openFile: vi.fn(async () => ({ success: false })),
  openEmail: vi.fn(),
  sendEmailWithCSV: vi.fn(),
};

// Helper to reset store between tests
export function resetStore() {
  Object.keys(store).forEach((k) => delete store[k]);
}

export function seedStore(data) {
  Object.assign(store, data);
}
