import React, { useState } from 'react';
import { Briefcase, CreditCard, Ticket, Clock, Plus, Trash2, Edit2, RotateCw, X, Search, ShoppingCart } from 'lucide-react';
import { useAdditionalServices } from '../hooks/useApi';

export default function AdditionalServices() {
  const { services, loading, addService, updateService, deleteService, refresh } = useAdditionalServices();
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [serviceType, setServiceType] = useState('STANDARD');
  const [price, setPrice] = useState('50');
  const [soldCount, setSoldCount] = useState('0');
  const [limitCount, setLimitCount] = useState('100');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Metrics
  const totalSold = services.reduce((sum, s) => sum + (parseInt(s.sold_count) || 0), 0);
  const totalRevenue = services.reduce((sum, s) => sum + ((parseFloat(s.price) || 0) * (parseInt(s.sold_count) || 0)), 0);
  const limitedServicesCount = services.filter(s => parseInt(s.limit_count) > 0).length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setActionError('Service name is required.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await addService({
        title,
        service_type: serviceType,
        price: parseFloat(price) || 0,
        sold_count: parseInt(soldCount) || 0,
        limit_count: parseInt(limitCount) || 0
      });
      resetForm();
      setShowAddModal(false);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to publish service catalog entry.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateService(editingService.id, {
        title,
        service_type: serviceType,
        price: parseFloat(price) || 0,
        sold_count: parseInt(soldCount) || 0,
        limit_count: parseInt(limitCount) || 0
      });
      resetForm();
      setEditingService(null);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update service catalog entry.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this additional service from catalog?')) return;
    try {
      await deleteService(id);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete service.');
    }
  };

  const handleQuickSale = async (svc: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const curSold = parseInt(svc.sold_count) || 0;
    const curLimit = parseInt(svc.limit_count) || 0;
    if (curLimit > 0 && curSold >= curLimit) {
      alert('This optional booking service has reached its absolute maximum limit!');
      return;
    }
    try {
      await updateService(svc.id, { sold_count: curSold + 1 });
    } catch (err: any) {
      alert('Failed to register fast service booking.');
    }
  };

  const handleEditClick = (svc: any) => {
    setEditingService(svc);
    setTitle(svc.title);
    setServiceType(svc.service_type || 'STANDARD');
    setPrice(String(svc.price || 0));
    setSoldCount(String(svc.sold_count || 0));
    setLimitCount(String(svc.limit_count || 100));
    setActionError(null);
  };

  const resetForm = () => {
    setTitle('');
    setServiceType('STANDARD');
    setPrice('50');
    setSoldCount('0');
    setLimitCount('100');
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

  const filteredServices = services.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Services Additionnels</h2>
          <p className="mt-1 text-sm text-slate-500 font-sans">Manage and commercialize supplementary services for clients and guests.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handleRefresh}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0"
            title="Refresh services from database"
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
            Create Service
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 font-sans">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Total Services Sold</p>
            <span className="text-2xl font-bold text-slate-900">{loading ? '...' : totalSold}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Supplementary Revenue</p>
            <span className="text-2xl font-bold text-indigo-600">€{totalRevenue.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Limited Class Buffers</p>
            <span className="text-2xl font-bold text-slate-900">{loading ? '...' : limitedServicesCount}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <h2 className="font-bold text-sm uppercase tracking-wider text-slate-700">Services Catalog</h2>
          <input
            type="text"
            placeholder="Search catalog item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans max-w-xs w-full bg-white text-slate-710"
          />
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap font-sans">
            <thead className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-mono">
              <tr>
                <th className="px-6 py-4 font-bold">Service Name</th>
                <th className="px-6 py-4 font-bold">Type</th>
                <th className="px-6 py-4 font-bold text-right font-mono">Price Unit</th>
                <th className="px-6 py-4 font-bold text-right font-mono">Sold / Limit</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-sans">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Loading additional services...
                  </td>
                </tr>
              )}
              {!loading && filteredServices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No catalog optional services matching filters.
                  </td>
                </tr>
              )}
              {!loading && filteredServices.map((svc, i) => {
                const limit = parseInt(svc.limit_count) || 0;
                const sold = parseInt(svc.sold_count) || 0;
                const isLimited = limit > 0;
                const fillPercent = isLimited ? (sold / limit) * 100 : 0;
                const isSoldOut = isLimited && sold >= limit;
                
                return (
                <tr key={svc.id || i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{svc.title}</td>
                  <td className="px-6 py-4 text-xs">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-150 font-bold rounded-lg uppercase tracking-wider text-[9px]">{svc.service_type || 'STANDARD'}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-semibold text-slate-800">{svc.price ? `€${parseFloat(svc.price).toLocaleString()}` : 'Free / Complimentary'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span className="font-mono text-xs">{sold} {isLimited ? `/ ${limit}` : ''}</span>
                      {isLimited && (
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0 hidden sm:block">
                          <div className={`h-full ${fillPercent > 90 ? 'bg-amber-400' : 'bg-indigo-600'}`} style={{ width: `${Math.min(100, fillPercent)}%` }}></div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 text-[9px] font-bold rounded-lg uppercase tracking-wider ${
                      isSoldOut ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {isSoldOut ? 'SOLD OUT' : 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => handleQuickSale(svc, e)}
                        disabled={isSoldOut}
                        className="bg-indigo-50 border border-indigo-155 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px] hover:bg-indigo-600 hover:text-white flex items-center gap-1 uppercase tracking-wider disabled:opacity-45 transition-all font-mono"
                        title="Book / buy this service for a client"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        Book Unit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditClick(svc)}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Edit catalog price or limit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(svc.id, e)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete from catalog"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT ADDITIONAL OPTION */}
      {(showAddModal || editingService) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                {editingService ? 'Edit Supplementary Option' : 'New Catalog Option'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingService(null);
                }} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={editingService ? handleUpdate : handleCreate} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-red-50 text-red-600 rounded text-xs leading-relaxed font-semibold">
                  {actionError}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Service Option Name</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. VIP Guided Lagoon Sunset Tour"
                  className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category / Group</label>
                <select 
                  value={serviceType} 
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="TOURISM_HOTEL">HOTEL & TOURS</option>
                  <option value="TRANSFERS">OPTIONAL TRANSFERS</option>
                  <option value="PREMIUM_MEALS">PREMIUM MEALS & BAR</option>
                  <option value="EQUIPMENT">EQUIPMENT & RENTALS</option>
                  <option value="STANDARD">OTHER STANDARD</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Price Unit (€)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Sold</label>
                  <input 
                    type="number" 
                    min="0"
                    value={soldCount}
                    onChange={(e) => setSoldCount(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Limit Capacity</label>
                  <input 
                    type="number" 
                    min="0"
                    value={limitCount}
                    onChange={(e) => setLimitCount(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    placeholder="0 for un-limited"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingService(null);
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
                  {actionLoading ? 'Saving...' : editingService ? 'Save Changes' : 'Publish Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
