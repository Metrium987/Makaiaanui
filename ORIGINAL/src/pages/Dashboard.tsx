import { useTranslation } from 'react-i18next';
import { useActivityLogs } from '../hooks/useApi';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { t } = useTranslation();
  const { logs, loading } = useActivityLogs();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">{t('dashboard.title')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('dashboard.subtitle')}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">System Status</p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900">All Systems Normal</span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500 italic">tahiti-2027-core</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full">OPERATIONAL</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Shifts</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-light text-slate-900">0</span>
            <span className="text-xs font-bold text-slate-400 tracking-tighter">DRIVERS / 0 SITES</span>
          </div>
          <div className="mt-3">
             <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full w-[0%] bg-indigo-500"></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Accommodation</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-light text-slate-900">0</span>
            <span className="text-xs font-bold text-slate-400 tracking-tighter">GUESTS / 0 HOTELS</span>
          </div>
          <div className="mt-3">
             <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
               <div className="h-full w-[0%] bg-emerald-500"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-sm uppercase tracking-wider text-slate-700">Recent Activity</h2>
          </div>
          <div className="flex-1 p-0 divide-y divide-slate-100 min-h-[200px]">
            {loading ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading activity...</div>
            ) : logs.length > 0 ? (
              logs.map((act) => (
                <div key={act.id} className="p-4 flex flex-col justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}
                  </span>
                  <span className="text-sm font-medium text-slate-900">{act.action}</span>
                  <span className="text-xs text-slate-500">{act.detail}</span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">No recent activity.</div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-sm uppercase tracking-wider text-slate-700">Upcoming Logistics</h2>
          </div>
          <div className="flex-1 p-0 divide-y divide-slate-100 min-h-[200px]">
            <div className="p-4 text-center text-sm text-slate-500">Logistics module needs database integration.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
