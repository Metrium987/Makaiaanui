# 08 — Dead Code List

[MODE A — Subagent]

| # | File | Line(s) | Item | Reason for Removal |
|---|------|---------|------|--------------------|
| 1 | `src/types/index.ts` | 14-18 | `TransportShift` interface | Not used anywhere — hooks return `any[]` for transport_shifts |
| 2 | `src/types/index.ts` | 20-26 | `Organization` interface | Not imported or used in any `src/` file |
| 3 | `src/types/index.ts` | 1-4 | `EntityStatus` type | Only used in Provider/Client interfaces which themselves are not used |
| 4 | `src/types/index.ts` | 6-12 | `Profile` interface | Interface defines `SUPER_ADMIN \| ORG_ADMIN \| OPERATOR \| VIEWER` roles but DB uses `MEMBER \| FRONT_OFFICE \| BACK_OFFICE \| ADMIN` — **actively misleading** |
| 5 | `src/hooks/useApi.ts` | 18 | `import { TransportShift } from '../types'` | Imported but never referenced in the hook body |
| 6 | `package.json` | — | `"motion": "^12.23.24"` | Installed but never imported in any source file |
| 7 | `package.json` | — | `"express"`, `"@types/express"` | Listed but no Express server exists in project |
| 8 | `package.json` | — | `"dotenv"` | Env vars are read via Vite's `import.meta.env`, not dotenv |
| 9 | `package.json` | — | `"tsx"` | Not used in any script or file |
| 10 | `src/components/layout/AppLayout.tsx` | 1, 5, 7 | `React` import, `children` prop | `children` prop is defined but `Outlet` is used instead; `React` default import not needed with React 19 JSX transform |
| 11 | `src/pages/Transport.tsx` | 19 | `Check` icon import from lucide-react | Imported but not used in Transport.tsx JSX |
| 12 | `src/pages/Accommodation.tsx` | 17, 24 | `Check` icon import | `Check` is imported from lucide-react but never used |
| 13 | `src/pages/Accommodation.tsx` | 13 | `DollarSign` icon import | unused in JSX |
| 14 | `src/pages/Accreditations.tsx` | 15 | `CheckCircle` icon import | unused |
| 15 | `src/pages/Accreditations.tsx` | 14 | `Filter` icon import | unused |
| 16 | `src/pages/Transport.tsx` | 24-25 | `Check`, `RefreshCw` specific icon checks | `RefreshCw` is used (line 232); `Check` is unused |
| 17 | `src/pages/Deliveries.tsx` | 23 | `Search` icon import | unused |
| 18 | `metadata.json` | — | `"majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]` | No Gemini API integration code exists in any file |
