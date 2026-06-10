-- ============================================================================
-- GAP-011: Database CHECK Constraints, Indexes & UNIQUE Constraints
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vyzbbtrohbeydgnzxxjy/sql/new
-- ============================================================================

-- ============================================================================
-- PART 1: CHECK CONSTRAINTS ON STATUS/TYPE/ROLE COLUMNS
-- Ensures only valid values enter the database (defense in depth beyond app code)
-- ============================================================================

-- Profiles: role
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS chk_profiles_role;
ALTER TABLE public.profiles
  ADD CONSTRAINT chk_profiles_role
  CHECK (role IN ('MEMBER', 'FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'));

-- Transport Shifts: status
ALTER TABLE public.transport_shifts
  DROP CONSTRAINT IF EXISTS chk_transport_shifts_status;
ALTER TABLE public.transport_shifts
  ADD CONSTRAINT chk_transport_shifts_status
  CHECK (status IN ('ACTIVE', 'OFFLINE'));

-- Accommodation Rooms: status
ALTER TABLE public.accommodation_rooms
  DROP CONSTRAINT IF EXISTS chk_accommodation_rooms_status;
ALTER TABLE public.accommodation_rooms
  ADD CONSTRAINT chk_accommodation_rooms_status
  CHECK (status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN'));

-- Accommodation Rooms: room_type
ALTER TABLE public.accommodation_rooms
  DROP CONSTRAINT IF EXISTS chk_accommodation_rooms_type;
ALTER TABLE public.accommodation_rooms
  ADD CONSTRAINT chk_accommodation_rooms_type
  CHECK (room_type IN ('Single', 'Double', 'Twin', 'Suite'));

-- Catering Menus: service_type
ALTER TABLE public.catering_menus
  DROP CONSTRAINT IF EXISTS chk_catering_menus_service_type;
ALTER TABLE public.catering_menus
  ADD CONSTRAINT chk_catering_menus_service_type
  CHECK (service_type IN ('BUFFET', 'PLATED', 'LUNCHBOX', 'BANQUET', 'COFFEE_BREAK'));

-- Uniforms: status
ALTER TABLE public.uniforms
  DROP CONSTRAINT IF EXISTS chk_uniforms_status;
ALTER TABLE public.uniforms
  ADD CONSTRAINT chk_uniforms_status
  CHECK (status IN ('HEALTHY', 'LOW_STOCK', 'OUT_OF_STOCK'));

-- Laundry Requests: status
ALTER TABLE public.laundry_requests
  DROP CONSTRAINT IF EXISTS chk_laundry_requests_status;
ALTER TABLE public.laundry_requests
  ADD CONSTRAINT chk_laundry_requests_status
  CHECK (status IN ('COLLECTED', 'IN_PROGRESS', 'READY', 'RETURNED'));

-- Laundry Requests: service_type
ALTER TABLE public.laundry_requests
  DROP CONSTRAINT IF EXISTS chk_laundry_requests_service_type;
ALTER TABLE public.laundry_requests
  ADD CONSTRAINT chk_laundry_requests_service_type
  CHECK (service_type IN ('Standard Wash', 'Express Wash (6h)', 'Dry Cleaning Only', 'Delicate Fabric Steam'));

-- Additional Services: service_type
ALTER TABLE public.additional_services
  DROP CONSTRAINT IF EXISTS chk_additional_services_type;
ALTER TABLE public.additional_services
  ADD CONSTRAINT chk_additional_services_type
  CHECK (service_type IN ('STANDARD', 'TOURISM_HOTEL', 'TRANSFERS', 'PREMIUM_MEALS', 'EQUIPMENT'));

-- Deliveries: status
ALTER TABLE public.deliveries
  DROP CONSTRAINT IF EXISTS chk_deliveries_status;
ALTER TABLE public.deliveries
  ADD CONSTRAINT chk_deliveries_status
  CHECK (status IN ('PENDING', 'EN_ROUTE', 'RECEIVED', 'DELAYED'));

-- Providers: status
ALTER TABLE public.providers
  DROP CONSTRAINT IF EXISTS chk_providers_status;
ALTER TABLE public.providers
  ADD CONSTRAINT chk_providers_status
  CHECK (status IN ('ACTIVE', 'ONBOARDING', 'INACTIVE'));

-- Clients: status
ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS chk_clients_status;
ALTER TABLE public.clients
  ADD CONSTRAINT chk_clients_status
  CHECK (status IN ('ACTIVE', 'ONBOARDING', 'INACTIVE'));

-- Profiles: role CHECK already exists — ensure members cannot escalate
-- (handled by RLS policies + appStore, but DB constraint is the last line of defense)

-- ============================================================================
-- PART 2: INDEXES ON HIGH-TRAFFIC/FILTERED COLUMNS
-- ============================================================================

-- organizations
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON public.organizations(domain);

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_org ON public.activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);

-- providers
CREATE INDEX IF NOT EXISTS idx_providers_org ON public.providers(organization_id);
CREATE INDEX IF NOT EXISTS idx_providers_status ON public.providers(status);
CREATE INDEX IF NOT EXISTS idx_providers_created_at ON public.providers(created_at);

-- clients
CREATE INDEX IF NOT EXISTS idx_clients_org ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at);

-- transport_shifts
CREATE INDEX IF NOT EXISTS idx_transport_shifts_org ON public.transport_shifts(organization_id);
CREATE INDEX IF NOT EXISTS idx_transport_shifts_status ON public.transport_shifts(status);
CREATE INDEX IF NOT EXISTS idx_transport_shifts_created_at ON public.transport_shifts(created_at DESC);

-- transport_transfers
CREATE INDEX IF NOT EXISTS idx_transport_transfers_org ON public.transport_transfers(organization_id);
CREATE INDEX IF NOT EXISTS idx_transport_transfers_created_at ON public.transport_transfers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transport_transfers_time ON public.transport_transfers(time);

-- accommodation_rooms
CREATE INDEX IF NOT EXISTS idx_accommodation_rooms_org ON public.accommodation_rooms(organization_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_rooms_status ON public.accommodation_rooms(status);
CREATE INDEX IF NOT EXISTS idx_accommodation_rooms_created_at ON public.accommodation_rooms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accommodation_rooms_check_in ON public.accommodation_rooms(check_in_date);

-- catering_menus
CREATE INDEX IF NOT EXISTS idx_catering_menus_org ON public.catering_menus(organization_id);
CREATE INDEX IF NOT EXISTS idx_catering_menus_created_at ON public.catering_menus(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_catering_menus_start_time ON public.catering_menus(start_time);

-- hospitality_packages
CREATE INDEX IF NOT EXISTS idx_hospitality_packages_org ON public.hospitality_packages(organization_id);
CREATE INDEX IF NOT EXISTS idx_hospitality_packages_created_at ON public.hospitality_packages(created_at DESC);

-- hospitality_guests
CREATE INDEX IF NOT EXISTS idx_hospitality_guests_org ON public.hospitality_guests(organization_id);
CREATE INDEX IF NOT EXISTS idx_hospitality_guests_section ON public.hospitality_guests(section);
CREATE INDEX IF NOT EXISTS idx_hospitality_guests_created_at ON public.hospitality_guests(created_at);

-- accreditations
CREATE INDEX IF NOT EXISTS idx_accreditations_org ON public.accreditations(organization_id);
CREATE INDEX IF NOT EXISTS idx_accreditations_created_at ON public.accreditations(created_at DESC);

-- uniforms
CREATE INDEX IF NOT EXISTS idx_uniforms_org ON public.uniforms(organization_id);
CREATE INDEX IF NOT EXISTS idx_uniforms_status ON public.uniforms(status);
CREATE INDEX IF NOT EXISTS idx_uniforms_created_at ON public.uniforms(created_at DESC);

-- laundry_requests
CREATE INDEX IF NOT EXISTS idx_laundry_requests_org ON public.laundry_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_laundry_requests_status ON public.laundry_requests(status);
CREATE INDEX IF NOT EXISTS idx_laundry_requests_created_at ON public.laundry_requests(created_at DESC);

-- additional_services
CREATE INDEX IF NOT EXISTS idx_additional_services_org ON public.additional_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_additional_services_created_at ON public.additional_services(created_at DESC);

-- deliveries
CREATE INDEX IF NOT EXISTS idx_deliveries_org ON public.deliveries(organization_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON public.deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deliveries_scheduled ON public.deliveries(scheduled_time);

-- ============================================================================
-- PART 3: UNIQUE CONSTRAINTS ON NATURAL KEYS
-- Prevents duplicate records per organization
-- ============================================================================

-- Accreditations: no duplicate codes per org
ALTER TABLE public.accreditations
  DROP CONSTRAINT IF EXISTS uq_accreditations_code_org;
ALTER TABLE public.accreditations
  ADD CONSTRAINT uq_accreditations_code_org
  UNIQUE (code, organization_id);

-- Uniforms: no duplicate item names per org
ALTER TABLE public.uniforms
  DROP CONSTRAINT IF EXISTS uq_uniforms_item_org;
ALTER TABLE public.uniforms
  ADD CONSTRAINT uq_uniforms_item_org
  UNIQUE (item_name, organization_id);

-- Hospitality Packages: no duplicate titles per org
ALTER TABLE public.hospitality_packages
  DROP CONSTRAINT IF EXISTS uq_hospitality_packages_title_org;
ALTER TABLE public.hospitality_packages
  ADD CONSTRAINT uq_hospitality_packages_title_org
  UNIQUE (title, organization_id);

-- Hospitality Guests: no duplicate seat assignments per section
ALTER TABLE public.hospitality_guests
  DROP CONSTRAINT IF EXISTS uq_hospitality_guests_seat;
ALTER TABLE public.hospitality_guests
  ADD CONSTRAINT uq_hospitality_guests_seat
  UNIQUE (section, seat_num, organization_id);

-- Organizations: unique domain
ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS uq_organizations_domain;
ALTER TABLE public.organizations
  ADD CONSTRAINT uq_organizations_domain
  UNIQUE (domain);

-- ============================================================================
-- PART 4: VERIFICATION QUERIES (run after execution to confirm)
-- ============================================================================

-- Uncomment to verify:
-- SELECT conname, contype FROM pg_constraint WHERE conname LIKE 'chk_%' OR conname LIKE 'uq_%' ORDER BY conname;
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%' ORDER BY indexname;

-- ============================================================================
-- DONE! All constraints, indexes, and unique keys applied.
-- ============================================================================
