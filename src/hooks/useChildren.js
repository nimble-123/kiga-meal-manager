import { useState, useEffect, useMemo, useCallback } from 'react';
import { DEFAULT_GRUPPEN } from '../utils/dates';
import { storageGet, storageSet } from '../utils/storage';

export function useChildren() {
  const [children, setChildren] = useState([]);
  const [gruppen, setGruppen] = useState(DEFAULT_GRUPPEN);
  const [loading, setLoading] = useState(true);
  const [saveIndicator, setSaveIndicator] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await storageGet('children');
      if (c && c.length > 0) {
        setChildren(c);
      }
      const g = await storageGet('gruppen');
      if (g && g.length > 0) setGruppen(g);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!loading && children.length > 0) {
      storageSet('children', children);
      setSaveIndicator(true);
      const t = setTimeout(() => setSaveIndicator(false), 1000);
      return () => clearTimeout(t);
    }
  }, [children, loading]);

  const activeChildren = useMemo(() => children.filter((c) => c.status === 'aktiv'), [children]);

  const addChild = (data) => {
    const newId = `c${Date.now()}`;
    setChildren((prev) => [...prev, { ...data, id: newId }]);
  };

  const updateChild = (id, data) => {
    setChildren((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  const deleteChild = (id) => {
    setChildren((prev) => prev.filter((c) => c.id !== id));
  };

  const setChildrenBulk = useCallback((newChildren) => {
    setChildren(newChildren);
    storageSet('children', newChildren);
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 1000);
  }, []);

  const saveGruppen = useCallback((newGruppen) => {
    setGruppen(newGruppen);
    storageSet('gruppen', newGruppen);
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 1000);
  }, []);

  const setGruppenBulk = useCallback((newGruppen) => {
    saveGruppen(newGruppen);
  }, [saveGruppen]);

  const addGruppe = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed || gruppen.includes(trimmed)) return false;
    saveGruppen([...gruppen, trimmed]);
    return true;
  }, [gruppen, saveGruppen]);

  const removeGruppe = useCallback((name) => {
    const hasChildren = children.some((c) => c.gruppe === name);
    if (hasChildren) return false;
    saveGruppen(gruppen.filter((g) => g !== name));
    return true;
  }, [children, gruppen, saveGruppen]);

  const renameGruppe = useCallback((oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || (trimmed !== oldName && gruppen.includes(trimmed))) return false;
    saveGruppen(gruppen.map((g) => (g === oldName ? trimmed : g)));
    setChildren((prev) => prev.map((c) => (c.gruppe === oldName ? { ...c, gruppe: trimmed } : c)));
    return true;
  }, [gruppen, saveGruppen]);

  return { children, activeChildren, gruppen, loading, saveIndicator, addChild, updateChild, deleteChild, setChildrenBulk, setGruppenBulk, addGruppe, removeGruppe, renameGruppe };
}
