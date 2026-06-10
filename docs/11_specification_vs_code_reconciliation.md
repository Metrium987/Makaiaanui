# 11 — Specification vs Code Reconciliation

[MODE A — Subagent]

> **Methodology:** Strict cross-referencing of the *Cahier des Charges Makaiaanui* (9 operational modules + global architecture) against the audited codebase (files 01-10) + SQL schema (`init_schema.sql`). Zero-tolerance rules applied: MOCKS = REJECTED, FILES ≠ FEATURES, CONCRETE LOGIC ONLY. Each specification sub-feature is categorized as [MATCH], [MISSING], [INCOMPLETE], or [DRIFT].

---

## 1. SUMMARY METRICS

| Metric | Count |
|--------|-------|
| Total granular features extracted from specifications | **58** |
| Fully Implemented [MATCH] — concrete, real working logic | **4** (6.9%) |
| Missing or Mock/Stub [MISSING] | **33** (56.9%) |
| Incomplete — partial implementation [INCOMPLETE] | **21** (36.2%) |
| Scope Drift — coded but not specified [DRIFT] | **0** (0%) |

**MATCH features (4) — features with concrete, real working logic, no mocks:**

| # | Feature | File(s) | Verification |
|---|---------|---------|--------------|
| 1 | **Email/Password Authentication** (Login + Signup) | `Login.tsx`, `AuthContext.tsx` | Real Supabase `signInWithPassword()` and `signUp()` calls. Session persists via `onAuthStateChange`. Error/success feedback shown. |
| 2 | **Google OAuth Authentication** | `Login.tsx` | Real Supabase `signInWithOAuth({ provider: 'google' })` with redirect. Session handled by `AuthCallback.tsx`. |
| 3 | **Route Protection with Role-Based Access** | `ProtectedRoute.tsx`, `App.tsx` | Real guard: unauthenticated redirected to `/login`. FRONT_OFFICE blocked from `/app/settings` and `/app/crm`. |
| 4 | **Activity Log with Realtime Subscription** | `useActivityLogs()` in `useApi.ts`, `Dashboard.tsx` | Real Supabase channel subscription `('activity-logs-changes', INSERT)`. New logs prepend in real time. |

---

---

## 2. MISSING FEATURES & REJECTED MOCKS [MISSING]

*Features present in the specifications but completely absent in the code, or existing only as stubs/mocks.*

### Global Architecture

| Spec Section | Feature | Reason for Rejection |
|:---|---|:---|
| Architecture | **Interface Client (Front Office)** — White-label portal for clients to make and track requests. | **MISSING.** No client-facing portal exists. The current UI is a single back-office interface. Login leads directly to `/app` dashboard. No client request submission workflow. |
| Architecture | **Applications Mobiles** — *Element Driver* (chauffeurs), *Element Dispatch* (coordinateurs) | **MISSING.** No mobile apps, no PWA manifest, no mobile-specific code paths. |
| Architecture | **Workflow Étape 1 — Paramétrage** des ressources et de l'offre | **MISSING.** No configuration/setup wizard. Settings page has 3 dead sidebar items ("Users & Tenancy", "Roles & Permissions", "Integrations"). |
| Architecture | **Workflow Étape 2 — Recensement des demandes** via portail client | **MISSING.** No client-side request submission form in any module. All CRUD is done directly by back-office users. |
| Architecture | **Workflow Étape 4 — Opérations sur le terrain le jour J** | **MISSING.** No field operations workflow, no check-in, no mobile data collection. |
| Architecture | **Workflow Étape 5 — Rapports et extraction** (Excel/PDF) | **MISSING.** Zero export functionality. No CSV, PDF, or Excel generation in any module. |

### Module Transport (2.1)

| Spec Section | Feature | Reason for Rejection |
|:---|---|:---|
| Transport | **Gestion des véhicules** — Vehicle registry with characteristics | **MISSING.** No `vehicles` table in SQL schema. `transport_shifts.vehicle` is a free-text VARCHAR. Specs require structured vehicle management. |
| Transport | **Chauffeurs — langues parlées** | **MISSING.** No `languages` column or `driver_languages` table in schema. No UI for language selection. |
| Transport | **Gestion des sites** — Site registry for departure/arrival points | **MISSING.** No `sites` table in SQL schema. All locations (`from_location`, `to_location`) are free-text VARCHAR. SQL structural gap. |
| Transport | **Calcul auto des temps de trajet via Google Maps** | **MISSING.** No Google Maps API calls anywhere in the codebase. No distance/duration calculation. |
| Transport | **Géolocalisation live des chauffeurs** | **MISSING.** No GPS tracking, no map component, no real-time location streaming. |
| Transport | **Workflow — Clients font des demandes de transferts** | **MISSING.** No client-facing transfer request form. Transfers are created directly by back-office. |
| Transport | **Workflow — Chauffeurs reçoivent mission via Driver App** | **MISSING.** No Driver App, no push notification, no assignment notification system. |
| Transport | **Workflow — Suivi en direct sur carte** | **MOCK REJECTED.** The "Live Tracking Status" card in Transport.tsx (line ~132) displays hardcoded text "Database Engine Linked" with a generic car icon. No map, no tracking. |

### Module Hébergement (2.2)

| Spec Section | Feature | Reason for Rejection |
|:---|---|:---|
| Hébergement | **Paramétrage des hôtels** — Hotel catalog with room types, allotments, contracts | **MISSING.** No `hotels` table in SQL schema. Hotel names are free-text VARCHAR in `accommodation_rooms`. SQL structural gap. |
| Hébergement | **Workflow — Groupes remplissent leurs rooming-lists sur le portail** | **MISSING.** No client portal for group leaders to submit rooming lists. All entries created by back-office. |
| Hébergement | **Workflow — Transmission des listes finales aux hôteliers** | **MISSING.** No export/share mechanism for hotel partners. No PDF/CSV generation. |

### Module Restauration (2.3)

| Spec Section | Feature | Reason for Rejection |
|:---|---|:---|
| Restauration | **Affectation individuelle ou en masse** des participants aux repas | **MISSING.** No per-participant meal assignment. Only aggregate PAX counts exist. `catering_menus` has no participant linking table. |
| Restauration | **Workflow — Client réserve un volume de repas** | **MISSING.** No client-facing menu reservation form. All menus created by back-office. |
| Restauration | **Suivi des commandes et exports pour les traiteurs** | **MISSING.** No export to caterers. No order status tracking beyond the basic table view. |

### Module Hospitalités (2.4)

| Spec Section | Feature | Reason for Rejection |
|:---|---|:---|
| Hospitalités | **Réservation et paiement en ligne (intégration Stripe)** | **MISSING.** No Stripe integration. No payment tables in SQL schema. No transaction records. `hospitality_packages.price` is VARCHAR (not NUMERIC). SQL structural gap. |
| Hospitalités | **Plan de tribune interactif** pour affectation des places | **MISSING.** Current seating is a text-based form (section dropdown + random seat number). No interactive visual seating chart. |
| Hospitalités | **Outil d'accueil et d'orientation sur tablette** | **MISSING.** No tablet app, no check-in interface, no guest orientation tool. |

### Module Accréditations (2.5)

| Spec Section | Feature | Reason for Rejection |
|:---|---|:---|
| Accréditations | **Outil de création de template personnalisé** | **MISSING.** No template designer. Accreditation data is a simple code/name/zones record. |
| Accréditations | **Récolte sécurisée des infos personnelles** | **MISSING.** No PII collection form, no secure data handling. No `accreditation_applicants` table. |
| Accréditations | **Suivi du criblage par les autorités** | **MISSING.** No background check workflow, no authorization handoff, no status for vetting. |
| Accréditations | **Workflow — Client remplit sa demande en ligne** | **MISSING.** No client-facing accreditation request form. |
| Accréditations | **Impression puis scan lors de la distribution** | **MOCK REJECTED.** `handleSimulatePrint` (Accreditations.tsx, ~line 100) uses `setTimeout(1500)` to increment a counter. No printer API. No QR scanning for distribution. |

### Module Livraisons (2.6)

| Spec Section | Feature | Reason for Rejection |
|:---|---|:---|
| Livraisons | **Ajout de PDF (plans d'accès)** | **MISSING.** No file upload capability. No `files` or `attachments` table in SQL schema. |
| Livraisons | **Gestion des accès sites** | **MISSING.** No `sites` table. Delivery site names are hardcoded strings in the UI select dropdown. |
| Livraisons | **Workflow — Prestataire soumet une demande** | **MISSING.** No supplier-facing delivery request form. |
| Livraisons | **Workflow — Sécurité pointe arrivée camion sur tablette** | **MOCK REJECTED.** QR signoff (Deliveries.tsx, ~line 230) is a simulated 4×4 grid of colored divs with a manual "Sign Off Receive" button. No camera/QR scanning. |
| Livraisons | **Workflow — Accusé de bonne réception partagé** | **MISSING.** No receipt generation or sharing mechanism. |

### Module Laverie (2.7)

| Spec Section | Feature | Reason for Rejection |
|:---|---|:---|
| Laverie | **Affectation au prestataire** | **MISSING.** No provider/laundry-service assignment in the laundry workflow. SQL schema has no `assigned_provider` column. |
| Laverie | **Exports pour gestion de la facturation prestataire** | **MISSING.** No financial report export. |

### Module Uniformes (2.8)

| Spec Section | Feature | Reason for Rejection |
|:---|---|:---|
| Uniformes | **Création de packages de dotation** | **MISSING.** No package/kit grouping. Items are individual flat records. |
| Uniformes | **Distribution basée sur les mensurations des fiches clients** | **MISSING.** No measurement/sizing per individual. `uniforms.sizes` is a free-text VARCHAR. No `recipient_measurements` table. SQL structural gap. |
| Uniformes | **Gestion des éventuels retours** | **MISSING.** No return workflow. No `returned` status or return tracking. |

### Module Services Additionnels (2.9)

| Spec Section | Feature | Reason for Rejection |
|:---|---|:---|
| Services Additionnels | **Gestion des validités (génériques ou journalières)** | **MISSING.** No validity period fields. `additional_services` table has no `start_date`/`end_date` columns. SQL structural gap. |
| Services Additionnels | **Workflow — Demande via le front-office** | **MISSING.** No client-facing request form for additional services. |

### SQL Schema — Structural Gaps (integrated)

*These gaps are concrete evidence that backend persistence for the specified features does not exist.*

| Missing Table/Column | Required by Spec | Impact |
|:---|---|:---|
| No `vehicles` table | Transport — vehicle management | Driver vehicles are free-text. No structured tracking. |
| No `sites` table | Transport, Livraisons, Accréditations — site management | Locations are hardcoded strings everywhere. |
| No `hotels` table | Hébergement — hotel catalog/pricing | Hotel names are free-text. No contract pricing in DB. |
| No payment/transactions table | Hospitalités — Stripe online payments | Cannot process or record payments. |
| No `notifications` table | Global — mobile app push notifications | No assignment notification system. |
| No file/attachments table | Livraisons — PDF uploads | No document management capability. |
| No `updated_at` on any table | General audit trail | Cannot track record modification history. |
| No CHECK constraints on status fields | General data integrity | SQL accepts any string for status values. |

---

## 3. INCOMPLETE OR DEVIATING FEATURES [INCOMPLETE]

*Features that exist with partial code but do not fully respect the specifications.*

| Implemented Feature | Expected vs Actual | Missing Sub-requirement(s) |
|:---|---|:---|
| **Transport Shifts** (`transport_shifts` table) | Expected `TIMESTAMPTZ time` for sorting/filtering. Actual: `time VARCHAR(100)`. | Cannot query shifts by time range. SQL structural deviation. |
| **Transport Transfers** (`transport_transfers` table) | Expected `TIMESTAMPTZ time` + dedicated `assigned_driver` FK. Actual: `time VARCHAR(100)`, `handleAssignTransfer()` appends driver name to time string (`time + " (Assigned to X)"`), corrupting original data. | Data corruption bug. No FK to shifts table. |
| **Accommodation Rooms** | Expected hotel catalog + contract allotments. Actual: hotel_name is free-text, total allotments hardcoded as `useState(120)`. | No hotel management. Allotment is a magic number. |
| **Accommodation Cost/Revenue** (`getRoomPrice()`) | Expected actual contract pricing from DB. Actual: hardcoded switch (Single=€150, Double=€180, Twin=€200, Suite=€450). Revenue = cost × 1.15 (magic margin). | No real pricing. 15% margin unconfigurable. |
| **Catering Dietary Tracking** (`catering_menus.pax_*`) | Expected per-participant diet tracking and assignment. Actual: aggregate counts only (`pax_pax`=50, `pax_veg`=10, etc.). | Cannot link specific meals to specific participants. No individual assignment. |
| **Catering Schedule Validation** | Expected start_time < end_time validation. Actual: no validation — user can create menu where end precedes start. | Data integrity gap. |
| **Hospitality Packages** (`hospitality_packages`) | Expected NUMERIC price + Stripe payment. Actual: `price VARCHAR(100)` with `€` prefix. | No DB aggregation. No payment pipeline. SQL structural deviation. |
| **Hospitality Seating** (`hospitality_guests`) | Expected interactive seating map with drag-and-drop. Actual: text form (section dropdown) + `Math.random()` seat number. | No visual plan. No real seat mapping. |
| **Accreditations Print** (`handleSimulatePrint`) | Expected real badge printing (Zebra/PDF). Actual: `setTimeout(1500)` incrementing a counter. | Simulated. No hardware integration. |
| **Deliveries QR Signoff** (QR modal) | Expected real QR scanning via device camera. Actual: static 4×4 CSS grid simulating a QR code pattern. | Mock. No camera. No real QR parsing. |
| **Dashboard** (`Dashboard.tsx`) | Expected live metrics from all modules. Actual: "Active Shifts" shows hardcoded `0`, "Accommodation" shows `0`, "Upcoming Logistics" panel says "Logistics module needs database integration." | Static. Not pulling from actual data. |
| **Laundry Status Pipeline** | Expected full provider assignment + billing. Actual: status transitions work (COLLECTED→IN_PROGRESS→READY→RETURNED) but no provider is assigned. | Missing provider assignment step. |
| **Laundry Service Catalog** | Expected editable catalog of laundry services. Actual: service types are hardcoded select options (`"Standard Wash"`, `"Express Wash (6h)"`, etc.). | Not configurable. |
| **Uniform Stock Tracking** | Expected per-size inventory (S/M/L/XL counted separately). Actual: `sizes VARCHAR("S, M, L, XL")`, total/deployed are aggregate numbers. | Cannot track stock by size. |
| **i18n Framework Coverage** | Spec requires bilingual FRA/ENG. Framework exists (`i18n/index.ts`) but only 1/14 pages (Landing.tsx) has full i18n coverage. 10/14 pages have zero i18n usage. | 80% of UI ignores the i18n system. Coverage gap. |
| **Login i18n Coverage** | Spec requires bilingual interface (FRA/ENG). Actual: Login.tsx has hardcoded English strings (`"Sign Up"`, `"Confirm Password"`, `"Sign in with Google"`, `"Or continue with"`). | User-facing text not translated. |
| **RLS Policy Inconsistency** | Expected uniform write policies across all modules. Actual: some tables allow `FRONT_OFFICE` writes (transport_shifts, accommodation_rooms, accreditations, laundry_requests, deliveries), others restrict to `BACK_OFFICE`/`ADMIN` (transport_transfers, catering_menus, hospitality_*, uniforms, additional_services). | Inconsistent security model. Unclear rationale for differing access levels. |
| **Back Office (Admin Interface)** | Expected 4 capabilities: parameterize resources, validate requests, pilot ops in real-time, extract statistics. Actual: parameterization is minimal (hardcoded), validation workflow absent, no real-time ops dashboard, zero statistics. | All 4 admin capabilities are incomplete or missing. |
| **Auto-Profile Creation Conflict** | Expected: SQL trigger creates profiles with `MEMBER` role. Actual: `appStore.ts fetchProfile()` overrides with fallback code assigning `ADMIN` role (lines 61-87). | Two competing paths. appStore path creates privilege escalation. |
| **TypeScript Type Mismatch** (`types/index.ts`) | Expected types matching DB schema. Actual: `Profile.role` uses `'SUPER_ADMIN' \| 'ORG_ADMIN' \| 'OPERATOR' \| 'VIEWER'` but DB uses `'MEMBER' \| 'FRONT_OFFICE' \| 'BACK_OFFICE' \| 'ADMIN'`. | Types are actively misleading. No compile-time safety. |
| **Settings — Dead Sidebar Items** | Expected full configuration UI. Actual: only "Brand & White-label" has content. Three items are non-interactive buttons. | "Users & Tenancy", "Roles & Permissions", "Integrations (API)" are stubs. |
| **Workflow Step 3 — Validation Obligatoire** | Spec requires: "Gestion et affectation avec validation obligatoire par l'organisation." Actual: CRUD operations exist but there is **no validation workflow** — no pending/approved/rejected state, no approval queue, no notification to client. | Validation is a mandatory spec requirement. Entire workflow missing. |
| **Additional Services Validity** | Expected generic/daily validity periods. Actual: no date fields in table or UI. | Cannot distinguish one-day passes from full-event passes. |

---

## 4. SCOPE DRIFT [DRIFT]

*Features found in the code that are NOT justified by the Cahier des Charges specifications.*

| Audited Feature | File/Location | Assessment |
|:---|---|:---|
| **CRM Module** (Clients & Providers) | `Crm.tsx` + `useProviders()`/`useClients()` | **Not drift.** Providers and clients are implicitly required by the specs (delivery suppliers, laundry providers, accreditation requests). The CRM UI consolidates these for back-office management. |
| **GLOBAL_BUG_HISTORY.md** | `/GLOBAL_BUG_HISTORY.md` | **Not drift.** Internal development tracking artifact. Not a feature. |
| **TECHNICAL_DOC_MODULES_2_1_TO_2_4.md** | `/TECHNICAL_DOC_MODULES_2_1_TO_2_4.md` | **Not drift.** Internal documentation. Not a feature. |
| **00_global_index.md** + audit files 01-11 | `/00_global_index.md` → `/11_*.md` | **Not drift.** These are audit deliverables, not application features. |
| **`metadata.json` — `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`** | `/metadata.json` | **Not drift (but misleading).** Declares a capability that has zero implementation in the codebase. No Gemini API calls exist. This is dead metadata, not feature drift. |
| **`motion` package in dependencies** | `package.json` | **Not drift.** Installed but unused. Dependency bloat, not a feature. |
| **`@google/genai` package** | `package.json` | **Not drift.** Installed alongside the Gemini capability claim. No imports found. Dependency bloat. |
| **`express` + `@types/express` + `dotenv` + `tsx` + `esbuild`** | `package.json` | **Not drift.** Unused dependencies from project template. Dependency bloat. |

**Conclusion:** No genuine scope drift detected. All coded features correspond to modules outlined in the specifications. The only notable finding is dependency bloat and a misleading metadata capability declaration.

