import React, { useState } from 'react';
import { Shield, Key, Building2, PaintBucket, Users, Lock, ChevronRight } from 'lucide-react';

const DEFAULT_WORKSPACE_NAME = 'Pacific Games Tahiti 2027';
const DEFAULT_PRIMARY_COLOR = '#4F46E5';
const DEFAULT_PORTAL_DOMAIN = 'portal.tahiti2027.com';

export default function Settings() {
  const [workspaceName, setWorkspaceName] = useState(DEFAULT_WORKSPACE_NAME);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      // Logic for saving settings could go here
    }, 1000);
  };
  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">System Settings</h2>
        <p className="mt-1 text-sm text-slate-500">Configure workspace, whitelabeling, integrations, and RBAC policies.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Settings Navigation Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-2">
          <button className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-sm text-left transition-colors">
            <span className="flex items-center gap-3"><Building2 className="w-4 h-4" /> Brand & White-label</span>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
          <button className="flex items-center justify-between p-3 rounded-lg text-slate-600 border border-transparent hover:bg-slate-50 font-bold text-sm text-left transition-colors">
            <span className="flex items-center gap-3"><Users className="w-4 h-4 text-slate-400" /> Users & Tenancy</span>
          </button>
          <button className="flex items-center justify-between p-3 rounded-lg text-slate-600 border border-transparent hover:bg-slate-50 font-bold text-sm text-left transition-colors">
            <span className="flex items-center gap-3"><Shield className="w-4 h-4 text-slate-400" /> Roles & Permissions</span>
          </button>
          <button className="flex items-center justify-between p-3 rounded-lg text-slate-600 border border-transparent hover:bg-slate-50 font-bold text-sm text-left transition-colors">
            <span className="flex items-center gap-3"><Key className="w-4 h-4 text-slate-400" /> Integrations (API)</span>
          </button>
        </div>

        {/* Main Settings Form Area */}
        <div className="lg:col-span-3 pb-12">
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
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Basic Info</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Workspace Name</label>
                    <input type="text" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Client Portal Domain</label>
                    <input type="text" defaultValue={DEFAULT_PORTAL_DOMAIN} className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm text-slate-500 bg-slate-50 cursor-not-allowed" disabled />
                  </div>
                </div>
              </div>

              <div className="flex flex-col divide-y divide-slate-100">
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700">Custom Logomark</label>
                    <p className="text-xs text-slate-500 mt-0.5">Upload a square SVG or PNG (min 128x128px).</p>
                  </div>
                  <button type="button" className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">Choose File</button>
                </div>
                
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700">Primary Color Hex</label>
                    <p className="text-xs text-slate-500 mt-0.5">Used for buttons, links, and active states.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md shadow-sm border border-slate-200" style={{ backgroundColor: primaryColor }}></div>
                    <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-24 px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm font-mono text-slate-600" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                 <button type="button" className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors">Discard Changes</button>
                 <button type="submit" disabled={isSaving} className="bg-indigo-600 px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide text-white hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50">
                   <Lock className="w-4 h-4" />
                   {isSaving ? 'Saving...' : 'Save Configuration'}
                 </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
