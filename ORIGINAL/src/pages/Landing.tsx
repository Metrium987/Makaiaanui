import { Link } from 'react-router-dom';
import { ArrowRight, Globe, Layers, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Landing() {
  const { t } = useTranslation();
  const appName = import.meta.env.VITE_APP_NAME || 'Makaiaanui';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      <nav className="h-20 px-4 sm:px-8 flex items-center justify-between border-b border-slate-200/50 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          <span className="font-bold text-xl tracking-tight uppercase">{appName}</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors hidden sm:block">{t('landing.nav.modules', 'Modules')}</span>
          <span className="text-sm font-semibold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors hidden sm:block">{t('landing.nav.infrastructure', 'Infrastructure')}</span>
          <Link to="/login" className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide hover:bg-slate-800 transition-all shadow-md hover:shadow-xl shrink-0">
            {t('landing.nav.portal', 'Client Portal')}
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center pt-20 md:pt-32 pb-20 px-4">
        <div className="max-w-4xl w-full text-center space-y-6 md:space-y-8 animate-fade-in-up">
          <span className="inline-block py-1.5 px-3 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-4">
            {t('landing.hero.badge', 'Event Logistics System v4.0')}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-slate-900 leading-tight">
            {t('landing.hero.title1', 'Orchestrate your')} <br aria-hidden="true" className="hidden sm:block" />
            <span className="text-indigo-600">{t('landing.hero.title2', 'Global Operations.')}</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            {t('landing.hero.subtitle', 'The centralized operational system for large-scale sports events. Dispatch fleets, manage accommodations, and secure zero-latency logistics.')}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl text-sm font-bold tracking-wide hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
              {t('landing.hero.cta', 'Access Platform')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 md:mt-32">
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6">
              <Layers className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t('landing.features.1.title', 'Modular Architecture')}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{t('landing.features.1.desc', 'Transport, Accommodation, Catering—deploy only the modules your event requires.')}</p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:pt-12 md:-mt-4 relative z-10 shadow-xl shadow-slate-200/50 border-t-indigo-600 border-t-4 transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t('landing.features.2.title', 'Enterprise Security')}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{t('landing.features.2.desc', 'Multi-tenant RBAC, strict data isolation via Supabase, and real-time operational logging.')}</p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm transition-transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{t('landing.features.3.title', 'Global Edge Delivery')}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{t('landing.features.3.desc', 'Deployed on Vercel Edge networks for sub-millisecond payload delivery to field operators.')}</p>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-slate-200 bg-white py-12 text-center text-slate-500 text-sm">
        <p className="font-medium">{appName} © {new Date().getFullYear()}. By Playground.</p>
        <p className="text-[10px] mt-2 uppercase tracking-widest text-slate-400 font-bold">{t('landing.footer.tagline', 'Event & Sport Solutions')}</p>
      </footer>
    </div>
  );
}
