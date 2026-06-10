import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { AppRole } from '../../types';
import { cn } from '../../lib/utils';import {
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
  Send,
  UserCircle,
  Building2,
  Flag
} from 'lucide-react';

const ALL_NAVIGATION = [
  { name: 'common.dashboard', href: '/app', icon: LayoutDashboard, roles: ['MEMBER', 'MANAGER', 'FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'] as AppRole[] },
  { name: 'common.myGroup', href: '/app/mon-groupe', icon: Building2, roles: ['MANAGER'] as AppRole[] },
  { name: 'common.profile', href: '/app/profil', icon: UserCircle, roles: ['MEMBER', 'MANAGER'] as AppRole[] },
  { name: 'common.transport', href: '/app/transport', icon: Car, roles: ['MEMBER', 'MANAGER', 'FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'] as AppRole[] },
  { name: 'common.accommodation', href: '/app/accommodation', icon: BedDouble, roles: ['MEMBER', 'MANAGER', 'FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'] as AppRole[] },
  { name: 'common.catering', href: '/app/catering', icon: Coffee, roles: ['MEMBER', 'MANAGER', 'FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'] as AppRole[] },
  { name: 'common.hospitalities', href: '/app/hospitalities', icon: Ticket, roles: ['MEMBER', 'MANAGER', 'FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'] as AppRole[] },
  { name: 'common.accreditations', href: '/app/accreditations', icon: BadgeCheck, roles: ['MEMBER', 'MANAGER', 'FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'] as AppRole[] },
  { name: 'common.deliveries', href: '/app/deliveries', icon: Package, roles: ['MEMBER', 'MANAGER', 'FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'] as AppRole[] },
  { name: 'Laverie', href: '/app/laverie', icon: WashingMachine, roles: ['MEMBER', 'MANAGER', 'FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'] as AppRole[] },
  { name: 'common.uniforms', href: '/app/uniforms', icon: Shirt, roles: ['MEMBER', 'MANAGER', 'FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'] as AppRole[] },
  { name: 'Services Add.', href: '/app/services-additionnels', icon: PlusCircle, roles: ['MEMBER', 'MANAGER', 'FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'] as AppRole[] },
  { name: 'common.crm', href: '/app/crm', icon: Users, roles: ['BACK_OFFICE', 'ADMIN'] as AppRole[] },
  { name: 'Audit Log', href: '/app/audit-log', icon: ClipboardList, roles: ['ADMIN'] as AppRole[] },
  { name: 'portal.sidebar', href: '/app/portal', icon: Send, roles: ['MEMBER', 'MANAGER', 'FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'] as AppRole[] },
  { name: 'common.settings', href: '/app/settings', icon: Settings, roles: ['ADMIN'] as AppRole[] },
  { name: 'User Management', href: '/app/users', icon: Users, roles: ['ADMIN'] as AppRole[] },
  { name: 'common.groups', href: '/app/groupes', icon: Flag, roles: ['BACK_OFFICE', 'ADMIN'] as AppRole[] },
];

export function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { isSidebarOpen, toggleSidebar, role, groupId } = useAppStore();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState<string>('');
  
  useEffect(() => {
    if ((role === 'MEMBER' || role === 'MANAGER') && groupId) {
      supabase.from('groups').select('name').eq('id', groupId).single()
        .then(({ data }) => { if (data) setGroupName(data.name); });
    }
  }, [role, groupId]);
  
  const appName = import.meta.env.VITE_APP_NAME || 'Playground';
  const orgName = user?.email?.split('@')[1] || 'Playground Org';
  
  const ROLE_LABELS: Record<AppRole, string> = {
    ADMIN: t('roles.admin', 'Admin'),
    MEMBER: t('roles.member', 'Member'),
    MANAGER: t('roles.manager', 'Manager'),
    BACK_OFFICE: t('roles.backOffice', 'Back Office'),
    FRONT_OFFICE: t('roles.frontOffice', 'Front Office'),
  };
  const roleLabel = role ? ROLE_LABELS[role] : t('roles.unknown', 'Unknown');
  const navigation = role
    ? ALL_NAVIGATION.filter(item => item.roles.includes(role))
    : [];

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
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest truncate">{roleLabel}</span>
              {groupName && (
                <span className="text-[10px] text-indigo-500 font-semibold truncate mt-0.5">{groupName}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
