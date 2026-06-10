-- Supabase Operational Modules Schema & RLS Policies Migration
-- This migration populates structures for the 9 core modules defined in useApi.ts

-- 1. UTILITY ROLES & HELPER FUNCTIONS FOR SECURITY (Avoid recursive policies)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_org()
RETURNS UUID AS $$
    SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;


-- 2. MODULE: TRANSPORT (Shifts & Transfers)
CREATE TABLE IF NOT EXISTS public.transport_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_name VARCHAR(255) NOT NULL,
    vehicle VARCHAR(255) NOT NULL,
    time VARCHAR(100), -- display range (e.g. "08:00 - 16:00"), NOT a single TIMESTAMP per design
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    progress VARCHAR(50) DEFAULT '0%',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transport_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time TIMESTAMP WITH TIME ZONE,
    from_location VARCHAR(255) NOT NULL,
    to_location VARCHAR(255) NOT NULL,
    pax INTEGER NOT NULL DEFAULT 1,
    assigned_driver VARCHAR(255),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 3. MODULE: ACCOMMODATION (Rooms & Lodging)
CREATE TABLE IF NOT EXISTS public.accommodation_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_name VARCHAR(255) NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    hotel_name VARCHAR(255) NOT NULL,
    room_type VARCHAR(100) NOT NULL,
    check_in_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 4. MODULE: CATERING (Menu & Volume forecasting)
CREATE TABLE IF NOT EXISTS public.catering_menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    service_type VARCHAR(100) NOT NULL, -- e.g., BUFFET, PLATED, LUNCHBOX, BANQUET
    pax_pax INTEGER DEFAULT 0,
    pax_veg INTEGER DEFAULT 0,
    pax_vgn INTEGER DEFAULT 0,
    pax_gf INTEGER DEFAULT 0,
    pax_halal INTEGER DEFAULT 0,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 5. MODULE: HOSPITALITIES (VIP Seating & Packages)
CREATE TABLE IF NOT EXISTS public.hospitality_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    capacity INTEGER NOT NULL DEFAULT 0,
    sold INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hospitality_guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section VARCHAR(255) NOT NULL,
    guest VARCHAR(255) NOT NULL,
    seat_num VARCHAR(50) NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 6. MODULE: ACCREDITATIONS (Permits & Populations)
CREATE TABLE IF NOT EXISTS public.accreditations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL, -- e.g., ATH, MED, VOL
    name VARCHAR(255) NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    pending INTEGER NOT NULL DEFAULT 0,
    zones VARCHAR(50)[] NOT NULL DEFAULT '{}',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 7. MODULE: UNIFORMS (Assts & Apparel)
CREATE TABLE IF NOT EXISTS public.uniforms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name VARCHAR(255) NOT NULL,
    sizes VARCHAR(100) NOT NULL,
    total INTEGER NOT NULL DEFAULT 0,
    deployed INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'HEALTHY',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 8. MODULE: LAUNDRY (Bags requests & Processing)
CREATE TABLE IF NOT EXISTS public.laundry_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name VARCHAR(255) NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    items_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'COLLECTED',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 9. MODULE: ADDITIONAL SERVICES (Catalog bookings)
CREATE TABLE IF NOT EXISTS public.additional_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    service_type VARCHAR(100) NOT NULL DEFAULT 'STANDARD',
    price NUMERIC(10, 2) DEFAULT 0.00,
    sold_count INTEGER NOT NULL DEFAULT 0,
    limit_count INTEGER NOT NULL DEFAULT 0,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 10. MODULE: DELIVERIES (Incoming items logistics)
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    scheduled_time TIMESTAMP WITH TIME ZONE,
    detail TEXT,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 11. ENABLE ROW LEVEL SECURITY
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


-- 12. ROW LEVEL SECURITY POLICIES (FRONT-OFFICE vs BACK-OFFICE Restrictions)

-- A. TRANSPORT SHIFTS
CREATE POLICY "Select organization transport shifts" 
    ON public.transport_shifts FOR SELECT 
    USING (organization_id = get_user_org());

CREATE POLICY "Front-office and Back-office manage transport shifts" 
    ON public.transport_shifts FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'));

-- B. TRANSPORT TRANSFERS
CREATE POLICY "Select organization transport transfers" 
    ON public.transport_transfers FOR SELECT 
    USING (organization_id = get_user_org());

CREATE POLICY "Back-office manage transport transfers" 
    ON public.transport_transfers FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('BACK_OFFICE', 'ADMIN'));

-- C. ACCOMMODATION ROOMS
CREATE POLICY "Select organization accommodation rooms" 
    ON public.accommodation_rooms FOR SELECT 
    USING (organization_id = get_user_org());

CREATE POLICY "Front-office and Back-office manage accommodation rooms" 
    ON public.accommodation_rooms FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'));

-- D. CATERING MENUS
CREATE POLICY "Select organization catering menus" 
    ON public.catering_menus FOR SELECT 
    USING (organization_id = get_user_org() AND get_user_role() IN ('FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'));

CREATE POLICY "Back-office and Admin manage catering menus" 
    ON public.catering_menus FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('BACK_OFFICE', 'ADMIN'));

-- E. HOSPITALITY PACKAGES
CREATE POLICY "Select organization hospitality packages" 
    ON public.hospitality_packages FOR SELECT 
    USING (organization_id = get_user_org() AND get_user_role() IN ('FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'));

CREATE POLICY "Back-office and Admin manage hospitality packages" 
    ON public.hospitality_packages FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('BACK_OFFICE', 'ADMIN'));

CREATE POLICY "Select organization hospitality guests" 
    ON public.hospitality_guests FOR SELECT 
    USING (organization_id = get_user_org() AND get_user_role() IN ('FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'));

CREATE POLICY "Back-office and Admin manage hospitality guests" 
    ON public.hospitality_guests FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('BACK_OFFICE', 'ADMIN'));

-- F. ACCREDITATIONS
CREATE POLICY "Select organization accreditations" 
    ON public.accreditations FOR SELECT 
    USING (organization_id = get_user_org());

CREATE POLICY "Front-office and Back-office manage accreditations" 
    ON public.accreditations FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'));

-- G. UNIFORMS
CREATE POLICY "Select organization uniforms" 
    ON public.uniforms FOR SELECT 
    USING (organization_id = get_user_org());

CREATE POLICY "Back-office and Admin manage uniforms" 
    ON public.uniforms FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('BACK_OFFICE', 'ADMIN'));

-- H. LAUNDRY REQUESTS
CREATE POLICY "Select organization laundry requests" 
    ON public.laundry_requests FOR SELECT 
    USING (organization_id = get_user_org());

CREATE POLICY "Front-office and Back-office manage laundry requests" 
    ON public.laundry_requests FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'));

-- I. ADDITIONAL SERVICES
CREATE POLICY "Select organization additional services" 
    ON public.additional_services FOR SELECT 
    USING (organization_id = get_user_org());

CREATE POLICY "Back-office and Admin manage additional services" 
    ON public.additional_services FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('BACK_OFFICE', 'ADMIN'));

-- J. DELIVERIES
CREATE POLICY "Select organization deliveries" 
    ON public.deliveries FOR SELECT 
    USING (organization_id = get_user_org());

CREATE POLICY "Front-office and Back-office manage deliveries" 
    ON public.deliveries FOR ALL 
    USING (organization_id = get_user_org() AND get_user_role() IN ('FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'));


-- Alter profiles default role to MEMBER
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'MEMBER';

-- Create a trigger that inserts a profile when a new user signs up
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
