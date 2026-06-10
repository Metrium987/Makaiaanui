# 10 — Application Gaps

[MODE A — Subagent]

> This file identifies features that are **missing from the application code** (not the documentation). These are functional gaps that a production event logistics platform should have.

## Core Infrastructure Gaps

| # | Gap | Impact | Priority |
|---|-----|--------|----------|
| 1 | **No server-side rendering or API gateway** | All business logic is client-side. No validation, caching, or transformation layer. | HIGH |
| 2 | **No error boundary** | React errors crash the entire app with no fallback UI | HIGH |
| 3 | **No loading skeletons** | All loading states are basic text ("Loading...") — poor UX | MEDIUM |
| 4 | **No pagination** | Tables load all records at once. With hundreds of entries, performance degrades. | MEDIUM |
| 5 | **No data export** | No CSV/PDF export for any module (reports, accommodation, deliveries, etc.) | MEDIUM |
| 6 | **No filtering/pagination on API side** | All filtering is client-side (Array.filter in React). Wastes bandwidth for large datasets. | MEDIUM |
| 7 | **No websocket/realtime beyond activity_logs** | Only one realtime subscription exists — no live updates for transport, deliveries, etc. | LOW |

## Missing Modules / Features

| # | Gap | Impact | Priority |
|---|-----|--------|----------|
| 8 | **No password reset flow** | Users who forget passwords are locked out | HIGH |
| 9 | **No user management UI** | Settings has "Users & Tenancy" sidebar item but it's a dead button (no content) | HIGH |
| 10 | **No roles & permissions UI** | Settings has "Roles & Permissions" sidebar item — dead button | MEDIUM |
| 11 | **No integrations configuration UI** | Settings has "Integrations (API)" sidebar item — dead button | MEDIUM |
| 12 | **No notification system** | No email, SMS, or in-app notifications for status changes, assignments, etc. | MEDIUM |
| 13 | **No dashboard customization** | Dashboard is static — users cannot configure widgets or layout | LOW |
| 14 | **No search across modules** | No global search bar to find records across all modules | LOW |
| 15 | **No audit trail viewer** | `activity_logs` table exists but there's no dedicated audit log viewer page | LOW |

## Data Integrity Gaps

| # | Gap | Impact | Priority |
|---|-----|--------|----------|
| 16 | **No database-level check constraints** | Status fields (`'PENDING'`, `'CONFIRMED'`, etc.) accept any string — DB has no validation | MEDIUM |
| 17 | **No unique constraints** | No duplicate detection on accreditation codes, uniform names, delivery manifests, etc. | MEDIUM |
| 18 | **No soft delete** | All deletions are hard deletes — no recovery possible | MEDIUM |
| 19 | **No timestamps on updates** | No `updated_at` column on any table — cannot track when records were last modified | MEDIUM |
| 20 | **No data archival** | Old activity logs, completed deliveries, etc. accumulate indefinitely | LOW |

## UX / Frontend Gaps

| # | Gap | Impact | Priority |
|---|-----|--------|----------|
| 21 | **Confirmation dialogs use `window.confirm()`** | Browser-native confirm dialogs — inconsistent with app styling, cannot be styled | LOW |
| 22 | **No keyboard shortcuts** | Power users cannot navigate or perform actions without mouse | LOW |
| 23 | **No mobile-responsive optimization** | App uses Tailwind responsive classes but complex tables (every module) are unusable on mobile | MEDIUM |
| 24 | **No dark mode** | Slate/white theme only | LOW |
| 25 | **No onboarding/tour for new users** | First-time users see empty tables with no guidance | LOW |
| 26 | **No batch operations** | Cannot select multiple records and bulk-update status | MEDIUM |

## Technical Debt Gaps

| # | Gap | Impact | Priority |
|---|-----|--------|----------|
| 27 | **No unit/integration tests** | Zero tests exist — no `*.test.ts`, `*.spec.ts` files found | HIGH |
| 28 | **No CI/CD configuration** | No GitHub Actions or similar pipeline | MEDIUM |
| 29 | **No Docker configuration** | Environment is not containerized | LOW |
| 30 | **No TypeScript strict mode** | `tsconfig.json` has `strict: false` (not set) — many type errors are suppressed | MEDIUM |
| 31 | **No import sorting/organization convention** | Imports are inconsistent across files | LOW |
| 32 | **`useApi.ts` is a monolith (~450 lines)** | Single file containing 12 hooks — breaks single-responsibility principle | MEDIUM |
