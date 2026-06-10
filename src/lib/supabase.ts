import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const hasCredentials = Boolean(supabaseUrl && supabaseAnonKey);

const NOOP_RESULT = { data: [], count: 0, error: null };

// Safe proxy chain: all method calls return this proxy so the builder pattern
// (.from().select().eq().range()) never throws. The critical piece is the `then`
// trap: it makes every `await safeProxy` resolve to { data: [], count: 0, error: null },
// so hooks can safely destructure without crashing on property access.
const safeProxy = new Proxy({} as any, {
  get(_target: any, prop: string | symbol) {
    // Make await resolve to a clean destructurable result
    if (prop === 'then') {
      return (resolve: Function) => resolve(NOOP_RESULT);
    }
    // Realtime subscribe/unsubscribe are no-ops
    if (prop === 'subscribe' || prop === 'unsubscribe') {
      return () => {};
    }
    // All other property access returns a function that chains back to safeProxy
    if (typeof prop === 'string' && !['catch', 'finally'].includes(prop)) {
      return () => safeProxy;
    }
    return safeProxy;
  },
});

function createSafeClient(): SupabaseClient {
  if (hasCredentials) {
    return createClient(supabaseUrl, supabaseAnonKey);
  }

  console.warn(
    '[Supabase] Credentials missing — running in safe mode. ' +
    'Auth and data features will be unavailable until ' +
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured.'
  );

  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      // Top-level namespaces
      if (prop === 'from' || prop === 'channel' || prop === 'rpc' || prop === 'schema') {
        return () => safeProxy;
      }
      if (prop === 'auth') return safeProxy;
      // Consistent with safeProxy: await supabase.auth... resolves cleanly
      if (prop === 'then') {
        return (resolve: Function) => resolve(NOOP_RESULT);
      }
      if (typeof prop === 'string' && !['catch', 'finally'].includes(prop)) {
        return safeProxy;
      }
      return undefined;
    },
  }) as SupabaseClient;
}

export const supabase = createSafeClient();
export { hasCredentials };
