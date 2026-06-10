import React, { useState } from 'react';
import { Users, Shield, Mail, Trash2, Plus, RotateCw, X, Download, UserPlus, Crown, Eye, Settings } from 'lucide-react';
import { useProfiles } from '../hooks/useApi';
import { useAppStore } from '../store/appStore';
import { SkeletonTable } from '../components/Skeleton';
import Pagination from '../components/Pagination';
import { exportToCsv } from '../lib/exportCsv';
import type { AppRole } from '../types';

const ROLES: { value: AppRole; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'MEMBER', label: 'Member', icon: <Eye className="w-3.5 h-3.5" />, color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'FRONT_OFFICE', label: 'Front Office', icon: <Users className="w-3.5 h-3.5" />, color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { value: 'BACK_OFFICE', label: 'Back Office', icon: <Settings className="w-3.5 h-3.5" />, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  { value: 'ADMIN', label: 'Admin', icon: <Crown className="w-3.5 h-3.5" />, color: 'bg-amber-50 text-amber-600 border-amber-100' },
];

const ROLE_BADGE_STYLES: Record<AppRole, string> = {
  MEMBER: 'bg-slate-50 text-slate-600 border border-slate-200',
  FRONT_OFFICE: 'bg-blue-50 text-blue-600 border border-blue-100',
  BACK_OFFICE: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
  ADMIN: 'bg-amber-50 text-amber-600 border border-amber-100',
};

export default function UserManagement() {
  const { profiles, loading, error, refresh, updateRole, deleteProfile, inviteUser, page, totalCount, goToPage } = useProfiles();
  const currentUserRole = useAppStore(s => s.role);
  const currentUserId = useAppStore(s => s.session?.user?.id);

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('MEMBER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const isAdmin = currentUserRole === 'ADMIN';



  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    if (userId === currentUserId && newRole !== 'ADMIN') {
      if (!window.confirm('You are about to demote your own role. You will lose admin access. Continue?')) return;
    } else if (userId !== currentUserId) {
      if (!window.confirm(`Change this user's role to ${ROLES.find(r => r.value === newRole)?.label || newRole}?`)) return;
    }
    setActionLoading(true);
    try {
      await updateRole(userId, newRole);
    } catch (err: any) {
      alert(err?.message || 'Failed to update role.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (userId === currentUserId) {
      alert('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove ${email}? This action cannot be undone.`)) return;
    try {
      await deleteProfile(userId);
    } catch (err: any) {
      alert(err?.message || 'Failed to remove user.');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      setInviteError('Email is required.');
      return;
    }
    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(false);
    try {
      await inviteUser(inviteEmail, inviteRole);
      setInviteSuccess(true);
      setInviteEmail('');
      setInviteRole('MEMBER');
    } catch (err: any) {
      setInviteError(err?.message || 'Failed to invite user.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleExportCsv = () => {
    exportToCsv(profiles, 'users', [
      { key: 'email', header: 'Email' },
      { key: 'role', header: 'Role' },
      { key: 'created_at', header: 'Joined' },
    ]);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Users &amp; Tenancy</h2>
          <p className="mt-1 text-sm text-slate-500 font-sans">Manage platform users, role assignments, and organization membership.</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={handleRefresh}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0"
                title="Refresh user list"
              >
                <RotateCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={loading || profiles.length === 0}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0"
                title="Export to CSV"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setInviteEmail('');
                  setInviteRole('MEMBER');
                  setInviteError(null);
                  setInviteSuccess(false);
                  setShowInviteModal(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shrink-0 font-sans"
              >
                <UserPlus className="w-4 h-4" />
                Invite User
              </button>
            </>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0 font-sans">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Total Users</p>
            {loading ? <div className="animate-pulse bg-slate-200 rounded h-8 w-16" /> : <span className="text-2xl font-bold text-slate-900">{totalCount}</span>}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">Roles Available</p>
            <span className="text-sm font-semibold text-slate-700">Admin · Back Office · Front Office · Member</span>
          </div>
        </div>
      </div>

      {/* Non-admin fallback */}
      {!isAdmin && !loading && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">Access Restricted</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            User management is only available to administrators. Please contact your system admin if you need access.
          </p>
        </div>
      )}

      {/* User List Table */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[400px]">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <h2 className="font-bold text-sm uppercase tracking-wider text-slate-700">Organization Members</h2>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap font-sans">
              <thead className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-mono">
                <tr>
                  <th className="px-6 py-4 font-bold">Email</th>
                  <th className="px-6 py-4 font-bold text-center">Role</th>
                  <th className="px-6 py-4 font-bold">Joined</th>
                  <th className="px-6 py-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {loading && (
                  <tr>
                    <td colSpan={4} className="p-0">
                      <SkeletonTable rows={4} cols={4} />
                    </td>
                  </tr>
                )}
                {!loading && profiles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                      No users found in this organization.
                    </td>
                  </tr>
                )}
                {!loading && profiles.map((profile) => {
                  const roleDef = ROLES.find(r => r.value === profile.role) || ROLES[0];
                  const isSelf = profile.id === currentUserId;
                  return (
                    <tr key={profile.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              {profile.email}
                              {isSelf && (
                                <span className="text-[9px] font-bold bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded uppercase tracking-wider">You</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <select
                          value={profile.role}
                          onChange={(e) => handleRoleChange(profile.id, e.target.value as AppRole)}
                          disabled={actionLoading || (isSelf && profile.role === 'ADMIN')}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg uppercase tracking-wider border cursor-pointer appearance-none text-center ${ROLE_BADGE_STYLES[profile.role]}`}
                          title={isSelf && profile.role === 'ADMIN' ? 'Cannot demote yourself from Admin' : 'Change user role'}
                        >
                          {ROLES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                        {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(profile.id, profile.email)}
                          disabled={isSelf}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={isSelf ? 'Cannot remove yourself' : `Remove ${profile.email}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && profiles.length > 0 && (<Pagination page={page} pageSize={10} totalCount={totalCount} onPageChange={goToPage} />)}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm font-medium">
          Failed to load users: {error.message}
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                Invite New User
              </h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteSuccess(false);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              {inviteError && (
                <div className="p-3 bg-red-50 text-red-600 rounded text-xs leading-relaxed font-semibold">
                  {inviteError}
                </div>
              )}
              {inviteSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded text-xs leading-relaxed font-semibold">
                  User invited successfully! They will receive a password setup email shortly.
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. new.user@example.com"
                  className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                  disabled={inviteLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assign Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setInviteRole(r.value)}
                      disabled={inviteLoading}
                      className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg text-xs font-bold transition-all ${
                        inviteRole === r.value
                          ? `${r.color} shadow-sm ring-1 ring-offset-1 ring-indigo-500`
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {r.icon}
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteSuccess(false);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold uppercase tracking-wider disabled:bg-indigo-400 flex items-center gap-2"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {inviteLoading ? 'Sending...' : inviteSuccess ? 'Invite Another' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
