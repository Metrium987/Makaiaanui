import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AppState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  session: Session | null;
  role: 'FRONT_OFFICE' | 'BACK_OFFICE' | 'ADMIN' | null;
  organizationId: string | null;
  isProfileLoading: boolean;
  language: string;
  setSession: (session: Session | null) => void;
  fetchProfile: (userId: string) => Promise<void>;
  setLanguage: (lang: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  session: null,
  role: null,
  organizationId: null,
  isProfileLoading: false,
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
  setSession: (session) => {
    set({ session });
    if (session?.user) {
      get().fetchProfile(session.user.id);
    } else {
      set({ role: null, organizationId: null });
    }
  },
  fetchProfile: async (userId) => {
    set({ isProfileLoading: true });
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', userId)
        .single();
      
      if (!data || error) {
        // Clear warning, let's auto-create profile
        let { data: orgs } = await supabase.from('organizations').select('id').limit(1);
        let orgId = orgs?.[0]?.id;
        
        if (!orgId) {
          const { data: newOrg, error: orgErr } = await supabase
            .from('organizations')
            .insert({ name: 'Default Organization' })
            .select('id')
            .single();
          if (newOrg && !orgErr) {
            orgId = newOrg.id;
          }
        }
        
        if (orgId) {
          const userObj = get().session?.user;
          const { data: newProfile, error: profErr } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: userObj?.email || 'user@example.com',
              role: 'ADMIN',
              organization_id: orgId
            })
            .select('role, organization_id')
            .single();
          
          if (newProfile && !profErr) {
            data = newProfile;
          }
        }
      }

      if (data) {
        set({ 
          role: data.role as 'FRONT_OFFICE' | 'BACK_OFFICE' | 'ADMIN', 
          organizationId: data.organization_id 
        });
      } else {
        set({ role: 'FRONT_OFFICE', organizationId: null });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      set({ role: 'FRONT_OFFICE', organizationId: null });
    } finally {
      set({ isProfileLoading: false });
    }
  }
}));
