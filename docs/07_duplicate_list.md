# 07 — Duplicate List

[MODE A — Subagent]

| # | File A | File B | Element | Impact |
|---|--------|--------|---------|--------|
| 1 | `src/hooks/useApi.ts` (lines 1-450) | N/A — same file | CRUD pattern duplicated across 12 hooks | ~40 lines per hook × 12 = ~480 lines of near-identical code. Each hook has: useState, fetch function, useEffect, add/update/delete functions with identical supabase patterns. **Refactor:** generic `useCrud(tableName)` factory |
| 2 | `src/pages/Deliveries.tsx` | `src/pages/Laundry.tsx` | Modal with form + table pattern | Nearly identical structure: metric cards → filtered table → add/edit modal → delete confirm. ~70% structural overlap |
| 3 | `src/pages/Accreditations.tsx` | `src/pages/Uniforms.tsx` | Form state fields pattern | Identical state management pattern for form fields |
| 4 | `src/pages/*.tsx` | All 14 pages | Action state boilerplate | Every page defines: `const [actionLoading, setActionLoading] = useState(false); const [actionError, setActionError] = useState<string | null>(null);` — ~4 lines × 14 = 56 lines |
| 5 | `src/locales/en.json` | `src/locales/fr.json` | Translation keys | Structure is identical (expected). Content differs. No issue. |
| 6 | `src/pages/Transport.tsx` | `src/pages/Hospitalities.tsx` | Dual-tab view switching | Both implement tab-style view switching with identical `activeView` useState pattern |
| 7 | `src/hooks/useApi.ts` (lines 65, 92, 119, 146, 173, 216, 260, 289, 321, 346, 374, 400) | N/A — same file | `'An error occurred'` fallback string repeated 12+ times | Replace with a shared constant or helper function |
| 8 | `src/pages/Transport.tsx` line 333 | `src/pages/Transport.tsx` line 345 | Site filter vs status filter logic (same pattern, different page) | Similar filter logic across pages |
