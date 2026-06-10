# 09 — Bug List

[MODE A — Subagent]

| # | File | Line(s) | Description | Severity | Fix |
|---|------|---------|-------------|----------|-----|
| 1 | `src/store/appStore.ts` | 61-87 | **Auto-admin escalation**: `fetchProfile()` auto-creates missing profiles with `role: 'ADMIN'`. Any new user signing up gets ADMIN unless a profile already exists. | **CRITICAL** | Remove auto-profile creation. Let the SQL trigger (`handle_new_user`) handle this with default `MEMBER` role. Or restrict to `role: 'MEMBER'`. |
| 2 | `src/types/index.ts` | 6-12 | **Type mismatch**: `Profile.role` type uses `'SUPER_ADMIN' \| 'ORG_ADMIN' \| 'OPERATOR' \| 'VIEWER'` but DB and app use `'MEMBER' \| 'FRONT_OFFICE' \| 'BACK_OFFICE' \| 'ADMIN'` | **HIGH** | Update the interface to match actual DB roles |
| 3 | `src/pages/Transport.tsx` | 140-153 | **Data corruption**: `handleAssignTransfer` appends assignment detail into the `time` VARCHAR field: `transfer.time + ' (Assigned to ' + driverName + ')'`. This overwrites the original time data. | **HIGH** | Add a dedicated `assigned_driver` column to `transport_transfers` table |
| 4 | `src/hooks/useApi.ts` | Multiple | **`any[]` types everywhere**: All hooks return `useState<any[]>()` — no TypeScript type safety on API responses. If the DB schema changes, no compile-time errors. | **MEDIUM** | Define and use proper TypeScript interfaces for each table |
| 5 | `src/hooks/useApi.ts` | Multiple | **Missing organization filter in queries**: Several hooks fetch ALL rows without `.eq('organization_id', organizationId)`, relying solely on RLS. This pulls extra data over the wire. | **MEDIUM** | Add explicit `.eq('organization_id', organizationId)` to all queries |
| 6 | `src/hooks/useApi.ts` | 89-96 | **useActivityLogs stale closure**: The realtime subscription callback references setLogs with `current => ...` which is correct, but the initial fetch is outside useEffect dependencies | **LOW** | No immediate bug, but break into separate effects for fetch vs subscribe |
| 7 | `src/pages/Login.tsx` | 131-137 | **Google OAuth redirect**: Uses `VITE_SUPABASE_URL + '/auth/v1/callback'` as redirectTo. This points to Supabase's internal callback URL, not the app's own `/auth/callback` route. | **MEDIUM** | Should redirect to `window.location.origin + '/auth/callback'` to match the app's route |
| 8 | `src/pages/Login.tsx` | 30-31 | **No password reset flow**: Login page has no "Forgot password" link. Users who forget their password cannot recover. | **LOW** | Add `supabase.auth.resetPasswordForEmail()` flow |
| 9 | `src/pages/Dashboard.tsx` | 14 | `formatDistanceToNow` imported from `date-fns` — this adds ~5KB to bundle for one function. | **LOW** | Consider lighter alternative or inline formatting |
| 10 | `supabase/migrations/20240101000000_init_schema.sql` | 52-53 | **transport_shifts.time is VARCHAR(100)**: Time stored as free text instead of TIMESTAMP, making time-based queries, sorting, and reporting impossible | **MEDIUM** | Change column to `TIMESTAMP WITH TIME ZONE` |
| 11 | `supabase/migrations/20240101000000_init_schema.sql` | 68-69 | **transport_transfers.time is VARCHAR(100)**: Same issue as #10 | **MEDIUM** | Change column to `TIMESTAMP WITH TIME ZONE` |
| 12 | `supabase/migrations/20240101000000_init_schema.sql` | 154-155 | **hospitality_packages.price is VARCHAR(100)**: Price stored as string with `€` prefix, preventing numeric aggregations in DB | **MEDIUM** | Change to `NUMERIC(10, 2)` and move currency symbol to display layer |
| 13 | `src/pages/Hospitalities.tsx` | 117 | **parsePrice strips currency**: `price.replace(/[^0-9.]/g, '')` — fragile, loses locale info | **LOW** | Store price as NUMERIC in DB and add currency code column |
| 14 | `src/pages/Accommodation.tsx` | 32-36 | **Revenue calculation uses 15% markup**: `getRoomPrice(type) * 1.15` — magic number margin, not configurable | **LOW** | Move margin to config or eliminate (revenue should come from actual bookings) |
| 15 | `src/pages/Catering.tsx` | Multiple | **No end_time validation**: Form accepts start_time > end_time with no validation | **LOW** | Add validation: end_time must be after start_time |
| 16 | `src/components/layout/ProtectedRoute.tsx` | 28-29 | **Restricted path check is fragile**: Hardcoded `['/app/settings', '/app/crm']` — adding new restricted modules requires code change | **LOW** | Move restricted paths to config or route metadata |
| 17 | `src/pages/Transport.tsx` | 232 | **`id-input` class**: Input has class `id-input` which is not a Tailwind class — typo? | **LOW** | Remove spurious class |
| 18 | `src/pages/Deliveries.tsx` | 176 | **`bg-indigo-505`** and **`border-slate-105`** typo: Not valid Tailwind classes | **LOW** | Fix class names |
| 19 | `src/pages/Deliveries.tsx` | 189 | **`bg-indigo-505`** same typo | **LOW** | Fix class name |
| 20 | `src/pages/Deliveries.tsx` | 234 | **`border-slate-205`** typo | **LOW** | Fix class name |
