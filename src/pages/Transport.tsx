import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Car, MapPin, Plus, Trash2, X, RefreshCw, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useTransportShifts, useTransportTransfers } from '../hooks/useApi';
import { useAppStore } from '../store/appStore';
import { useBatchSelection } from '../hooks/useBatchSelection';
import { BatchToolbar } from '../components/BatchToolbar';
import { SkeletonList } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import GroupSelect from '../components/GroupSelect';
import { exportToCsv } from '../lib/exportCsv';
import { exportToExcel, exportToPdf } from '../lib/reports';

const TRANSPORT_SHIFT_STATUSES = [
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'OFFLINE', label: 'OFFLINE' },
] as const;

const DEFAULT_SHIFT_TIME = '08:00 - 16:00';
const DEFAULT_PAX = '1';

export default function Transport() {
  const { t } = useTranslation();
  const { role } = useAppStore();
  const isReadOnly = role === 'MEMBER';
  const { shifts, loading: loadingShifts, addShift, updateShift, deleteShift, refresh: refreshShifts, page: shiftsPage, totalCount: shiftsTotal, goToPage: goToShiftsPage } = useTransportShifts();
  const { transfers, loading: loadingTransfers, addTransfer, updateTransfer, deleteTransfer, refresh: refreshTransfers, page: transfersPage, totalCount: transfersTotal, goToPage: goToTransfersPage } = useTransportTransfers();

  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<any | undefined>(undefined);

  const [driverName, setDriverName] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [shiftTime, setShiftTime] = useState(DEFAULT_SHIFT_TIME);
  const [shiftStatus, setShiftStatus] = useState<string>(TRANSPORT_SHIFT_STATUSES[0].value);
  const [progress, setProgress] = useState('0');

  const [transferTime, setTransferTime] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [pax, setPax] = useState(DEFAULT_PAX);

  const [shiftGroupId, setShiftGroupId] = useState('');
  const [transferGroupId, setTransferGroupId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Batch selection for shifts
  const { selectedIds: shiftSelectedIds, selectedCount: shiftSelectedCount, toggleSelect: toggleShiftSelect, toggleSelectAll: toggleShiftSelectAll, clearSelection: clearShiftSelection, isAllSelected: isAllShiftsSelected } = useBatchSelection(shifts);

  const handleBulkDeleteShifts = async () => {
    if (!window.confirm(`Delete ${shiftSelectedCount} selected shifts?`)) return;
    setActionLoading(true); try { for (const id of shiftSelectedIds) { await deleteShift(id); } clearShiftSelection(); } catch (err) { alert('Bulk delete failed.'); } finally { setActionLoading(false); }
  };
  const handleBulkShiftStatusChange = async (newStatus: string) => {
    if (!window.confirm(`Change ${shiftSelectedCount} shifts to ${newStatus}?`)) return;
    setActionLoading(true); try { for (const id of shiftSelectedIds) { await updateShift(id, { status: newStatus }); } clearShiftSelection(); } catch (err) { alert('Bulk status change failed.'); } finally { setActionLoading(false); }
  };

  // Batch selection for transfers
  const { selectedIds: transferSelectedIds, selectedCount: transferSelectedCount, toggleSelect: toggleTransferSelect, toggleSelectAll: toggleTransferSelectAll, clearSelection: clearTransferSelection, isAllSelected: isAllTransfersSelected } = useBatchSelection(transfers);

  const handleBulkDeleteTransfers = async () => {
    if (!window.confirm(`Delete ${transferSelectedCount} selected transfers?`)) return;
    setActionLoading(true); try { for (const id of transferSelectedIds) { await deleteTransfer(id); } clearTransferSelection(); } catch (err) { alert('Bulk delete failed.'); } finally { setActionLoading(false); }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault(); if (!driverName || !vehicle) { setActionError('Driver name and vehicle info are required.'); return; }
    setActionLoading(true); setActionError(null);
    try { await addShift({ driver_name: driverName, vehicle, time: shiftTime, status: shiftStatus, progress: progress + '%', group_id: shiftGroupId || undefined }); setDriverName(''); setVehicle(''); setShiftTime(DEFAULT_SHIFT_TIME); setShiftStatus(TRANSPORT_SHIFT_STATUSES[0].value); setProgress('0'); setShiftGroupId(''); setShowShiftModal(false); } catch (err: any) { setActionError(err?.message || 'Failed to create shift.'); } finally { setActionLoading(false); }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault(); if (!transferTime || !fromLocation || !toLocation) { setActionError('Departure location, destination, and scheduled time are required.'); return; }
    setActionLoading(true); setActionError(null);
    try { await addTransfer({ time: transferTime, from_location: fromLocation, to_location: toLocation, pax: parseInt(pax) || 1, group_id: transferGroupId || undefined }); setTransferTime(''); setFromLocation(''); setToLocation(''); setPax(DEFAULT_PAX); setTransferGroupId(''); setShowTransferModal(false); } catch (err: any) { setActionError(err?.message || 'Failed to create transfer.'); } finally { setActionLoading(false); }
  };

  const handleAssignTransfer = async (driverName: string) => {
    if (!showAssignModal) return;
    setActionLoading(true); setActionError(null);
    try { await updateTransfer(showAssignModal!.id, { assigned_driver: driverName }); setShowAssignModal(undefined as any); await refreshTransfers(); } catch (err: any) { setActionError(err?.message || 'Failed to assign driver.'); } finally { setActionLoading(false); }
  };

  const handleDeleteShift = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); if (!window.confirm('Are you sure you want to delete this shift?')) return;
    try { await deleteShift(id); } catch (err: any) { alert(err?.message || 'Failed to delete shift.'); }
  };

  const handleDeleteTransfer = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); if (!window.confirm('Are you sure you want to delete this transfer request?')) return;
    try { await deleteTransfer(id); } catch (err: any) { alert(err?.message || 'Failed to delete transfer.'); }
  };

  const handleToggleShiftStatus = async (id: string, currentStatus: string) => {
    try { const nextStatus = currentStatus === TRANSPORT_SHIFT_STATUSES[0].value ? TRANSPORT_SHIFT_STATUSES[1].value : TRANSPORT_SHIFT_STATUSES[0].value; await updateShift(id, { status: nextStatus }); } catch (err: any) { alert(err?.message || 'Failed to update shift status.'); }
  };

  const handleSyncData = async () => { setActionLoading(true); try { await refreshShifts(); await refreshTransfers(); } catch (err) { console.error(err); } finally { setActionLoading(false); } };

  const shiftColumns = [{ key: 'driver_name', header: 'Driver Name' },{ key: 'vehicle', header: 'Vehicle' },{ key: 'time', header: 'Shift Hours' },{ key: 'status', header: 'Status' },{ key: 'progress', header: 'Progress' }];
  const transferColumns = [{ key: 'from_location', header: 'Departure' },{ key: 'to_location', header: 'Destination' },{ key: 'time', header: 'Scheduled Time' },{ key: 'pax', header: 'PAX' },{ key: 'assigned_driver', header: 'Assigned Driver' }];
  const handleExportShifts = () => { exportToCsv(shifts, 'transport-shifts', shiftColumns); };
  const handleExportTransfers = () => { exportToCsv(transfers, 'transport-transfers', transferColumns); };
  const handleExportShiftsExcel = () => { exportToExcel(shifts, 'transport-shifts', shiftColumns, 'Driver Shifts', 'Fleet & Dispatch — Shift Timeline'); };
  const handleExportShiftsPdf = () => { exportToPdf(shifts, 'transport-shifts', shiftColumns, 'Fleet & Dispatch — Shift Timeline', `Active Shifts: ${shifts.length} | Scheduled`); };
  const handleExportTransfersExcel = () => { exportToExcel(transfers, 'transport-transfers', transferColumns, 'Dispatch Transfers', 'Fleet & Dispatch — Transfer Manifest'); };
  const handleExportTransfersPdf = () => { exportToPdf(transfers, 'transport-transfers', transferColumns, 'Fleet & Dispatch — Transfer Manifest', `Transfers: ${transfers.length} | In Transit`); };

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Fleet & Dispatch</h2><p className="mt-1 text-sm text-slate-500 font-sans">Live scheduling, tracking, and real-time driver management.</p></div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleSyncData} className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center" title="Refresh database records"><RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} /></button>
          {!isReadOnly && (<button type="button" onClick={() => { setActionError(null); setShowShiftModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shrink-0"><Plus className="w-4 h-4" />Add Shift</button>)}
          {!isReadOnly && (<button type="button" onClick={() => { setActionError(null); setShowTransferModal(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shrink-0"><Plus className="w-4 h-4" />Add Transfer</button>)}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 shrink-0">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Shifts</p><div className="flex items-center gap-2"><span className="text-2xl font-light text-slate-900">{loadingShifts ? <span className="inline-block w-6 h-6 bg-slate-200 rounded animate-pulse align-middle" /> : shiftsTotal}</span><span className="text-xs font-bold text-slate-400 tracking-tighter">/ SCHEDULED</span></div><div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${shifts.length > 0 ? 100 : 0}%` }}></div></div></div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ongoing Transfers</p><div className="flex items-center gap-2"><span className="text-2xl font-light text-slate-900">{loadingTransfers ? <span className="inline-block w-6 h-6 bg-slate-200 rounded animate-pulse align-middle" /> : transfersTotal}</span><span className="text-xs font-bold text-slate-400 tracking-tighter">IN TRANSIT</span></div><div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${transfers.length > 0 ? 100 : 0}%` }}></div></div></div>
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 shadow-sm lg:col-span-2 flex items-center justify-between"><div><p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Live Tracking Status</p><div className="flex items-center gap-2 mt-1"><span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span><span className="text-sm font-semibold text-indigo-900">Database Engine Linked</span></div><p className="mt-1 text-xs text-indigo-700 font-sans">CRUD mutations & fleet management records operational.</p></div><Car className="w-10 h-10 text-indigo-200" /></div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-[500px]">
        {/* Shift Timeline Section */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {!isReadOnly && <input type="checkbox" checked={isAllShiftsSelected} onChange={toggleShiftSelectAll} disabled={loadingShifts || shifts.length === 0} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />}
              <h2 className="font-bold text-sm uppercase tracking-wider text-slate-700">Shift Timeline (Today)</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-sans">Click status label to toggle active state</span>
              <button type="button" onClick={handleExportShifts} disabled={loadingShifts || shifts.length === 0} className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-md transition-colors" title="Export shifts to CSV"><Download className="w-3.5 h-3.5" /></button><button type="button" onClick={handleExportShiftsExcel} disabled={loadingShifts || shifts.length === 0} className="p-1.5 border border-slate-200 hover:bg-emerald-50 text-emerald-600 rounded-md transition-colors" title="Export shifts to Excel"><FileSpreadsheet className="w-3.5 h-3.5" /></button><button type="button" onClick={handleExportShiftsPdf} disabled={loadingShifts || shifts.length === 0} className="p-1.5 border border-slate-200 hover:bg-red-50 text-red-500 rounded-md transition-colors" title="Export shifts to PDF"><FileText className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <BatchToolbar selectedCount={shiftSelectedCount} onBulkDelete={handleBulkDeleteShifts} onClearSelection={clearShiftSelection} statusOptions={[...TRANSPORT_SHIFT_STATUSES]} onBulkStatusChange={handleBulkShiftStatusChange} actionLoading={actionLoading} />
          <div className="flex-1 p-0 overflow-auto bg-slate-50/50">
            <div className="min-w-[600px] p-6 space-y-4">
              {loadingShifts && (<div className="text-center text-sm text-slate-400 py-12 bg-white rounded-xl border border-slate-100"><SkeletonList items={4} /></div>)}
              {!loadingShifts && shifts.length === 0 && (<div className="text-center text-sm text-slate-400 py-12 bg-white rounded-xl border border-slate-100">No shifts found. Create a shift with driver name & vehicle info to build schedule.</div>)}
              {!loadingShifts && shifts.map((shift, i) => (
                <div key={shift.id || i} className="bg-white p-4 rounded-lg border border-slate-100 flex items-center gap-4 shadow-sm hover:border-indigo-200 transition-colors">
                  {!isReadOnly && <input type="checkbox" checked={shiftSelectedIds.has(shift.id)} onChange={() => toggleShiftSelect(shift.id)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0" />}
                  <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0"><span className="text-xs font-bold text-indigo-700">{(shift.driver_name || '?').charAt(0)}</span></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-900 truncate font-sans">{shift.driver_name}</p><p className="text-xs text-slate-500 truncate font-sans">{shift.vehicle}</p></div>
                  <div className="text-right shrink-0 px-4"><p className="text-xs font-mono text-slate-600">{shift.time}</p><button type="button" onClick={() => handleToggleShiftStatus(shift.id, shift.status)} className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase cursor-pointer hover:opacity-85 transition-opacity ${shift.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{shift.status}</button></div>
                  <div className="w-32 h-2 bg-slate-150 rounded-full overflow-hidden shrink-0 hidden sm:block"><div className={`h-full ${shift.status === 'ACTIVE' ? 'bg-indigo-500' : 'bg-transparent'}`} style={{ width: shift.progress || '0%' }}></div></div>
                  {!isReadOnly && <button type="button" onClick={(e) => handleDeleteShift(shift.id, e)} className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="Delete Shift"><Trash2 className="w-4 h-4" /></button>}
                </div>
              ))}
            </div>
            {!loadingShifts && shifts.length > 0 && (<Pagination page={shiftsPage} pageSize={10} totalCount={shiftsTotal} onPageChange={goToShiftsPage} />)}
          </div>
        </div>
        {/* Dispatch Queue Section */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-6 py-4 border-b border-slate-100 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!isReadOnly && <input type="checkbox" checked={isAllTransfersSelected} onChange={toggleTransferSelectAll} disabled={loadingTransfers || transfers.length === 0} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />}
              <h2 className="font-bold text-sm uppercase tracking-wider text-slate-700">Dispatch Queue</h2>
            </div>
            <button type="button" onClick={handleExportTransfers} disabled={loadingTransfers || transfers.length === 0} className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-md transition-colors" title="Export transfers to CSV"><Download className="w-3.5 h-3.5" /></button><button type="button" onClick={handleExportTransfersExcel} disabled={loadingTransfers || transfers.length === 0} className="p-1.5 border border-slate-200 hover:bg-emerald-50 text-emerald-600 rounded-md transition-colors" title="Export transfers to Excel"><FileSpreadsheet className="w-3.5 h-3.5" /></button><button type="button" onClick={handleExportTransfersPdf} disabled={loadingTransfers || transfers.length === 0} className="p-1.5 border border-slate-200 hover:bg-red-50 text-red-500 rounded-md transition-colors" title="Export transfers to PDF"><FileText className="w-3.5 h-3.5" /></button>
          </div>
          <BatchToolbar selectedCount={transferSelectedCount} onBulkDelete={handleBulkDeleteTransfers} onClearSelection={clearTransferSelection} actionLoading={actionLoading} />
          <div className="p-0 divide-y divide-slate-100 overflow-y-auto flex-1">
            {loadingTransfers && (<div className="p-4"><SkeletonList items={3} /></div>)}
            {!loadingTransfers && transfers.length === 0 && (<div className="text-center text-sm text-slate-400 py-12 px-6">No transfers in queue. Add custom dispatch requests above.</div>)}
            {!loadingTransfers && transfers.map((transfer, i) => (
              <div key={transfer.id || i} className="p-4 hover:bg-slate-50 transition-colors group cursor-pointer relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {!isReadOnly && <input type="checkbox" checked={transferSelectedIds.has(transfer.id)} onChange={() => toggleTransferSelect(transfer.id)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" onClick={(e) => e.stopPropagation()} />}
                    <span className="text-[10px] font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded truncate max-w-[120px]" title={transfer.id}>{transfer.id.slice(0, 8)}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded max-w-[200px] truncate" title={transfer.time ?? undefined}>{transfer.time && !isNaN(new Date(transfer.time).getTime()) ? new Date(transfer.time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                </div>
                <div className="space-y-3 relative pl-2">
                  <div className="absolute left-[11px] top-4 bottom-4 w-px bg-slate-200"></div>
                  <div className="flex items-center gap-4"><div className="w-2.5 h-2.5 rounded-full border-2 border-indigo-400 bg-white z-10"></div><span className="text-sm text-slate-700 truncate font-sans">{transfer.from_location}</span></div>
                  <div className="flex items-center gap-4"><MapPin className="w-3.5 h-3.5 text-emerald-500 z-10 bg-white -ml-0.5" /><span className="text-sm font-medium text-slate-900 truncate font-sans">{transfer.to_location}</span></div>
                </div>
                <div className="mt-4 flex items-center justify-between pl-2">
                  <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">{transfer.pax} PAX</span>{transfer.assigned_driver && (<span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">← {transfer.assigned_driver}</span>)}</div>
                  <div className="flex items-center gap-1">
                    {!isReadOnly && (<button type="button" onClick={() => { setActionError(null); setShowAssignModal(transfer); }} className="text-[10px] bg-slate-900 hover:bg-indigo-600 text-white font-bold px-3 py-1.5 rounded opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider font-sans">{transfer.assigned_driver ? 'Reassign' : 'Assign'}</button>)}
                    {!isReadOnly && <button type="button" onClick={(e) => handleDeleteTransfer(transfer.id, e)} className="p-1 px-2 text-slate-400 hover:text-red-500 transition-colors opacity-100" title="Delete transfer"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                </div>
              </div>
            ))}
            {!loadingTransfers && transfers.length > 0 && (<Pagination page={transfersPage} pageSize={10} totalCount={transfersTotal} onPageChange={goToTransfersPage} />)}
          </div>
        </div>
      </div>
      {/* MODALS */}
      {showShiftModal && (<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"><div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50"><h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider font-sans">Add Driver Shift</h3><button onClick={() => setShowShiftModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button></div><form onSubmit={handleCreateShift} className="p-6 space-y-4">{actionError && (<div className="p-3 bg-red-50 text-red-600 rounded text-xs leading-relaxed font-sans font-medium">{actionError}</div>)}<div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">Driver Name</label><input type="text" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="e.g. Jean Dupont" className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans" required /></div><div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">Vehicle</label><input type="text" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="e.g. Tesla Model Y (White, AA-123-BB)" className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans" required /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">Shift Hours</label><input type="text" value={shiftTime} onChange={(e) => setShiftTime(e.target.value)} placeholder="e.g. 08:00 - 16:00" className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans" /></div><div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">Progress (%)</label><input type="number" min="0" max="100" value={progress} onChange={(e) => setProgress(e.target.value)} className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans font-mono" /></div></div><GroupSelect value={shiftGroupId} onChange={setShiftGroupId} /><div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">Initial Status</label><select value={shiftStatus} onChange={(e) => setShiftStatus(e.target.value)} className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-sans">{TRANSPORT_SHIFT_STATUSES.map(s => (<option key={s.value} value={s.value}>{s.label}</option>))}</select></div><div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => setShowShiftModal(false)} className="px-4 py-2 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider font-sans">Cancel</button><button type="submit" disabled={actionLoading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold uppercase tracking-wider disabled:bg-indigo-300 font-sans">{actionLoading ? 'Creating...' : 'Create Shift'}</button></div></form></div></div>)}
      {showTransferModal && (<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"><div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50"><h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider font-sans">Add Dispatch Transfer</h3><button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button></div><form onSubmit={handleCreateTransfer} className="p-6 space-y-4">{actionError && (<div className="p-3 bg-red-50 text-red-600 rounded text-xs leading-relaxed font-sans font-medium">{actionError}</div>)}<div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">Scheduled Date & Time</label><input type="datetime-local" value={transferTime} onChange={(e) => setTransferTime(e.target.value)} className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans" required /></div><div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">Departure (From)</label><input type="text" value={fromLocation} onChange={(e) => setFromLocation(e.target.value)} placeholder="e.g. Main Stadium Entrance North" className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans" required /></div><div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">Destination (To)</label><input type="text" value={toLocation} onChange={(e) => setToLocation(e.target.value)} placeholder="e.g. Olympic Village Hotel Block B" className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans" required /></div><div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">Passenger (PAX) Count</label><input type="number" min="1" value={pax} onChange={(e) => setPax(e.target.value)} className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans font-mono" required /></div><GroupSelect value={transferGroupId} onChange={setTransferGroupId} /><div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => setShowTransferModal(false)} className="px-4 py-2 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider font-sans">Cancel</button><button type="submit" disabled={actionLoading} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold uppercase tracking-wider disabled:bg-emerald-300 font-sans">{actionLoading ? 'Creating...' : 'Create Transfer'}</button></div></form></div></div>)}
      {showAssignModal && (<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"><div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50"><h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider font-sans">Assign Transfer</h3><button onClick={() => setShowAssignModal(undefined)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button></div><div className="p-6 space-y-4"><div className="bg-slate-50 p-3 rounded text-xs text-slate-600 border border-slate-100 space-y-1 font-sans"><p><span className="font-bold">Departure:</span> {showAssignModal.from_location}</p><p><span className="font-bold">Destination:</span> {showAssignModal.to_location}</p><p><span className="font-bold">PAX:</span> {showAssignModal.pax}</p></div><p className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">Select Active Driver / Shift</p>{loadingShifts && <p className="text-sm text-slate-500 font-sans">Loading Shifts...</p>}{!loadingShifts && shifts.length === 0 && (<div className="text-xs text-amber-600 bg-amber-50 rounded p-3 font-sans font-medium">No active driver shifts scheduled. Create a shift in the timeline before assigning.</div>)}{!loadingShifts && shifts.length > 0 && (<div className="space-y-2 max-h-[220px] overflow-y-auto">{shifts.map((shift, idx) => (<button key={shift.id || idx} onClick={() => handleAssignTransfer(shift.driver_name)} className="w-full text-left p-3 border border-slate-150 hover:border-indigo-400 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-between"><div><p className="text-sm font-bold text-slate-800 font-sans">{shift.driver_name}</p><p className="text-xs text-slate-500 font-sans">{shift.vehicle}</p></div><span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${shift.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{shift.status}</span></button>))}</div>)}<div className="pt-2 flex justify-end"><button type="button" onClick={() => setShowAssignModal(undefined)} className="px-4 py-2 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider font-sans">Close</button></div></div></div></div>)}
    </div>
  );
}
