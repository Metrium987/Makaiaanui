# 05 — API & MCP Interfaces

[MODE A — Subagent]

## Application Routes (React Router)

| Route | Component | Auth Required | Access Level |
|-------|-----------|---------------|--------------|
| `/` | Landing | No | Public |
| `/login` | Login | No | Public |
| `/auth/callback` | AuthCallback | No | Public (OAuth) |
| `/app` | Dashboard | Yes | All |
| `/app/transport` | Transport | Yes | All |
| `/app/accommodation` | Accommodation | Yes | All |
| `/app/catering` | Catering | Yes | All |
| `/app/hospitalities` | Hospitalities | Yes | All |
| `/app/accreditations` | Accreditations | Yes | All |
| `/app/deliveries` | Deliveries | Yes | All |
| `/app/laverie` | Laundry | Yes | All |
| `/app/uniforms` | Uniforms | Yes | All |
| `/app/services-additionnels` | AdditionalServices | Yes | All |
| `/app/crm` | Crm | Yes | Restricted (no FRONT_OFFICE) |
| `/app/settings` | Settings | Yes | Restricted (no FRONT_OFFICE) |
| `*` | Redirect → `/` | No | Public |

## Supabase API Endpoints (via supabase-js)

### Auth Endpoints (Supabase Auth API)

| Operation | Method | Endpoint | Called From |
|-----------|--------|----------|-------------|
| getSession | GET | `/auth/v1/user` | AuthContext.tsx, AuthCallback.tsx |
| onAuthStateChange | WS | `/auth/v1/events` | AuthContext.tsx |
| signUp | POST | `/auth/v1/signup` | Login.tsx (isSignUp) |
| signInWithPassword | POST | `/auth/v1/token?grant_type=password` | Login.tsx |
| signInWithOAuth | GET | `/auth/v1/authorize?provider=google` | Login.tsx |
| signOut | POST | `/auth/v1/logout` | AuthContext.tsx |

### Database Endpoints (Supabase Data API)

All hooks use the generic supabase-js client methods. Equivalent REST:

| Table | Operations | Equivalent REST |
|-------|-----------|----------------|
| `providers` | SELECT | `GET /rest/v1/providers?order=name` |
| `clients` | SELECT | `GET /rest/v1/clients?order=name` |
| `activity_logs` | SELECT + realtime | `GET /rest/v1/activity_logs?order=created_at.desc&limit=10` |
| `transport_shifts` | SELECT, INSERT, UPDATE, DELETE | CRUD on `/rest/v1/transport_shifts` |
| `transport_transfers` | SELECT, INSERT, UPDATE, DELETE | CRUD on `/rest/v1/transport_transfers` |
| `accommodation_rooms` | SELECT, INSERT, UPDATE, DELETE | CRUD on `/rest/v1/accommodation_rooms` |
| `catering_menus` | SELECT, INSERT, UPDATE, DELETE | CRUD on `/rest/v1/catering_menus` |
| `hospitality_packages` | SELECT, INSERT, UPDATE, DELETE | CRUD on `/rest/v1/hospitality_packages` |
| `hospitality_guests` | SELECT, INSERT, DELETE | CRUD on `/rest/v1/hospitality_guests` |
| `accreditations` | SELECT, INSERT, UPDATE, DELETE | CRUD on `/rest/v1/accreditations` |
| `uniforms` | SELECT, INSERT, UPDATE, DELETE | CRUD on `/rest/v1/uniforms` |
| `laundry_requests` | SELECT, INSERT, UPDATE, DELETE | CRUD on `/rest/v1/laundry_requests` |
| `additional_services` | SELECT, INSERT, UPDATE, DELETE | CRUD on `/rest/v1/additional_services` |
| `deliveries` | SELECT, INSERT, UPDATE, DELETE | CRUD on `/rest/v1/deliveries` |

### Realtime Channel

| Channel | Event | Table | Used By |
|---------|-------|-------|---------|
| `activity-logs-changes` | INSERT | `activity_logs` | Dashboard.tsx |

## MCP Interfaces

No MCP (Model Context Protocol) interfaces are implemented. The `metadata.json` declares `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` but no Gemini API integration code exists in the frontend.

## Input/Output Specifications

All API interactions are:
- **Input:** Supabase-js query builders (`.select()`, `.insert()`, `.update()`, `.delete()`)
- **Output:** Typed as `any[]` in all hooks (no TypeScript validation on API responses)
- **Error handling:** try/catch with `error instanceof Error` check — all errors presented as UI alerts or form errors
