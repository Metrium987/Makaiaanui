import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/appStore';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { Globe, LogOut } from 'lucide-react';

export function Header() {
  const { i18n, t } = useTranslation();
  const { isSidebarOpen, setLanguage } = useAppStore();
  const { signOut } = useAuth();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
    setLanguage(newLang);
  };

  return (
    <header className={cn(
      "fixed top-0 right-0 z-40 h-16 bg-white border-b border-slate-100 transition-all duration-300 flex items-center px-8 shrink-0",
      isSidebarOpen ? "left-64" : "left-16"
    )}>
      <div className="flex w-full h-full items-center justify-end gap-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-widest hidden sm:inline-block">{t('header.systemLive', 'System Live')}</span>
        </div>
        <div className="w-px h-6 bg-slate-200"></div>
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 text-[10px] font-bold text-slate-600 hover:text-indigo-600 bg-slate-50 px-3 py-1.5 rounded border border-slate-200 transition-colors uppercase"
        >
          <Globe className="h-4 w-4" />
          <span>{i18n.language}</span>
        </button>
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded border border-red-100 transition-colors uppercase"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{t('auth.signOut', 'Sign Out')}</span>
        </button>
      </div>
    </header>
  );
}
