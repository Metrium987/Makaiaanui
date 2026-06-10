import React, { useState } from 'react';
import { Search, Plus, Filter, MoreHorizontal, Briefcase, Mail, Phone, Users } from 'lucide-react';
import { useProviders, useClients } from '../hooks/useApi';

// CRM status badge styles
const CRM_STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-600',
};
const DEFAULT_CRM_STATUS_STYLE = 'bg-amber-50 text-amber-600';

export default function Crm() {
  const [activeTab, setActiveTab] = useState<'providers' | 'clients'>('providers');
  const [searchQuery, setSearchQuery] = useState('');

  const { providers: rawProviders, loading: loadingProviders } = useProviders();
  const { clients: rawClients, loading: loadingClients } = useClients();

  const currentList = activeTab === 'providers' ? rawProviders : rawClients;
  const isLoading = activeTab === 'providers' ? loadingProviders : loadingClients;

  const displayedList = currentList.filter(
    (item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              (item.contact_name && item.contact_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Clients & Providers</h2>
          <p className="mt-1 text-sm text-slate-500">Manage external relationships, supplier contracts, and CRM pipeline.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Add Entity
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex gap-4">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Providers</p>
            <span className="text-2xl font-bold text-slate-900">{loadingProviders ? '...' : rawProviders.length}</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex gap-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Client Accounts</p>
            <span className="text-2xl font-bold text-slate-900">{loadingClients ? '...' : rawClients.length}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pipeline Value</p>
            <span className="text-2xl font-bold text-slate-900">€ 0M</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[500px]">
        <div className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex px-6">
            <button
              onClick={() => setActiveTab('providers')}
              className={`py-4 px-2 text-sm font-bold uppercase tracking-widest border-b-2 mr-8 transition-colors ${activeTab === 'providers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Providers Catalog
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`py-4 px-2 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'clients' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Client Database
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-white">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`} 
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">Entity Name</th>
                <th className="px-6 py-4 font-bold">Category</th>
                <th className="px-6 py-4 font-bold">Primary Contact</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Loading {activeTab}...
                  </td>
                </tr>
              )}
              {!isLoading && displayedList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{item.id.split('-')[0]}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-700">{item.contact_name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3" /> {item.contact_email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-widest ${CRM_STATUS_STYLES[item.status] || DEFAULT_CRM_STATUS_STYLE}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && displayedList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
