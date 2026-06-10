import React, { useState } from 'react';
import { Coffee, Utensils, AlertTriangle, ChevronRight, Plus, Trash2, Edit2, RotateCw, X, Check } from 'lucide-react';
import { useCateringMenus } from '../hooks/useApi';

const DEFAULT_DIETARY_COUNTS = { pax: '', veg: '', vgn: '', gf: '', halal: '' } as const;

export default function Catering() {
  const { menus, loading, addMenu, updateMenu, deleteMenu, refresh } = useCateringMenus();

  // Modal control
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any | null>(null);
  const [deletingMenu, setDeletingMenu] = useState<any | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [serviceType, setServiceType] = useState('BUFFET');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [pax, setPax] = useState(DEFAULT_DIETARY_COUNTS.pax);
  const [veg, setVeg] = useState(DEFAULT_DIETARY_COUNTS.veg);
  const [vgn, setVgn] = useState(DEFAULT_DIETARY_COUNTS.vgn);
  const [gf, setGf] = useState(DEFAULT_DIETARY_COUNTS.gf);
  const [halal, setHalal] = useState(DEFAULT_DIETARY_COUNTS.halal);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Aggregators
  const totalMeals = menus.reduce((sum, m) => sum + (parseInt(m.pax) || 0), 0);
  const totalVeg = menus.reduce((sum, m) => sum + (parseInt(m.veg) || 0), 0);
  const totalVgn = menus.reduce((sum, m) => sum + (parseInt(m.vgn) || 0), 0);
  const totalGf = menus.reduce((sum, m) => sum + (parseInt(m.gf) || 0), 0);
  const totalHalal = menus.reduce((sum, m) => sum + (parseInt(m.halal) || 0), 0);
  const uniqueServicePoints = Array.from(new Set(menus.map(m => m.service_type))).length;

  const handleCreateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) {
      setActionError('Title, start time, and end time are required.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await addMenu({
        title,
        service_type: serviceType,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        pax: parseInt(pax) || 0,
        veg: parseInt(veg) || 0,
        vgn: parseInt(vgn) || 0,
        gf: parseInt(gf) || 0,
        halal: parseInt(halal) || 0
      });
      resetForm();
      setShowAddModal(false);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to create catering schedule.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenu) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateMenu(editingMenu.id, {
        title,
        service_type: serviceType,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        pax: parseInt(pax) || 0,
        veg: parseInt(veg) || 0,
        vgn: parseInt(vgn) || 0,
        gf: parseInt(gf) || 0,
        halal: parseInt(halal) || 0
      });
      resetForm();
      setEditingMenu(null);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update catering schedule.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMenu = async () => {
    if (!deletingMenu) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await deleteMenu(deletingMenu.id);
      setDeletingMenu(null);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete catering entry.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = (menu: any) => {
    const toLocalDatetimeString = (isoString: string) => {
      if (!isoString) return '';
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setEditingMenu(menu);
    setTitle(menu.title);
    setServiceType(menu.service_type || 'BUFFET');
    setStartTime(toLocalDatetimeString(menu.start_time));
    setEndTime(toLocalDatetimeString(menu.end_time));
    setPax(String(menu.pax || 0));
    setVeg(String(menu.veg || 0));
    setVgn(String(menu.vgn || 0));
    setGf(String(menu.gf || 0));
    setHalal(String(menu.halal || 0));
    setActionError(null);
  };

  const resetForm = () => {
    setTitle('');
    setServiceType('BUFFET');
    setStartTime('');
    setEndTime('');
    setPax(DEFAULT_DIETARY_COUNTS.pax);
    setVeg(DEFAULT_DIETARY_COUNTS.veg);
    setVgn(DEFAULT_DIETARY_COUNTS.vgn);
    setGf(DEFAULT_DIETARY_COUNTS.gf);
    setHalal(DEFAULT_DIETARY_COUNTS.halal);
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

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Catering & Meals</h2>
          <p className="mt-1 text-sm text-slate-500 font-sans">Manage daily food service, dietary constraints, and volume forecasting.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handleRefresh}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0"
            title="Refresh menu services"
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
            <Plus className="w-4 h-4" />
            Add Menu
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Total Meals Scheduled (Today)</p>
          <span className="text-3xl font-bold text-slate-900">{loading ? '...' : totalMeals}</span>
          <span className="text-xs font-medium text-slate-500 mt-2">Across {uniqueServicePoints} unique service formats</span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 md:col-span-2">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2 font-mono text-left">Dietary Requirements Aggregate</h3>
            <div className="flex flex-wrap gap-2 text-xs font-bold font-mono">
              <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg">{totalVeg} VEG</span>
              <span className="bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg">{totalVgn} VGN</span>
              <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg">{totalGf} GF</span>
              <span className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg">{totalHalal} HALAL</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <h2 className="font-bold text-sm uppercase tracking-wider text-slate-700">Today's Service Schedule</h2>
          <span className="text-xs font-mono text-slate-500">{menus.length} services planned</span>
        </div>
        <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
          {loading && (
            <div className="p-12 text-center text-sm text-slate-400 font-sans">Loading service schedule from Supabase...</div>
          )}
          {!loading && menus.length === 0 && (
            <div className="p-12 text-center text-sm text-slate-400 font-sans">No menus scheduled for today. Create your first service above.</div>
          )}
          {!loading && menus.map((menu, idx) => (
            <div key={menu.id || idx} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between group gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Coffee className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-900 truncate">{menu.title}</h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs font-sans">
                    <span className="font-mono text-slate-500">
                      {new Date(menu.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(menu.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:inline"></span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded uppercase tracking-wider text-[9px]">{menu.service_type}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full hidden sm:inline"></span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      (V:{menu.veg} Ve:{menu.vgn} G:{menu.gf} H:{menu.halal})
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 px-2">
                 <p className="text-lg font-bold text-slate-900 font-mono">{menu.pax}</p>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Covers</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleEditClick(menu)}
                  className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                  title="Edit scheduled meal plan"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingMenu(menu);
                    setActionError(null);
                  }}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  title="Remove scheduled meal plan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: ADD / EDIT MENU */}
      {(showAddModal || editingMenu) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                {editingMenu ? 'Edit Scheduled Meal Service' : 'Add New Meal Service'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingMenu(null);
                }} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={editingMenu ? handleUpdateMenu : handleCreateMenu} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-red-50 text-red-600 rounded text-xs leading-relaxed font-semibold">
                  {actionError}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 mb-1">Service Title / Description</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. VIP Buffet Launch Dinner"
                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Service Format</label>
                  <select 
                    value={serviceType} 
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="BUFFET">BUFFET</option>
                    <option value="PLATED">PLATED SERVICE</option>
                    <option value="LUNCHBOX">LUNCHBOX / TAKEAWAY</option>
                    <option value="BANQUET">BANQUET</option>
                    <option value="COFFEE_BREAK">COFFEE BREAK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Covers (PAX)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={pax}
                    onChange={(e) => setPax(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Time / Date</label>
                  <input 
                    type="datetime-local" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">End Time / Date</label>
                  <input 
                    type="datetime-local" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <p className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">Special Dietary Counts</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">VEG (Vegetarian)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={veg}
                      onChange={(e) => setVeg(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">VGN (Vegan)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={vgn}
                      onChange={(e) => setVgn(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">GF (Gluten-Free)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={gf}
                      onChange={(e) => setGf(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">HALAL (Halal)</label>
                    <input 
                      type="number" 
                      min="0"
                      value={halal}
                      onChange={(e) => setHalal(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMenu(null);
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
                  {actionLoading ? 'Saving...' : editingMenu ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deletingMenu && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-red-600 text-sm uppercase tracking-wider">
                Delete Scheduled Meal Service
              </h3>
              <button 
                onClick={() => setDeletingMenu(null)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed text-left">
                Are you sure you want to delete the scheduled meal service <strong className="text-slate-950 font-bold">"{deletingMenu.title}"</strong>?<br/>This action cannot be undone.
              </p>
              
              {actionError && (
                <div className="p-3 bg-red-50 text-red-600 rounded text-xs font-semibold">
                  {actionError}
                </div>
              )}
              
              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setDeletingMenu(null)}
                  className="px-4 py-2 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleDeleteMenu}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold uppercase tracking-wider disabled:bg-red-400"
                >
                  {actionLoading ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
