import React from 'react';
import { Trash2, X, Tag } from 'lucide-react';

interface BatchToolbarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  statusOptions?: { value: string; label: string }[];
  onBulkStatusChange?: (status: string) => void;
  actionLoading?: boolean;
}

/**
 * Floating batch action toolbar that appears when items are selected.
 * Supports bulk delete and optional bulk status change via dropdown.
 */
export function BatchToolbar({
  selectedCount,
  onBulkDelete,
  onClearSelection,
  statusOptions,
  onBulkStatusChange,
  actionLoading = false,
}: BatchToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-indigo-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-150 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold uppercase tracking-wider">
          {selectedCount} selected
        </span>
        <button
          onClick={onClearSelection}
          className="p-1 hover:bg-indigo-500 rounded transition-colors"
          title="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        {statusOptions && onBulkStatusChange && (
          <div className="relative">
            <select
              key={selectedCount}
              onChange={(e) => { if (e.target.value) onBulkStatusChange(e.target.value); }}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-500 text-white border border-indigo-400 cursor-pointer hover:bg-indigo-400 transition-colors appearance-none pr-8 disabled:opacity-50"
              defaultValue=""
            >
              <option value="" disabled>Change Status...</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value} className="text-slate-900 bg-white">{opt.label}</option>
              ))}
            </select>
            <Tag className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-75" />
          </div>
        )}
        <button
          onClick={onBulkDelete}
          disabled={actionLoading}
          className="px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white rounded-md text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete {selectedCount}
        </button>
      </div>
    </div>
  );
}
