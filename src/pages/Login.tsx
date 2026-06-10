import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (error) {
          setError(error.message);
        } else {
          setSuccessMsg(t('login.successSignUp', 'Account created successfully. You can now sign in.'));
          setIsSignUp(false);
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
        } else if (data.session) {
          navigate('/app');
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redirect back to the app's callback route, which AuthCallback.tsx handles
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred with Google login');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-6 h-6 border-2 border-white rounded-sm"></div>
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-slate-900 uppercase">
          {isSignUp ? t('login.createAccount', 'Create Account') : t('login.title', 'System Access')}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          {isSignUp ? t('login.signupSubtitle', 'Sign up to access the system') : t('login.subtitle', 'Operations Control Center')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-4 shadow-xl shadow-slate-200/50 border border-slate-100 sm:rounded-2xl sm:px-10">
          
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}
          
          {successMsg && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-100 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-green-800">{successMsg}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleAuth}>
            <div>
              <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase">{t('login.email', 'Email address')}</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-slate-200 px-4 py-3 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase">{t('login.password', 'Password')}</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-slate-200 px-4 py-3 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-slate-500 tracking-wider uppercase">{t('login.confirmPassword', 'Confirm Password')}</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full appearance-none rounded-lg border border-slate-200 px-4 py-3 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`flex w-full justify-center items-center gap-2 rounded-xl border border-transparent py-3.5 px-4 text-sm font-bold tracking-wide text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isSignUp ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' : 'bg-slate-900 hover:bg-slate-800 focus:ring-indigo-500'}`}
              >
                {loading 
                  ? (isSignUp ? t('auth.signingUp', 'Signing up...') : t('login.loading', 'Authenticating...')) 
                  : (isSignUp ? t('login.signUp', 'Sign Up') : t('login.submit', 'Sign In'))} 
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                 <span className="bg-white px-2 text-slate-500 font-medium">{t('login.orContinueWith', 'Or continue with')}</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
              >
                 <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                   <path
                     d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                     fill="#4285F4"
                   />
                   <path
                     d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                     fill="#34A853"
                   />
                   <path
                     d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                     fill="#FBBC05"
                   />
                   <path
                     d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                     fill="#EA4335"
                   />
                   <path d="M1 1h22v22H1z" fill="none" />
                 </svg>
                 {t('login.signInWithGoogle', 'Sign in with Google')}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-4 text-center">
            <span className="text-xs text-slate-500">
              {isSignUp ? (
                <>
                  {t('login.hasAccount', 'Already have an account?')} <button type="button" onClick={() => { setIsSignUp(false); setError(null); setSuccessMsg(null); }} className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">{t('login.signIn', 'Sign In')}</button>
                </>
              ) : (
                <>
                   {t('login.noAccount', "Don't have an account?")} <button type="button" onClick={() => { setIsSignUp(true); setError(null); setSuccessMsg(null); }} className="font-bold text-indigo-600 hover:text-indigo-500 transition-colors">{t('login.signUp', 'Sign Up')}</button>
                </>
              )}
            </span>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
          Protected by Supabase Auth
        </p>
      </div>
    </div>
  );
}
