# 03 — Database & Business Logic

[MODE A — Subagent]

## Schema Overview

**File:** `supabase/migrations/20240101000000_init.sql` and `20240101000000_init_schema.sql`

### Core Tables (init.sql)

| Table | Key Columns | Business Role |
|-------|-------------|---------------|
| `organizations` | id, name, domain, brand_color, logo_url | Multi-tenant isolation root |
| `profiles` | id, email, role, organization_id | User auth linkage (FK → auth.users) |
| `providers` | name, type, contact_name, contact_email, status | External supplier registry |
| `clients` | name, type, contact_name, contact_email, status | External client registry |
| `activity_logs` | action, detail, user_id, organization_id | Audit trail |

### Module Tables (init_schema.sql)

| Table | Key Business Columns | Business Logic |
|-------|---------------------|----------------|
| `transport_shifts` | driver_name, vehicle, time (VARCHAR), status, progress | Driver scheduling with text-based time (no native TIMESTAMP) |
| `transport_transfers` | time (VARCHAR), from_location, to_location, pax | Point-to-point transport, text time field |
| `accommodation_rooms` | guest_name, group_name, hotel_name, room_type, check_in_date, status | Hotel room allocation with status tracking |
| `catering_menus` | title, start_time (TIMESTAMPTZ), end_time (TIMESTAMPTZ), service_type, pax_pax, pax_veg, pax_vgn, pax_gf, pax_halal | Meal planning with scalar dietary columns (fixed per bug ID 003) |
| `hospitality_packages` | title, price (VARCHAR), capacity, sold, total | VIP package sales — NOTE: price is VARCHAR, not NUMERIC |
| `hospitality_guests` | section, guest, seat_num | Individual seat assignment |
| `accreditations` | code, name, count, pending, zones (VARCHAR[]) | Population management with array zones |
| `uniforms` | item_name, sizes, total, deployed, status | Inventory tracking |
| `laundry_requests` | client_name, group_name, service_type, items_count, status | Laundry pipeline (COLLECTED→IN_PROGRESS→READY→RETURNED) |
| `additional_services` | title, service_type, price (NUMERIC), sold_count, limit_count | Paid service catalog |
| `deliveries` | site, status, scheduled_time (TIMESTAMPTZ), detail | Goods receiving |

## Business Logic — Anomalies

### Stored in Application Code (not DB)

All business validation is in React components, including:
- **Price formatting** (`Hospitalities.tsx`: `parsePrice()`, price stored as VARCHAR with `€` prefix)
- **Stock status calculation** (`Uniforms.tsx`: auto-calculates HEALTHY/LOW_STOCK/OUT_OF_STOCK from total/deployed)
- **Occupancy rates** (Accommodation.tsx: `occupancyRate`, `getRoomPrice()`)
- **Capacity validation** (AdditionalServices.tsx: sold-out check, fill percentage)

### SQL Security

- `get_user_role()` and `get_user_org()` are SECURITY DEFINER functions
- Every module table has: SELECT policy (org-scoped) + ALL policy (role-gated)
- **Inconsistency**: Some ALL policies require `FRONT_OFFICE`, others only `BACK_OFFICE`/`ADMIN`
  - transport_shifts, accommodation_rooms, accreditations, laundry_requests, deliveries: FRONT_OFFICE can write
  - transport_transfers, catering_menus, hospitality_*, uniforms, additional_services: BACK_OFFICE/ADMIN only
- **profiles** role default changed to `MEMBER` (init_schema.sql line ~275) but auth system uses `FRONT_OFFICE`, `BACK_OFFICE`, `ADMIN`

## Data Flow

```
React Component → useXYZ Hook → supabase.from('table').select/insert/update/delete → Supabase RLS → Postgres
                                                                                              ↑
                                                                                    get_user_role() / get_user_org()
```

## Missing Database Features

- No foreign key constraints on `activity_logs.user_id → profiles.id` (uses ON DELETE SET NULL)
- No check constraints on status fields (e.g., status can be any string)
- No indexes beyond PK defaults
- No database-level computed columns
- No materialized views for reporting
