import React, { useState } from 'react';
import { FileText, Search, Download, RotateCw, Calendar, Filter, Clock } from 'lucide-react';
import { useAuditLogs } from '../hooks/useApi';
import { SkeletonTable } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { exportToCsv } from '../lib/exportCsv';

export default function AuditLog() {
  const { logs, loading, error, page, pageSize, totalCount, goToPage, applyFilters, refresh } = useAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Metrics
  const totalEvents = totalCount;

  const handleSearch = () => {
    applyFilters(searchTerm, dateFrom || null, dateTo || null);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    applyFilters('', null, null);
  };

  const handleRefresh = async () => {
    setActionLoading(true);
    try {
      await refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCsv = () => {
    exportToCsv(logs, 'audit-log', [
      { key: 'created_at', header: 'Timestamp' },
      { key: 'action', header: 'Action' },
      { key: 'detail', header: 'Detail' },
      { key: 'user_id', header: 'User ID' },
    ]);
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Audit Trail</h2>
          <p className="mt-1 text-sm text-slate-500 font-sans">View system activity logs, trace actions, and export audit records.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0"
            title="Refresh audit log"
          >
            <RotateCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={loading || logs.length === 0}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0"
            title="Export to CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 font-sans">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Total Events</p>
            {loading ? <div className="animate-pulse bg-slate-200 rounded h-8 w-16" /> : <span className="text-2xl font-bold text-slate-900">{totalCount.toLocaleString()}</span>}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Events / Page</p>
            {loading ? <div className="animate-pulse bg-slate-200 rounded h-8 w-12" /> : <span className="text-2xl font-bold text-slate-900">{logs.length}</span>}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Unique Actions</p>
            {loading ? <div className="animate-pulse bg-slate-200 rounded h-8 w-12" /> : <span className="text-2xl font-bold text-slate-900">{new Set(logs.map(l => l.action)).size}</span>}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action or detail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            <Filter className="w-3.5 h-3.5" />
            Apply
          </button>
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap font-sans">
            <thead className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-mono sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-bold w-44">Timestamp</th>
                <th className="px-6 py-4 font-bold">Action</th>
                <th className="px-6 py-4 font-bold">Detail</th>
                <th className="px-6 py-4 font-bold w-32">User ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {loading && (
                <tr>
                  <td colSpan={4} className="p-0">
                    <SkeletonTable rows={8} cols={4} />
                  </td>
                </tr>
              )}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No activity log entries found matching your criteria.
                  </td>
                </tr>
              )}
              {!loading && logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-xs text-slate-600">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="font-bold text-slate-900 text-xs">{log.action}</span>
                  </td>
                  <td className="px-6 py-3 text-xs text-slate-500 max-w-xs truncate" title={log.detail}>
                    {log.detail || '—'}
                  </td>
                  <td className="px-6 py-3">
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                      {log.user_id ? log.user_id.substring(0, 8) : 'SYSTEM'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && logs.length > 0 && (
          <Pagination page={page} pageSize={pageSize} totalCount={totalCount} onPageChange={goToPage} />
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm font-medium">
          Failed to load audit logs: {error.message}
        </div>
      )}
    </div>
  );
}
