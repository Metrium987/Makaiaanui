import { useTranslation } from 'react-i18next';
import { useActivityLogs, useTransportShifts, useAccommodationRooms, useDeliveries } from '../hooks/useApi';
import { formatDistanceToNow } from 'date-fns';
import { SkeletonCard, SkeletonList } from '../components/Skeleton';

export default function Dashboard() {
  const { t } = useTranslation();
  const { logs, loading: logsLoading } = useActivityLogs();
  const { shifts, loading: shiftsLoading } = useTransportShifts();
  const { rooms, loading: roomsLoading } = useAccommodationRooms();
  const { deliveries, loading: deliveriesLoading } = useDeliveries();

  const appName = import.meta.env.VITE_APP_NAME || 'Makaiaanui';
  const activeShifts = shifts.filter(s => s.status === 'ACTIVE').length;
  const uniqueDrivers = new Set(shifts.map(s => s.driver_name)).size;
  const pendingDeliveries = deliveries.filter(d => d.status === 'PENDING' || d.status === 'EN_ROUTE');

  const isLoading = shiftsLoading || roomsLoading || deliveriesLoading;
  const systemLoading = isLoading || logsLoading;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">{t('dashboard.title')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('dashboard.subtitle')}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('dashboard.systemStatus', 'System Status')}</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${systemLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></span>
                <span className="text-xl font-bold text-slate-900">{systemLoading ? t('dashboard.connecting', 'Connecting...') : t('dashboard.operational', 'All Systems Normal')}</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500 italic">{appName}</span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${systemLoading ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {systemLoading ? 'CONNECTING' : 'OPERATIONAL'}
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('dashboard.activeShifts', 'Active Shifts')}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-light text-slate-900">{shiftsLoading ? '...' : activeShifts}</span>
                <span className="text-xs font-bold text-slate-400 tracking-tighter">{t('dashboard.driversCount', { count: uniqueDrivers, defaultValue: '{{count}} DRIVER(S)' })}</span>
              </div>
              <div className="mt-3">
                 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${shifts.length > 0 ? Math.min(100, (activeShifts / shifts.length) * 100) : 0}%` }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('dashboard.accommodation', 'Accommodation')}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-light text-slate-900">{roomsLoading ? '...' : rooms.length}</span>
                <span className="text-xs font-bold text-slate-400 tracking-tighter">{t('dashboard.guestsCount', { count: rooms.length, defaultValue: '{{count}} GUEST(S)' })}</span>
              </div>
              <div className="mt-3">
                 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${rooms.length > 0 ? 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {logsLoading ? (
          <SkeletonList items={4} />
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-sm uppercase tracking-wider text-slate-700">{t('dashboard.recentActivity', 'Recent Activity')}</h2>
            </div>
            <div className="flex-1 p-0 divide-y divide-slate-100 min-h-[200px]">
              {logs.length > 0 ? (
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
                <div className="p-4 text-center text-sm text-slate-500">{t('dashboard.noActivity', 'No recent activity.')}</div>
              )}
            </div>
          </div>
        )}
        {deliveriesLoading ? (
          <SkeletonList items={3} />
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-sm uppercase tracking-wider text-slate-700">{t('dashboard.upcomingLogistics', 'Upcoming Logistics')}</h2>
              <span className="text-[10px] font-bold text-slate-400 font-mono">{deliveries.length} total</span>
            </div>
            <div className="flex-1 p-0 divide-y divide-slate-100 min-h-[200px] overflow-y-auto">
              {pendingDeliveries.length > 0 ? (
                pendingDeliveries.slice(0, 5).map((del) => (
                  <div key={del.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-slate-900 truncate block">{del.detail || 'No description'}</span>
                      <span className="text-xs text-slate-500">{del.site}</span>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase whitespace-nowrap ${
                      del.status === 'EN_ROUTE' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {del.status === 'EN_ROUTE' ? 'In Transit' : 'Pending'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">
                  {deliveries.length > 0 ? t('dashboard.noPending', 'All deliveries completed.') : t('dashboard.noDeliveries', 'No deliveries scheduled yet.')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
