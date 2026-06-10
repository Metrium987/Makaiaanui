import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Building2, PaintBucket, Users, Lock, ChevronRight, Check, Upload, Link2, AlertCircle, Zap } from 'lucide-react';

const DEFAULT_WORKSPACE_NAME = 'Pacific Games Tahiti 2027';
const DEFAULT_PRIMARY_COLOR = '#4F46E5';
const DEFAULT_PORTAL_DOMAIN = 'portal.tahiti2027.com';

type SettingsSection = 'brand' | 'users' | 'roles' | 'integrations';

export default function Settings() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<SettingsSection>('brand');
  const [workspaceName, setWorkspaceName] = useState(DEFAULT_WORKSPACE_NAME);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setLogoFile(file);
  };

  const handleDiscard = () => {
    setWorkspaceName(DEFAULT_WORKSPACE_NAME);
    setPrimaryColor(DEFAULT_PRIMARY_COLOR);
    setLogoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSaved(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  };

  const sections: { key: SettingsSection; icon: React.ReactNode; label: string; desc: string }[] = [
    { key: 'brand', icon: <Building2 className="w-5 h-5" />, label: 'Brand & White-label', desc: 'Workspace name, logo, colors' },
    { key: 'users', icon: <Users className="w-5 h-5" />, label: 'Users & Tenancy', desc: 'Manage platform users and roles' },
    { key: 'roles', icon: <Shield className="w-5 h-5" />, label: 'Roles & Permissions', desc: 'RBAC policies and access control' },
    { key: 'integrations', icon: <Key className="w-5 h-5" />, label: 'Integrations & API', desc: 'External services and API keys' },
  ];

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">System Settings</h2>
        <p className="mt-1 text-sm text-slate-500 font-sans">Configure workspace, whitelabeling, integrations, and RBAC policies.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-1">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => {
                if (s.key === 'users') navigate('/app/users');
                else setActiveSection(s.key);
              }}
              className={`flex items-center justify-between p-3.5 rounded-lg text-left transition-all group ${
                (s.key === 'users' ? false : activeSection === s.key)
                  ? 'bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold'
                  : 'text-slate-600 border border-transparent hover:bg-slate-50 hover:text-indigo-600 font-medium'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`${(s.key === 'users' ? false : activeSection === s.key) ? 'text-indigo-600' : 'text-slate-400'} shrink-0`}>{s.icon}</span>
                <div className="text-left min-w-0">
                  <p className="text-sm font-bold truncate">{s.label}</p>
                  <p className="text-[10px] font-normal opacity-60 truncate">{s.desc}</p>
                </div>
              </div>
              {s.key === 'users' ? (
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 shrink-0" />
              ) : (
                activeSection === s.key && <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {/* BRAND & WHITE-LABEL */}
          {activeSection === 'brand' && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-6">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <PaintBucket className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">White-label Configuration</h3>
                  <p className="text-xs text-slate-500 mt-1">Customize the platform appearance for the end-client portal.</p>
                </div>
              </div>

              <form className="space-y-8 max-w-2xl" onSubmit={handleSave}>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">Basic Info</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Workspace Name</label>
                      <input type="text" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none text-sm transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Client Portal Domain</label>
                      <input type="text" defaultValue={DEFAULT_PORTAL_DOMAIN} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-400 bg-slate-50 cursor-not-allowed" disabled />
                      <p className="text-[10px] text-slate-400 mt-1 font-sans">Domain locked. Contact your account manager to change.</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col divide-y divide-slate-100">
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700">Custom Logomark</label>
                      <p className="text-xs text-slate-500 mt-0.5">Upload a square SVG or PNG (min 128×128px).</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {logoFile && <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{logoFile.name}</span>}
                      <input ref={fileInputRef} type="file" accept="image/png,image/svg+xml" onChange={handleFileSelect} className="hidden" />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
                        <Upload className="w-3.5 h-3.5" />Choose File
                      </button>
                    </div>
                  </div>

                  <div className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700">Primary Color Hex</label>
                      <p className="text-xs text-slate-500 mt-0.5">Used for buttons, links, and active states.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg shadow-sm border border-slate-200 ring-2 ring-slate-100" style={{ backgroundColor: primaryColor }}></div>
                      <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-28 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none text-sm font-mono text-slate-700" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                  {saved && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg"><Check className="w-3.5 h-3.5" />Settings saved</span>
                  )}
                  <div className="flex gap-3 ml-auto">
                    <button type="button" onClick={handleDiscard} className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">Discard Changes</button>
                    <button type="submit" disabled={isSaving} className="bg-indigo-600 px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide text-white hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50">
                      <Lock className="w-4 h-4" />
                      {isSaving ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ROLES & PERMISSIONS */}
          {activeSection === 'roles' && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-6">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0"><Shield className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Roles & Permissions</h3>
                  <p className="text-xs text-slate-500 mt-1">Manage role-based access control for your organization.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { role: 'ADMIN', desc: 'Full system access — manage users, settings, and all modules', color: 'bg-purple-50 border-purple-200 text-purple-700' },
                    { role: 'BACK_OFFICE', desc: 'Manage all operational modules (transport, catering, laundry, etc.)', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
                    { role: 'FRONT_OFFICE', desc: 'View and manage client-facing modules (accreditations, deliveries)', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                    { role: 'MEMBER', desc: 'Read-only access to assigned modules and personal profile', color: 'bg-slate-50 border-slate-200 text-slate-700' },
                  ].map((r) => (
                    <div key={r.role} className={`p-4 rounded-xl border ${r.color}`}>
                      <p className="font-bold text-sm">{r.role}</p>
                      <p className="text-xs mt-1 opacity-75">{r.desc}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/app/users')} className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors mt-2">
                  Manage role assignments in Users & Tenancy <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* INTEGRATIONS & API */}
          {activeSection === 'integrations' && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-6">
                <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center shrink-0"><Zap className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Integrations & API Keys</h3>
                  <p className="text-xs text-slate-500 mt-1">Connect external services and manage API credentials.</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Supabase', status: 'Connected', desc: 'Database, Auth, and Storage backend', color: 'emerald' },
                  { name: 'Google OAuth', status: 'Available', desc: 'Social login provider — configure in Supabase Auth dashboard', color: 'amber' },
                  { name: 'Stripe Payments', status: 'Coming Soon', desc: 'Payment processing for additional services', color: 'slate' },
                  { name: 'SendGrid / Email', status: 'Coming Soon', desc: 'Transactional emails and notifications', color: 'slate' },
                ].map((integration) => (
                  <div key={integration.name} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Link2 className={`w-5 h-5 ${integration.color === 'emerald' ? 'text-emerald-500' : integration.color === 'amber' ? 'text-amber-500' : 'text-slate-400'}`} />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{integration.name}</p>
                        <p className="text-xs text-slate-500">{integration.desc}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                      integration.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      integration.color === 'amber' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>{integration.status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">API keys managed externally</p>
                  <p className="text-xs text-amber-600 mt-0.5">Supabase keys are configured via environment variables (.env). Google OAuth is configured in the Supabase Authentication dashboard.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
