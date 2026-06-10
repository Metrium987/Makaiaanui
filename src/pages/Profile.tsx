import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserCircle, Shield, Send, Users, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { supabase } from '../lib/supabase';
import { useClientRequests } from '../hooks/useApi';

export default function Profile() {
  const { t } = useTranslation();
  const { session, role, groupId, fetchProfile } = useAppStore();
  const isMember = role === 'MEMBER';
  const isManager = role === 'MANAGER';
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;
  const userName = session?.user?.user_metadata?.full_name || userEmail;

  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [currentGroupName, setCurrentGroupName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change request
  const { addRequest } = useClientRequests();
  const [changeReason, setChangeReason] = useState('');
  const [showChangeRequest, setShowChangeRequest] = useState(false);
  const [changeSaving, setChangeSaving] = useState(false);
  const [changeMessage, setChangeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load groups and current group name
  useEffect(() => {
    supabase.from('groups').select('id, name').order('name')
      .then(({ data }) => { if (data) setGroups(data); });

    if (groupId) {
      supabase.from('groups').select('name').eq('id', groupId).single()
        .then(({ data }) => { if (data) setCurrentGroupName(data.name); });
    }
  }, [groupId]);

  const handleSetGroup = async () => {
    if (!selectedGroupId || !userId) return;
    setSaving(true); setMessage(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ group_id: selectedGroupId })
        .eq('id', userId);
      if (error) throw error;
      setMessage({ type: 'success', text: t('profile.groupSetSuccess', 'Groupe défini avec succès !') });
      await fetchProfile(userId);
      const g = groups.find(g => g.id === selectedGroupId);
      if (g) setCurrentGroupName(g.name);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Erreur lors de la définition du groupe.' });
    } finally { setSaving(false); }
  };

  const handleChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeReason) { setChangeMessage({ type: 'error', text: 'Veuillez indiquer la raison du changement.' }); return; }
    setChangeSaving(true); setChangeMessage(null);
    try {
      await addRequest({
        module_type: 'transport',
        title: `Changement de groupe : ${currentGroupName || 'Actuel'} → ${groups.find(g => g.id === selectedGroupId)?.name || 'Nouveau'}`,
        description: `Demande de changement de groupe.\nRaison : ${changeReason}\nGroupe actuel : ${currentGroupName || 'Non défini'}\nNouveau groupe : ${groups.find(g => g.id === selectedGroupId)?.name || ''}`,
        client_name: userName || '',
        client_email: userEmail || '',
        details: { type: 'group_change', current_group_id: groupId, requested_group_id: selectedGroupId }
      });
      setChangeMessage({ type: 'success', text: t('profile.changeRequestSent', 'Demande de changement envoyée à l\'administration.') });
      setShowChangeRequest(false); setChangeReason('');
    } catch (err: any) {
      setChangeMessage({ type: 'error', text: err?.message || 'Erreur lors de l\'envoi de la demande.' });
    } finally { setChangeSaving(false); }
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
          {t('profile.title', 'Mon Profil')}
        </h2>
        <p className="mt-1 text-sm text-slate-500 font-sans">
          {t('profile.subtitle', 'Gérez vos informations et votre groupe.')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations personnelles */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3">
                <UserCircle className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-900">{userName || 'Utilisateur'}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{userEmail}</p>
              <span className="mt-3 px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-widest rounded-full">
                {role === 'MANAGER' ? t('roles.manager', 'Manager') : t('roles.member', 'Member')}
              </span>
              {currentGroupName && (
                <span className="mt-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {currentGroupName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Gestion du groupe */}
        <div className="lg:col-span-2 space-y-6">
          {/* Si pas de groupe — choix unique */}
          {!groupId && isMember && (
            <div className="bg-white rounded-xl border-2 border-amber-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {t('profile.chooseGroup', 'Choisissez votre groupe / délégation')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('profile.chooseGroupDesc', 'Cette sélection est définitive. Contactez l\'administration pour tout changement.')}
                  </p>
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded text-xs font-semibold mb-4 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {message.text}
                </div>
              )}

              <div className="flex gap-3">
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">{t('profile.selectGroup', '-- Sélectionnez votre groupe --')}</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleSetGroup}
                  disabled={!selectedGroupId || saving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider disabled:bg-indigo-400 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {t('profile.confirm', 'Confirmer')}
                </button>
              </div>
            </div>
          )}

          {/* Si groupe déjà défini — affichage + demande de changement */}
          {groupId && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wider mb-4">
                {t('profile.currentGroup', 'Mon groupe actuel')}
              </h3>
              <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <Users className="w-6 h-6 text-indigo-600" />
                <div>
                  <span className="font-bold text-slate-900">{currentGroupName || 'Chargement...'}</span>
                  <p className="text-xs text-slate-500">{t('profile.groupInfo', 'Groupe / Délégation')}</p>
                </div>
              </div>

              <div className="mt-4">
                {!showChangeRequest ? (
                  <button
                    type="button"
                    onClick={() => setShowChangeRequest(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {t('profile.requestChange', 'Demander un changement de groupe')}
                  </button>
                ) : (
                  <form onSubmit={handleChangeRequest} className="space-y-3 mt-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-semibold text-slate-600">
                      {t('profile.changeInfo', 'Votre demande sera examinée par l\'administration.')}
                    </p>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        {t('profile.newGroup', 'Nouveau groupe souhaité')}
                      </label>
                      <select
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">{t('profile.selectGroup', '-- Sélectionnez --')}</option>
                        {groups.filter(g => g.id !== groupId).map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        {t('profile.reason', 'Raison du changement')}
                      </label>
                      <textarea
                        value={changeReason}
                        onChange={(e) => setChangeReason(e.target.value)}
                        rows={2}
                        placeholder={t('profile.reasonPlaceholder', 'Expliquez pourquoi vous souhaitez changer de groupe...')}
                        className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                        required
                      />
                    </div>
                    {changeMessage && (
                      <div className={`p-2 rounded text-xs font-semibold ${changeMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        {changeMessage.text}
                      </div>
                    )}
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => { setShowChangeRequest(false); setChangeMessage(null); }}
                        className="px-3 py-1.5 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider"
                      >
                        {t('common.cancel', 'Annuler')}
                      </button>
                      <button
                        type="submit"
                        disabled={!selectedGroupId || !changeReason || changeSaving}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold uppercase tracking-wider disabled:bg-indigo-400 flex items-center gap-1"
                      >
                        {changeSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        {t('profile.sendRequest', 'Envoyer la demande')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Rôle et permissions */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wider mb-4">
              {t('profile.permissions', 'Mes permissions')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-slate-400" />
                <div>
                  <span className="text-sm font-medium text-slate-900">
                    {role === 'MANAGER' ? t('profile.managerAccess', 'Accès gestionnaire de groupe') : t('profile.memberAccess', 'Accès membre')}
                  </span>
                  <p className="text-xs text-slate-500">
                    {role === 'MANAGER'
                      ? t('profile.managerDesc', 'Vous pouvez gérer les données de votre groupe et signaler des membres.')
                      : t('profile.memberDesc', 'Vous pouvez consulter les données de votre groupe et soumettre des demandes.')
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
