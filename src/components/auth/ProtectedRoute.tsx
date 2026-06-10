import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAppStore } from '../../store/appStore';
import { useTranslation } from 'react-i18next';

// Routes restricted for FRONT_OFFICE users
const RESTRICTED_PATHS = ['/app/settings', '/app/crm'] as const;

export function ProtectedRoute() {
  const { user, loading: authLoading } = useAuth();
  const { role, isProfileLoading } = useAppStore();
  const { t } = useTranslation();
  const location = useLocation();

  if (authLoading || (user && !role && isProfileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
          </div>
          <span className="animate-pulse text-slate-400 font-bold text-[10px] tracking-widest uppercase">{t('auth.loading')}</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isRestrictedPath = RESTRICTED_PATHS.some(path => location.pathname.startsWith(path));

  if (isRestrictedPath && role === 'FRONT_OFFICE') {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
