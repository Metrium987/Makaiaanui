<div align="center">
  <h1>🏝️ Makaiaanui</h1>
  <p><strong>Pacific Games 2027 — Logistics & Operations Hub</strong></p>
  <p>
    <img src="https://img.shields.io/badge/react-19-61DAFB?logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/typescript-5.8-3178C6?logo=typescript" alt="TypeScript 5.8" />
    <img src="https://img.shields.io/badge/vite-6-646CFF?logo=vite" alt="Vite 6" />
    <img src="https://img.shields.io/badge/supabase-live-3FCF8E?logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/tailwind-4-06B6D4?logo=tailwindcss" alt="Tailwind v4" />
    <img src="https://img.shields.io/badge/i18n-fr_|_en-ok" alt="i18n FR/EN" />
  </p>
</div>

---

## 📋 Overview

**Makaiaanui** is the central operations platform for the **Pacific Games Tahiti 2027**. It manages the complete logistics pipeline across **9 operational modules**, from fleet dispatch to accreditation printing, catering schedules to VIP seating protocols.

Built as a single-page React application with a Supabase backend, it provides:

- 🔐 **Role-based access** (Admin, Back Office, Front Office, Member)
- 📊 **Real-time dashboard** with live activity tracking
- 🌐 **Bilingual interface** — French & English (full i18n coverage)
- 📑 **Report engine** — CSV, Excel, PDF exports across all modules
- 👥 **Client Portal** — white-label request submission with approval workflow

---

## 🧩 Modules

| Module | Description | Key Features |
|--------|-------------|--------------|
| 🚗 **Transport** | Fleet & dispatch | Driver shifts, transfer manifests, live status tracking |
| 🏨 **Accommodation** | Rooming & allotments | Rooming lists, hotel allocation, budget estimation |
| 🍽️ **Catering** | Meal planning | Dietary tracking (veg/vegan/GF/halal), volume forecasting |
| 🎫 **Hospitalities** | VIP & protocol | Package management, seating allocation, quick-sale |
| 🏷️ **Accreditations** | Badge & identity | Zone authorization, print center, population matrix |
| 📦 **Deliveries** | Logistics & docks | Dock scheduling, QR signoff, delivery tracking |
| 🧺 **Laundry** | Linen services | Service catalog, status pipeline (collect→wash→ready→return) |
| 👕 **Uniforms** | Apparel inventory | Size distribution, warehouse stock, fast-deploy |
| ➕ **Additional Services** | Optional bookings | Catalog management, capacity limits, quick-booking |
| 🏢 **CRM** | Providers & clients | Contact directory, status management |
| 📨 **Client Portal** | Request hub | Submit & track requests, approve/reject workflow |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 5.8, Vite 6 |
| **Styling** | Tailwind CSS v4, lucide-react icons |
| **State** | Zustand 5, React hooks |
| **Routing** | react-router-dom v7 |
| **Backend** | Supabase (Postgres + Auth + Realtime) |
| **i18n** | i18next + react-i18next (French / English) |
| **Reports** | xlsx (Excel), jsPDF + jspdf-autotable (PDF), PapaParse (CSV) |
| **Auth** | Supabase Auth (email/password + Google OAuth) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/<your-org>/makaiaanui.git
cd makaiaanui

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# 4. Run SQL migrations
# Execute all .sql files in supabase/migrations/ via Supabase SQL Editor
# Then execute supabase/gap012_client_requests.sql for the client portal table

# 5. Start the dev server
npm run dev
```

The app will be available at **http://localhost:3000**.

### Environment Variables

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
VITE_APP_NAME="Makaiaanui"
```

---

## 📁 Project Structure

```
makaiaanui/
├── src/
│   ├── components/        # Shared UI (Layout, Auth, Skeleton, BatchToolbar, Pagination)
│   ├── contexts/          # React contexts (Auth)
│   ├── hooks/             # Custom hooks (useApi — 16 data hooks, useBatchSelection)
│   ├── i18n/              # i18next config + locale files (en.json, fr.json)
│   ├── lib/               # Utilities (Supabase client, CSV/Excel/PDF exports)
│   ├── locales/           # Translation files (en.json, fr.json — 120+ keys each)
│   ├── pages/             # 16 page components (Dashboard, 9 modules, Settings, CRM, etc.)
│   ├── store/             # Zustand store (app state)
│   └── types/             # TypeScript interfaces (40+ typed models)
├── supabase/
│   └── migrations/        # SQL schema migrations + gap012_client_requests.sql
├── docs/                  # Audit documentation (spec reconciliation, bug history, gaps)
├── package.json
├── vite.config.ts
├── tsconfig.json          # strict: true — zero type errors
└── .env.example
```

---

## 🔐 Roles & Permissions

| Role | Access |
|------|--------|
| **Admin** | Full access — all modules, settings, user management, audit logs |
| **Back Office** | All operational modules + client portal review/approval |
| **Front Office** | Limited modules (transport, accommodation, accreditations, laundry, deliveries) |
| **Member** | Dashboard only |

Managed via Supabase RLS policies on all 17 tables + frontend route guards.

---

## 🏗️ Build & Deploy

```bash
# Production build
npm run build    # Outputs to dist/

# Preview build locally
npm run preview

# TypeScript check
npm run lint     # tsc --noEmit (strict mode, zero errors)
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Build settings for Vercel:**
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

---

## 📊 Development Status

| Category | Resolved |
|----------|----------|
| 🐛 Bugs | 14/15 (+1 WONTFIX) |
| 🔤 Hardcoded strings | 35/35 |
| 🧹 Dead code | 18/18 |
| 🕳️ Application gaps | **14/14** |
| 📝 Total entry points | 81 resolved issues across 14 modules |

See `docs/TODOFREEBUFF01.md` for the complete bug-fix queue and `docs/GLOBAL_BUG_HISTORY.md` for all resolved entries.

---

## 📄 License

MIT © 2026 — See [LICENSE](./LICENSE) for details.

---

<div align="center">
  <sub>Built for the Pacific Games Tahiti 2027 🇵🇫</sub>
</div>
