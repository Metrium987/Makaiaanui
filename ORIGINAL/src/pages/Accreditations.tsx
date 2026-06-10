import React, { useState } from 'react';
import { BadgeCheck, ShieldAlert, Fingerprint, Printer, Filter, Plus, Trash2, Edit2, RotateCw, X, Search, CheckCircle } from 'lucide-react';
import { useAccreditations } from '../hooks/useApi';

export default function Accreditations() {
  const { accreditations, loading, addAccreditation, updateAccreditation, deleteAccreditation, refresh } = useAccreditations();

  // Search/Filter states
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAcc, setEditingAcc] = useState<any | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [count, setCount] = useState('0');
  const [pending, setPending] = useState('0');
  const [selectedZones, setSelectedZones] = useState<string[]>([]);

  // Local printer simulator log state
  const [printLogs, setPrintLogs] = useState<string[]>([]);
  const [activePrintingId, setActivePrintingId] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Available zones
  const AVAILABLE_ZONES = ['1', '2', '3', '4', '5', 'V', 'S', 'M', 'P'];

  // Metrics
  const totalPrinted = accreditations.reduce((sum, item) => sum + (parseInt(item.count) || 0), 0);
  const totalPending = accreditations.reduce((sum, item) => sum + (parseInt(item.pending) || 0), 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      setActionError('Code and Name are required.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await addAccreditation({
        code: code.toUpperCase().trim(),
        name,
        count: parseInt(count) || 0,
        pending: parseInt(pending) || 0,
        zones: selectedZones
      });
      resetForm();
      setShowAddModal(false);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to register accreditation class.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAcc) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateAccreditation(editingAcc.id, {
        code: code.toUpperCase().trim(),
        name,
        count: parseInt(count) || 0,
        pending: parseInt(pending) || 0,
        zones: selectedZones
      });
      resetForm();
      setEditingAcc(null);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update accreditation class.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this accreditation class?')) return;
    try {
      await deleteAccreditation(id);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete.');
    }
  };

  const handleSimulatePrint = async (pop: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (parseInt(pop.pending) <= 0) {
      alert('No pending credentials in queue to print for this population.');
      return;
    }
    
    setActivePrintingId(pop.id);
    const logMsg = `[Printer Node 1] Starting batch credentials render for code ${pop.code}...`;
    setPrintLogs(prev => [logMsg, ...prev].slice(0, 5));

    setTimeout(async () => {
      try {
        const nextCount = (parseInt(pop.count) || 0) + 1;
        const nextPending = Math.max(0, (parseInt(pop.pending) || 1) - 1);
        await updateAccreditation(pop.id, {
          count: nextCount,
          pending: nextPending
        });
        setPrintLogs(prev => [`[Printer Node 1] SUCCESS: Custom PVC badge emitted for delegate "${pop.name}" (${pop.code}). Queue count decremented.`, ...prev].slice(0, 5));
      } catch (err) {
        setPrintLogs(prev => [`[Printer Node 1] ERROR: Spool buffer overrun or authentication error.`, ...prev].slice(0, 5));
      } finally {
        setActivePrintingId(null);
      }
    }, 1500);
  };

  const handleEditClick = (pop: any) => {
    setEditingAcc(pop);
    setCode(pop.code);
    setName(pop.name);
    setCount(String(pop.count || 0));
    setPending(String(pop.pending || 0));
    setSelectedZones(pop.zones || []);
    setActionError(null);
  };

  const toggleZone = (zone: string) => {
    setSelectedZones(prev => 
      prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]
    );
  };

  const resetForm = () => {
    setCode('');
    setName('');
    setCount('0');
    setPending('0');
    setSelectedZones([]);
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

  const filteredAccreditations = accreditations.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Accreditations</h2>
          <p className="mt-1 text-sm text-slate-500 font-sans">Manage identity, print center operations, and zone authorizations.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            type="button"
            onClick={handleRefresh}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0"
            title="Refresh Accreditation List"
          >
            <RotateCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => {
              resetForm();
              setActionError(null);
              setShowAddModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shrink-0"
          >
            <Fingerprint className="w-4 h-4" />
            New Group
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 font-sans">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <BadgeCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Total Printed Cards</p>
            <span className="text-2xl font-bold text-slate-900">{loading ? '...' : totalPrinted.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Awaiting Printing Check</p>
            <span className="text-2xl font-bold text-slate-900">{loading ? '...' : totalPending.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="bg-slate-900 p-6 rounded-xl shadow-lg flex flex-col justify-center border border-slate-800">
           <h3 className="font-bold text-xs text-indigo-300 uppercase tracking-widest font-mono">Active Print Center Outputs</h3>
           <div className="mt-2 text-[10px] font-mono text-slate-400 space-y-1 h-10 overflow-hidden leading-snug">
             {printLogs.length === 0 ? (
               <p className="italic text-slate-500">Wait-state print queue empty.</p>
             ) : (
               printLogs.map((log, lIdx) => (
                 <p key={lIdx} className="truncate">{log}</p>
               ))
             )}
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 shrink-0">
          <h2 className="font-bold text-sm uppercase tracking-wider text-slate-700">Population Matrix</h2>
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search code or demographic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans bg-white"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap font-sans">
            <thead className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-mono">
              <tr>
                <th className="px-6 py-4 font-bold">Code</th>
                <th className="px-6 py-4 font-bold">Population Group</th>
                <th className="px-6 py-4 font-bold">Access Zones</th>
                <th className="px-6 py-4 font-bold text-right">Printed</th>
                <th className="px-6 py-4 font-bold text-right">Pending</th>
                <th className="px-6 py-4 font-bold text-center">Batch Processing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">Loading populations...</td>
                </tr>
              )}
              {!loading && filteredAccreditations.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">No population demographics match active filters.</td>
                </tr>
              )}
              {!loading && filteredAccreditations.map((pop, i) => (
                <tr key={pop.id || i} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded">{pop.code}</span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">{pop.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {(pop.zones || []).map((z: string) => (
                        <span key={z} className="w-6 h-6 flex items-center justify-center bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded font-mono">{z}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-semibold text-slate-800">{(pop.count || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    {(pop.pending || 0) > 0 ? (
                      <span className="font-mono text-amber-600 font-bold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded text-xs">{pop.pending}</span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => handleSimulatePrint(pop, e)}
                        disabled={activePrintingId !== null || parseInt(pop.pending) <= 0}
                        className="bg-slate-900 border border-slate-250 text-slate-100 font-bold px-3 py-1 text-[10px] hover:bg-indigo-600 hover:text-white rounded flex items-center gap-1 uppercase tracking-widest disabled:opacity-40 transition-all font-mono"
                      >
                        <Printer className={`w-3.5 h-3.5 ${activePrintingId === pop.id ? 'animate-bounce' : ''}`} />
                        {activePrintingId === pop.id ? 'Emitting...' : 'Print Badge'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditClick(pop)}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Edit credentials rule"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(pop.id, e)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT ACCREDITATION GROUP */}
      {(showAddModal || editingAcc) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                {editingAcc ? 'Edit Population Parameters' : 'Create Accreditation Demographic'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingAcc(null);
                }} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={editingAcc ? handleUpdate : handleCreate} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-red-50 text-red-600 rounded text-xs leading-relaxed font-semibold">
                  {actionError}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Code (Short ID)</label>
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. VOL"
                  className="w-full text-sm border border-slate-200 rounded px-3 py-2 uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Group Demographic Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Volunteers Center Staff"
                  className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Printed Credentials</label>
                  <input 
                    type="number" 
                    min="0"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Credentials</label>
                  <input 
                    type="number" 
                    min="0"
                    value={pending}
                    onChange={(e) => setPending(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <p className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Zones Authorization</p>
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABLE_ZONES.map((zone) => {
                    const isChecked = selectedZones.includes(zone);
                    return (
                      <button
                        type="button"
                        key={zone}
                        onClick={() => toggleZone(zone)}
                        className={`py-2 text-xs font-bold border rounded transition-all font-mono ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'}`}
                      >
                        {zone}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingAcc(null);
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
                  {actionLoading ? 'Saving...' : editingAcc ? 'Save Changes' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
