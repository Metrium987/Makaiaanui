# 06 — Hardcode List

[MODE A — Subagent]

| # | File | Line(s) | Value | Proposed Correction |
|---|------|---------|-------|-------------------|
| 1 | `src/pages/Dashboard.tsx` | 24 | `"All Systems Normal"` | Move to i18n or fetch from a status endpoint |
| 2 | `src/pages/Dashboard.tsx` | 29 | `"tahiti-2027-core"` | Read from env var or organization config |
| 3 | `src/pages/Dashboard.tsx` | 30 | `"OPERATIONAL"` | Move to i18n |
| 4 | `src/pages/Dashboard.tsx` | 35 | `"Active Shifts"` | Move to i18n |
| 5 | `src/pages/Dashboard.tsx` | 48 | `"Accommodation"` | Move to i18n |
| 6 | `src/pages/Dashboard.tsx` | 61, 82 | `"Recent Activity"`, `"Upcoming Logistics"` | Move to i18n |
| 7 | `src/pages/Dashboard.tsx` | 88 | `"Logistics module needs database integration."` | Move to i18n or implement actual data |
| 8 | `src/pages/Accommodation.tsx` | 63 | `const [totalAllotments, setTotalAllotments] = useState(120)` | ✅ replaced by `DEFAULT_ALLOTMENTS` |
| 9 | `src/pages/Accommodation.tsx` | 101 | `hotelCount || 4` | ✅ replaced by `MIN_HOTEL_COUNT` |
| 10 | `src/pages/Accommodation.tsx` | 75-82 | Room pricing `getRoomPrice()`: 450, 150, 200, 180 | ✅ replaced by `ROOM_PRICES` + `REVENUE_MARGIN_RATE` |
| 11 | `src/pages/Deliveries.tsx` | 14 | `'All Sites'` filter placeholder | Move to i18n |
| 12 | `src/pages/Deliveries.tsx` | 52 | Site options: `"Main Stadium"`, `"Olympic Village"`, `"Tahitia Lagoon"`, `"Marriott Press Hub"` | Fetch from DB sites table or env config |
| 13 | `src/pages/Deliveries.tsx` | 297-300 | Site select options repeated | Same as #12 |
| 14 | `src/pages/Accreditations.tsx` | 59 | `const AVAILABLE_ZONES = ['1', '2', '3', '4', '5', 'V', 'S', 'M', 'P']` | Move to DB config or constants |
| 15 | `src/pages/Hospitalities.tsx` | 235-238 | Seat section options: `"Tribune d'Honneur"`, `"Loge Présidentielle"`, etc. | Move to DB config or constants |
| 16 | `src/pages/Catering.tsx` | 162-163 | `'50'`, `'0'`, `'0'`, `'0'`, `'0'` (default dietary counts) | Use empty/default from constant |
| 17 | `src/pages/Catering.tsx` | 252-257 | Service format options: `"BUFFET"`, `"PLATED"`, etc. | Move to constants |
| 18 | `src/pages/Login.tsx` | 94 | `'Account created successfully. You can now sign in.'` | Move to i18n |
| 19 | `src/pages/Login.tsx` | 209-210 | `"Or continue with"`, `"Sign in with Google"` | Move to i18n |
| 20 | `src/pages/Settings.tsx` | 10 | `'Pacific Games Tahiti 2027'` | Read from DB organization settings |
| 21 | `src/pages/Settings.tsx` | 11 | `'#4F46E5'` | Read from DB organization color |
| 22 | `src/pages/Settings.tsx` | 38 | `'portal.tahiti2027.com'` (domain) | Read from env var or DB |
| 23 | `src/lib/supabase.ts` | 7-8 | `''` (empty fallback for env vars) | Let the throw catch misconfiguration (already done) |
| 24 | `src/store/appStore.ts` | 74 | `'user@example.com'` (fallback email) | Use actual user email or undefined |
| 25 | `src/store/appStore.ts` | 76 | `'ADMIN'` (default role on auto-create) | Use `'MEMBER'` to match DB default or reject auto-create |
| 26 | `src/store/appStore.ts` | 71 | `'Default Organization'` (auto-create name) | Use user domain or reject auto-create |
| 27 | `src/pages/Transport.tsx` | 182-186 | `'08:00 - 16:00'` default shift hours | Use empty string |
| 28 | `src/pages/Uniforms.tsx` | 105 | `'S, M, L, XL'` default sizes | Use empty string |
| 29 | `src/pages/Uniforms.tsx` | 106 | `'100'` default total | Use empty string |
| 30 | `src/pages/Uniforms.tsx` | 331 | `'100'` default total in create form | Same as #29 |
| 31 | `src/pages/AdditionalServices.tsx` | 97 | `'100'` default limit | Use empty or 0 |
| 32 | `src/pages/AdditionalServices.tsx` | 93 | `'50'` default price | Use empty string |
| 33 | `src/components/layout/Header.tsx` | 32 | `'System Live'` fallback in t() | Remove fallback, rely on i18n key |
| 34 | `src/pages/Accommodation.tsx` | 24 | `'Hébergement & Allotements'` (French hardcoded title) | ✅ moved to i18n |
| 35 | `src/pages/Accommodation.tsx` | 256 | placeholder | ✅ moved to i18n |
