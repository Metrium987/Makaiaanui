# 04 — Frontend Architecture

[MODE A — Subagent]

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Routing | React Router v7 (BrowserRouter) |
| State | Zustand (global: appStore) + React useState (local page state) |
| i18n | i18next + react-i18next (en, fr) |
| Icons | Lucide React |
| Animation | motion (installed, not imported anywhere) |
| Backend | Supabase JS v2 (direct client queries) |

## Component Tree

```
<App>
  <AuthProvider>
    <Router>
      <Routes>
        / → <Landing />
        /login → <Login />
        /auth/callback → <AuthCallback />
        <ProtectedRoute>
          <AppLayout>
            <Sidebar />
            <Header />
            <Outlet /> → Module Pages
          </AppLayout>
        </ProtectedRoute>
        * → <Navigate to="/" />
      </Routes>
    </Router>
  </AuthProvider>
</App>
```

## Shared Components

| Component | File | Props | Usage |
|-----------|------|-------|-------|
| `AppLayout` | `components/layout/AppLayout.tsx` | children (unused), Outlet | Wraps all protected routes |
| `Sidebar` | `components/layout/Sidebar.tsx` | none (reads store) | Navigation panel |
| `Header` | `components/layout/Header.tsx` | none (reads store) | Top bar with lang/signout |
| `ProtectedRoute` | `components/auth/ProtectedRoute.tsx` | none (uses Outlet) | Auth guard |

## Module Page Architecture (Common Pattern)

Every module page follows an identical pattern:
1. Import icons from lucide-react
2. Import corresponding hook from useApi.ts
3. Define state for modals (showAddModal, editingItem, actionLoading, actionError)
4. Define form state fields
5. Define CRUD handlers (handleCreate, handleUpdate, handleDelete)
6. Define metric aggregators from hook data
7. Render: header → metric cards → table/grid → CRUD modals

**No shared components used across modules** — every page has its own modal JSX, table JSX, metrics layout.

## i18n Coverage

| Page | Uses i18n? | Notes |
|------|-----------|-------|
| Landing.tsx | **Yes** | Full coverage |
| Login.tsx | Partial | Mix of t() calls and hardcoded English strings ("Sign Up", "Sign up", "Confirm Password") |
| Dashboard.tsx | Partial | Uses `t('dashboard.title')` but also hardcoded "All Systems Normal", "tahiti-2027-core" |
| Transport.tsx | Partial | Uses `t()` for nav items but hardcoded modal text |
| Accommodation.tsx | Partial | Hardcoded French title "Hébergement & Allotements" |
| Catering.tsx | **No** | All hardcoded English |
| Hospitalities.tsx | **No** | All hardcoded English + French |
| Accreditations.tsx | **No** | All hardcoded English |
| Deliveries.tsx | **No** | All hardcoded English |
| Laundry.tsx | **No** | All hardcoded English |
| Uniforms.tsx | **No** | All hardcoded English |
| AdditionalServices.tsx | **No** | All hardcoded English + "Services Additionnels" (French title) |
| Crm.tsx | **No** | All hardcoded English |
| Settings.tsx | **No** | All hardcoded English |

## Unused Dependencies

| Package | Reason |
|---------|--------|
| `motion` | Installed in package.json but never imported in any source file |
| `@types/express` | Dev dependency for Express types — Express is not used in this frontend |
| `express` | Listed in dependencies but no `import express from 'express'` in any file |
| `dotenv` | Listed in dependencies but not imported anywhere |
| `tsx` | Dev dependency — used for running TypeScript scripts if any, none found |
| `esbuild` | Dev dependency — likely unused, Vite uses its own esbuild bundled version |

## Front ↔ Back Data Flow

```
User Action → Page Component → useXYZ Hook → supabase client → Supabase REST API → Postgres → Response → Hook state → Re-render
```

No API gateway, no server-side validation, no caching layer between frontend and DB.
