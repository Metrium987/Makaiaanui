import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shirt, Box, PackageCheck, Rss, Plus, Trash2, Edit2, RotateCw, X, ArrowUpRight, ShieldCheck, Download } from 'lucide-react';
import { useUniforms } from '../hooks/useApi';
import { useAppStore } from '../store/appStore';
import { useBatchSelection } from '../hooks/useBatchSelection';
import { BatchToolbar } from '../components/BatchToolbar';
import { SkeletonTable } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import GroupSelect from '../components/GroupSelect';
import { exportToCsv } from '../lib/exportCsv';

const UNIFORM_STATUSES = [
  { value: 'HEALTHY', label: 'HEALTHY' },
  { value: 'LOW_STOCK', label: 'LOW STOCK' },
  { value: 'OUT_OF_STOCK', label: 'OUT OF STOCK' },
];

export default function Uniforms() {
  const { t } = useTranslation();
  const { role } = useAppStore();
  const isReadOnly = role === 'MEMBER';
  const { uniforms, loading, addUniform, updateUniform, deleteUniform, refresh, page, totalCount, goToPage } = useUniforms();

  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUniform, setEditingUniform] = useState<any | null>(null);

  const [itemName, setItemName] = useState('');
  const [sizes, setSizes] = useState('S, M, L, XL');
  const [total, setTotal] = useState('');
  const [deployed, setDeployed] = useState('0');
  const [status, setStatus] = useState('HEALTHY');

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredUniforms = uniforms.filter(item => 
    item.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { selectedIds, selectedCount, toggleSelect, toggleSelectAll, clearSelection, isAllSelected } = useBatchSelection(filteredUniforms);

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedCount} selected items?`)) return;
    setActionLoading(true); try { for (const id of selectedIds) { await deleteUniform(id); } clearSelection(); } catch (err) { alert('Bulk delete failed.'); } finally { setActionLoading(false); }
  };
  const handleBulkStatusChange = async (newStatus: string) => {
    if (!window.confirm(`Change ${selectedCount} items to ${newStatus}?`)) return;
    setActionLoading(true); try { for (const id of selectedIds) { await updateUniform(id, { status: newStatus }); } clearSelection(); } catch (err) { alert('Bulk status change failed.'); } finally { setActionLoading(false); }
  };

  const totalItemsDeployed = uniforms.reduce((sum: number, item: any) => sum + (Number(item.deployed) || 0), 0);
  const totalTotalCapacity = uniforms.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0);
  const warehouseStock = Math.max(0, totalTotalCapacity - totalItemsDeployed);
  const lowStockAlertCount = uniforms.filter((u: any) => u.status === 'LOW_STOCK' || (Number(u.total) - Number(u.deployed) < 15)).length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !sizes) { setActionError('Item description and sizes are required.'); return; }
    setActionLoading(true); setActionError(null);
    try {
      const tot = parseInt(total) || 0; const dep = parseInt(deployed) || 0;
      const diff = tot - dep;
      const autoStatus = diff <= 0 ? 'OUT_OF_STOCK' : diff < 15 ? 'LOW_STOCK' : 'HEALTHY';
      await addUniform({ item_name: itemName, sizes, total: tot, deployed: dep, status: autoStatus, group_id: selectedGroupId || undefined });
      resetForm(); setShowAddModal(false);
    } catch (err: any) { setActionError(err?.message || 'Failed to register uniform asset.'); } finally { setActionLoading(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingUniform) return;
    setActionLoading(true); setActionError(null);
    try {
      const tot = parseInt(total) || 0; const dep = parseInt(deployed) || 0;
      const diff = tot - dep;
      const autoStatus = diff <= 0 ? 'OUT_OF_STOCK' : diff < 15 ? 'LOW_STOCK' : 'HEALTHY';
      await updateUniform(editingUniform.id, { item_name: itemName, sizes, total: tot, deployed: dep, status: autoStatus, group_id: selectedGroupId || undefined });
      resetForm(); setEditingUniform(null);
    } catch (err: any) { setActionError(err?.message || 'Failed to update uniform asset.'); } finally { setActionLoading(false); }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this uniform inventory record?')) return;
    try { await deleteUniform(id); } catch (err: any) { alert(err?.message || 'Failed to delete uniform record.'); }
  };

  const handleFastDeploy = async (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const curDeployed = Number(item.deployed) || 0; const curTotal = Number(item.total) || 0;
    if (curDeployed >= curTotal) { alert('This apparel asset is completely out of stock!'); return; }
    try {
      const nextDeployed = curDeployed + 1; const diff = curTotal - nextDeployed;
      const nextStatus = diff <= 0 ? 'OUT_OF_STOCK' : diff < 15 ? 'LOW_STOCK' : 'HEALTHY';
      await updateUniform(item.id, { deployed: nextDeployed, status: nextStatus });
    } catch (err: any) { alert('Failed to execute fast distribution.'); }
  };

  const handleEditClick = (item: any) => {
    setEditingUniform(item); setItemName(item.item_name); setSizes(item.sizes);
    setTotal(String(item.total || 0)); setDeployed(String(item.deployed || 0));
    setStatus(item.status || 'HEALTHY'); setSelectedGroupId(item.group_id || ''); setActionError(null);
  };

  const resetForm = () => { setItemName(''); setSizes('S, M, L, XL'); setTotal(''); setDeployed('0'); setStatus('HEALTHY'); setSelectedGroupId(''); };

  const handleExportCsv = () => {
    exportToCsv(filteredUniforms, 'uniforms', [
      { key: 'item_name', header: 'Item Description' }, { key: 'sizes', header: 'Available Sizes' },
      { key: 'total', header: 'Total Acquired' }, { key: 'deployed', header: 'Distributed' },
      { key: 'status', header: 'Status' },
    ]);
  };

  const handleRefresh = async () => { setActionLoading(true); try { await refresh(); } catch (err) { console.error(err); } finally { setActionLoading(false); } };

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <div className="flex justify-between items-start gap-4">
        <div><h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">{t('uniforms.title', 'Uniforms & Assets')}</h2><p className="mt-1 text-sm text-slate-500 font-sans">{t('uniforms.subtitle', 'Manage apparel inventory, size distribution, and package allocation.')}</p></div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleRefresh} className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0" title="Refresh assets"><RotateCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} /></button>
          <button type="button" onClick={handleExportCsv} disabled={loading || uniforms.length === 0} className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0" title="Export to CSV"><Download className="w-4 h-4" /></button>
          {!isReadOnly && <button onClick={() => { resetForm(); setActionError(null); setShowAddModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shrink-0 font-sans"><Plus className="w-4 h-4" />{t('uniforms.addUniform', 'Add Uniform')}</button>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 font-sans">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4"><div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0"><Shirt className="w-6 h-6" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">{t('uniforms.apparelDeployed', 'Apparel Deployed')}</p>{loading ? <div className="animate-pulse bg-slate-200 rounded h-8 w-16" /> : <span className="text-2xl font-bold text-slate-900">{totalItemsDeployed.toLocaleString()}</span>}</div></div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4"><div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0"><Box className="w-6 h-6" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">{t('uniforms.warehouseStock', 'Warehouse Stock')}</p>{loading ? <div className="animate-pulse bg-slate-200 rounded h-8 w-16" /> : <span className="text-2xl font-bold text-slate-900">{warehouseStock.toLocaleString()}</span>}</div></div>
        <div className={`bg-white p-6 rounded-xl border-l-4 border-y border-r border-slate-100 shadow-sm flex flex-col justify-center ${lowStockAlertCount > 0 ? 'border-l-amber-500 bg-amber-50/10' : 'border-l-indigo-500'}`}><div className="flex items-center gap-2 mb-1"><Rss className={`w-4 h-4 ${lowStockAlertCount > 0 ? 'text-amber-500' : 'text-indigo-500'}`} /><p className={`text-[10px] font-bold uppercase tracking-widest font-mono ${lowStockAlertCount > 0 ? 'text-amber-500' : 'text-indigo-500'}`}>{t('uniforms.stockAlerts', 'Stock Security Alerts')}</p></div><span className="text-xs font-semibold text-slate-700 leading-tight">{lowStockAlertCount > 0 ? `${lowStockAlertCount} items are running low on warehouse safety levels!` : 'Warehouse stock thresholds are clean and robust.'}</span></div>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <h2 className="font-bold text-sm uppercase tracking-wider text-slate-700">{t('uniforms.masterInventory', 'Master Inventory Layout')}</h2>
          <input type="text" placeholder={t('uniforms.filterPlaceholder', 'Filter item name...')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans max-w-xs w-full bg-white text-slate-705" />
        </div>
        <BatchToolbar selectedCount={selectedCount} onBulkDelete={handleBulkDelete} onClearSelection={clearSelection} statusOptions={UNIFORM_STATUSES} onBulkStatusChange={handleBulkStatusChange} actionLoading={actionLoading} />
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap font-sans">
            <thead className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-mono">
              <tr>
                <th className="px-4 py-4 w-10">{!isReadOnly && <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} disabled={loading || filteredUniforms.length === 0} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />}</th>
                <th className="px-6 py-4 font-bold">{t('uniforms.tableHeaders.itemDescription', 'Item Description')}</th><th className="px-6 py-4 font-bold">{t('uniforms.tableHeaders.availableSizes', 'Available Sizes')}</th><th className="px-6 py-4 font-bold text-right font-mono">{t('uniforms.tableHeaders.totalAcquired', 'Total Acquired')}</th><th className="px-6 py-4 font-bold text-right font-mono">{t('uniforms.tableHeaders.distributed', 'Distributed')}</th><th className="px-6 py-4 font-bold text-center">{t('uniforms.tableHeaders.status', 'Status')}</th><th className="px-6 py-4 font-bold text-center">{t('uniforms.tableHeaders.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {loading && (<tr><td colSpan={7} className="p-0"><SkeletonTable rows={4} cols={7} /></td></tr>)}
              {!loading && filteredUniforms.length === 0 && (<tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">{t('uniforms.noItems', 'No items matching criteria.')}</td></tr>)}
              {!loading && filteredUniforms.map((item, i) => {
                const fillPercent = ((item.deployed || 0) / (item.total || 1)) * 100;
                const isOutOfStock = Number(item.deployed) >= Number(item.total);
                return (
                <tr key={item.id || i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4">{!isReadOnly && <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{item.item_name}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{item.sizes}</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-700">{(item.total || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-3"><span className="font-mono text-slate-800">{(item.deployed || 0).toLocaleString()}</span><div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0 hidden sm:block"><div className={`h-full ${fillPercent > 90 ? 'bg-amber-400' : 'bg-indigo-600'}`} style={{ width: `${Math.min(100, fillPercent)}%` }}></div></div></div></td>
                  <td className="px-6 py-4 text-center"><span className={`px-2.5 py-1 text-[9px] font-bold rounded-lg uppercase tracking-wider ${item.status === 'HEALTHY' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : item.status === 'LOW_STOCK' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>{item.status ? item.status.replace('_', ' ') : 'UNKNOWN'}</span></td>
                  <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-3">{!isReadOnly && <button type="button" onClick={(e) => handleFastDeploy(item, e)} disabled={isOutOfStock} className="bg-indigo-50 border border-indigo-155 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px] hover:bg-indigo-600 hover:text-white flex items-center gap-1 uppercase tracking-wider disabled:opacity-45 transition-all font-mono" title="Distribute 1 item of this model to staff"><ArrowUpRight className="w-3 h-3" />{t('uniforms.deployUnit', 'Deploy Unit')}</button>}{!isReadOnly && <button type="button" onClick={() => handleEditClick(item)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit assets details"><Edit2 className="w-4 h-4" /></button>}{!isReadOnly && <button type="button" onClick={(e) => handleDelete(item.id, e)} className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="Delete asset record"><Trash2 className="w-4 h-4" /></button>}</div></td>
                </tr>
              )})}
            </tbody>
          </table>
          {!loading && filteredUniforms.length > 0 && (<Pagination page={page} pageSize={10} totalCount={totalCount} onPageChange={goToPage} />)}
        </div>
      </div>
      {(showAddModal || editingUniform) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans"><div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"><div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50"><h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{editingUniform ? t('uniforms.editParameters', 'Edit Apparel Parameters') : t('uniforms.createDemographic', 'Create Apparel Demographic')}</h3><button onClick={() => { setShowAddModal(false); setEditingUniform(null); }} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button></div>
        <form onSubmit={editingUniform ? handleUpdate : handleCreate} className="p-6 space-y-4">{actionError && (<div className="p-3 bg-red-50 text-red-600 rounded text-xs leading-relaxed font-semibold">{actionError}</div>)}
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('uniforms.itemNameLabel', 'Item_name (Description)')}</label><input type="text" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g.志愿者红马甲 / Volunteers Red Vest" className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500" required /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">{t('uniforms.sizesLabel', 'Available Sizes')}</label><input type="text" value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="e.g. S, M, L, XL, XXL" className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500" required /></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('uniforms.totalLabel', 'Total Acquired')}</label><input type="number" min="0" value={total} onChange={(e) => setTotal(e.target.value)} className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" required /></div><div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('uniforms.deployedLabel', 'Deployed Models')}</label><input type="number" min="0" value={deployed} onChange={(e) => setDeployed(e.target.value)} className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" required /></div></div>
          <GroupSelect value={selectedGroupId} onChange={setSelectedGroupId} />
          <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => { setShowAddModal(false); setEditingUniform(null); }} className="px-4 py-2 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider">{t('common.cancel', 'Cancel')}</button><button type="submit" disabled={actionLoading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold uppercase tracking-wider disabled:bg-indigo-400">{actionLoading ? t('common.saving', 'Saving...') : editingUniform ? t('common.saveChanges', 'Save Changes') : t('uniforms.createVariant', 'Create Variant')}</button></div>
        </form></div></div>
      )}
    </div>
  );
}
