import React, { useState } from 'react';
import { WashingMachine, Clock, CheckCircle2, Factory, Plus, Trash2, Edit2, RotateCw, X, ArrowRight, Play, Check } from 'lucide-react';
import { useLaundryRequests } from '../hooks/useApi';

export default function Laundry() {
  const { requests, loading, addRequest, updateRequest, deleteRequest, refresh } = useLaundryRequests();
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState<any | null>(null);

  // Form states
  const [clientName, setClientName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [serviceType, setServiceType] = useState('Standard Wash');
  const [itemsCount, setItemsCount] = useState('5');
  const [status, setStatus] = useState('COLLECTED');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Metrics
  const totalBags = requests.reduce((sum, r) => sum + (parseInt(r.items_count) || 0), 0);
  const inProgressCount = requests.filter(r => r.status === 'IN_PROGRESS').length;
  const readyCount = requests.filter(r => r.status === 'READY').length;
  const returnedCount = requests.filter(r => r.status === 'RETURNED').length;
  const collectedCount = requests.filter(r => r.status === 'COLLECTED').length;

  const progressPercentage = requests.length > 0 ? Math.round((readyCount / requests.length) * 100) : 0;
  const collectedPercentage = requests.length > 0 ? Math.round((collectedCount / requests.length) * 100) : 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !groupName) {
      setActionError('Client name and group name are required.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await addRequest({
        client_name: clientName,
        group_name: groupName,
        service_type: serviceType,
        items_count: parseInt(itemsCount) || 0,
        status: status
      });
      resetForm();
      setShowAddModal(false);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to file laundry request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateRequest(editingRequest.id, {
        client_name: clientName,
        group_name: groupName,
        service_type: serviceType,
        items_count: parseInt(itemsCount) || 0,
        status: status
      });
      resetForm();
      setEditingRequest(null);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update laundry request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this laundry request?')) return;
    try {
      await deleteRequest(id);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete record.');
    }
  };

  const handleQuickStatusTransition = async (req: any, nextStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateRequest(req.id, { status: nextStatus });
    } catch (err: any) {
      alert('Failed to update status.');
    }
  };

  const handleEditClick = (req: any) => {
    setEditingRequest(req);
    setClientName(req.client_name);
    setGroupName(req.group_name);
    setServiceType(req.service_type || 'Standard Wash');
    setItemsCount(String(req.items_count || 5));
    setStatus(req.status || 'COLLECTED');
    setActionError(null);
  };

  const resetForm = () => {
    setClientName('');
    setGroupName('');
    setServiceType('Standard Wash');
    setItemsCount('5');
    setStatus('COLLECTED');
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

  const filteredRequests = requests.filter(r => {
    if (statusFilter === 'All Statuses') return true;
    if (statusFilter === 'Collected' && r.status === 'COLLECTED') return true;
    if (statusFilter === 'In Progress' && r.status === 'IN_PROGRESS') return true;
    if (statusFilter === 'Ready' && r.status === 'READY') return true;
    if (statusFilter === 'Returned' && r.status === 'RETURNED') return true;
    return false;
  });

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Laverie / Laundry</h2>
          <p className="mt-1 text-sm text-slate-500 font-sans">Manage laundry workflows, service catalogs, and client request tracking.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handleRefresh}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0"
            title="Refresh Laundry queues"
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
            File Request
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0 font-sans">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm col-span-1 md:col-span-2 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Today's Processing Operations</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-slate-900">{loading ? '...' : requests.length}</span>
              <span className="text-xs font-bold text-slate-400 tracking-tighter">/ {totalBags} BAGS IN QUEUE</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex gap-1 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full bg-slate-400" style={{ width: `${collectedPercentage}%` }}></div>
               <div className="h-full bg-indigo-500" style={{ width: `${100 - collectedPercentage - progressPercentage}%` }}></div>
               <div className="h-full bg-emerald-400 transition-colors" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <div className="mt-2 flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-slate-400"></div> Collected ({collectedCount})</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-indigo-500"></div> Washing ({inProgressCount})</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-400"></div> Ready ({readyCount})</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-2">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">In Progress</p>
          <span className="text-2xl font-bold text-slate-900 mt-1">{inProgressCount}</span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Delivered Back</p>
          <span className="text-2xl font-bold text-slate-900 mt-1">{returnedCount}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 shrink-0">
          <h2 className="font-bold text-sm uppercase tracking-wider text-slate-700">Laundry Requests</h2>
          <div className="flex gap-2">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-sans text-slate-700"
            >
              <option>All Statuses</option>
              <option>Collected</option>
              <option>In Progress</option>
              <option>Ready</option>
              <option>Returned</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap font-sans">
            <thead className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-mono">
              <tr>
                <th className="px-6 py-4 font-bold">Request ID</th>
                <th className="px-6 py-4 font-bold">Client / Group</th>
                <th className="px-6 py-4 font-bold">Service Type</th>
                <th className="px-6 py-4 font-bold text-right">Items Count</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-center">Actions / Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Loading laundry requests...
                  </td>
                </tr>
              )}
              {!loading && filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No active laundry bags matching criteria.
                  </td>
                </tr>
              )}
              {!loading && filteredRequests.map((row, i) => (
                <tr key={row.id || i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded">{(row.id || '').substring(0, 8)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{row.client_name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{row.group_name}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <WashingMachine className="w-4 h-4 text-slate-400 shrink-0" />
                      {row.service_type}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono text-slate-800 font-bold">{row.items_count}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 text-[9px] font-bold rounded-lg uppercase tracking-wider ${
                      row.status === 'READY' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      row.status === 'COLLECTED' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                      row.status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 animate-pulse' :
                      'bg-purple-50 text-purple-700 border border-purple-100'
                    }`}>
                      {row.status ? row.status.replace('_', ' ') : 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                       {row.status === 'COLLECTED' && (
                         <button
                           type="button"
                           onClick={(e) => handleQuickStatusTransition(row, 'IN_PROGRESS', e)}
                           className="bg-indigo-600 text-white text-[10px] font-serif uppercase tracking-widest px-2.5 py-1 rounded hover:bg-indigo-750 transition-colors flex items-center gap-1 font-mono"
                           title="Start industrial washing machine cycle"
                         >
                           <Play className="w-3 h-3" /> Wash
                         </button>
                       )}
                       {row.status === 'IN_PROGRESS' && (
                         <button
                           type="button"
                           onClick={(e) => handleQuickStatusTransition(row, 'READY', e)}
                           className="bg-emerald-600 text-white text-[10px] font-serif uppercase tracking-widest px-2.5 py-1 rounded hover:bg-emerald-750 transition-colors flex items-center gap-1 font-mono"
                           title="Mark laundry dry and folded"
                         >
                           <Check className="w-3 h-3" /> Set Ready
                         </button>
                       )}
                       {row.status === 'READY' && (
                         <button
                           type="button"
                           onClick={(e) => handleQuickStatusTransition(row, 'RETURNED', e)}
                           className="bg-purple-600 text-white text-[10px] font-serif uppercase tracking-widest px-2.5 py-1 rounded hover:bg-purple-750 transition-colors flex items-center gap-1 font-mono"
                           title="Deliver laundry back to delegate hotel"
                         >
                           <ArrowRight className="w-3 h-3" /> Deliver
                         </button>
                       )}
                       
                       <button
                         type="button"
                         onClick={() => handleEditClick(row)}
                         className="p-1 text-slate-400 hover:text-indigo-600 transition-colors ml-2"
                         title="Edit laundry request details"
                       >
                         <Edit2 className="w-3.5 h-3.5" />
                       </button>
                       <button
                         type="button"
                         onClick={(e) => handleDelete(row.id, e)}
                         className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                         title="Delete laundry record"
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

      {/* MODAL: ADD / EDIT LAUNDRY REQUEST */}
      {(showAddModal || editingRequest) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                {editingRequest ? 'Edit Laundry Bag Request' : 'File Laundry Bag Order'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRequest(null);
                }} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={editingRequest ? handleUpdate : handleCreate} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-red-50 text-red-600 rounded text-xs leading-relaxed font-semibold">
                  {actionError}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Client Name</label>
                <input 
                  type="text" 
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. S.A.S. Le Prince Albert"
                  className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Group / Delegation</label>
                <input 
                  type="text" 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Monaco Protocol Delegation"
                  className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Service Type</label>
                  <select 
                    value={serviceType} 
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Standard Wash">Standard Wash</option>
                    <option value="Express Wash (6h)">Express Wash (6h)</option>
                    <option value="Dry Cleaning Only">Dry Cleaning Only</option>
                    <option value="Delicate Fabric Steam">Delicate Fabric Steam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Items / Bags Count</label>
                  <input 
                    type="number" 
                    min="1"
                    value={itemsCount}
                    onChange={(e) => setItemsCount(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Initial Status</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="COLLECTED">COLLECTED</option>
                  <option value="IN_PROGRESS">IN PROGRESS (Washing)</option>
                  <option value="READY">READY (Dry & Folded)</option>
                  <option value="RETURNED">RETURNED</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingRequest(null);
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
                  {actionLoading ? 'Saving...' : editingRequest ? 'Save Changes' : 'Submit Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
