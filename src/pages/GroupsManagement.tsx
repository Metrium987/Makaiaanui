import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flag, Users, Plus, Trash2, Edit2, RotateCw, X, Search, Download, Globe } from 'lucide-react';
import { useGroups } from '../hooks/useApi';
import { SkeletonTable } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { exportToCsv } from '../lib/exportCsv';

export default function GroupsManagement() {
  const { t } = useTranslation();
  const { groups, loading, error, refresh, addGroup, updateGroup, deleteGroup, page, totalCount, goToPage } = useGroups();
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string } | null>(null);
  const [groupName, setGroupName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredGroups = groups.filter(g =>
    g.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMembers = groups.reduce((sum, g) => sum + (g.member_count || 0), 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) { setActionError('Group name is required.'); return; }
    setActionLoading(true); setActionError(null);
    try {
      await addGroup(groupName.trim());
      setGroupName(''); setShowAddModal(false);
    } catch (err: any) { setActionError(err?.message || 'Failed to create group.'); }
    finally { setActionLoading(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !groupName.trim()) { setActionError('Group name is required.'); return; }
    setActionLoading(true); setActionError(null);
    try {
      await updateGroup(editingGroup.id, groupName.trim());
      setEditingGroup(null); setGroupName('');
    } catch (err: any) { setActionError(err?.message || 'Failed to update group.'); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (id: string, name: string, memberCount: number) => {
    const msg = memberCount > 0
      ? `Delete "${name}"? ${memberCount} member(s) will lose their group association.`
      : `Delete "${name}"? This action cannot be undone.`;
    if (!window.confirm(msg)) return;
    setActionLoading(true);
    try { await deleteGroup(id); } catch (err: any) { alert(err?.message || 'Failed to delete group.'); }
    finally { setActionLoading(false); }
  };

  const handleEditClick = (g: any) => {
    setEditingGroup(g); setGroupName(g.name); setActionError(null);
  };

  const handleRefresh = async () => {
    setActionLoading(true);
    try { await refresh(); } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  const handleExportCsv = () => {
    exportToCsv(groups, 'groups', [
      { key: 'name', header: 'Group Name' },
      { key: 'member_count', header: 'Members' },
      { key: 'created_at', header: 'Created' },
    ]);
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">{t('groups.title', 'Groupes & Délégations')}</h2>
          <p className="mt-1 text-sm text-slate-500 font-sans">{t('groups.subtitle', 'Gérez les groupes et délégations participants.')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleRefresh} className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0" title="Refresh groups">
            <RotateCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={handleExportCsv} disabled={loading || groups.length === 0} className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0" title="Export to CSV">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => { setGroupName(''); setActionError(null); setShowAddModal(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shrink-0 font-sans"
          >
            <Plus className="w-4 h-4" />{t('groups.addGroup', 'Add Group')}
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0 font-sans">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Flag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">{t('groups.totalGroups', 'Total Groups')}</p>
            {loading ? <div className="animate-pulse bg-slate-200 rounded h-8 w-16" /> : <span className="text-2xl font-bold text-slate-900">{totalCount}</span>}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">{t('groups.totalMembers', 'Total Members')}</p>
            {loading ? <div className="animate-pulse bg-slate-200 rounded h-8 w-16" /> : <span className="text-2xl font-bold text-slate-900">{totalMembers}</span>}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">{t('groups.avgMembers', 'Avg Members/Group')}</p>
            {loading ? <div className="animate-pulse bg-slate-200 rounded h-8 w-16" /> : <span className="text-2xl font-bold text-slate-900">{groups.length > 0 ? Math.round(totalMembers / groups.length) : 0}</span>}
          </div>
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <h2 className="font-bold text-sm uppercase tracking-wider text-slate-700">{t('groups.listTitle', 'Groupes')}</h2>
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input type="text" placeholder={t('groups.searchPlaceholder', 'Search groups...')} value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-md text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans bg-white" />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap font-sans">
            <thead className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-mono">
              <tr>
                <th className="px-6 py-4 font-bold">{t('groups.tableHeaders.name', 'Group Name')}</th>
                <th className="px-6 py-4 font-bold text-center">{t('groups.tableHeaders.members', 'Members')}</th>
                <th className="px-6 py-4 font-bold">{t('groups.tableHeaders.created', 'Created')}</th>
                <th className="px-6 py-4 font-bold text-center">{t('groups.tableHeaders.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {loading && (
                <tr><td colSpan={4} className="p-0"><SkeletonTable rows={5} cols={4} /></td></tr>
              )}
              {!loading && filteredGroups.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">{t('groups.noGroups', 'No groups found.')}</td></tr>
              )}
              {!loading && filteredGroups.map((g, i) => (
                <tr key={g.id || i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                        <Flag className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{g.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg ${
                      g.member_count > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'
                    }`}>
                      <Users className="w-3 h-3" />
                      {g.member_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                    {g.created_at ? new Date(g.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button type="button" onClick={() => handleEditClick(g)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit group">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleDelete(g.id, g.name, g.member_count)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Delete group">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filteredGroups.length > 0 && (
            <Pagination page={page} pageSize={10} totalCount={totalCount} onPageChange={goToPage} />
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm font-medium">
          {t('groups.error', 'Failed to load groups')}: {error.message}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showAddModal || editingGroup) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                {editingGroup ? t('groups.editGroup', 'Edit Group') : t('groups.addGroup', 'Add Group')}
              </h3>
              <button onClick={() => { setShowAddModal(false); setEditingGroup(null); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={editingGroup ? handleUpdate : handleCreate} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-red-50 text-red-600 rounded text-xs leading-relaxed font-semibold">{actionError}</div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('groups.groupNameLabel', 'Group / Delegation Name')}</label>
                <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. France, Japan, Brazil..."
                  className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required autoFocus />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => { setShowAddModal(false); setEditingGroup(null); }}
                  className="px-4 py-2 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider">
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold uppercase tracking-wider disabled:bg-indigo-400 flex items-center gap-2">
                  <Flag className="w-3.5 h-3.5" />
                  {actionLoading ? t('common.saving', 'Saving...') : editingGroup ? t('common.saveChanges', 'Save Changes') : t('groups.createGroup', 'Create Group')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
