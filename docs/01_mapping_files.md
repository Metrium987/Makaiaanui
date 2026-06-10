# 01 — File Mapping : Path & Technical Role

[MODE A — Subagent]

## Source Files (src/)

| # | Path | Technical Role |
|---|------|---------------|
| 1 | `src/main.tsx` | App entry point — mounts React, imports i18n & global CSS |
| 2 | `src/App.tsx` | Router definition — public routes (Landing, Login, AuthCallback) + protected routes (11 modules) inside AppLayout |
| 3 | `src/index.css` | Tailwind CSS v4 import (`@import "tailwindcss"`) |
| 4 | `src/types/index.ts` | TypeScript interfaces — Profile, Organization, Provider, Client, TransportShift, ActivityLog, EntityStatus |
| 5 | `src/lib/supabase.ts` | Supabase client singleton — reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` from env |
| 6 | `src/lib/utils.ts` | Utility — `cn()` function merging clsx + tailwind-merge |
| 7 | `src/store/appStore.ts` | Zustand global store — sidebar state, session, role, organizationId, language, profile fetch |
| 8 | `src/contexts/AuthContext.tsx` | Auth context provider — session management, user state, signOut |
| 9 | `src/hooks/useApi.ts` | Monolithic API hook file — 12 hooks (useProviders, useClients, useActivityLogs, useTransportShifts, useTransportTransfers, useAccommodationRooms, useDeliveries, useHospitalityPackages, useHospitalityGuests, useAccreditations, useUniforms, useLaundryRequests, useAdditionalServices, useCateringMenus) |
| 10 | `src/i18n/index.ts` | i18n initialization — i18next + react-i18next, en/fr resources |
| 11 | `src/components/auth/ProtectedRoute.tsx` | Route guard — redirects unauthenticated users, restricts FRONT_OFFICE from /app/settings & /app/crm |
| 12 | `src/components/layout/AppLayout.tsx` | Main layout — Sidebar + Header + content area (Outlet) |
| 13 | `src/components/layout/Sidebar.tsx` | Navigation sidebar — collapsible, 12 nav items with Lucide icons |
| 14 | `src/components/layout/Header.tsx` | Top header bar — language toggle, sign-out button, system live indicator |

## Pages (src/pages/)

| # | Path | Technical Role |
|---|------|---------------|
| 15 | `src/pages/Landing.tsx` | Public landing/hero page — marketing content, navigation to /login |
| 16 | `src/pages/Login.tsx` | Auth page — email/password sign-in + sign-up, Google OAuth, access request mode |
| 17 | `src/pages/AuthCallback.tsx` | OAuth callback handler — session check + redirect to /app |
| 18 | `src/pages/Dashboard.tsx` | Main dashboard — activity log feed, system status, active shifts & accommodation widgets |
| 19 | `src/pages/Transport.tsx` | Fleet & dispatch — shift timeline, transfer queue, driver assignment, CRUD modals |
| 20 | `src/pages/Accommodation.tsx` | Rooming lists — allotment tracking, occupancy rate, cost/revenue estimation, CRUD |
| 21 | `src/pages/Catering.tsx` | Meal service schedule — dietary aggregates (VEG/VGN/GF/HALAL), time slots, CRUD |
| 22 | `src/pages/Hospitalities.tsx` | VIP packages & seating — package grid, seat allocation terminal, section load |
| 23 | `src/pages/Accreditations.tsx` | Identity & print center — population matrix, zone authorizations, simulated badge printing |
| 24 | `src/pages/Deliveries.tsx` | Goods logistics — dock schedule, QR signoff simulation, status transitions, CRUD |
| 25 | `src/pages/Laundry.tsx` | Laundry workflow — request tracking, status pipeline (Collected→Wash→Ready→Delivered) |
| 26 | `src/pages/Uniforms.tsx` | Apparel inventory — stock levels, deployment tracking, low-stock alerts |
| 27 | `src/pages/AdditionalServices.tsx` | Supplementary services catalog — sales tracking, revenue, capacity limits |
| 28 | `src/pages/Crm.tsx` | Clients & providers CRM — dual-tab (providers/clients), search, status display |
| 29 | `src/pages/Settings.tsx` | System settings — brand/whitelabel config, sidebar navigation (users, roles, integrations placeholders) |

## Config & Data Files

| # | Path | Technical Role |
|---|------|---------------|
| 30 | `src/locales/en.json` | English translations — common nav items + dashboard titles |
| 31 | `src/locales/fr.json` | French translations — same keys as en.json |
| 32 | `supabase/migrations/20240101000000_init.sql` | Core schema — organizations, profiles, providers, clients, activity_logs + basic RLS |
| 33 | `supabase/migrations/20240101000000_init_schema.sql` | Operational schema — 9 modules (transport_shifts, transport_transfers, accommodation_rooms, catering_menus, hospitality_packages, hospitality_guests, accreditations, uniforms, laundry_requests, additional_services, deliveries) + RLS policies + auto-profile trigger |
| 34 | `package.json` | Dependencies — React 19, Vite 6, Supabase JS, Tailwind CSS v4, i18next, Zustand, Lucide, motion, date-fns |
| 35 | `vite.config.ts` | Build config — React plugin + Tailwind CSS + path alias `@/` |
| 36 | `tsconfig.json` | TypeScript config — ES2022 target, bundler module resolution, JSX react-jsx |
| 37 | `.env.example` | Template env vars — GEMINI_API_KEY, APP_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY |
| 38 | `index.html` | HTML shell — root div, script entry to main.tsx |

## Coverage Summary

**Files in scope:** 33 source files (31 src/ + 2 migrations) + 5 config files (package.json, tsconfig, vite.config, .env.example, index.html)
**Files analyzed:** 38/38 (100%)
