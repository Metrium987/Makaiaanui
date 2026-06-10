import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PUBLIC_PATHS = ['/', '/login'];

/**
 * Redirects authenticated users from public pages to /app.
 * Handles the OAuth callback case where Supabase redirects to
 * the root path with #access_token in the URL hash.
 */
export default function AuthRedirector() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && session && PUBLIC_PATHS.includes(location.pathname)) {
      navigate('/app', { replace: true });
    }
  }, [session, loading, location.pathname, navigate]);

  return null;
}
