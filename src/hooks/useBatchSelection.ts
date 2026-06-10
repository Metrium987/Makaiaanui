import { useState, useCallback } from 'react';

/**
 * Generic batch selection hook for table checkboxes.
 * Manages a Set of selected item IDs with toggle, select-all, and clear operations.
 */
export function useBatchSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size >= items.length && items.length > 0) {
        return new Set(); // deselect all
      }
      return new Set(items.map(i => i.id));
    });
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isAllSelected: items.length > 0 && selectedIds.size >= items.length,
  };
}
