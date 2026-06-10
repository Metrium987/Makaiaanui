-- ============================================================================
-- MAKAIAANUI COMBINED SCHEMA MIGRATION
-- Run this entire script in the Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/vyzbbtrohbeydgnzxxjy/sql/new
-- ============================================================================

-- Enable UUID extension (required for uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CORE TABLES (from 20240101000000_init.sql)
-- ============================================================================

-- Organizations (Tenants)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    brand_color VARCHAR(10) DEFAULT '#4F46E5',
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Profiles (Users linked to Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'MEMBER',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(255) NOT NULL,
    detail TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Providers (CRM)
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ONBOARDING',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Clients (CRM)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ONBOARDING',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 2. SECURITY HELPER FUNCTIONS (from 20240101000000_init_schema.sql)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_org()
RETURNS UUID AS $$
    SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- 3. MODULE TABLES (from 20240101000000_init_schema.sql)
-- ============================================================================

-- Transport Shifts
CREATE TABLE IF NOT EXISTS public.transport_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_name VARCHAR(255) NOT NULL,
    vehicle VARCHAR(255) NOT NULL,
    time VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    progress VARCHAR(50) DEFAULT '0%',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Transport Transfers
CREATE TABLE IF NOT EXISTS public.transport_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time TIMESTAMP WITH TIME ZONE,
    from_location VARCHAR(255) NOT NULL,
    to_location VARCHAR(255) NOT NULL,
    pax INTEGER NOT NULL DEFAULT 1,
    assigned_driver VARCHAR(255),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Accommodation Rooms
CREATE TABLE IF NOT EXISTS public.accommodation_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_name VARCHAR(255) NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    hotel_name VARCHAR(255) NOT NULL,
    room_type VARCHAR(100) NOT NULL,
    check_in_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Catering Menus
CREATE TABLE IF NOT EXISTS public.catering_menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    pax INTEGER DEFAULT 0,
    veg INTEGER DEFAULT 0,
    vgn INTEGER DEFAULT 0,
    gf INTEGER DEFAULT 0,
    halal INTEGER DEFAULT 0,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Hospitality Packages
CREATE TABLE IF NOT EXISTS public.hospitality_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    capacity INTEGER NOT NULL DEFAULT 0,
    sold INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Hospitality Guests (Seating)
CREATE TABLE IF NOT EXISTS public.hospitality_guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section VARCHAR(255) NOT NULL,
    guest VARCHAR(255) NOT NULL,
    seat_num VARCHAR(50) NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Accreditations
CREATE TABLE IF NOT EXISTS public.accreditations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    pending INTEGER NOT NULL DEFAULT 0,
    zones VARCHAR(50)[] NOT NULL DEFAULT '{}',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Uniforms
CREATE TABLE IF NOT EXISTS public.uniforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name VARCHAR(255) NOT NULL,
    sizes VARCHAR(100) NOT NULL,
    total INTEGER NOT NULL DEFAULT 0,
    deployed INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'HEALTHY',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Laundry Requests
CREATE TABLE IF NOT EXISTS public.laundry_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name VARCHAR(255) NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    items_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'COLLECTED',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Additional Services
CREATE TABLE IF NOT EXISTS public.additional_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    service_type VARCHAR(100) NOT NULL DEFAULT 'STANDARD',
    price NUMERIC(10, 2) DEFAULT 0.00,
    sold_count INTEGER NOT NULL DEFAULT 0,
    limit_count INTEGER NOT NULL DEFAULT 0,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Deliveries
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    scheduled_time TIMESTAMP WITH TIME ZONE,
    detail TEXT,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodation_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catering_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitality_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitality_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accreditations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uniforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laundry_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Organizations
CREATE POLICY "Users can view their own organization" ON public.organizations FOR SELECT 
    USING (id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT 
    USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Activity Logs
CREATE POLICY "Users can view activity logs of their org" ON public.activity_logs FOR SELECT 
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Back-office can insert activity logs" ON public.activity_logs FOR INSERT 
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Providers
CREATE POLICY "Users can view their organization providers" ON public.providers FOR SELECT 
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Back-office and Admin manage providers" ON public.providers FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('BACK_OFFICE', 'ADMIN'));

-- Clients
CREATE POLICY "Users can view their organization clients" ON public.clients FOR SELECT 
    USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "Back-office and Admin manage clients" ON public.clients FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('BACK_OFFICE', 'ADMIN'));

-- Transport Shifts
CREATE POLICY "Select organization transport shifts" ON public.transport_shifts FOR SELECT 
    USING (organization_id = get_user_org());
CREATE POLICY "Front-office and Back-office manage transport shifts" ON public.transport_shifts FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'));

-- Transport Transfers
CREATE POLICY "Select organization transport transfers" ON public.transport_transfers FOR SELECT 
    USING (organization_id = get_user_org());
CREATE POLICY "Back-office manage transport transfers" ON public.transport_transfers FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('BACK_OFFICE', 'ADMIN'));

-- Accommodation Rooms
CREATE POLICY "Select organization accommodation rooms" ON public.accommodation_rooms FOR SELECT 
    USING (organization_id = get_user_org());
CREATE POLICY "Front-office and Back-office manage accommodation rooms" ON public.accommodation_rooms FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'));

-- Catering Menus
CREATE POLICY "Select organization catering menus" ON public.catering_menus FOR SELECT 
    USING (organization_id = get_user_org() AND get_user_role() IN ('MEMBER', 'FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'));
CREATE POLICY "Back-office and Admin manage catering menus" ON public.catering_menus FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('BACK_OFFICE', 'ADMIN'));

-- Hospitality Packages
CREATE POLICY "Select organization hospitality packages" ON public.hospitality_packages FOR SELECT 
    USING (organization_id = get_user_org() AND get_user_role() IN ('MEMBER', 'FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'));
CREATE POLICY "Back-office and Admin manage hospitality packages" ON public.hospitality_packages FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('BACK_OFFICE', 'ADMIN'));

-- Hospitality Guests
CREATE POLICY "Select organization hospitality guests" ON public.hospitality_guests FOR SELECT 
    USING (organization_id = get_user_org() AND get_user_role() IN ('MEMBER', 'FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'));
CREATE POLICY "Back-office and Admin manage hospitality guests" ON public.hospitality_guests FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('BACK_OFFICE', 'ADMIN'));

-- Accreditations
CREATE POLICY "Select organization accreditations" ON public.accreditations FOR SELECT 
    USING (organization_id = get_user_org());
CREATE POLICY "Front-office and Back-office manage accreditations" ON public.accreditations FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'));

-- Uniforms
CREATE POLICY "Select organization uniforms" ON public.uniforms FOR SELECT 
    USING (organization_id = get_user_org());
CREATE POLICY "Back-office and Admin manage uniforms" ON public.uniforms FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('BACK_OFFICE', 'ADMIN'));

-- Laundry Requests
CREATE POLICY "Select organization laundry requests" ON public.laundry_requests FOR SELECT 
    USING (organization_id = get_user_org());
CREATE POLICY "Front-office and Back-office manage laundry requests" ON public.laundry_requests FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'));

-- Additional Services
CREATE POLICY "Select organization additional services" ON public.additional_services FOR SELECT 
    USING (organization_id = get_user_org());
CREATE POLICY "Back-office and Admin manage additional services" ON public.additional_services FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('BACK_OFFICE', 'ADMIN'));

-- Deliveries
CREATE POLICY "Select organization deliveries" ON public.deliveries FOR SELECT 
    USING (organization_id = get_user_org());
CREATE POLICY "Front-office and Back-office manage deliveries" ON public.deliveries FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'));

-- Groups
CREATE POLICY "Users can view org groups" ON public.groups FOR SELECT 
    USING (organization_id = get_user_org());
CREATE POLICY "Back-office and Admin manage groups" ON public.groups FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('BACK_OFFICE', 'ADMIN'));

-- ============================================================================
-- 6. AUTO-PROFILE TRIGGER (creates profile on signup)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'MEMBER');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- 7. GAP-011: CHECK constraints + indexes + UNIQUE constraints (idempotent)
-- ============================================================================

-- CHECK constraints on status/type/role columns (DROP first for idempotency)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_profiles_role;
ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_role CHECK (role IN ('MEMBER', 'FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'));

ALTER TABLE public.transport_shifts DROP CONSTRAINT IF EXISTS chk_transport_shifts_status;
ALTER TABLE public.transport_shifts ADD CONSTRAINT chk_transport_shifts_status CHECK (status IN ('ACTIVE', 'OFFLINE'));

ALTER TABLE public.accommodation_rooms DROP CONSTRAINT IF EXISTS chk_accommodation_rooms_status;
ALTER TABLE public.accommodation_rooms ADD CONSTRAINT chk_accommodation_rooms_status CHECK (status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN'));

ALTER TABLE public.accommodation_rooms DROP CONSTRAINT IF EXISTS chk_accommodation_rooms_type;
ALTER TABLE public.accommodation_rooms ADD CONSTRAINT chk_accommodation_rooms_type CHECK (room_type IN ('Single', 'Double', 'Twin', 'Suite'));

ALTER TABLE public.catering_menus DROP CONSTRAINT IF EXISTS chk_catering_menus_service_type;
ALTER TABLE public.catering_menus ADD CONSTRAINT chk_catering_menus_service_type CHECK (service_type IN ('BUFFET', 'PLATED', 'LUNCHBOX', 'BANQUET', 'COFFEE_BREAK'));

ALTER TABLE public.uniforms DROP CONSTRAINT IF EXISTS chk_uniforms_status;
ALTER TABLE public.uniforms ADD CONSTRAINT chk_uniforms_status CHECK (status IN ('HEALTHY', 'LOW_STOCK', 'OUT_OF_STOCK'));

ALTER TABLE public.laundry_requests DROP CONSTRAINT IF EXISTS chk_laundry_requests_status;
ALTER TABLE public.laundry_requests ADD CONSTRAINT chk_laundry_requests_status CHECK (status IN ('COLLECTED', 'IN_PROGRESS', 'READY', 'RETURNED'));

ALTER TABLE public.laundry_requests DROP CONSTRAINT IF EXISTS chk_laundry_requests_service_type;
ALTER TABLE public.laundry_requests ADD CONSTRAINT chk_laundry_requests_service_type CHECK (service_type IN ('Standard Wash', 'Express Wash (6h)', 'Dry Cleaning Only', 'Delicate Fabric Steam'));

ALTER TABLE public.additional_services DROP CONSTRAINT IF EXISTS chk_additional_services_type;
ALTER TABLE public.additional_services ADD CONSTRAINT chk_additional_services_type CHECK (service_type IN ('STANDARD', 'TOURISM_HOTEL', 'TRANSFERS', 'PREMIUM_MEALS', 'EQUIPMENT'));

ALTER TABLE public.deliveries DROP CONSTRAINT IF EXISTS chk_deliveries_status;
ALTER TABLE public.deliveries ADD CONSTRAINT chk_deliveries_status CHECK (status IN ('PENDING', 'EN_ROUTE', 'RECEIVED', 'DELAYED'));

ALTER TABLE public.providers DROP CONSTRAINT IF EXISTS chk_providers_status;
ALTER TABLE public.providers ADD CONSTRAINT chk_providers_status CHECK (status IN ('ACTIVE', 'ONBOARDING', 'INACTIVE'));

ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS chk_clients_status;
ALTER TABLE public.clients ADD CONSTRAINT chk_clients_status CHECK (status IN ('ACTIVE', 'ONBOARDING', 'INACTIVE'));

-- Indexes (organization_id, status, created_at — all queries filter/order by these)
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON public.organizations(domain);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

CREATE INDEX IF NOT EXISTS idx_activity_logs_org ON public.activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_providers_org ON public.providers(organization_id);
CREATE INDEX IF NOT EXISTS idx_providers_status ON public.providers(status);
CREATE INDEX IF NOT EXISTS idx_providers_created_at ON public.providers(created_at);

CREATE INDEX IF NOT EXISTS idx_clients_org ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at);

CREATE INDEX IF NOT EXISTS idx_transport_shifts_org ON public.transport_shifts(organization_id);
CREATE INDEX IF NOT EXISTS idx_transport_shifts_status ON public.transport_shifts(status);
CREATE INDEX IF NOT EXISTS idx_transport_shifts_created_at ON public.transport_shifts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transport_transfers_org ON public.transport_transfers(organization_id);
CREATE INDEX IF NOT EXISTS idx_transport_transfers_created_at ON public.transport_transfers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transport_transfers_time ON public.transport_transfers(time);

CREATE INDEX IF NOT EXISTS idx_accommodation_rooms_org ON public.accommodation_rooms(organization_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_rooms_status ON public.accommodation_rooms(status);
CREATE INDEX IF NOT EXISTS idx_accommodation_rooms_created_at ON public.accommodation_rooms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accommodation_rooms_check_in ON public.accommodation_rooms(check_in_date);

CREATE INDEX IF NOT EXISTS idx_catering_menus_org ON public.catering_menus(organization_id);
CREATE INDEX IF NOT EXISTS idx_catering_menus_created_at ON public.catering_menus(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_catering_menus_start_time ON public.catering_menus(start_time);

CREATE INDEX IF NOT EXISTS idx_hospitality_packages_org ON public.hospitality_packages(organization_id);
CREATE INDEX IF NOT EXISTS idx_hospitality_packages_created_at ON public.hospitality_packages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hospitality_guests_org ON public.hospitality_guests(organization_id);
CREATE INDEX IF NOT EXISTS idx_hospitality_guests_section ON public.hospitality_guests(section);
CREATE INDEX IF NOT EXISTS idx_hospitality_guests_created_at ON public.hospitality_guests(created_at);

CREATE INDEX IF NOT EXISTS idx_accreditations_org ON public.accreditations(organization_id);
CREATE INDEX IF NOT EXISTS idx_accreditations_created_at ON public.accreditations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_uniforms_org ON public.uniforms(organization_id);
CREATE INDEX IF NOT EXISTS idx_uniforms_status ON public.uniforms(status);
CREATE INDEX IF NOT EXISTS idx_uniforms_created_at ON public.uniforms(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_laundry_requests_org ON public.laundry_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_laundry_requests_status ON public.laundry_requests(status);
CREATE INDEX IF NOT EXISTS idx_laundry_requests_created_at ON public.laundry_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_additional_services_org ON public.additional_services(organization_id);
CREATE INDEX IF NOT EXISTS idx_additional_services_created_at ON public.additional_services(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deliveries_org ON public.deliveries(organization_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON public.deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deliveries_scheduled ON public.deliveries(scheduled_time);

-- UNIQUE constraints on natural keys (per organization) — DROP first for idempotency
ALTER TABLE public.accreditations DROP CONSTRAINT IF EXISTS uq_accreditations_code_org;
ALTER TABLE public.accreditations ADD CONSTRAINT uq_accreditations_code_org UNIQUE (code, organization_id);

ALTER TABLE public.uniforms DROP CONSTRAINT IF EXISTS uq_uniforms_item_org;
ALTER TABLE public.uniforms ADD CONSTRAINT uq_uniforms_item_org UNIQUE (item_name, organization_id);

ALTER TABLE public.hospitality_packages DROP CONSTRAINT IF EXISTS uq_hospitality_packages_title_org;
ALTER TABLE public.hospitality_packages ADD CONSTRAINT uq_hospitality_packages_title_org UNIQUE (title, organization_id);

ALTER TABLE public.hospitality_guests DROP CONSTRAINT IF EXISTS uq_hospitality_guests_seat;
ALTER TABLE public.hospitality_guests ADD CONSTRAINT uq_hospitality_guests_seat UNIQUE (section, seat_num, organization_id);

ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS uq_organizations_domain;
ALTER TABLE public.organizations ADD CONSTRAINT uq_organizations_domain UNIQUE (domain);

-- ============================================================================
-- 8. GAP-010: updated_at auto-trigger (sets updated_at = NOW() on every UPDATE)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT unnest(ARRAY[
      'organizations','profiles','activity_logs','providers','clients',
      'transport_shifts','transport_transfers','accommodation_rooms','catering_menus',
      'hospitality_packages','hospitality_guests','accreditations','uniforms',
      'laundry_requests','additional_services','deliveries','groups'
    ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I;', t);
    EXECUTE format('CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', t);
  END LOOP;
END $$;

-- ============================================================================
-- 9. CLIENT PORTAL — client_requests table (GAP-012 merged)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.client_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  module_type TEXT NOT NULL CHECK (module_type IN ('transport', 'accommodation', 'catering', 'laundry', 'additional_services', 'accreditations', 'deliveries')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED')),
  client_name TEXT DEFAULT '',
  client_email TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id),
  details JSONB DEFAULT '{}'::jsonb,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_requests_org ON public.client_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_requests_status ON public.client_requests(status);
CREATE INDEX IF NOT EXISTS idx_client_requests_module ON public.client_requests(module_type);
CREATE INDEX IF NOT EXISTS idx_client_requests_created ON public.client_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_requests_org_status ON public.client_requests(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_client_requests_created_by ON public.client_requests(created_by);

-- Ensure created_by column exists on existing tables (idempotent)
ALTER TABLE public.client_requests ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Auto-update trigger
DROP TRIGGER IF EXISTS trg_set_updated_at ON public.client_requests;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.client_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.client_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org requests" ON public.client_requests
  FOR SELECT USING (organization_id = get_user_org());

CREATE POLICY "Users can create requests" ON public.client_requests
  FOR INSERT WITH CHECK (organization_id = get_user_org());

CREATE POLICY "Back-office and Admin manage requests" ON public.client_requests
  FOR UPDATE USING (organization_id = get_user_org() AND get_user_role() IN ('BACK_OFFICE', 'ADMIN'));

CREATE POLICY "Admins can delete requests" ON public.client_requests
  FOR DELETE USING (organization_id = get_user_org() AND get_user_role() = 'ADMIN');

-- ============================================================================
-- 10. GROUPS — countries/delegations for athletes and participants
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_groups_org ON public.groups(organization_id);
CREATE INDEX IF NOT EXISTS idx_groups_name ON public.groups(name);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON public.groups(created_at DESC);

-- Ensure table and columns exist on existing DB (idempotent)
-- (CREATE TABLE IF NOT EXISTS already handles table creation;
--  if adding columns later, use ALTER TABLE ADD COLUMN IF NOT EXISTS here)

-- Auto-update trigger
DROP TRIGGER IF EXISTS trg_set_updated_at ON public.groups;
CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org groups" ON public.groups
  FOR SELECT USING (organization_id = get_user_org());

CREATE POLICY "Back-office and Admin manage groups" ON public.groups
  FOR ALL USING (organization_id = get_user_org() AND get_user_role() IN ('BACK_OFFICE', 'ADMIN'));

-- ============================================================================
-- 11. DONE! Toutes les tables, policies, triggers, contraintes et indexes sont créés.
-- ============================================================================
