-- ============================================================================
-- MAKAIAANUI SEED DATA — Insert test records into all modules
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vyzbbtrohbeydgnzxxjy/sql/new
-- ============================================================================

DO $$
DECLARE
    v_org_id UUID;
    v_user_id UUID;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
    -- 1. Find or create a demo organization
    SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
    IF v_org_id IS NULL THEN
        INSERT INTO public.organizations (id, name, domain, brand_color)
        VALUES (gen_random_uuid(), 'Demo Organization', 'demo.makaiaanui.io', '#4F46E5')
        RETURNING id INTO v_org_id;
    END IF;

    -- 2. Find the first user
    SELECT id INTO v_user_id FROM public.profiles LIMIT 1;
    
    -- Assign first user to the org if not already
    IF v_user_id IS NOT NULL THEN
        UPDATE public.profiles SET organization_id = v_org_id, role = 'ADMIN'
        WHERE id = v_user_id AND organization_id IS NULL;
    END IF;

    -- ========================================================================
    -- 3. TRANSPORT — Shifts & Transfers
    -- ========================================================================
    INSERT INTO public.transport_shifts (driver_name, vehicle, time, status, progress, organization_id, created_at) VALUES
        ('Jean Dupont', 'Tesla Model Y (AA-123-BB)', '06:00 - 14:00', 'ACTIVE', '45%', v_org_id, v_now),
        ('Marie Lambert', 'Renault Trafic (CC-456-DD)', '08:00 - 16:00', 'ACTIVE', '20%', v_org_id, v_now),
        ('Pierre Tahiti', 'Toyota Coaster (EE-789-FF)', '14:00 - 22:00', 'OFFLINE', '0%', v_org_id, v_now),
        ('Hina Marama', 'Mercedes Sprinter (GG-012-HH)', '06:00 - 18:00', 'ACTIVE', '80%', v_org_id, v_now);

    INSERT INTO public.transport_transfers (time, from_location, to_location, pax, assigned_driver, organization_id, created_at) VALUES
        (v_now + interval '2 hours', 'Aéroport Faa''a', 'Olympic Village', 12, 'Jean Dupont', v_org_id, v_now),
        (v_now + interval '3 hours', 'Main Stadium', 'Tahitia Lagoon Hotel', 4, 'Marie Lambert', v_org_id, v_now),
        (v_now + interval '5 hours', 'Marriott Press Hub', 'Olympic Village', 8, NULL, v_org_id, v_now),
        (v_now + interval '1 hour', 'Olympic Village', 'Training Center Pirae', 15, 'Hina Marama', v_org_id, v_now),
        (v_now + interval '6 hours', 'Main Stadium', 'Aéroport Faa''a', 6, NULL, v_org_id, v_now);

    -- ========================================================================
    -- 4. ACCOMMODATION — Rooms & Lodging
    -- ========================================================================
    INSERT INTO public.accommodation_rooms (guest_name, group_name, hotel_name, room_type, check_in_date, status, organization_id, created_at) VALUES
        ('Prince Albert', 'Monaco Protocol', 'Hilton Tahiti Resort', 'Suite', CURRENT_DATE, 'CHECKED_IN', v_org_id, v_now),
        ('Marie Curie', 'France Olympic', 'InterContinental Tahiti', 'Double', CURRENT_DATE + 2, 'CONFIRMED', v_org_id, v_now),
        ('John Smith', 'UK Delegation', 'Hilton Tahiti Resort', 'Single', CURRENT_DATE + 1, 'PENDING', v_org_id, v_now),
        ('Akira Tanaka', 'Japan Olympic', 'InterContinental Tahiti', 'Twin', CURRENT_DATE, 'CHECKED_IN', v_org_id, v_now),
        ('Maria Silva', 'Brazil Delegation', 'Manava Suite Resort', 'Double', CURRENT_DATE + 3, 'CONFIRMED', v_org_id, v_now),
        ('Hans Mueller', 'Germany Olympic', 'Hilton Tahiti Resort', 'Suite', CURRENT_DATE, 'PENDING', v_org_id, v_now);

    -- ========================================================================
    -- 5. CATERING — Menus & Dietary
    -- ========================================================================
    INSERT INTO public.catering_menus (title, start_time, end_time, service_type, pax, veg, vgn, gf, halal, organization_id, created_at) VALUES
        ('VIP Breakfast Buffet', v_now + interval '7 hours', v_now + interval '10 hours', 'BUFFET', 120, 20, 8, 5, 10, v_org_id, v_now),
        ('Athletes Lunch Plated', v_now + interval '12 hours', v_now + interval '14 hours', 'PLATED', 250, 35, 15, 12, 25, v_org_id, v_now),
        ('Media Coffee Break', v_now + interval '10 hours', v_now + interval '11 hours', 'COFFEE_BREAK', 60, 5, 3, 8, 2, v_org_id, v_now),
        ('Gala Dinner Banquet', v_now + interval '20 hours', v_now + interval '23 hours', 'BANQUET', 180, 25, 10, 15, 20, v_org_id, v_now),
        ('Team Lunchbox Takeaway', v_now + interval '11 hours', v_now + interval '13 hours', 'LUNCHBOX', 80, 12, 6, 4, 8, v_org_id, v_now);

    -- ========================================================================
    -- 6. HOSPITALITIES — VIP Packages & Seating
    -- ========================================================================
    INSERT INTO public.hospitality_packages (title, price, capacity, sold, total, organization_id, created_at) VALUES
        ('VIP President Box', 850.00, 20, 12, 20, v_org_id, v_now),
        ('Gold Tribune Pass', 350.00, 100, 45, 100, v_org_id, v_now),
        ('Silver Lounge Access', 180.00, 200, 89, 200, v_org_id, v_now),
        ('Premium Deck Experience', 500.00, 50, 50, 50, v_org_id, v_now);

    INSERT INTO public.hospitality_guests (section, guest, seat_num, organization_id, created_at) VALUES
        ('Tribune d''Honneur', 'S.A.S. Le Prince Albert', 'A-12', v_org_id, v_now),
        ('Loge Présidentielle', 'Emmanuel Macron', 'VIP-01', v_org_id, v_now),
        ('Tribune Nord Elite', 'Thomas Bach', 'B-45', v_org_id, v_now),
        ('Prestige Lounge', 'Sébastien Chabal', 'D-22', v_org_id, v_now),
        ('Tribune d''Honneur', 'Dinah Jane', 'A-18', v_org_id, v_now);

    -- ========================================================================
    -- 7. ACCREDITATIONS — Permits & Populations
    -- ========================================================================
    INSERT INTO public.accreditations (code, name, count, pending, zones, organization_id, created_at) VALUES
        ('ATH', 'Athletes', 250, 12, ARRAY['1','2','3','5'], v_org_id, v_now),
        ('MED', 'Media Staff', 80, 5, ARRAY['2','3','M'], v_org_id, v_now),
        ('VOL', 'Volunteers', 300, 45, ARRAY['1','2','3','4','5'], v_org_id, v_now),
        ('VIP', 'VIP & Protocol', 50, 0, ARRAY['1','2','3','4','5','V','S','M','P'], v_org_id, v_now),
        ('ORG', 'Organizers', 40, 3, ARRAY['1','2','3','4','5','S','M'], v_org_id, v_now),
        ('SEC', 'Security Staff', 120, 8, ARRAY['1','2','3','4','5','S'], v_org_id, v_now);

    -- ========================================================================
    -- 8. UNIFORMS — Apparel & Assets
    -- ========================================================================
    INSERT INTO public.uniforms (item_name, sizes, total, deployed, status, organization_id, created_at) VALUES
        ('Volunteer Red Vest', 'S, M, L, XL, XXL', 350, 280, 'HEALTHY', v_org_id, v_now),
        ('Staff Polo Blue', 'S, M, L, XL', 200, 195, 'LOW_STOCK', v_org_id, v_now),
        ('Security Jacket Black', 'M, L, XL, XXL', 150, 120, 'HEALTHY', v_org_id, v_now),
        ('Athlete Kit Home', 'XS, S, M, L, XL', 300, 300, 'OUT_OF_STOCK', v_org_id, v_now),
        ('Media Vest Yellow', 'S, M, L, XL', 100, 45, 'HEALTHY', v_org_id, v_now);

    -- ========================================================================
    -- 9. LAUNDRY — Bags & Processing
    -- ========================================================================
    INSERT INTO public.laundry_requests (client_name, group_name, service_type, items_count, status, organization_id, created_at) VALUES
        ('S.A.S. Prince Albert', 'Monaco Protocol', 'Dry Cleaning Only', 8, 'RETURNED', v_org_id, v_now),
        ('UK Delegation', 'UK Delegation', 'Standard Wash', 45, 'IN_PROGRESS', v_org_id, v_now),
        ('France Olympic', 'France Olympic', 'Express Wash (6h)', 20, 'COLLECTED', v_org_id, v_now),
        ('Media Center', 'Media Staff', 'Standard Wash', 120, 'READY', v_org_id, v_now),
        ('Japan Olympic', 'Japan Olympic', 'Delicate Fabric Steam', 12, 'COLLECTED', v_org_id, v_now);

    -- ========================================================================
    -- 10. ADDITIONAL SERVICES — Catalog
    -- ========================================================================
    INSERT INTO public.additional_services (title, service_type, price, sold_count, limit_count, organization_id, created_at) VALUES
        ('VIP Lagoon Sunset Tour', 'TOURISM_HOTEL', 120.00, 35, 50, v_org_id, v_now),
        ('Private Airport Transfer', 'TRANSFERS', 80.00, 22, 0, v_org_id, v_now),
        ('Premium Wine & Dine', 'PREMIUM_MEALS', 200.00, 15, 30, v_org_id, v_now),
        ('GoPro Camera Rental', 'EQUIPMENT', 45.00, 28, 40, v_org_id, v_now),
        ('Helicopter Island Tour', 'TOURISM_HOTEL', 350.00, 10, 10, v_org_id, v_now),
        ('SIM Card Tahiti Pack', 'STANDARD', 25.00, 150, 0, v_org_id, v_now);

    -- ========================================================================
    -- 11. DELIVERIES — Incoming Logistics
    -- ========================================================================
    INSERT INTO public.deliveries (site, status, scheduled_time, detail, organization_id, created_at) VALUES
        ('Main Stadium', 'RECEIVED', v_now - interval '2 hours', '500 Broadcast Headsets — Sound Devices', v_org_id, v_now),
        ('Olympic Village', 'EN_ROUTE', v_now + interval '1 hour', '200 Welcome Kits — Delegation Bags', v_org_id, v_now),
        ('Tahitia Lagoon', 'PENDING', v_now + interval '3 hours', '50 Water Sports Equipment — Canoes & Paddles', v_org_id, v_now),
        ('Marriott Press Hub', 'RECEIVED', v_now - interval '1 hour', '30 Media Workstations — Laptops Dell XPS', v_org_id, v_now),
        ('Main Stadium', 'DELAYED', v_now - interval '4 hours', '1000 Event Programs — Printed Booklets', v_org_id, v_now),
        ('Olympic Village', 'PENDING', v_now + interval '5 hours', '300 Medical Supply Kits — First Aid Boxes', v_org_id, v_now);

    -- ========================================================================
    -- 12. CRM — Providers & Clients
    -- ========================================================================
    INSERT INTO public.providers (name, type, contact_name, contact_email, status, organization_id, created_at) VALUES
        ('SoundPro Equipment', 'EQUIPMENT', 'Marc Dubois', 'marc@soundpro.pf', 'ACTIVE', v_org_id, v_now),
        ('Moana Catering SAS', 'CATERING', 'Teva Marama', 'teva@moanacatering.pf', 'ACTIVE', v_org_id, v_now),
        ('Polynesian Transports', 'TRANSPORTATION', 'Hitiura Vahine', 'contact@polytrans.pf', 'ONBOARDING', v_org_id, v_now);

    INSERT INTO public.clients (name, type, contact_name, contact_email, status, organization_id, created_at) VALUES
        ('Monaco Protocol', 'DELEGATION', 'Isabelle Grimaldi', 'isabelle@monaco-protocol.mc', 'ACTIVE', v_org_id, v_now),
        ('France Olympic Committee', 'NOC', 'Laurent Dubois', 'laurent@franceolympique.fr', 'ACTIVE', v_org_id, v_now),
        ('BBC Sport Coverage', 'MEDIA', 'James Wilson', 'james@bbc.co.uk', 'ACTIVE', v_org_id, v_now),
        ('NHK Japan Broadcasting', 'MEDIA', 'Yuki Tanaka', 'yuki@nhk.or.jp', 'ONBOARDING', v_org_id, v_now);

    -- ========================================================================
    -- 13. ACTIVITY LOGS — Audit Trail
    -- ========================================================================
    INSERT INTO public.activity_logs (action, detail, user_id, organization_id, created_at) VALUES
        ('LOGIN', 'User logged in successfully', v_user_id, v_org_id, v_now),
        ('CREATE', 'Created transport shift: Jean Dupont', v_user_id, v_org_id, v_now - interval '5 minutes'),
        ('UPDATE', 'Updated accommodation status to CHECKED_IN for Prince Albert', v_user_id, v_org_id, v_now - interval '10 minutes'),
        ('CREATE', 'Added VIP package: Gold Tribune Pass', v_user_id, v_org_id, v_now - interval '15 minutes'),
        ('DELETE', 'Removed outdated laundry request', v_user_id, v_org_id, v_now - interval '20 minutes'),
        ('LOGIN', 'User session started', v_user_id, v_org_id, v_now - interval '1 hour'),
        ('CREATE', 'Created delivery: 500 Broadcast Headsets', v_user_id, v_org_id, v_now - interval '2 hours'),
        ('UPDATE', 'Changed uniform status to LOW_STOCK for Staff Polo Blue', v_user_id, v_org_id, v_now - interval '3 hours');

    RAISE NOTICE '✅ Seed complete! Organization: %, User: %', v_org_id, v_user_id;
END $$;
