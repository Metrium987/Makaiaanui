# 02 — Modules & Functionalities (Backend / API Hooks)

[MODE A — Subagent]

> This project has no traditional backend server. "Backend" = Supabase (Postgres + RLS) + client-side hooks in `src/hooks/useApi.ts`.

## Supabase Database Tables

| Module | Table | Purpose |
|--------|-------|---------|
| Transport | `transport_shifts` | Driver shift records (driver_name, vehicle, time, status, progress) |
| Transport | `transport_transfers` | Point-to-point transfer requests (time, from/to locations, pax) |
| Accommodation | `accommodation_rooms` | Rooming list entries (guest, group, hotel, room_type, check_in, status) |
| Catering | `catering_menus` | Meal service slots (title, start/end, service_type, dietary counts) |
| Hospitalities | `hospitality_packages` | VIP package definitions (title, price, capacity, sold, total) |
| Hospitalities | `hospitality_guests` | VIP seat assignments (section, guest, seat_num) |
| Accreditations | `accreditations` | Population/demographic groups (code, name, count, pending, zones[]) |
| Uniforms | `uniforms` | Apparel inventory items (item_name, sizes, total, deployed, status) |
| Laundry | `laundry_requests` | Laundry service requests (client, group, service_type, items_count, status) |
| Additional Services | `additional_services` | Service catalog entries (title, type, price, sold_count, limit_count) |
| Deliveries | `deliveries` | Incoming goods logistics (site, status, scheduled_time, detail) |
| Core | `organizations` | Tenant organizations |
| Core | `profiles` | User profiles with roles |
| Core | `providers` | External provider contacts |
| Core | `clients` | Client contacts |
| Core | `activity_logs` | Audit trail entries |

## API Hooks (src/hooks/useApi.ts)

All hooks live in a single monolithic `useApi.ts` file (~450 lines). Pattern: `useState` + `useEffect` on mount + `organizationId` dependency.

| Hook | Tables | Operations | Used By |
|------|--------|------------|---------|
| `useProviders()` | providers | fetch (SELECT) | Crm.tsx |
| `useClients()` | clients | fetch (SELECT) | Crm.tsx |
| `useActivityLogs()` | activity_logs | fetch + realtime subscription (INSERT) | Dashboard.tsx |
| `useTransportShifts()` | transport_shifts | CRUD + refresh | Transport.tsx |
| `useTransportTransfers()` | transport_transfers | CRUD + refresh | Transport.tsx |
| `useAccommodationRooms()` | accommodation_rooms | CRUD + refresh | Accommodation.tsx |
| `useDeliveries()` | deliveries | CRUD + refresh | Deliveries.tsx |
| `useHospitalityPackages()` | hospitality_packages | CRUD + refresh | Hospitalities.tsx |
| `useHospitalityGuests()` | hospitality_guests | CRUD + refresh | Hospitalities.tsx |
| `useAccreditations()` | accreditations | CRUD + refresh | Accreditations.tsx |
| `useUniforms()` | uniforms | CRUD + refresh | Uniforms.tsx |
| `useLaundryRequests()` | laundry_requests | CRUD + refresh | Laundry.tsx |
| `useAdditionalServices()` | additional_services | CRUD + refresh | AdditionalServices.tsx |
| `useCateringMenus()` | catering_menus | CRUD + refresh (with dietary mapping) | Catering.tsx |

## SQL Security Functions

| Function | File | Line | Purpose |
|----------|------|------|---------|
| `get_user_role()` | `init_schema.sql` | ~9 | Returns auth user's role from profiles |
| `get_user_org()` | `init_schema.sql` | ~14 | Returns auth user's organization_id |
| `handle_new_user()` (trigger) | `init_schema.sql` | ~285 | Auto-creates profile row on auth signup |

## Impact Analysis

- **No server-side logic** exists beyond Supabase RLS policies. All business logic is client-side.
- **Database queries are unfiltered by organization** in some hooks (transport_shifts, transport_transfers, accommodation_rooms, accreditations, uniforms, laundry_requests, additional_services, deliveries — fetch ALL rows then rely on RLS).
- **`useActivityLogs`** has a realtime subscription listening to INSERT events — the only realtime feature.
- **useCateringMenus** has a `mapMenuFromDb()` transformation layer that remaps `pax_pax` → `pax`, `pax_veg` → `veg`, etc., adding runtime overhead.
