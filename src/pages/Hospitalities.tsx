import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ticket, Users, LayoutTemplate, Star, CreditCard, Plus, Trash2, Edit2, RotateCw, X, ChevronRight, Euro, Download } from 'lucide-react';
import { useHospitalityPackages, useHospitalityGuests } from '../hooks/useApi';
import { useAppStore } from '../store/appStore';
import { useBatchSelection } from '../hooks/useBatchSelection';
import { BatchToolbar } from '../components/BatchToolbar';
import { SkeletonCard } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import GroupSelect from '../components/GroupSelect';
import { exportToCsv } from '../lib/exportCsv';

const SEAT_SECTIONS = [
  { value: "Tribune d'Honneur", label: "Tribune d'Honneur (Zone A)" },
  { value: 'Loge Présidentielle', label: 'Loge Présidentielle (Zone VIP)' },
  { value: 'Tribune Nord Elite', label: 'Tribune Nord Elite (Zone B)' },
  { value: 'Prestige Lounge', label: 'Prestige Lounge (Makaiaanui Deck)' },
] as const;

const STADIUM_SECTIONS = [
  { label: 'TG (A)', load: '85%', color: 'bg-indigo-500' },
  { label: 'PRES (VIP)', load: '90%', color: 'bg-rose-500' },
  { label: 'TN (B)', load: '40%', color: 'bg-emerald-500' },
  { label: 'L_DECK', load: '65%', color: 'bg-amber-500' },
] as const;

export default function Hospitalities() {
  const { t } = useTranslation();
  const { role } = useAppStore();
  const isReadOnly = role === 'MEMBER';
  const [activeView, setActiveView] = useState<'packages' | 'seating'>('packages');
  const { packages, loading, addPackage, updatePackage, deletePackage, refresh, page, totalCount, goToPage } = useHospitalityPackages();
  const { guests: assignedSeats, loading: guestsLoading, addGuest, deleteGuest, refresh: refreshGuests, page: guestsPage, totalCount: guestsTotal, goToPage: goToGuestsPage } = useHospitalityGuests();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any | null>(null);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('150');
  const [capacity, setCapacity] = useState('100');
  const [sold, setSold] = useState('0');
  const [total, setTotal] = useState('100');

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [selectedSeatSection, setSelectedSeatSection] = useState<string>(SEAT_SECTIONS[0].value);
  const [seatGuestName, setSeatGuestName] = useState('');

  const { selectedIds, selectedCount, toggleSelect, toggleSelectAll, clearSelection, isAllSelected } = useBatchSelection(packages);

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedCount} selected packages?`)) return;
    setActionLoading(true); try { for (const id of selectedIds) { await deletePackage(id); } clearSelection(); } catch (err) { alert('Bulk delete failed.'); } finally { setActionLoading(false); }
  };

  const totalRevenue = packages.reduce((sum: number, pkg: any) => sum + ((Number(pkg.price) || 0) * (Number(pkg.sold) || 0)), 0);
  const totalVIPGuests = packages.reduce((sum: number, pkg: any) => sum + (Number(pkg.sold) || 0), 0);
  const overallCapacity = packages.reduce((sum: number, pkg: any) => sum + (Number(pkg.capacity) || 0), 0);
  const fillRate = overallCapacity > 0 ? Math.round((totalVIPGuests / overallCapacity) * 100) : 0;

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault(); if (!title || !price) { setActionError('Title and pricing are required.'); return; }
    setActionLoading(true); setActionError(null);
    try { const capInt = parseInt(capacity) || 0; await addPackage({ title, price: parseFloat(price) || 0, capacity: capInt, sold: parseInt(sold) || 0, total: parseInt(total) || capInt, group_id: selectedGroupId || undefined }); resetForm(); setShowAddModal(false); } catch (err: any) { setActionError(err?.message || 'Failed to create VIP package.'); } finally { setActionLoading(false); }
  };

  const handleUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editingPackage) return;
    setActionLoading(true); setActionError(null);
    try { const capInt = parseInt(capacity) || 0; await updatePackage(editingPackage.id, { title, price: parseFloat(price) || 0, capacity: capInt, sold: parseInt(sold) || 0, total: parseInt(total) || capInt, group_id: selectedGroupId || undefined }); resetForm(); setEditingPackage(null); } catch (err: any) { setActionError(err?.message || 'Failed to update VIP package.'); } finally { setActionLoading(false); }
  };

  const handleDeletePackage = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); if (!window.confirm('Are you sure you want to delete this VIP package?')) return;
    try { await deletePackage(id); } catch (err: any) { alert(err?.message || 'Failed to delete package.'); }
  };

  const handleQuickSale = async (pkg: any, e: React.MouseEvent) => {
    e.stopPropagation(); const currentSold = Number(pkg.sold) || 0; const currentTotal = Number(pkg.total) || 1;
    if (currentSold >= currentTotal) { alert('This package is already sold out!'); return; }
    try { await updatePackage(pkg.id, { sold: currentSold + 1 }); } catch (err: any) { alert('Failed to register fast ticket sale.'); }
  };

  const handleEditClick = (pkg: any) => {
    setEditingPackage(pkg); setTitle(pkg.title); setPrice(pkg.price !== undefined && pkg.price !== null ? String(pkg.price) : '150');
    setCapacity(String(pkg.capacity || 100)); setSold(String(pkg.sold || 0)); setTotal(String(pkg.total || 100)); setSelectedGroupId(pkg.group_id || ''); setActionError(null);
  };

  const handleSeatAssign = async (e: React.FormEvent) => {
    e.preventDefault(); if (!seatGuestName) return;
    const nextSeatNum = `${selectedSeatSection.charAt(0)}-${Math.floor(Math.random() * 90) + 10}`;
    setActionLoading(true);
    try { await addGuest({ section: selectedSeatSection, guest: seatGuestName, seat_num: nextSeatNum }); setSeatGuestName(''); } catch (err: any) { alert(err?.message || 'Failed to assign seat.'); } finally { setActionLoading(false); }
  };

  const handleSeatRemove = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); try { await deleteGuest(id); } catch (err: any) { alert(err?.message || 'Failed to remove seat assignment.'); }
  };

  const resetForm = () => { setTitle(''); setPrice('150'); setCapacity('100'); setSold('0'); setTotal('100'); setSelectedGroupId(''); };

  const handleRefresh = async () => { setActionLoading(true); try { await refresh(); } catch (err) { console.error(err); } finally { setActionLoading(false); } };

  const handleExportCsv = () => {
    exportToCsv(packages, 'hospitality-packages', [
      { key: 'title', header: 'Package Title' }, { key: 'price', header: 'Price (€)' },
      { key: 'capacity', header: 'Capacity' }, { key: 'sold', header: 'Sold Tickets' }, { key: 'total', header: 'Total Seats' },
    ]);
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div><h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">{t('hospitalities.title', 'Protocol & Hospitalities')}</h2><p className="mt-1 text-sm text-slate-500 font-sans">{t('hospitalities.subtitle', 'Manage VIP packages, ticketing, and interactive seating protocols.')}</p></div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleRefresh} className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0" title="Refresh packages"><RotateCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} /></button>
          <button type="button" onClick={handleExportCsv} disabled={loading || packages.length === 0} className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0" title="Export to CSV"><Download className="w-4 h-4" /></button>
          {activeView === 'packages' && !isReadOnly && (<button onClick={() => { resetForm(); setActionError(null); setShowAddModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shrink-0"><Plus className="w-4 h-4" />{t('hospitalities.addPackage', 'Add Package')}</button>)}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0 font-sans">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">{t('hospitalities.totalSalesRevenue', 'Total Sales Revenue')}</p><span className="text-3xl font-bold text-indigo-600">{loading ? <span className="inline-block w-20 h-8 bg-slate-200 rounded animate-pulse align-middle" /> : `€${totalRevenue.toLocaleString()}`}</span></div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">{t('hospitalities.vipGuestsRegistered', 'VIP Guests Registered')}</p><span className="text-3xl font-bold text-slate-900">{loading ? <span className="inline-block w-10 h-8 bg-slate-200 rounded animate-pulse align-middle" /> : totalVIPGuests}</span></div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm md:col-span-2 flex items-center gap-4"><div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0"><Star className="w-6 h-6" /></div><div className="flex-1"><h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider font-mono">{t('hospitalities.fillRateAllotments', 'Fill Rate & Allotments')}</h3><p className="text-sm font-semibold text-slate-900 mt-0.5">{fillRate}% {t('hospitalities.allocated', 'allocated')} ({totalVIPGuests} / {overallCapacity} {t('hospitalities.vipSeats', 'VIP Seats')})</p><div className="mt-2 h-1.5 w-full bg-slate-150 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${fillRate}%` }}></div></div></div></div>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[450px]">
        <div className="border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex px-6">
            <button onClick={() => setActiveView('packages')} className={`py-4 px-2 text-sm font-bold uppercase tracking-widest border-b-2 mr-8 transition-colors font-sans ${activeView === 'packages' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{t('hospitalities.vipPackages', 'VIP Packages')}</button>
            <button onClick={() => setActiveView('seating')} className={`py-4 px-2 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors font-sans ${activeView === 'seating' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{t('hospitalities.allocationsSeating', 'Allocations & Seating')}</button>
          </div>
        </div>
        {activeView === 'packages' && (
          <div className="flex flex-col flex-1 bg-slate-50/50">
            <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center gap-3">
              {!isReadOnly && <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} disabled={loading || packages.length === 0} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />}
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('hospitalities.selectAllPackages', 'Select All Packages')}</span>
            </div>
            <BatchToolbar selectedCount={selectedCount} onBulkDelete={handleBulkDelete} onClearSelection={clearSelection} actionLoading={actionLoading} />
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto flex-1">
              {loading && <div className="col-span-full py-12"><SkeletonCard /><div className="grid grid-cols-3 gap-6 mt-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div></div>}
              {!loading && packages.length === 0 && <div className="col-span-full py-12 text-center text-sm text-slate-500 font-sans font-medium">{t('hospitalities.noPackages', 'No VIP Packages defined. Click Add Package to begin.')}</div>}
              {!loading && packages.map((pkg, idx) => (
                <div key={pkg.id || idx} className="bg-white border border-slate-150 rounded-xl p-5 hover:border-indigo-300 transition-colors cursor-pointer group flex flex-col shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {!isReadOnly && <input type="checkbox" checked={selectedIds.has(pkg.id)} onChange={() => toggleSelect(pkg.id)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" onClick={(e) => e.stopPropagation()} />}
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors font-sans">{pkg.title}</h3>
                    </div>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg font-mono">€{pkg.price || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-6 text-slate-500 font-sans text-xs"><Users className="w-4 h-4" /><span>{t('hospitalities.capacityAllotment', 'Capacity Allotment')}: {pkg.capacity || 0}</span></div>
                  <div className="mt-auto space-y-4">
                    <div><div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono"><span>{t('hospitalities.liveSales', 'Live Sales Registration')}</span><span>{pkg.sold || 0} / {pkg.total || 0}</span></div><div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full transition-all duration-300 ${(pkg.sold || 0) >= (pkg.total || 1) ? 'bg-indigo-600' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, ((pkg.sold || 0) / (pkg.total || 1)) * 100)}%` }}></div></div></div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      {!isReadOnly && <button type="button" onClick={(e) => handleQuickSale(pkg, e)} disabled={Number(pkg.sold) >= (Number(pkg.total) || 1)} className="text-xs font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 transition-colors flex items-center gap-1"><Ticket className="w-3.5 h-3.5" />{t('hospitalities.quickSale', 'Quick Sale')}</button>}
                      <div className="flex items-center gap-1 bg-white shrink-0">
                        {!isReadOnly && <button type="button" onClick={() => handleEditClick(pkg)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit package parameters"><Edit2 className="w-3.5 h-3.5" /></button>}
                        {!isReadOnly && <button type="button" onClick={(e) => handleDeletePackage(pkg.id, e)} className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="Delete Package"><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!loading && packages.length > 0 && (<Pagination page={page} pageSize={10} totalCount={totalCount} onPageChange={goToPage} />)}
            </div>
          </div>
        )}
        {activeView === 'seating' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 bg-slate-50/20 font-sans">
            <div className="lg:col-span-5 bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div><h3 className="font-bold text-sm text-slate-700 uppercase tracking-wider mb-4 font-mono">{t('hospitalities.vipAllocationTerminal', 'VIP Allocation Terminal')}</h3>
                <form onSubmit={handleSeatAssign} className="space-y-4">                    <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1 font-mono">{t('hospitalities.guestName', 'Guest / Delegate Name')}</label><input type="text" value={seatGuestName} onChange={(e) => setSeatGuestName(e.target.value)} placeholder="e.g. S.A.S. Le Prince Albert" className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500" required disabled={isReadOnly} /></div>
                  <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1 font-mono font-sans">{t('hospitalities.seatSection', 'Premium Seat Section')}</label><select value={selectedSeatSection} onChange={(e) => setSelectedSeatSection(e.target.value)} className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500" disabled={isReadOnly}>{SEAT_SECTIONS.map((section) => (<option key={section.value} value={section.value}>{section.label}</option>))}</select></div>
                  {!isReadOnly && <button type="submit" className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded text-xs uppercase tracking-widest transition-colors">{t('hospitalities.allocateSeat', 'Allocate seat ticket')}</button>}
                </form>
              </div>
              <div className="mt-6 border-t border-slate-100 pt-6"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 font-mono">{t('hospitalities.liveStadiumLoad', 'Live Stadium Section Load')}</p><div className="grid grid-cols-4 gap-2">{STADIUM_SECTIONS.map((sec, idx) => (<div key={idx} className="bg-slate-50 border border-slate-150 p-2.5 rounded-lg text-center"><p className="text-[9px] font-bold text-slate-400 font-mono">{sec.label}</p><p className="text-sm font-bold text-slate-800 font-mono mt-0.5">{sec.load}</p><div className="h-1 w-full bg-slate-200 rounded-full mt-1.5 overflow-hidden"><div className={`h-full ${sec.color}`} style={{ width: sec.load }}></div></div></div>))}</div></div>
            </div>
            <div className="lg:col-span-7 bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm flex flex-col h-[350px] lg:h-auto">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between"><h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider font-mono">{t('hospitalities.assignedSeatLogs', 'Assigned Seat Logs')}</h3><span className="text-[10px] font-bold text-slate-400 font-mono">{guestsTotal} {t('hospitalities.seatsActive', 'seats active')}</span></div>
              <div className="overflow-y-auto divide-y divide-slate-100 flex-1">{assignedSeats.map((as, idx) => (<div key={as.id || idx} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"><div className="min-w-0"><p className="text-sm font-bold text-slate-900 truncate">{as.guest}</p><div className="flex items-center gap-2 mt-1 text-xs text-slate-500"><span className="font-semibold text-indigo-600 font-mono">{as.section}</span><span>•</span><span className="font-mono bg-slate-105 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">{as.seat_num}</span></div></div>{!isReadOnly && <button type="button" onClick={() => handleSeatRemove(as.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Deallocate seat"><X className="w-4 h-4" /></button>}</div>))}{!guestsLoading && assignedSeats.length > 0 && (<Pagination page={guestsPage} pageSize={10} totalCount={guestsTotal} onPageChange={goToGuestsPage} />)}</div>
            </div>
          </div>
        )}
      </div>
      {(showAddModal || editingPackage) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans"><div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"><div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50"><h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{editingPackage ? t('hospitalities.editPackage', 'Edit VIP Box Package') : t('hospitalities.createPackage', 'Create VIP Box Package')}</h3><button onClick={() => { setShowAddModal(false); setEditingPackage(null); }} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button></div>
        <form onSubmit={editingPackage ? handleUpdatePackage : handleCreatePackage} className="p-6 space-y-4">{actionError && (<div className="p-3 bg-red-50 text-red-600 rounded text-xs leading-relaxed font-semibold">{actionError}</div>)}
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('hospitalities.packageTitle', 'Package / Location Title')}</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. VIP President Box" className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500" required /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('hospitalities.priceEuro', 'Price (€)')}</label><input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 500.00" className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" required /></div>
          <div className="grid grid-cols-3 gap-4"><div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('hospitalities.capacity', 'Capacity')}</label><input type="number" min="0" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" required /></div><div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('hospitalities.soldTickets', 'Sold Tickets')}</label><input type="number" min="0" value={sold} onChange={(e) => setSold(e.target.value)} className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" /></div><div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('hospitalities.totalSeats', 'Total Seats')}</label><input type="number" min="0" value={total} onChange={(e) => setTotal(e.target.value)} className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" /></div></div>
          <GroupSelect value={selectedGroupId} onChange={setSelectedGroupId} />
          <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => { setShowAddModal(false); setEditingPackage(null); }} className="px-4 py-2 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider">{t('common.cancel', 'Cancel')}</button><button type="submit" disabled={actionLoading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold uppercase tracking-wider disabled:bg-indigo-400">{actionLoading ? t('common.saving', 'Saving...') : editingPackage ? t('common.saveChanges', 'Save Changes') : t('hospitalities.createPackage', 'Create Package')}</button></div>
        </form></div></div>
      )}
    </div>
  );
}
