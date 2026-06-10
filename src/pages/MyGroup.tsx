import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, ShieldAlert, Flag, Send, UserX, UserCheck, Loader2, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { supabase } from '../lib/supabase';
import { useClientRequests } from '../hooks/useApi';

export default function MyGroup() {
  const { t } = useTranslation();
  const { groupId, session } = useAppStore();
  const userId = session?.user?.id;

  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Signal modal
  const [signalModal, setSignalModal] = useState<{ memberId: string; memberName: string; reason: string } | null>(null);
  const [signaling, setSignaling] = useState(false);
  const [signalMessage, setSignalMessage] = useState<string | null>(null);

  const { addRequest } = useClientRequests();

  useEffect(() => {
    if (!groupId) { setLoading(false); return; }

    const loadData = async () => {
      setLoading(true);
      try {
        // Group name
        const { data: gData } = await supabase.from('groups').select('name').eq('id', groupId).single();
        if (gData) setGroupName(gData.name);

        // Members of the group
        const { data: mData } = await supabase
          .from('profiles')
          .select('id, email, role, created_at')
          .eq('group_id', groupId)
          .is('deleted_at', null)
          .order('created_at', { ascending: true });
        if (mData) setMembers(mData);

        // Portal requests for this group (by module_type or client_name)
        const { data: rData } = await supabase
          .from('client_requests')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(20);
        if (rData) {
          // Filter requests related to this group (either created by group members or mentioning the group)
          const memberIds = new Set((mData || []).map(m => m.id));
          const filtered = rData.filter(r => memberIds.has(r.created_by) || r.client_name?.toLowerCase().includes(groupName.toLowerCase()));
          setRequests(filtered);
        }
      } catch (err) {
        console.error('Failed to load group data:', err);
      } finally { setLoading(false); }
    };

    loadData();
  }, [groupId]);

  const handleSignal = async () => {
    if (!signalModal || !signalModal.reason || !userId) return;
    setSignaling(true); setSignalMessage(null);
    try {
      await addRequest({
        module_type: 'transport',
        title: `Signalement : ${signalModal.memberName}`,
        description: `Signalement d'un membre du groupe ${groupName}.\nMembre : ${signalModal.memberName} (${signalModal.memberId})\nRaison : ${signalModal.reason}\nSignalé par : ${userId}`,
        client_name: '',
        client_email: '',
        details: { type: 'member_report', reported_member_id: signalModal.memberId, reason: signalModal.reason, group_id: groupId }
      });
      setSignalMessage(t('myGroup.signalSent', 'Signalement envoyé à l\'administration.'));
      setSignalModal(null);
    } catch (err: any) {
      setSignalMessage(err?.message || 'Erreur lors de l\'envoi du signalement.');
    } finally { setSignaling(false); }
  };

  if (!groupId) {
    return (
      <div className="flex flex-col gap-6 h-full pb-8">
        <div><h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">{t('myGroup.title', 'Mon Groupe')}</h2></div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">{t('myGroup.noGroup', 'Vous n\'êtes pas encore associé à un groupe.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">{t('myGroup.title', 'Mon Groupe')}</h2>
        <p className="mt-1 text-sm text-slate-500 font-sans">
          {t('myGroup.subtitle', 'Gérez les membres et les demandes de votre groupe.')}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('myGroup.members', 'Membres')}</p>
            <span className="text-2xl font-bold text-slate-900">{loading ? '...' : members.length}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
            <Send className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('myGroup.requests', 'Demandes')}</p>
            <span className="text-2xl font-bold text-slate-900">{loading ? '...' : requests.length}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('myGroup.group', 'Groupe')}</p>
            <span className="text-lg font-bold text-slate-900 truncate block max-w-[150px]">{groupName}</span>
          </div>
        </div>
      </div>

      {signalMessage && (
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200">
          {signalMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members list */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700">
              {t('myGroup.membersList', 'Membres du groupe')}
            </h3>
          </div>
          <div className="divide-y divide-slate-100 flex-1 max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-slate-400">{t('common.loading', 'Chargement...')}</div>
            ) : members.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">{t('myGroup.noMembers', 'Aucun membre dans ce groupe.')}</div>
            ) : members.map((member, i) => (
              <div key={member.id || i} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-slate-600">
                      {(member.email || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-slate-900 truncate block">{member.email}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {member.role === 'MANAGER' ? t('roles.manager', 'Manager') : t('roles.member', 'Membre')}
                    </span>
                  </div>
                </div>
                {member.id !== userId && (
                  <button
                    type="button"
                    onClick={() => setSignalModal({ memberId: member.id, memberName: member.email, reason: '' })}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    title={t('myGroup.signalMember', 'Signaler ce membre')}
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent requests */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700">
              {t('myGroup.recentRequests', 'Demandes récentes')}
            </h3>
          </div>
          <div className="divide-y divide-slate-100 flex-1 max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-slate-400">{t('common.loading', 'Chargement...')}</div>
            ) : requests.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">{t('myGroup.noRequests', 'Aucune demande pour le moment.')}</div>
            ) : requests.map((req, i) => (
              <div key={req.id || i} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-semibold text-slate-900 truncate block">{req.title}</span>
                    <span className="text-xs text-slate-500 mt-0.5 block">{req.client_name || '—'}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase whitespace-nowrap ${
                    req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                    req.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
                    req.status === 'COMPLETED' ? 'bg-indigo-50 text-indigo-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {req.status === 'IN_PROGRESS' ? 'En cours' : req.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Signal Modal */}
      {signalModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                {t('myGroup.signalTitle', 'Signaler un membre')}
              </h3>
              <button onClick={() => setSignalModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="text-lg">×</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                {t('myGroup.signalInfo', 'Vous signalez')} : <strong>{signalModal.memberName}</strong>
              </p>
              <p className="text-xs text-slate-500">
                {t('myGroup.signalDesc', 'Ce signalement sera envoyé à l\'administration pour examen.')}
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t('myGroup.reason', 'Motif du signalement')}
                </label>
                <textarea
                  value={signalModal.reason}
                  onChange={(e) => setSignalModal({ ...signalModal, reason: e.target.value })}
                  rows={3}
                  placeholder={t('myGroup.reasonPlaceholder', 'Expliquez pourquoi ce membre ne devrait pas faire partie du groupe...')}
                  className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSignalModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider"
                >
                  {t('common.cancel', 'Annuler')}
                </button>
                <button
                  type="button"
                  onClick={handleSignal}
                  disabled={!signalModal.reason || signaling}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold uppercase tracking-wider disabled:bg-red-400 flex items-center gap-1"
                >
                  {signaling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flag className="w-3 h-3" />}
                  {t('myGroup.sendSignal', 'Envoyer le signalement')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
