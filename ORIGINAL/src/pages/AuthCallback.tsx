import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Activity, AlertCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase auth handles parsing the URL and storing the session automatically 
    // when using the @supabase/supabase-js library. 
    // We just need to check if a session is established and then redirect.
    const processAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (session) {
          navigate('/app');
        } else {
          // Listen for auth state change if the session isn't immediately available
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
              navigate('/app');
            }
          });
          
          // Cleanup
          return () => {
            subscription.unsubscribe();
          };
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error during authentication callback.');
      }
    };

    processAuth();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2 uppercase">Authentication Failed</h2>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="w-full bg-slate-900 text-white rounded-lg py-2 text-sm font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <Activity className="w-8 h-8 animate-spin" />
        <span className="text-sm font-bold uppercase tracking-widest text-slate-500">Verifying access...</span>
      </div>
    </div>
  );
}
