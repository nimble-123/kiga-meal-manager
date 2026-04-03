import { useState, useMemo } from 'react';

export function useSortableTable(data, defaultKey = null, defaultDir = 'asc') {
  const [sortConfig, setSortConfig] = useState({ key: defaultKey, direction: defaultDir });
  const [accessors, setAccessors] = useState({});

  const requestSort = (key, accessor = null) => {
    if (accessor) {
      setAccessors((prev) => ({ ...prev, [key]: accessor }));
    }
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !data) return data;

    return [...data].sort((a, b) => {
      const accessor = accessors[sortConfig.key];
      let valA = accessor ? accessor(a) : a[sortConfig.key];
      let valB = accessor ? accessor(b) : b[sortConfig.key];

      // null/undefined nach unten
      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      let cmp;
      if (typeof valA === 'string' && typeof valB === 'string') {
        cmp = valA.localeCompare(valB, 'de');
      } else {
        cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
      }

      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }, [data, sortConfig, accessors]);

  return { sortedData, sortConfig, requestSort };
}
