import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/appStore';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { 
  LayoutDashboard, 
  Car, 
  BedDouble, 
  Users, 
  Coffee,
  Ticket,
  BadgeCheck,
  Package,
  Shirt,
  Settings, 
  ChevronLeft,
  WashingMachine,
  PlusCircle,
  ClipboardList,
  Send
} from 'lucide-react';

const navigation = [
  { name: 'common.dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'common.transport', href: '/app/transport', icon: Car },
  { name: 'common.accommodation', href: '/app/accommodation', icon: BedDouble },
  { name: 'common.catering', href: '/app/catering', icon: Coffee },
  { name: 'common.hospitalities', href: '/app/hospitalities', icon: Ticket },
  { name: 'common.accreditations', href: '/app/accreditations', icon: BadgeCheck },
  { name: 'common.deliveries', href: '/app/deliveries', icon: Package },
  { name: 'Laverie', href: '/app/laverie', icon: WashingMachine },
  { name: 'common.uniforms', href: '/app/uniforms', icon: Shirt },
  { name: 'Services Add.', href: '/app/services-additionnels', icon: PlusCircle },
  { name: 'common.crm', href: '/app/crm', icon: Users },
  { name: 'Audit Log', href: '/app/audit-log', icon: ClipboardList },
  { name: 'portal.sidebar', href: '/app/portal', icon: Send },
  { name: 'common.settings', href: '/app/settings', icon: Settings },
];

export function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { isSidebarOpen, toggleSidebar } = useAppStore();
  const { user } = useAuth();
  
  const appName = import.meta.env.VITE_APP_NAME || 'Playground';
  const orgName = user?.email?.split('@')[1] || 'Playground Org';

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-100 transition-all duration-300",
      isSidebarOpen ? "w-64" : "w-16"
    )}>
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 shrink-0">
        <div className={cn("flex items-center gap-3 overflow-hidden", !isSidebarOpen && "hidden")}>
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shrink-0">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          <span className="font-bold text-xl tracking-tight uppercase text-slate-900 truncate">{appName}</span>
        </div>
        <button onClick={toggleSidebar} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md ml-auto">
          <ChevronLeft className={cn("h-5 w-5 transition-transform", !isSidebarOpen && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-6 overflow-y-auto">
        {isSidebarOpen && <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 px-1">{t('sidebar.coreModules', 'Core Modules')}</h3>}
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          const isExactHome = item.href === '/app' && location.pathname !== '/app';
          const active = isExactHome ? false : isActive;
          
          return (
             <Link
              key={item.href}
              to={item.href}
              title={!isSidebarOpen ? t(item.name) : undefined}
              className={cn(
                "group flex items-center px-3 py-2 text-sm rounded-lg transition-colors overflow-hidden",
                active ? "bg-slate-50 text-indigo-700 font-semibold" : "text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("flex-shrink-0 h-5 w-5", isSidebarOpen ? "mr-3" : "mx-auto", active ? "text-indigo-600" : "")} />
              {isSidebarOpen && <span className="truncate">{t(item.name)}</span>}
            </Link>
          );
        })}
      </nav>

      {isSidebarOpen && (
        <div className="mt-auto border-t border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs">{orgName.slice(0, 2).toUpperCase()}</div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold text-slate-900 truncate">{orgName}</span>
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest truncate">{t('auth.adminRole', 'Admin')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
