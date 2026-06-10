import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AppRole } from '../types';

interface AppState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  session: Session | null;
  role: AppRole | null;
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
      const { data, error } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', userId)
        .single();
      
      if (data && !error) {
        set({ 
          role: data.role as AppRole, 
          organizationId: data.organization_id 
        });
      } else {
        // Profile not found — SQL trigger on_auth_user_created should have created it.
        // If missing, log warning and set safe defaults rather than auto-creating with escalated privileges.
        console.warn('Profile not found for user', userId, '- SQL trigger may not have completed. Retrying on next session.');
        set({ role: null, organizationId: null });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      set({ role: null, organizationId: null });
    } finally {
      set({ isProfileLoading: false });
    }
  }
}));
