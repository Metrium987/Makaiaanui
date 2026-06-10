import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Plus, RotateCw, X, Search, Download, CheckCircle2, XCircle, Play, Flag, Clock, Filter } from 'lucide-react';
import { useClientRequests } from '../hooks/useApi';
import { useAppStore } from '../store/appStore';
import { SkeletonTable } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { exportToCsv } from '../lib/exportCsv';
import type { ClientRequestModuleType, ClientRequestStatus } from '../types';

const MODULE_TYPES: { value: ClientRequestModuleType | 'ALL'; label: string; color: string }[] = [
  { value: 'ALL', label: 'All Modules', color: 'bg-slate-100 text-slate-600' },
  { value: 'transport', label: 'Transport', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { value: 'accommodation', label: 'Accommodation', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { value: 'catering', label: 'Catering', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { value: 'laundry', label: 'Laundry', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { value: 'additional_services', label: 'Add. Services', color: 'bg-rose-50 text-rose-600 border-rose-100' },
  { value: 'accreditations', label: 'Accreditations', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  { value: 'deliveries', label: 'Deliveries', color: 'bg-teal-50 text-teal-600 border-teal-100' },
];

const STATUS_TABS: { value: ClientRequestStatus | 'ALL'; label: string; color: string }[] = [
  { value: 'ALL', label: 'All', color: 'border-slate-300 text-slate-600' },
  { value: 'PENDING', label: 'Pending', color: 'border-amber-300 text-amber-600' },
  { value: 'APPROVED', label: 'Approved', color: 'border-emerald-300 text-emerald-600' },
  { value: 'REJECTED', label: 'Rejected', color: 'border-red-300 text-red-600' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-300 text-blue-600' },
  { value: 'COMPLETED', label: 'Completed', color: 'border-indigo-300 text-indigo-600' },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-600 border border-amber-100',
  APPROVED: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  REJECTED: 'bg-red-50 text-red-600 border border-red-100',
  IN_PROGRESS: 'bg-blue-50 text-blue-600 border border-blue-100',
  COMPLETED: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
};

export default function ClientPortal() {
  const { t } = useTranslation();
  const currentUserRole = useAppStore(s => s.role);
  const currentUserId = useAppStore(s => s.session?.user?.id);
  const isBackOffice = currentUserRole === 'BACK_OFFICE' || currentUserRole === 'ADMIN';

  const [statusFilter, setStatusFilter] = useState<ClientRequestStatus | 'ALL'>('ALL');
  const [moduleFilter, setModuleFilter] = useState<ClientRequestModuleType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { requests, loading, addRequest, updateRequest, deleteRequest, refresh, page, totalCount, goToPage } = useClientRequests(
    statusFilter === 'ALL' ? undefined : statusFilter,
    moduleFilter === 'ALL' ? undefined : moduleFilter
  );

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reqModule, setReqModule] = useState<ClientRequestModuleType>('transport');
  const [reqTitle, setReqTitle] = useState('');
  const [reqDescription, setReqDescription] = useState('');
  const [reqClientName, setReqClientName] = useState('');
  const [reqClientEmail, setReqClientEmail] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{ id: string; reason: string } | null>(null);

  const filteredRequests = requests.filter(r =>
    r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle) { setActionError('Title is required.'); return; }
    setActionLoading(true); setActionError(null);
    try {
      await addRequest({ module_type: reqModule, title: reqTitle, description: reqDescription, client_name: reqClientName, client_email: reqClientEmail });
      resetForm(); setShowCreateModal(false);
    } catch (err: any) { setActionError(err?.message || 'Failed to submit request.'); } finally { setActionLoading(false); }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try { await updateRequest(id, { status: 'APPROVED', approved_by: currentUserId }); } catch (err: any) { alert(err?.message || 'Failed to approve.'); } finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectionModal) return;
    setActionLoading(true);
    try {
      await updateRequest(rejectionModal.id, { status: 'REJECTED', rejection_reason: rejectionModal.reason });
      setRejectionModal(null);
    } catch (err: any) { alert(err?.message || 'Failed to reject.'); } finally { setActionLoading(false); }
  };

  const handleStartProgress = async (id: string) => {
    setActionLoading(true);
    try { await updateRequest(id, { status: 'IN_PROGRESS' }); } catch (err: any) { alert(err?.message || 'Failed to start.'); } finally { setActionLoading(false); }
  };

  const handleComplete = async (id: string) => {
    setActionLoading(true);
    try { await updateRequest(id, { status: 'COMPLETED' }); } catch (err: any) { alert(err?.message || 'Failed to complete.'); } finally { setActionLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this request? This action cannot be undone.')) return;
    try { await deleteRequest(id); } catch (err: any) { alert(err?.message || 'Failed to delete.'); }
  };

  const handleExportCsv = () => {
    exportToCsv(filteredRequests, 'client-requests', [
      { key: 'title', header: 'Title' }, { key: 'module_type', header: 'Module' },
      { key: 'client_name', header: 'Client' }, { key: 'status', header: 'Status' },
      { key: 'created_at', header: 'Submitted' },
    ]);
  };

  const handleRefresh = async () => { setActionLoading(true); try { await refresh(); } catch (err) { console.error(err); } finally { setActionLoading(false); } };

  const resetForm = () => { setReqModule('transport'); setReqTitle(''); setReqDescription(''); setReqClientName(''); setReqClientEmail(''); };

  const requestColumns = [
    { key: 'title', header: 'Title' }, { key: 'module_type', header: 'Module' },
    { key: 'client_name', header: 'Client' }, { key: 'status', header: 'Status' },
    { key: 'created_at', header: 'Submitted' },
  ];

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">{t('portal.title', 'Client Portal')}</h2>
          <p className="mt-1 text-sm text-slate-500 font-sans">{t('portal.subtitle', 'Submit and track service requests. Back-office: review, approve, and manage.')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleRefresh} className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0" title="Refresh requests"><RotateCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} /></button>
          <button type="button" onClick={handleExportCsv} disabled={loading || requests.length === 0} className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0" title="Export to CSV"><Download className="w-4 h-4" /></button>
          <button onClick={() => { resetForm(); setActionError(null); setShowCreateModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shrink-0 font-sans"><Plus className="w-4 h-4" />{t('portal.newRequest', 'New Request')}</button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 font-sans">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center shrink-0"><Send className="w-6 h-6" /></div>
          <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">{t('portal.totalRequests', 'Total Requests')}</p>{loading ? <div className="animate-pulse bg-slate-200 rounded h-8 w-12" /> : <span className="text-2xl font-bold text-slate-900">{totalCount}</span>}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0"><Clock className="w-6 h-6" /></div>
          <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">{t('portal.filterByStatus', 'Filter by Status')}</p><span className="text-lg font-bold text-slate-700">{t('portal.useFiltersHint', 'Use the tabs above to filter by status')}</span></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0"><Flag className="w-6 h-6" /></div>
          <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">{t('portal.modulesAvailable', 'Modules Available')}</p><span className="text-lg font-bold text-slate-700">7</span></div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[450px]">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md border transition-colors ${statusFilter === tab.value ? `${tab.color} bg-white` : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                {t(`portal.status.${tab.value.toLowerCase()}`, tab.label)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value as ClientRequestModuleType | 'ALL')} className="pl-7 pr-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-600 font-sans">
                {MODULE_TYPES.map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}
              </select>
            </div>
            <div className="relative max-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input type="text" placeholder={t('portal.searchPlaceholder', 'Search...')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans w-full bg-white" />
            </div>
          </div>
        </div>

        {/* Request Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap font-sans">
            <thead className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-mono">
              <tr>
                <th className="px-6 py-4 font-bold">{t('portal.tableHeaders.title', 'Title')}</th>
                <th className="px-6 py-4 font-bold">{t('portal.tableHeaders.module', 'Module')}</th>
                <th className="px-6 py-4 font-bold">{t('portal.tableHeaders.client', 'Client')}</th>
                <th className="px-6 py-4 font-bold">{t('portal.tableHeaders.submitted', 'Submitted')}</th>
                <th className="px-6 py-4 font-bold text-center">{t('portal.tableHeaders.status', 'Status')}</th>
                <th className="px-6 py-4 font-bold text-center">{t('portal.tableHeaders.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {loading && (<tr><td colSpan={6} className="p-0"><SkeletonTable rows={5} cols={6} /></td></tr>)}
              {!loading && filteredRequests.length === 0 && (<tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">{t('portal.noRequests', 'No requests found matching the current filters.')}</td></tr>)}
              {!loading && filteredRequests.map((req) => {
                const moduleDef = MODULE_TYPES.find(m => m.value === req.module_type);
                return (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div><span className="font-bold text-slate-900">{req.title}</span></div>
                      {req.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{req.description}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[9px] font-bold rounded-lg uppercase tracking-wider border ${moduleDef?.color || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {moduleDef?.label || req.module_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">{req.client_name || '—'}</span>
                      {req.client_email && <p className="text-xs text-slate-400">{req.client_email}</p>}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                      {new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-[9px] font-bold rounded-lg uppercase tracking-wider ${STATUS_BADGE[req.status] || 'bg-slate-50 text-slate-500'}`}>
                        {t(`portal.statusLabel.${req.status.toLowerCase()}`, req.status.replace('_', ' '))}
                      </span>
                      {req.rejection_reason && (
                        <p className="text-[10px] text-red-400 mt-1 italic max-w-[150px] truncate" title={req.rejection_reason}>{req.rejection_reason}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {isBackOffice && req.status === 'PENDING' && (
                          <>
                            <button type="button" onClick={() => handleApprove(req.id)} disabled={actionLoading} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Approve"><CheckCircle2 className="w-4 h-4" /></button>
                            <button type="button" onClick={() => setRejectionModal({ id: req.id, reason: '' })} disabled={actionLoading} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Reject"><XCircle className="w-4 h-4" /></button>
                          </>
                        )}
                        {isBackOffice && req.status === 'APPROVED' && (
                          <button type="button" onClick={() => handleStartProgress(req.id)} disabled={actionLoading} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Start Progress"><Play className="w-4 h-4" /></button>
                        )}
                        {isBackOffice && req.status === 'IN_PROGRESS' && (
                          <button type="button" onClick={() => handleComplete(req.id)} disabled={actionLoading} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Mark Complete"><Flag className="w-4 h-4" /></button>
                        )}
                        {isBackOffice && (req.status === 'REJECTED' || req.status === 'COMPLETED') && (
                          <button type="button" onClick={() => handleDelete(req.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete"><X className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && filteredRequests.length > 0 && (<Pagination page={page} pageSize={10} totalCount={totalCount} onPageChange={goToPage} />)}
        </div>
      </div>

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{t('portal.createRequest', 'New Service Request')}</h3>
              <button onClick={() => { setShowCreateModal(false); setActionError(null); }} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {actionError && (<div className="p-3 bg-red-50 text-red-600 rounded text-xs leading-relaxed font-semibold">{actionError}</div>)}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('portal.module', 'Module / Service Type')}</label>
                <select value={reqModule} onChange={(e) => setReqModule(e.target.value as ClientRequestModuleType)} className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  {MODULE_TYPES.filter(m => m.value !== 'ALL').map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('portal.requestTitle', 'Request Title')}</label>
                <input type="text" value={reqTitle} onChange={(e) => setReqTitle(e.target.value)} placeholder={t('portal.titlePlaceholder', 'e.g. Airport transfer for 5 delegates')} className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('portal.description', 'Description')}</label>
                <textarea value={reqDescription} onChange={(e) => setReqDescription(e.target.value)} placeholder={t('portal.descriptionPlaceholder', 'Detailed requirements, dates, quantities...')} rows={3} className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('portal.clientName', 'Client Name')}</label>
                  <input type="text" value={reqClientName} onChange={(e) => setReqClientName(e.target.value)} placeholder={t('portal.clientNamePlaceholder', 'e.g. Team France')} className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('portal.clientEmail', 'Client Email')}</label>
                  <input type="email" value={reqClientEmail} onChange={(e) => setReqClientEmail(e.target.value)} placeholder={t('portal.emailPlaceholder', 'contact@team.fr')} className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => { setShowCreateModal(false); setActionError(null); }} className="px-4 py-2 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider">{t('common.cancel', 'Cancel')}</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold uppercase tracking-wider disabled:bg-indigo-400 flex items-center gap-2"><Send className="w-3.5 h-3.5" />{actionLoading ? t('common.saving', 'Submitting...') : t('portal.submit', 'Submit Request')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{t('portal.rejectTitle', 'Reject Request')}</h3>
              <button onClick={() => setRejectionModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('portal.rejectionReason', 'Reason for Rejection')}</label>
                <textarea value={rejectionModal.reason} onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })} placeholder={t('portal.rejectionPlaceholder', 'Explain why this request cannot be fulfilled...')} rows={3} className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setRejectionModal(null)} className="px-4 py-2 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider">{t('common.cancel', 'Cancel')}</button>
                <button type="button" onClick={handleReject} disabled={actionLoading} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold uppercase tracking-wider disabled:bg-red-400">{actionLoading ? t('common.saving', 'Rejecting...') : t('portal.confirmReject', 'Confirm Rejection')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
