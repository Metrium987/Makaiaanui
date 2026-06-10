import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, CreditCard, Ticket, Clock, Plus, Trash2, Edit2, RotateCw, X, Search, ShoppingCart, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useAdditionalServices } from '../hooks/useApi';
import { useAppStore } from '../store/appStore';
import { useBatchSelection } from '../hooks/useBatchSelection';
import { BatchToolbar } from '../components/BatchToolbar';
import { SkeletonTable } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import GroupSelect from '../components/GroupSelect';
import { exportToCsv } from '../lib/exportCsv';
import { exportToExcel, exportToPdf } from '../lib/reports';

const SERVICE_TYPE_OPTIONS = [
  { value: 'TOURISM_HOTEL', label: 'HOTEL & TOURS' },
  { value: 'TRANSFERS', label: 'OPTIONAL TRANSFERS' },
  { value: 'PREMIUM_MEALS', label: 'PREMIUM MEALS & BAR' },
  { value: 'EQUIPMENT', label: 'EQUIPMENT & RENTALS' },
  { value: 'STANDARD', label: 'OTHER STANDARD' },
] as const;

const DEFAULT_SERVICE_PRICE = '';
const DEFAULT_LIMIT_COUNT = '';

export default function AdditionalServices() {
  const { t } = useTranslation();
  const { role } = useAppStore();
  const isReadOnly = role === 'MEMBER';
  const { services, loading, addService, updateService, deleteService, refresh, page, totalCount, goToPage } = useAdditionalServices();
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);

  const [title, setTitle] = useState('');
  const [serviceType, setServiceType] = useState<string>(SERVICE_TYPE_OPTIONS[4].value);
  const [price, setPrice] = useState(DEFAULT_SERVICE_PRICE);
  const [soldCount, setSoldCount] = useState('0');
  const [limitCount, setLimitCount] = useState(DEFAULT_LIMIT_COUNT);

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredServices = services.filter(item => item.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  const { selectedIds, selectedCount, toggleSelect, toggleSelectAll, clearSelection, isAllSelected } = useBatchSelection(filteredServices);

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedCount} selected services?`)) return;
    setActionLoading(true); try { for (const id of selectedIds) { await deleteService(id); } clearSelection(); } catch (err) { alert('Bulk delete failed.'); } finally { setActionLoading(false); }
  };

  const totalSold = services.reduce((sum: number, s: any) => sum + (Number(s.sold_count) || 0), 0);
  const totalRevenue = services.reduce((sum: number, s: any) => sum + ((Number(s.price) || 0) * (Number(s.sold_count) || 0)), 0);
  const limitedServicesCount = services.filter((s: any) => Number(s.limit_count) > 0).length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!title) { setActionError('Service name is required.'); return; }
    setActionLoading(true); setActionError(null);
    try {
      await addService({ title, service_type: serviceType, price: Number(price) || 0, sold_count: Number(soldCount) || 0, limit_count: Number(limitCount) || 0, group_id: selectedGroupId || undefined });
      resetForm(); setShowAddModal(false);
    } catch (err: any) { setActionError(err?.message || 'Failed to publish service catalog entry.'); } finally { setActionLoading(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingService) return;
    setActionLoading(true); setActionError(null);
    try {
      await updateService(editingService.id, { title, service_type: serviceType, price: Number(price) || 0, sold_count: Number(soldCount) || 0, limit_count: Number(limitCount) || 0 });
      resetForm(); setEditingService(null);
    } catch (err: any) { setActionError(err?.message || 'Failed to update service catalog entry.'); } finally { setActionLoading(false); }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this additional service from catalog?')) return;
    try { await deleteService(id); } catch (err: any) { alert(err?.message || 'Failed to delete service.'); }
  };

  const handleQuickSale = async (svc: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const curSold = Number(svc.sold_count) || 0; const curLimit = Number(svc.limit_count) || 0;
    if (curLimit > 0 && curSold >= curLimit) { alert('This optional booking service has reached its absolute maximum limit!'); return; }
    try { await updateService(svc.id, { sold_count: curSold + 1 }); } catch (err: any) { alert('Failed to register fast service booking.'); }
  };

  const handleEditClick = (svc: any) => {
    setEditingService(svc); setTitle(svc.title); setServiceType(svc.service_type || SERVICE_TYPE_OPTIONS[4].value);
    setPrice(String(svc.price || 0)); setSoldCount(String(svc.sold_count || 0));
    setLimitCount(svc.limit_count ? String(svc.limit_count) : DEFAULT_LIMIT_COUNT); setActionError(null);
  };

  const resetForm = () => { setTitle(''); setServiceType(SERVICE_TYPE_OPTIONS[4].value); setPrice(DEFAULT_SERVICE_PRICE); setSoldCount('0'); setLimitCount(DEFAULT_LIMIT_COUNT); setSelectedGroupId(''); };

  const additionalServicesColumns = [
    { key: 'title', header: 'Service Name' }, { key: 'service_type', header: 'Type' },
    { key: 'price', header: 'Price (€)' }, { key: 'sold_count', header: 'Sold' }, { key: 'limit_count', header: 'Limit' },
  ];
  const handleExportCsv = () => { exportToCsv(filteredServices, 'additional-services', additionalServicesColumns); };
  const handleExportExcel = () => { exportToExcel(filteredServices, 'additional-services', additionalServicesColumns, 'Services Catalog', 'Services Additionnels — Catalog Report'); };
  const handleExportPdf = () => { exportToPdf(filteredServices, 'additional-services', additionalServicesColumns, 'Services Additionnels — Catalog Report', `Total Sold: ${totalSold} | Revenue: €${totalRevenue.toLocaleString()}`); };

  const handleRefresh = async () => { setActionLoading(true); try { await refresh(); } catch (err) { console.error(err); } finally { setActionLoading(false); } };

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <div className="flex justify-between items-start gap-4">
        <div><h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">{t('additionalServices.title', 'Services Additionnels')}</h2><p className="mt-1 text-sm text-slate-500 font-sans">{t('additionalServices.subtitle', 'Manage and commercialize supplementary services for clients and guests.')}</p></div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleRefresh} className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0" title="Refresh services from database"><RotateCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} /></button>
          <button type="button" onClick={handleExportCsv} disabled={loading || services.length === 0} className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0" title="Export to CSV"><Download className="w-4 h-4" /></button><button type="button" onClick={handleExportExcel} disabled={loading || services.length === 0} className="p-2 border border-slate-200 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors flex items-center justify-center shrink-0" title="Export to Excel"><FileSpreadsheet className="w-4 h-4" /></button><button type="button" onClick={handleExportPdf} disabled={loading || services.length === 0} className="p-2 border border-slate-200 hover:bg-red-50 text-red-500 rounded-lg transition-colors flex items-center justify-center shrink-0" title="Export to PDF"><FileText className="w-4 h-4" /></button>
          {!isReadOnly && <button onClick={() => { resetForm(); setActionError(null); setShowAddModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shrink-0 font-sans"><Plus className="w-4 h-4" />{t('additionalServices.createService', 'Create Service')}</button>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 font-sans">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4"><div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0"><Ticket className="w-6 h-6" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">{t('additionalServices.totalServicesSold', 'Total Services Sold')}</p>{loading ? <div className="animate-pulse bg-slate-200 rounded h-8 w-12" /> : <span className="text-2xl font-bold text-slate-900">{totalSold}</span>}</div></div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4"><div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0"><CreditCard className="w-6 h-6" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">{t('additionalServices.supplementaryRevenue', 'Supplementary Revenue')}</p>{loading ? <div className="animate-pulse bg-slate-200 rounded h-8 w-24" /> : <span className="text-2xl font-bold text-indigo-600">€{totalRevenue.toLocaleString()}</span>}</div></div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4"><div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0"><Clock className="w-6 h-6" /></div><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">{t('additionalServices.limitedClassBuffers', 'Limited Class Buffers')}</p>{loading ? <div className="animate-pulse bg-slate-200 rounded h-8 w-8" /> : <span className="text-2xl font-bold text-slate-900">{limitedServicesCount}</span>}</div></div>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <h2 className="font-bold text-sm uppercase tracking-wider text-slate-700">{t('additionalServices.servicesCatalog', 'Services Catalog')}</h2>
          <input type="text" placeholder={t('additionalServices.searchPlaceholder', 'Search catalog item name...')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans max-w-xs w-full bg-white text-slate-710" />
        </div>
        <BatchToolbar selectedCount={selectedCount} onBulkDelete={handleBulkDelete} onClearSelection={clearSelection} actionLoading={actionLoading} />
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap font-sans">
            <thead className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-mono">
              <tr>
                <th className="px-4 py-4 w-10">{!isReadOnly && <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} disabled={loading || filteredServices.length === 0} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />}</th>
                <th className="px-6 py-4 font-bold">{t('additionalServices.tableHeaders.serviceName', 'Service Name')}</th><th className="px-6 py-4 font-bold">{t('additionalServices.tableHeaders.type', 'Type')}</th><th className="px-6 py-4 font-bold text-right font-mono">{t('additionalServices.tableHeaders.priceUnit', 'Price Unit')}</th><th className="px-6 py-4 font-bold text-right font-mono">{t('additionalServices.tableHeaders.soldLimit', 'Sold / Limit')}</th><th className="px-6 py-4 font-bold text-center">{t('additionalServices.tableHeaders.status', 'Status')}</th><th className="px-6 py-4 font-bold text-center">{t('additionalServices.tableHeaders.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-sans">
              {loading && (<tr><td colSpan={7} className="p-0"><SkeletonTable rows={4} cols={7} /></td></tr>)}
              {!loading && filteredServices.length === 0 && (<tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">{t('additionalServices.noServices', 'No catalog optional services matching filters.')}</td></tr>)}
              {!loading && filteredServices.map((svc, i) => {
                const limit = Number(svc.limit_count) || 0; const sold = Number(svc.sold_count) || 0;
                const isLimited = limit > 0; const fillPercent = isLimited ? (sold / limit) * 100 : 0;
                const isSoldOut = isLimited && sold >= limit;
                return (
                <tr key={svc.id || i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4">{!isReadOnly && <input type="checkbox" checked={selectedIds.has(svc.id)} onChange={() => toggleSelect(svc.id)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{svc.title}</td>
                  <td className="px-6 py-4 text-xs"><span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-150 font-bold rounded-lg uppercase tracking-wider text-[9px]">{svc.service_type || 'STANDARD'}</span></td>
                  <td className="px-6 py-4 text-right font-mono font-semibold text-slate-800">{svc.price ? `€${Number(svc.price).toLocaleString()}` : t('additionalServices.free', 'Free / Complimentary')}</td>
                  <td className="px-6 py-4 text-right"><div className="flex items-center justify-end gap-3"><span className="font-mono text-xs">{sold} {isLimited ? `/ ${limit}` : ''}</span>{isLimited && (<div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0 hidden sm:block"><div className={`h-full ${fillPercent > 90 ? 'bg-amber-400' : 'bg-indigo-600'}`} style={{ width: `${Math.min(100, fillPercent)}%` }}></div></div>)}</div></td>
                  <td className="px-6 py-4 text-center"><span className={`px-2.5 py-1 text-[9px] font-bold rounded-lg uppercase tracking-wider ${isSoldOut ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>{isSoldOut ? t('additionalServices.soldOut', 'SOLD OUT') : t('additionalServices.active', 'ACTIVE')}</span></td>
                  <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-3">{!isReadOnly && <button type="button" onClick={(e) => handleQuickSale(svc, e)} disabled={isSoldOut} className="bg-indigo-50 border border-indigo-155 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px] hover:bg-indigo-600 hover:text-white flex items-center gap-1 uppercase tracking-wider disabled:opacity-45 transition-all font-mono" title="Book / buy this service for a client"><ShoppingCart className="w-3 h-3" />{t('additionalServices.bookUnit', 'Book Unit')}</button>}{!isReadOnly && <button type="button" onClick={() => handleEditClick(svc)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit catalog price or limit"><Edit2 className="w-3.5 h-3.5" /></button>}{!isReadOnly && <button type="button" onClick={(e) => handleDelete(svc.id, e)} className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="Delete from catalog"><Trash2 className="w-3.5 h-3.5" /></button>}</div></td>
                </tr>
              )})}
            </tbody>
          </table>
          {!loading && filteredServices.length > 0 && (<Pagination page={page} pageSize={10} totalCount={totalCount} onPageChange={goToPage} />)}
        </div>
      </div>
      {(showAddModal || editingService) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans"><div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"><div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50"><h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{editingService ? t('additionalServices.editOption', 'Edit Supplementary Option') : t('additionalServices.newCatalogOption', 'New Catalog Option')}</h3><button onClick={() => { setShowAddModal(false); setEditingService(null); }} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button></div>
        <form onSubmit={editingService ? handleUpdate : handleCreate} className="p-6 space-y-4">{actionError && (<div className="p-3 bg-red-50 text-red-600 rounded text-xs leading-relaxed font-semibold">{actionError}</div>)}
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('additionalServices.serviceName', 'Service Option Name')}</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. VIP Guided Lagoon Sunset Tour" className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500" required /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('additionalServices.category', 'Category / Group')}</label><select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">{SERVICE_TYPE_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}</select></div>
          <div className="grid grid-cols-3 gap-4"><div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('additionalServices.priceUnit', 'Price Unit (€)')}</label><input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" required /></div><div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('additionalServices.totalSold', 'Total Sold')}</label><input type="number" min="0" value={soldCount} onChange={(e) => setSoldCount(e.target.value)} className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" required /></div><div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('additionalServices.limitCapacity', 'Limit Capacity')}</label><input type="number" min="0" value={limitCount} onChange={(e) => setLimitCount(e.target.value)} className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" placeholder="0 for un-limited" required /></div></div>
          <GroupSelect value={selectedGroupId} onChange={setSelectedGroupId} />
          <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => { setShowAddModal(false); setEditingService(null); }} className="px-4 py-2 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider">{t('common.cancel', 'Cancel')}</button><button type="submit" disabled={actionLoading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold uppercase tracking-wider disabled:bg-indigo-400">{actionLoading ? t('common.saving', 'Saving...') : editingService ? t('common.saveChanges', 'Save Changes') : t('additionalServices.publishCatalog', 'Publish Catalog')}</button></div>
        </form></div></div>
      )}
    </div>
  );
}
