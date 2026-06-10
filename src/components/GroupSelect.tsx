import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore';

interface GroupSelectProps {
  value: string;
  onChange: (groupId: string) => void;
  disabled?: boolean;
  label?: string;
  required?: boolean;
}

export default function GroupSelect({ value, onChange, disabled, label, required }: GroupSelectProps) {
  const { t } = useTranslation();
  const role = useAppStore(s => s.role);
  const storeGroupId = useAppStore(s => s.groupId);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const isGroupScoped = role === 'MEMBER' || role === 'MANAGER';

  useEffect(() => {
    setLoading(true);
    supabase.from('groups').select('id, name').order('name')
      .then(({ data, error }) => {
        if (!error && data) setGroups(data);
        setLoading(false);
      });
  }, []);

  // Auto-select the user's group for MANAGER/MEMBER if no value set
  useEffect(() => {
    if (isGroupScoped && storeGroupId && !value) {
      onChange(storeGroupId);
    }
  }, [isGroupScoped, storeGroupId, value, onChange]);

  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
        {label || t('groupSelect.label', 'Group / Delegation')}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        required={required}
        className="block w-full text-sm border border-slate-200 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">
          {loading ? t('common.loading', 'Loading...') : t('groupSelect.placeholder', '-- Select a group --')}
        </option>
        {groups.map(g => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
    </div>
  );
}
