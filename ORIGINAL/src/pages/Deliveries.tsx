import React, { useState } from 'react';
import { Package, Truck, Clock, CheckCircle2, MapPin, Plus, Trash2, Edit2, RotateCw, X, QrCode, Search } from 'lucide-react';
import { useDeliveries } from '../hooks/useApi';

export default function Deliveries() {
  const { deliveries, loading, addDelivery, updateDelivery, deleteDelivery, refresh } = useDeliveries();
  const [siteFilter, setSiteFilter] = useState('All Sites');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<any | null>(null);

  // QR Modal simulation
  const [activeQrDelivery, setActiveQrDelivery] = useState<any | null>(null);

  // Form states
  const [site, setSite] = useState('Main Stadium');
  const [status, setStatus] = useState('PENDING');
  const [scheduledTime, setScheduledTime] = useState('');
  const [detail, setDetail] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Metrics
  const totalDeliveries = deliveries.length;
  const receivedCount = deliveries.filter(d => d.status === 'RECEIVED').length;
  const enRouteCount = deliveries.filter(d => d.status === 'EN_ROUTE').length;
  const delayedCount = deliveries.filter(d => d.status === 'DELAYED').length;
  const pendingCount = deliveries.filter(d => d.status === 'PENDING').length;

  const progressPercentage = totalDeliveries > 0 ? Math.round((receivedCount / totalDeliveries) * 100) : 0;
  const dockUtilization = totalDeliveries > 0 ? Math.round(((receivedCount + enRouteCount) / totalDeliveries) * 100) : 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) {
      setActionError('Contents detail description is required.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      // Default scheduled_time if empty: current time as ISO
      const sTime = scheduledTime ? new Date(scheduledTime).toISOString() : new Date().toISOString();
      await addDelivery({
        site,
        status,
        scheduled_time: sTime,
        detail
      });
      resetForm();
      setShowAddModal(false);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to file delivery slot.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDelivery) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const sTime = scheduledTime ? new Date(scheduledTime).toISOString() : new Date().toISOString();
      await updateDelivery(editingDelivery.id, {
        site,
        status,
        scheduled_time: sTime,
        detail
      });
      resetForm();
      setEditingDelivery(null);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update delivery record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel and delete this delivery ticket?')) return;
    try {
      await deleteDelivery(id);
    } catch (err: any) {
      alert(err?.message || 'Failed to cancel delivery.');
    }
  };

  const handleQuickStatusTransition = async (delivery: any, nextStatus: string) => {
    try {
      await updateDelivery(delivery.id, { status: nextStatus });
    } catch (err: any) {
      alert('Failed to update status.');
    }
  };

  const handleQrVerifiedSignoff = async () => {
    if (!activeQrDelivery) return;
    try {
      await updateDelivery(activeQrDelivery.id, { status: 'RECEIVED' });
      setActiveQrDelivery(null);
    } catch (err: any) {
      alert('Failed to sign off delivery via QR code.');
    }
  };

  const handleEditClick = (delivery: any) => {
    setEditingDelivery(delivery);
    setSite(delivery.site || 'Main Stadium');
    setStatus(delivery.status || 'PENDING');
    if (delivery.scheduled_time) {
      // Convert to local datetime string formatted as YYYY-MM-DDThh:mm
      const localDate = new Date(delivery.scheduled_time);
      const offsetMs = localDate.getTimezoneOffset() * 60000;
      const localISOTime = new Date(localDate.getTime() - offsetMs).toISOString().slice(0, 16);
      setScheduledTime(localISOTime);
    } else {
      setScheduledTime('');
    }
    setDetail(delivery.detail || '');
    setActionError(null);
  };

  const resetForm = () => {
    setSite('Main Stadium');
    setStatus('PENDING');
    setScheduledTime('');
    setDetail('');
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

  const filteredDeliveries = deliveries.filter(d => {
    const siteMatches = siteFilter === 'All Sites' || d.site === siteFilter;
    const searchMatches = d.detail?.toLowerCase().includes(searchTerm.toLowerCase());
    return siteMatches && searchMatches;
  });

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Deliveries & Logistics</h2>
          <p className="mt-1 text-sm text-slate-500 font-sans">Track incoming physical goods, loading dock timetables, and QR verified handshakes.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handleRefresh}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0"
            title="Refresh Deliveries queue"
          >
            <RotateCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => {
              resetForm();
              setActionError(null);
              setShowAddModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shrink-0 font-sans"
          >
            <Plus className="w-4 h-4" />
            Log Incoming
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0 font-sans">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm col-span-1 md:col-span-2 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Operations Tracker Progress</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-slate-900">{loading ? '...' : receivedCount}</span>
              <span className="text-xs font-bold text-slate-400 tracking-tighter">/ {totalDeliveries} SUCCESSFUL SIGN-OFFS</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex gap-1 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-emerald-500" style={{ width: `${progressPercentage}%` }}></div>
               <div className="h-full bg-indigo-505 transition-colors" style={{ width: `${100 - progressPercentage}%` }}></div>
            </div>
            <div className="mt-2 flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-500"></div> Received ({receivedCount})</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-indigo-400"></div> En Route / Pending ({enRouteCount + pendingCount})</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Delayed Deliveries</p>
          <span className="text-2xl font-bold text-slate-900 mt-1">{delayedCount}</span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Dock Utilization</p>
          <span className="text-2xl font-bold text-slate-900 mt-1">{dockUtilization}%</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 shrink-0">
          <h2 className="font-bold text-sm uppercase tracking-wider text-slate-700">Dock Schedule</h2>
          <div className="flex flex-col sm:flex-row gap-2 max-w-lg w-full sm:justify-end">
            <input
              type="text"
              placeholder="Search contents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />
            <select 
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-sans text-slate-700"
            >
              <option>All Sites</option>
              <option>Main Stadium</option>
              <option>Olympic Village</option>
              <option>Tahitia Lagoon</option>
              <option>Marriott Press Hub</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 sticky top-0 z-10 font-mono">
              <tr>
                <th className="px-6 py-4 font-bold">Manifest ID</th>
                <th className="px-6 py-4 font-bold">Contents</th>
                <th className="px-6 py-4 font-bold">Destination / Site</th>
                <th className="px-6 py-4 font-bold text-right font-mono">Scheduled Time</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-center">Actions / QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-sans">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Loading deliveries...
                  </td>
                </tr>
              )}
              {!loading && filteredDeliveries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No matching deliveries found.
                  </td>
                </tr>
              )}
              {!loading && filteredDeliveries.map((row, i) => (
                <tr key={row.id || i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded">{(row.id || '').substring(0, 8)}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-slate-400 shrink-0" />
                      {row.detail}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-700">{row.site}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-slate-600 text-xs">
                    <div className="flex items-center justify-end gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {row.scheduled_time ? new Date(row.scheduled_time).toLocaleString() : 'ASAP'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 text-[9px] font-bold rounded-lg uppercase tracking-wider border ${
                      row.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      row.status === 'EN_ROUTE' ? 'bg-blue-50 text-blue-600 border-blue-105 animate-pulse' :
                      row.status === 'DELAYED' ? 'bg-red-50 text-red-600 border-red-100' :
                      'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {row.status ? row.status.replace('_', ' ') : 'PENDING'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      {row.status !== 'RECEIVED' && (
                        <button
                          type="button"
                          onClick={() => setActiveQrDelivery(row)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-205 text-slate-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1 font-mono hover:text-indigo-600 transition-colors"
                          title="Authenticate and register handshakes with physical delivery driver"
                        >
                          <QrCode className="w-3 h-3" /> QR Signoff
                        </button>
                      )}

                      {row.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusTransition(row, 'EN_ROUTE')}
                          className="text-[10px] font-bold uppercase text-indigo-600 hover:underline"
                        >
                          Ship
                        </button>
                      )}

                      {row.status === 'EN_ROUTE' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusTransition(row, 'DELAYED')}
                          className="text-[10px] font-bold uppercase text-red-500 hover:underline"
                        >
                          Mark Delay
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleEditClick(row)}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Edit Delivery details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(row.id, e)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="Cancel Delivery Ticket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: QR SCAN SIMULATOR */}
      {activeQrDelivery && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden text-center p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Logistic SecToken Handshake</span>
              <button onClick={() => setActiveQrDelivery(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="py-4 flex flex-col items-center space-y-3">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 inline-block">
                {/* Simulated QR Code matrix using table block */}
                <div className="grid grid-cols-4 gap-1 w-24 h-24 bg-white p-2 border border-slate-300 shadow-inner">
                  <div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-slate-900"></div>
                  <div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-white"></div>
                  <div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div><div className="bg-white"></div>
                  <div className="bg-slate-900"></div><div className="bg-slate-900"></div><div className="bg-white"></div><div className="bg-slate-900"></div>
                </div>
              </div>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-medium">
                Verify driver credentials & cargo contents of <br/><span className="text-indigo-600 font-bold">"{activeQrDelivery.detail}"</span> at <span className="font-bold">{activeQrDelivery.site}</span>.
              </p>
            </div>

            <div className="flex gap-2 w-full pt-1">
              <button 
                onClick={() => setActiveQrDelivery(null)} 
                className="w-1/2 py-2 border border-slate-200 hover:bg-slate-50 rounded text-xs font-bold text-slate-600 uppercase tracking-wider"
              >
                Close
              </button>
              <button 
                onClick={handleQrVerifiedSignoff} 
                className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold uppercase tracking-wider"
              >
                Sign Off Receive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT DELIVERY ENTRY */}
      {(showAddModal || editingDelivery) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                {editingDelivery ? 'Edit Delivery Ticket' : 'Book Incoming Dock Slot'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingDelivery(null);
                }} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={editingDelivery ? handleUpdate : handleCreate} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-red-50 text-red-600 rounded text-xs leading-relaxed font-semibold">
                  {actionError}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Contents Description</label>
                <input 
                  type="text" 
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="e.g. 500 Broadcast Headsets, Sound Devices"
                  className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Destination Site</label>
                  <select 
                    value={site} 
                    onChange={(e) => setSite(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Main Stadium">Main Stadium</option>
                    <option value="Olympic Village">Olympic Village</option>
                    <option value="Tahitia Lagoon">Tahitia Lagoon</option>
                    <option value="Marriott Press Hub">Marriott Press Hub</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status State</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="EN_ROUTE">EN ROUTE</option>
                    <option value="RECEIVED">RECEIVED</option>
                    <option value="DELAYED">DELAYED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Scheduled Dock Time</label>
                <input 
                  type="datetime-local" 
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingDelivery(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold uppercase tracking-wider disabled:bg-indigo-400"
                >
                  {actionLoading ? 'Saving...' : editingDelivery ? 'Save Changes' : 'Log Arrival'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
