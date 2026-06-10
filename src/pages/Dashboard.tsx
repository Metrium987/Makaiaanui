import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useActivityLogs, useTransportShifts, useAccommodationRooms, useDeliveries } from '../hooks/useApi';
import { useAppStore } from '../store/appStore';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { SkeletonCard, SkeletonList } from '../components/Skeleton';
import { Car, BedDouble, Coffee, Ticket, BadgeCheck, Package, Shirt, WashingMachine, PlusCircle, Send, ArrowRight, Users } from 'lucide-react';

const MEMBER_MODULES = [
  { name: 'common.transport', href: '/app/transport', icon: Car, descKey: 'dashboard.member.transportDesc' },
  { name: 'common.accommodation', href: '/app/accommodation', icon: BedDouble, descKey: 'dashboard.member.accommodationDesc' },
  { name: 'common.catering', href: '/app/catering', icon: Coffee, descKey: 'dashboard.member.cateringDesc' },
  { name: 'common.hospitalities', href: '/app/hospitalities', icon: Ticket, descKey: 'dashboard.member.hospitalitiesDesc' },
  { name: 'common.accreditations', href: '/app/accreditations', icon: BadgeCheck, descKey: 'dashboard.member.accreditationsDesc' },
  { name: 'common.deliveries', href: '/app/deliveries', icon: Package, descKey: 'dashboard.member.deliveriesDesc' },
  { name: 'Laverie', href: '/app/laverie', icon: WashingMachine, descKey: 'dashboard.member.laundryDesc' },
  { name: 'common.uniforms', href: '/app/uniforms', icon: Shirt, descKey: 'dashboard.member.uniformsDesc' },
  { name: 'Services Add.', href: '/app/services-additionnels', icon: PlusCircle, descKey: 'dashboard.member.servicesDesc' },
];

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const role = useAppStore(s => s.role);
  const { logs, loading: logsLoading } = useActivityLogs();
  const { shifts, loading: shiftsLoading } = useTransportShifts();
  const { rooms, loading: roomsLoading } = useAccommodationRooms();
  const { deliveries, loading: deliveriesLoading } = useDeliveries();

  const isGroupScoped = role === 'MEMBER' || role === 'MANAGER';
  const groupId = useAppStore(s => s.groupId);
  const [groupName, setGroupName] = useState<string>('');
  
  useEffect(() => {
    if (isGroupScoped && groupId) {
      supabase.from('groups').select('name').eq('id', groupId).single()
        .then(({ data }) => { if (data) setGroupName(data.name); });
    }
  }, [isGroupScoped, groupId]);
  
  const appName = import.meta.env.VITE_APP_NAME || 'Makaiaanui';

  // ── MEMBER / MANAGER Dashboard ─────────────────────────────────
  if (isGroupScoped) {
    return (
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
            {t('dashboard.member.title', 'Catalogue & Commandes')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {groupName ? (
              <>
                {t('dashboard.member.yourGroup', 'Votre groupe :')}{' '}
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-semibold text-xs">
                  <Users className="w-3 h-3" />
                  {groupName}
                </span>
              </>
            ) : (
              t('dashboard.member.subtitle', 'Parcourez les services disponibles et soumettez vos demandes.')
            )}
          </p>
        </div>

        {/* Quick action — Portal */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 sm:p-8 shadow-lg shadow-indigo-200/50 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">{t('dashboard.member.portalCta', 'Une demande spécifique ?')}</h3>
              <p className="text-sm text-indigo-100 mt-1 max-w-md">
                {t('dashboard.member.portalDesc', 'Soumettez une demande personnalisée via le portail client. Suivi en temps réel.')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/app/portal')}
              className="inline-flex items-center gap-2 bg-white text-indigo-700 px-5 py-3 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors shadow-sm shrink-0"
            >
              <Send className="w-4 h-4" />
              {t('dashboard.member.goPortal', 'Accéder au portail')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Module cards grid */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            {t('dashboard.member.modulesTitle', 'Services disponibles')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MEMBER_MODULES.map((mod) => (
              <button
                key={mod.href}
                type="button"
                onClick={() => navigate(mod.href)}
                className="group bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left flex items-start gap-4"
              >
                <div className="w-10 h-10 bg-slate-50 group-hover:bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 transition-colors">
                  <mod.icon className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-slate-900 block truncate">{t(mod.name)}</span>
                  {t(mod.descKey, '') && (
                    <span className="text-xs text-slate-400 mt-0.5 block line-clamp-2">
                      {t(mod.descKey, '')}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── ADMIN / BACK_OFFICE Dashboard (original) ─────────────────

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
