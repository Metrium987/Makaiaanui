# TODOFREEBUFF01 — Bug Fix Priority Queue

> **Source audits:** `06_hardcode_list.md`, `07_duplicate_list.md`, `08_dead_code_list.md`, `09_bug_list.md`, `10_gaps_application.md`, `11_specification_vs_code_reconciliation.md`
> **Format:** GLOBAL_BUG_HISTORY.md compatible — each entry has exact file references for quick location. **When a bug is fixed (🟢):** Append a corresponding entry to `GLOBAL_BUG_HISTORY.md` using its format (`## ID 011: Title`, `**Module:**`, `**Description:**`, `**Resolution:**`, `**Statut:** [VERIFIED_REPAIRED]`). Start at **ID 011** (GLOBAL_BUG_HISTORY.md ends at 010).
> **Status legend:** 🔴 PENDING | 🟡 IN PROGRESS | 🟢 FIXED + appended to GLOBAL_BUG_HISTORY.md | ❌ BLOCKED
> **Segmentation:** Remaining lower-priority gaps (mobile responsive, dark mode, keyboard shortcuts, etc.) and Cahier des Charges feature implementations → `TODOFREEBUFF02.md`

---

## PHASE 0 — CRITICAL SECURITY (Immediate)

---

### BUG-001: Auto-Admin Escalation (Privilege Escalation)
**Source:** `09_bug_list.md` — Bug #1 (CRITICAL)
**Module:** 1. Core (Authentification / Store)
**File:** `src/store/appStore.ts` — Lines 61-87
**Description:** `fetchProfile()` auto-creates missing profiles with `role: 'ADMIN'`. Any new user whose profile doesn't yet exist (race condition with the SQL trigger) gets ADMIN privileges. This directly contradicts the SQL trigger `handle_new_user()` which uses `role: 'MEMBER'`.
**Fix:** Remove the auto-creation block in `fetchProfile()`. Let the SQL trigger `on_auth_user_created` handle profile creation with `MEMBER` role. If the profile still doesn't exist after the Supabase session callback, set a fallback `role: 'MEMBER'` only, never `'ADMIN'`.
**Related:** `09_bug_list.md` Bug #25 (appStore.ts hardcoded fallback email/org)
**Status:** 🟢 FIXED → ID 011 in GLOBAL_BUG_HISTORY.md

---

### BUG-002: Google OAuth Redirect Points to Wrong URL
**Source:** `09_bug_list.md` — Bug #7 (MEDIUM, flagged HIGH in 11_reconciliation)
**Module:** 1. Core (Authentification)
**File:** `src/pages/Login.tsx` — Lines 131-137
**Description:** Google OAuth `redirectTo` uses `import.meta.env.VITE_SUPABASE_URL + '/auth/v1/callback'` which points to Supabase's internal auth callback URL, NOT the app's own `/auth/callback` route. The app's `AuthCallback.tsx` handles the callback at `window.location.origin + '/auth/callback'`.
**Fix:** Change to `redirectTo: \`${window.location.origin}/auth/callback\``
**Note:** Bug ID 009 in GLOBAL_BUG_HISTORY.md previously changed this from `window.location.origin` to the Supabase URL — this was a regression. The correct value should be the app's route.
**Status:** 🟢 FIXED → ID 012 in GLOBAL_BUG_HISTORY.md

---

## PHASE 1 — DATA CORRUPTION & INTEGRITY

---

### BUG-003: Transport Assignment Data Corruption
**Source:** `09_bug_list.md` — Bug #3 (HIGH)
**Module:** 2.1 Transport
**File:** `src/pages/Transport.tsx` — Lines 140-153 (function `handleAssignTransfer`)
**Description:** `handleAssignTransfer` appends assignment info INTO the `time` VARCHAR field: `transfer.time + ' (Assigned to ' + driverName + ')'`. This **destroys the original time data**. Combined with `transport_transfers.time` being VARCHAR instead of TIMESTAMPTZ (BUG-004), the time data becomes unrecoverable after assignment.
**Fix:** 
1. Add a dedicated `assigned_driver` VARCHAR column to `transport_transfers` table in schema
2. Update `handleAssignTransfer` to write to `assigned_driver` instead of mutating `time`
3. Add proper FK relationship to `transport_shifts` if possible
**Related:** BUG-004 (VARCHAR time), `09_bug_list.md` Bug #11
**Status:** 🟢 FIXED → ID 013 in GLOBAL_BUG_HISTORY.md

---

### BUG-004: SQL — transport_shifts.time is VARCHAR instead of TIMESTAMPTZ
**Source:** `09_bug_list.md` — Bug #10 (MEDIUM)
**Module:** 2.1 Transport
**File:** `supabase/migrations/20240101000000_init_schema.sql` — Lines 52-53
**Description:** `transport_shifts.time` is `VARCHAR(100)` instead of `TIMESTAMP WITH TIME ZONE`. Makes time-based queries, sorting, and reporting impossible in SQL.
**Decision:** ✅ WONTFIX — The `time` field stores human-readable shift ranges (e.g., "08:00 - 16:00"), not a single point in time. This is a display-range concept that doesn't map to a single TIMESTAMPTZ. A proper future enhancement would add `shift_start TIMESTAMPTZ` and `shift_end TIMESTAMPTZ` columns separately, but that's scope creep beyond this bugfix phase.
**Related:** BUG-005, BUG-003
**Status:** ✅ WONTFIX (design decision — shift hours are display ranges, not timestamps)

---

### BUG-005: SQL — transport_transfers.time is VARCHAR instead of TIMESTAMPTZ
**Source:** `09_bug_list.md` — Bug #11 (MEDIUM)
**Module:** 2.1 Transport
**File:** `supabase/migrations/20240101000000_init_schema.sql` — Lines 68-69
**Description:** Same issue as BUG-004 for `transport_transfers.time`.
**Fix:** Same as BUG-004. Add `assigned_driver` column at the same time.
**Status:** 🟢 FIXED → ID 014 in GLOBAL_BUG_HISTORY.md

---

### BUG-006: SQL — hospitality_packages.price is VARCHAR instead of NUMERIC
**Source:** `09_bug_list.md` — Bug #12 (MEDIUM)
**Module:** 2.4 Hospitalités
**File:** `supabase/migrations/20240101000000_init_schema.sql` — Lines 154-155
**Description:** `hospitality_packages.price` is `VARCHAR(100)` with `€` prefix stored, preventing numeric aggregation in DB (SUM, AVG, etc.). `additional_services.price` correctly uses `NUMERIC(10,2)`.
**Fix:** `ALTER TABLE hospitality_packages ALTER COLUMN price TYPE NUMERIC(10,2) USING regexp_replace(price, '[^0-9.]', '', 'g')::NUMERIC;`. Update frontend `parsePrice()` in `Hospitalities.tsx` line 117.
**Related:** `09_bug_list.md` Bug #13 (parsePrice fragile regex)
**Status:** 🟢 FIXED → ID 015 in GLOBAL_BUG_HISTORY.md

---

### BUG-007: Catering — No end_time > start_time Validation
**Source:** `09_bug_list.md` — Bug #15 (LOW, but data integrity)
**Module:** 2.3 Restauration
**File:** `src/pages/Catering.tsx` — Multiple lines (form submission handlers)
**Description:** The form accepts `start_time >= end_time` with no validation. A menu can end before it starts, creating impossible scheduling data.
**Fix:** Add validation in `handleCreateMenu` and `handleUpdateMenu`: `if (new Date(startTime) >= new Date(endTime)) { setActionError('End time must be after start time.'); return; }`
**Status:** 🟢 FIXED → ID 016 in GLOBAL_BUG_HISTORY.md

---

## PHASE 2 — TYPE SAFETY & CODE CLEANUP

---

### BUG-008: TypeScript — Profile.role Type Mismatch
**Source:** `09_bug_list.md` — Bug #2 (HIGH)
**Module:** All (types)
**File:** `src/types/index.ts` — Lines 6-12
**Description:** `Profile.role` is typed as `'SUPER_ADMIN' | 'ORG_ADMIN' | 'OPERATOR' | 'VIEWER'` which does not match the actual DB/app roles `'MEMBER' | 'FRONT_OFFICE' | 'BACK_OFFICE' | 'ADMIN'`. This means TypeScript provides zero safety for role checks — the appStore.ts casts with `as 'FRONT_OFFICE' | 'BACK_OFFICE' | 'ADMIN'` bypassing the type entirely.
**Fix:** Update `Profile.role` to `'MEMBER' | 'FRONT_OFFICE' | 'BACK_OFFICE' | 'ADMIN'`. Audit all files that reference Profile.role for compatibility.
**Status:** 🟢 FIXED → ID 017 in GLOBAL_BUG_HISTORY.md

---

### BUG-009: All Hooks Use `any[]` Instead of Typed Interfaces
**Source:** `09_bug_list.md` — Bug #4 (MEDIUM)
**Module:** All (API layer)
**File:** `src/hooks/useApi.ts` — All 12 hooks
**Description:** Every hook declares `useState<any[]>()` instead of typed states. Any DB schema change silently breaks the frontend with no compile-time errors. The `types/index.ts` interfaces exist but are never used.
**Fix:** Define proper interfaces for each table (matching actual DB columns) and type all hooks accordingly. Create interfaces in `types/index.ts` or a dedicated `types/database.ts`.
**Related:** BUG-008 (existing types are wrong), `08_dead_code_list.md` items 1-5 (unused types)
**Status:** 🟢 FIXED → ID 018 in GLOBAL_BUG_HISTORY.md

---

### BUG-010: Missing Explicit organization_id Filter in Queries
**Source:** `09_bug_list.md` — Bug #5 (MEDIUM)
**Module:** All (API layer)
**File:** `src/hooks/useApi.ts` — Multiple hooks
**Description:** Several hooks fetch ALL rows from their tables without `.eq('organization_id', organizationId)`, relying solely on RLS policies to filter. This pulls unnecessary data over the network and could expose data in error states.
**Fix:** Audit all hooks in useApi.ts. Add `.eq('organization_id', organizationId)` to every SELECT/INSERT/UPDATE/DELETE query that has a `organizationId` dependency.
**Status:** 🟢 FIXED → ID 019 in GLOBAL_BUG_HISTORY.md

---

### BUG-011: useActivityLogs Stale Closure in Realtime Subscription
**Source:** `09_bug_list.md` — Bug #6 (LOW)
**Module:** Dashboard
**File:** `src/hooks/useApi.ts` — Lines 89-96
**Description:** The realtime subscription for activity logs uses a functional state update `current => ...` which is correct for the state update, but the initial `fetchLogs` function is defined in the same useEffect and could have stale closures if dependencies change.
**Fix:** Split into two useEffects: one for initial fetch with `[]` dependency, one for the realtime subscription with cleanup.
**Status:** 🟢 FIXED → ID 020 in GLOBAL_BUG_HISTORY.md

---

### BUG-012: ProtectedRoute Hardcoded Restricted Paths
**Source:** `09_bug_list.md` — Bug #16 (LOW)
**Module:** 1. Core
**File:** `src/components/layout/ProtectedRoute.tsx` — Lines 28-29
**Description:** Restricted paths `['/app/settings', '/app/crm']` are hardcoded. Adding new restricted modules requires a code change.
**Fix:** Move to a config constant or route metadata (e.g., `meta: { restrictedRole: 'FRONT_OFFICE' }` in route definition).
**Status:** 🟢 FIXED → ID 021 in GLOBAL_BUG_HISTORY.md

---

### BUG-013: CSS Class Typos (Not Valid Tailwind Classes)
**Source:** `09_bug_list.md` — Bugs #17-20 (LOW)
**Module:** Transport, Deliveries
**Files:** 
- `src/pages/Transport.tsx` — Line 232: `id-input` (invalid class)
- `src/pages/Deliveries.tsx` — Lines 176, 189: `bg-indigo-505`, `border-slate-105`
- `src/pages/Deliveries.tsx` — Line 234: `border-slate-205`
**Description:** These CSS class names don't exist in Tailwind v4. They render as no-ops (no styling effect).
**Fix:** Remove invalid classes or replace with valid Tailwind equivalents (e.g., `bg-indigo-500`, `border-slate-100`).
**Status:** 🟢 FIXED → ID 023 in GLOBAL_BUG_HISTORY.md

---

### BUG-014: Accommodation Revenue Uses Magic Number 15% Margin
**Source:** `09_bug_list.md` — Bug #14 (LOW)
**Module:** 2.2 Hébergement
**File:** `src/pages/Accommodation.tsx` — Lines 32-36
**Description:** Revenue is calculated as `cost * 1.15` (hardcoded 15% markup). Margin is not configurable.
**Fix:** Extract to named constant `REVENUE_MARGIN_RATE = 0.15` and compute as `(1 + REVENUE_MARGIN_RATE)`. Also extracted `ROOM_PRICES` record and `getRoomPrice()` lookup (bonus HC-010 fix).
**Related:** `06_hardcode_list.md` Items #8-10 (hardcoded allotments, pricing, fallback hotel count)
**Status:** 🟢 FIXED → ID 034 (REVENUE_MARGIN_RATE + ROOM_PRICES record)

---

### BUG-015: Dashboard — Hardcoded Static Values
**Source:** `09_bug_list.md` — Bug #9 (LOW), `06_hardcode_list.md` Items #1-7
**Module:** Dashboard
**File:** `src/pages/Dashboard.tsx` — Multiple lines
**Description:** Dashboard shows hardcoded "0" for Active Shifts and Accommodation. "Upcoming Logistics" panel says "Logistics module needs database integration." System status shows hardcoded "All Systems Normal" with hardcoded project name "tahiti-2027-core".
**Fix:** Pull real data from hooks. Remove hardcoded placeholder text. Either implement the logistics data or hide the panel.
**Status:** 🟢 FIXED → ID 022 in GLOBAL_BUG_HISTORY.md

---

## PHASE 3 — HARDCODE ELIMINATION (Systematic)

---

### HC-001 to HC-035: Hardcoded Values
**Source:** `06_hardcode_list.md` — Items #1 to #35
**Module:** All modules

| Ref | File | Lines | Value | Priority | Status |
|-----|------|-------|-------|----------|--------|
| HC-001 | `Dashboard.tsx` | 24 | `"All Systems Normal"` | LOW | 🟢 → ID 022 |
| HC-002 | `Dashboard.tsx` | 29 | `"tahiti-2027-core"` | LOW | 🟢 → ID 022 |
| HC-003 | `Dashboard.tsx` | 30 | `"OPERATIONAL"` | LOW | 🟢 → ID 022 |
| HC-004 | `Dashboard.tsx` | 35 | `"Active Shifts"` | LOW | 🟢 → ID 022 |
| HC-005 | `Dashboard.tsx` | 48 | `"Accommodation"` | LOW | 🟢 → ID 022 |
| HC-006 | `Dashboard.tsx` | 61, 82 | `"Recent Activity"`, `"Upcoming Logistics"` | LOW | 🟢 → ID 022 |
| HC-007 | `Dashboard.tsx` | 88 | `"Logistics module needs database integration."` | LOW | 🟢 → ID 022 |
| HC-008 | `Accommodation.tsx` | 63 | `useState(120)` (total allotments) | MED | 🟢 → ID 034 |
| HC-009 | `Accommodation.tsx` | 101 | `hotelCount \|\| 4` (magic fallback) | MED | 🟢 → ID 034 |
| HC-010 | `Accommodation.tsx` | 75-82 | `getRoomPrice()` hardcoded prices (150/180/200/450) | MED | 🟢 → ID 034 |
| HC-011 | `Deliveries.tsx` | 14 | `'All Sites'` filter label | LOW | 🟢 → ID 024 |
| HC-012 | `Deliveries.tsx` | 52 | Site options hardcoded (4 stadiums) | MED | 🟢 → ID 024 |
| HC-013 | `Deliveries.tsx` | 297-300 | Same sites repeated in form | MED | 🟢 → ID 024 |
| HC-014 | `Accreditations.tsx` | 59 | `AVAILABLE_ZONES` hardcoded array | MED | 🟢 → ID 025 |
| HC-015 | `Hospitalities.tsx` | 235-238 | Seat section options hardcoded (French labels) | MED | 🟢 → ID 026 |
| HC-016 | `Catering.tsx` | 162-163 | Default dietary counts `'50','0','0','0','0'` | LOW | 🔴 PENDING |
| HC-017 | `Catering.tsx` | 252-257 | Service format options hardcoded (BUFFET, PLATED...) | LOW | 🟢 → ID 028 |
| HC-018 | `Login.tsx` | 94 | `'Account created successfully...'` not in i18n | MED | 🔴 PENDING |
| HC-019 | `Login.tsx` | 209-210 | `"Or continue with"`, `"Sign in with Google"` not in i18n | MED | 🔴 PENDING |
| HC-020 | `Settings.tsx` | 10 | `'Pacific Games Tahiti 2027'` hardcoded workspace name | MED | 🟢 → ID 033 |
| HC-021 | `Settings.tsx` | 11 | `'#4F46E5'` hardcoded primary color | LOW | 🟢 → ID 033 |
| HC-022 | `Settings.tsx` | 38 | `'portal.tahiti2027.com'` hardcoded domain | LOW | 🟢 → ID 033 |
| HC-023 | `supabase.ts` | 7-8 | `''` empty fallback for env vars (style nit) | LOW | 🔴 PENDING |
| HC-024 | `appStore.ts` | 74 | `'user@example.com'` fallback email (security) | MED | 🔴 PENDING |
| HC-025 | `appStore.ts` | 76 | `'ADMIN'` default role on auto-create | **INCLUDED IN BUG-001** | 🟡 |
| HC-026 | `appStore.ts` | 71 | `'Default Organization'` auto-create name | MED | 🔴 PENDING |
| HC-027 | `Transport.tsx` | 182-186 | `'08:00 - 16:00'` default shift hours | LOW | 🟢 → ID 029 |
| HC-028 | `Uniforms.tsx` | 105 | `'S, M, L, XL'` default sizes | LOW | 🟢 → ID 030 |
| HC-029 | `Uniforms.tsx` | 106 | `'100'` default total | LOW | 🔴 PENDING |
| HC-030 | `Uniforms.tsx` | 331 | `'100'` default total (same as HC-029) | LOW | 🔴 PENDING |
| HC-031 | `AdditionalServices.tsx` | 97 | `'100'` default limit count | LOW | 🟢 → ID 031 |
| HC-032 | `AdditionalServices.tsx` | 93 | `'50'` default price | LOW | 🟢 → ID 031 |
| HC-033 | `Header.tsx` | 32 | `'System Live'` fallback in `t()` call | LOW | 🔴 PENDING |
| HC-034 | `Accommodation.tsx` | 24 | `'Hébergement & Allotements'` (French title not in i18n) | MED | 🔴 PENDING |
| HC-035 | `Accommodation.tsx` | 256 | `ent search...` truncated placeholder | LOW | 🔴 PENDING |

**Strategy:** Systematically move values to i18n for UI text, config/env for business values, DB for site/hotel/zone data. Batch by file.

---

## PHASE 4 — DEAD CODE & DUPLICATE CLEANUP

---

### DC-001 to DC-018: Dead Code Removal
**Source:** `08_dead_code_list.md` — Items #1 to #18
**Strategy:** Remove one category at a time, verify build still compiles (`npm run lint`)

| Ref | File | Item | Fix | Priority | Status |
|-----|------|------|-----|----------|--------|
| DC-001 | `types/index.ts:14-18` | `TransportShift` interface (unused) | Remove | LOW | 🔴 |
| DC-002 | `types/index.ts:20-26` | `Organization` interface (unused) | Remove | LOW | 🔴 |
| DC-003 | `types/index.ts:1-4` | `EntityStatus` type (unused) | Remove | LOW | 🔴 |
| DC-004 | `types/index.ts:6-12` | `Profile` interface (misleading types — **see BUG-008**) | Rewrite | HIGH | 🟢 |
| DC-005 | `useApi.ts:18` | `import { TransportShift }` (unused import) | Remove | LOW | 🔴 |
| DC-006 | `package.json` | `"motion"` dependency (unused) | Remove | LOW | 🔴 |
| DC-007 | `package.json` | `"express"`, `"@types/express"` (unused) | Remove | LOW | 🔴 |
| DC-008 | `package.json` | `"dotenv"` (unused) | Remove | LOW | 🔴 |
| DC-009 | `package.json` | `"tsx"` (unused devDep) | Remove | LOW | 🔴 |
| DC-010 | `AppLayout.tsx:1,5,7` | `React` import + `children` prop (React 19) | Clean up | LOW | 🔴 |
| DC-011 | `Transport.tsx:19` | `Check` icon import (unused) | Remove | LOW | 🔴 |
| DC-012 | `Accommodation.tsx:17,24` | `Check` icon import (unused) | Remove | LOW | 🔴 |
| DC-013 | `Accommodation.tsx:13` | `DollarSign` icon import (unused) | Remove | LOW | 🔴 |
| DC-014 | `Accreditations.tsx:15` | `CheckCircle` icon import (unused) | Remove | LOW | 🔴 |
| DC-015 | `Accreditations.tsx:14` | `Filter` icon import (unused) | Remove | LOW | 🔴 |
| DC-016 | `Transport.tsx:24-25` | `Check` icon (duplicate of DC-011) | Remove | LOW | 🔴 |
| DC-017 | `Deliveries.tsx:23` | `Search` icon import (unused) | Remove | LOW | 🔴 |
| DC-018 | `metadata.json` | `"majorCapabilities": [..GEMINI_API..]` (no implementation) | Remove/correct | LOW | 🔴 |

---

### DUP-001 to DUP-008: Duplicate Pattern Refactoring
**Source:** `07_duplicate_list.md` — Items #1 to #8

| Ref | Description | Approach | Priority | Status |
|-----|-------------|----------|----------|--------|
| DUP-001 | `useApi.ts`: CRUD pattern duplicated across 12 hooks (~480 lines) | Extract `useCrud(tableName, options)` generic factory hook | **HIGH** | 🔴 |
| DUP-002 | Deliveries.tsx ⇔ Laundry.tsx: ~70% structural overlap | Create shared `<CrudPage>` or `<DataTable>` component | MED | 🔴 |
| DUP-003 | Accreditations.tsx ⇔ Uniforms.tsx: identical form state pattern | Create shared state management hook | LOW | 🔴 |
| DUP-004 | All 14 pages: `actionLoading` + `actionError` boilerplate | Create `useActionState()` shared hook | LOW | 🔴 |
| DUP-005 | Locale files (en.json ⇔ fr.json) — expected duplication | Skip (normal) | — | — |
| DUP-006 | Transport.tsx ⇔ Hospitalities.tsx: dual-tab view switching | Create shared `<TabView>` component | LOW | 🔴 |
| DUP-007 | `useApi.ts`: `'An error occurred'` repeated 12+ times | Replace with `ERROR_FALLBACK` constant | LOW | 🔴 |
| DUP-008 | Transport.tsx: similar filter logic at lines 333 and 345 | Create shared `useFilter()` hook | LOW | 🔴 |

---

## PHASE 5 — APPLICATION GAPS

---

### GAP-001: Error Boundary (HIGH)
**Source:** `10_gaps_application.md` — Gap #2
**Description:** No React error boundary. Any unhandled exception crashes the entire app with a white screen.
**Fix:** Create `<ErrorBoundary>` component wrapping `<App>` in `main.tsx`. Show a styled fallback UI with "Reload" button.
**Status:** 🔴 PENDING

---

### GAP-002: Loading Skeletons (MEDIUM)
**Source:** `10_gaps_application.md` — Gap #3
**Description:** All loading states are basic "Loading..." text. Poor UX.
**Fix:** Create `<Skeleton>` component. Apply to all 14 pages' loading states.
**Status:** 🔴 PENDING

---

### GAP-003: Pagination (MEDIUM)
**Source:** `10_gaps_application.md` — Gap #4
**Description:** Tables load all records at once. Performance degrades with hundreds of entries.
**Fix:** Add `.range()` to Supabase queries. Create `<Pagination>` component. Apply to all table views.
**Status:** 🔴 PENDING

---

### GAP-004: Data Export (MEDIUM)
**Source:** `10_gaps_application.md` — Gap #5
**Description:** No CSV/PDF export in any module. Required by 5/9 module specs (Cahier des Charges).
**Fix:** Add "Export CSV" button to all table headers. Use a library like `papaparse` or `jspdf`.
**Status:** 🔴 PENDING

---

### GAP-005: Password Reset Flow (HIGH)
**Source:** `10_gaps_application.md` — Gap #8, `09_bug_list.md` Bug #8
**Description:** Login page has no "Forgot password" link. Users who forget their password are permanently locked out.
**Fix:** Add "Forgot password?" link below password field. Implement `supabase.auth.resetPasswordForEmail()` flow with a dedicated reset page.
**Status:** 🔴 PENDING

---

### GAP-006: User Management UI (HIGH)
**Source:** `10_gaps_application.md` — Gap #9
**Description:** "Users & Tenancy" button in Settings is a dead button (no content).
**Fix:** Implement user list with role management, invite flow, and profile editing using `profiles` table.
**Status:** 🔴 PENDING

---

### GAP-007: Audit Trail Viewer (LOW)
**Source:** `10_gaps_application.md` — Gap #15
**Description:** `activity_logs` table exists but no dedicated viewer page exists.
**Fix:** Create a dedicated audit log page or panel with search, date filter, and export.
**Status:** 🔴 PENDING

---

### GAP-008: Batch Operations (MEDIUM)
**Source:** `10_gaps_application.md` — Gap #26
**Description:** No checkbox selection on tables. Cannot bulk-update status or bulk-delete.
**Fix:** Add checkbox column to tables. Add "Select All" and bulk action toolbar.
**Status:** 🔴 PENDING

---

### GAP-009: TypeScript Strict Mode (MEDIUM)
**Source:** `10_gaps_application.md` — Gap #30
**Description:** `tsconfig.json` has no `"strict": true`. Many type errors are suppressed.
**Fix:** Enable `"strict": true` in `tsconfig.json`. Fix all resulting type errors (likely 50+).
**Warning:** High effort but significantly improves code quality.
**Status:** 🔴 PENDING

---

### GAP-010: softDelete + updated_at Columns (MEDIUM)
**Source:** `10_gaps_application.md` — Gaps #18, #19
**Description:** No `updated_at` on any table. All deletes are hard deletes.
**Fix:** Add `updated_at TIMESTAMPTZ DEFAULT NOW()` to all tables. Add `deleted_at TIMESTAMPTZ` for soft delete support. Update hooks to use `update` instead of `delete` where appropriate.
**Status:** 🔴 PENDING

---

### GAP-011: DB Check Constraints + Indexes (MEDIUM)
**Source:** `10_gaps_application.md` — Gaps #16, #17; `11_reconciliation` SQL Schema gaps
**Description:** No CHECK constraints on status fields (any string accepted). No indexes beyond PK. No unique constraints on codes/names.
**Fix:** Add CHECK constraints: `status IN ('PENDING','CONFIRMED',...)`. Add indexes on `organization_id`, `status`, `created_at`. Add UNIQUE on accreditation codes, uniform names.
**Status:** 🔴 PENDING

---

### GAP-012: Front Office (Client Portal) [HIGH]
**Source:** `11_specification_vs_code_reconciliation.md` — Largest missing feature
**Description:** Spec requires a white-label client portal where clients make and track requests. Current UI is back-office only.
**Fix:** New major feature — requires dedicated planning. Not a simple bug fix.
**Status:** 🔴 PENDING

---

### GAP-013: Reports & Export Engine [HIGH]
**Source:** `11_specification_vs_code_reconciliation.md` — Required by 5/9 modules
**Description:** Spec requires Excel/PDF generation for transport, accommodation, catering, laundry, and additional services modules.
**Fix:** Implement report generation layer. Required by core workflow Step 5.
**Status:** 🔴 PENDING

---

### GAP-014: i18n Coverage Expansion [MEDIUM]
**Source:** `11_reconciliation` Section 3 (i18n Framework Coverage); `06_hardcode_list.md` multiple items
**Description:** i18n framework exists but only 1/14 pages (Landing.tsx) has full coverage. 10 pages have zero i18n usage. Login.tsx has partial coverage.
**Fix:** Systematically add translation keys for all hardcoded UI strings in each page. Prioritize user-facing pages (Login, Dashboard, then module pages).
**Status:** 🔴 PENDING

---

## APPENDIX: SQL Schema Migration Plan

*Ordered migration steps for database changes. Should be coordinated with frontend fixes.*

| Step | SQL Change | Related Bug | Status | Migration File |
|------|-----------|-------------|--------|---------------|
| 1 | `ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'MEMBER'` | BUG-001 | ✅ Already in schema | — |
| 2 | `transport_shifts.time VARCHAR` kept as-is (shift hours = display range) | BUG-004 | ✅ WONTFIX | — |
| 3 | `transport_transfers.time VARCHAR→TIMESTAMPTZ` + `assigned_driver VARCHAR(255)` | BUG-003 + BUG-005 | ✅ DONE → ID 013/014 | `20240101000002_fix_transport_schema.sql` |
| 4 | `hospitality_packages.price VARCHAR→NUMERIC(10,2)` | BUG-006 | ✅ DONE → ID 015 | `20240101000003_fix_hospitality_price.sql` |
| 5 | Add `updated_at TIMESTAMPTZ DEFAULT NOW()` to all tables | GAP-010 | 🔴 PENDING | — |
| 6 | Add `deleted_at TIMESTAMPTZ` for soft delete support | GAP-010 | 🔴 PENDING | — |
| 7 | Add CHECK constraints on all status columns | GAP-011 | 🔴 PENDING | — |
| 8 | Add indexes: `organization_id`, `status`, `created_at` | GAP-011 | 🔴 PENDING | — |
| 9 | Add UNIQUE constraints on accreditation codes, uniform names | GAP-011 | 🔴 PENDING | — |

---

> **Next file:** `TODOFREEBUFF02.md` will contain the Cahier des Charges feature implementation roadmap (client portal, mobile apps, Stripe, Google Maps, etc.) once all bugs, hardcodes, dead code, and gaps are resolved.
>
> **Progress tracking:** Update STATUS tags when work begins (🟡 IN PROGRESS) and when completed (🟢 FIXED). Log resolution details in `GLOBAL_BUG_HISTORY.md` using the same format as existing entries.
