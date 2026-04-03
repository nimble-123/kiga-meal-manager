let store;

async function initStore() {
  if (store) return store;
  const { default: Store } = await import('electron-store');
  store = new Store({
    name: 'kiga-essenverwaltung-data',
    defaults: {
      children: [],
    },
  });
  return store;
}

module.exports = { initStore };
