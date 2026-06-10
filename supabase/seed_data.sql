-- ============================================================================
-- MAKAIAANUI SEED DATA — Enhanced with groups, MANAGER role, and per-group data
-- ============================================================================

-- 1. Update CHECK constraint to include MANAGER
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_profiles_role;
ALTER TABLE public.profiles ADD CONSTRAINT chk_profiles_role CHECK (role IN ('MEMBER', 'MANAGER', 'FRONT_OFFICE', 'BACK_OFFICE', 'ADMIN'));

DO $$
DECLARE
    v_org_id UUID;
    v_now TIMESTAMP WITH TIME ZONE := NOW();
    v_groups UUID[] := '{}';
    v_g1 UUID; v_g2 UUID; v_g3 UUID; v_g4 UUID; v_g5 UUID;
    v_admin_id UUID;
BEGIN
    -- Find or create org
    SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
    IF v_org_id IS NULL THEN
        INSERT INTO public.organizations (id, name, domain, brand_color)
        VALUES (gen_random_uuid(), 'Makaiaanui Games', 'games.makaiaanui.io', '#4F46E5')
        RETURNING id INTO v_org_id;
    END IF;

    -- Find admin user
    SELECT id INTO v_admin_id FROM public.profiles WHERE role = 'ADMIN' LIMIT 1;

    -- ========================================================================
    -- 2. GROUPS (Countries / Delegations)
    -- ========================================================================
    INSERT INTO public.groups (id, name, organization_id) VALUES
        (gen_random_uuid(), 'France', v_org_id),
        (gen_random_uuid(), 'Monaco', v_org_id),
        (gen_random_uuid(), 'Japan', v_org_id),
        (gen_random_uuid(), 'Brazil', v_org_id),
        (gen_random_uuid(), 'Germany', v_org_id)
    RETURNING id INTO v_g1;

    -- Since RETURNING only gives us the last one, fetch all
    SELECT ARRAY_AGG(id ORDER BY name) INTO v_groups FROM public.groups WHERE organization_id = v_org_id;
    v_g1 := v_groups[1]; v_g2 := v_groups[2]; v_g3 := v_groups[3]; v_g4 := v_groups[4]; v_g5 := v_groups[5];

    RAISE NOTICE 'Groups: %', v_groups;

    -- ========================================================================
    -- 3. TRANSPORT — Shifts & Transfers
    -- ========================================================================
    INSERT INTO public.transport_shifts (driver_name, vehicle, time, status, progress, organization_id, group_id, created_at) VALUES
        ('Jean Dupont', 'Tesla Model Y (AA-123-BB)', '06:00 - 14:00', 'ACTIVE', '45%', v_org_id, v_g1, v_now),
        ('Marie Lambert', 'Renault Trafic (CC-456-DD)', '08:00 - 16:00', 'ACTIVE', '20%', v_org_id, v_g1, v_now),
        ('Taro Yamada', 'Toyota Coaster (EE-789-FF)', '14:00 - 22:00', 'OFFLINE', '0%', v_org_id, v_g3, v_now),
        ('Hina Marama', 'Mercedes Sprinter (GG-012-HH)', '06:00 - 18:00', 'ACTIVE', '80%', v_org_id, v_g2, v_now),
        ('Carlos Silva', 'Volkswagen Crafter (BR-001)', '07:00 - 15:00', 'ACTIVE', '60%', v_org_id, v_g4, v_now);

    INSERT INTO public.transport_transfers (time, from_location, to_location, pax, assigned_driver, organization_id, group_id, created_at) VALUES
        (v_now + interval '2 hours', 'Aéroport Faa''a', 'Olympic Village', 12, 'Jean Dupont', v_org_id, v_g1, v_now),
        (v_now + interval '3 hours', 'Main Stadium', 'Tahitia Lagoon Hotel', 4, 'Marie Lambert', v_org_id, v_g2, v_now),
        (v_now + interval '5 hours', 'Marriott Press Hub', 'Olympic Village', 8, NULL, v_org_id, v_g3, v_now),
        (v_now + interval '1 hour', 'Olympic Village', 'Training Center Pirae', 15, 'Hina Marama', v_org_id, v_g2, v_now),
        (v_now + interval '6 hours', 'Main Stadium', 'Aéroport Faa''a', 6, NULL, v_org_id, v_g4, v_now);

    -- ========================================================================
    -- 4. ACCOMMODATION — Rooms & Lodging
    -- ========================================================================
    INSERT INTO public.accommodation_rooms (guest_name, group_name, hotel_name, room_type, check_in_date, status, organization_id, group_id, created_at) VALUES
        ('Marie Curie', 'France', 'InterContinental Tahiti', 'Double', CURRENT_DATE + 2, 'CONFIRMED', v_org_id, v_g1, v_now),
        ('Antoine Laurent', 'France', 'InterContinental Tahiti', 'Single', CURRENT_DATE + 1, 'CONFIRMED', v_org_id, v_g1, v_now),
        ('Prince Albert', 'Monaco', 'Hilton Tahiti Resort', 'Suite', CURRENT_DATE, 'CHECKED_IN', v_org_id, v_g2, v_now),
        ('Isabelle Grimaldi', 'Monaco', 'Hilton Tahiti Resort', 'Double', CURRENT_DATE, 'CHECKED_IN', v_org_id, v_g2, v_now),
        ('Akira Tanaka', 'Japan', 'InterContinental Tahiti', 'Twin', CURRENT_DATE, 'CHECKED_IN', v_org_id, v_g3, v_now),
        ('Yuki Tanaka', 'Japan', 'InterContinental Tahiti', 'Single', CURRENT_DATE + 1, 'PENDING', v_org_id, v_g3, v_now),
        ('Maria Silva', 'Brazil', 'Manava Suite Resort', 'Double', CURRENT_DATE + 3, 'CONFIRMED', v_org_id, v_g4, v_now),
        ('Pedro Santos', 'Brazil', 'Manava Suite Resort', 'Suite', CURRENT_DATE + 2, 'PENDING', v_org_id, v_g4, v_now),
        ('Hans Mueller', 'Germany', 'Hilton Tahiti Resort', 'Suite', CURRENT_DATE, 'PENDING', v_org_id, v_g5, v_now),
        ('Erika Schmidt', 'Germany', 'Hilton Tahiti Resort', 'Double', CURRENT_DATE, 'CONFIRMED', v_org_id, v_g5, v_now);

    -- ========================================================================
    -- 5. CATERING — Menus & Dietary
    -- ========================================================================
    INSERT INTO public.catering_menus (title, start_time, end_time, service_type, pax, veg, vgn, gf, halal, organization_id, group_id, created_at) VALUES
        ('France Team Breakfast', v_now + interval '7 hours', v_now + interval '10 hours', 'BUFFET', 40, 8, 3, 2, 0, v_org_id, v_g1, v_now),
        ('Monaco VIP Brunch', v_now + interval '9 hours', v_now + interval '11 hours', 'PLATED', 12, 4, 1, 2, 1, v_org_id, v_g2, v_now),
        ('Japan Team Lunch', v_now + interval '12 hours', v_now + interval '14 hours', 'LUNCHBOX', 25, 5, 2, 1, 3, v_org_id, v_g3, v_now),
        ('Brazil Dinner Service', v_now + interval '19 hours', v_now + interval '22 hours', 'BANQUET', 35, 6, 2, 4, 0, v_org_id, v_g4, v_now),
        ('Germany Coffee Break', v_now + interval '10 hours', v_now + interval '11 hours', 'COFFEE_BREAK', 20, 2, 1, 3, 0, v_org_id, v_g5, v_now);

    -- ========================================================================
    -- 6. HOSPITALITIES — VIP Packages & Seating
    -- ========================================================================
    INSERT INTO public.hospitality_packages (title, price, capacity, sold, total, organization_id, group_id, created_at) VALUES
        ('France Premium Box', 850.00, 20, 12, 20, v_org_id, v_g1, v_now),
        ('Monaco President Box', 1200.00, 10, 8, 10, v_org_id, v_g2, v_now),
        ('Japan Gold Pass', 350.00, 30, 20, 30, v_org_id, v_g3, v_now),
        ('Brazil Silver Lounge', 180.00, 40, 15, 40, v_org_id, v_g4, v_now),
        ('Germany VIP Deck', 500.00, 15, 10, 15, v_org_id, v_g5, v_now);

    INSERT INTO public.hospitality_guests (section, guest, seat_num, organization_id, group_id, created_at) VALUES
        ('Tribune d''Honneur', 'Marie Curie', 'A-12', v_org_id, v_g1, v_now),
        ('Tribune d''Honneur', 'Antoine Laurent', 'A-13', v_org_id, v_g1, v_now),
        ('Loge Présidentielle', 'S.A.S. Le Prince Albert', 'VIP-01', v_org_id, v_g2, v_now),
        ('Loge Présidentielle', 'Isabelle Grimaldi', 'VIP-02', v_org_id, v_g2, v_now),
        ('Tribune Nord Elite', 'Akira Tanaka', 'B-45', v_org_id, v_g3, v_now),
        ('Tribune Nord Elite', 'Yuki Tanaka', 'B-46', v_org_id, v_g3, v_now),
        ('Prestige Lounge', 'Maria Silva', 'D-22', v_org_id, v_g4, v_now),
        ('Prestige Lounge', 'Pedro Santos', 'D-23', v_org_id, v_g4, v_now),
        ('Prestige Lounge', 'Hans Mueller', 'D-24', v_org_id, v_g5, v_now),
        ('Prestige Lounge', 'Erika Schmidt', 'D-25', v_org_id, v_g5, v_now);

    -- ========================================================================
    -- 7. ACCREDITATIONS — Permits & Populations
    -- ========================================================================
    INSERT INTO public.accreditations (code, name, count, pending, zones, organization_id, group_id, created_at) VALUES
        ('FRA', 'France Delegation', 50, 3, ARRAY['1','2','3','5'], v_org_id, v_g1, v_now),
        ('MON', 'Monaco Protocol', 15, 0, ARRAY['1','2','3','4','5','V','S'], v_org_id, v_g2, v_now),
        ('JPN', 'Japan Olympic', 40, 5, ARRAY['1','2','3','5'], v_org_id, v_g3, v_now),
        ('BRA', 'Brazil Delegation', 35, 2, ARRAY['1','2','3','4','5'], v_org_id, v_g4, v_now),
        ('GER', 'Germany Olympic', 30, 1, ARRAY['1','2','3','5'], v_org_id, v_g5, v_now);

    -- ========================================================================
    -- 8. UNIFORMS — Apparel & Assets
    -- ========================================================================
    INSERT INTO public.uniforms (item_name, sizes, total, deployed, status, organization_id, group_id, created_at) VALUES
        ('France Team Jacket', 'S, M, L, XL', 60, 45, 'HEALTHY', v_org_id, v_g1, v_now),
        ('Monaco Polo Shirt', 'S, M, L, XL, XXL', 25, 20, 'HEALTHY', v_org_id, v_g2, v_now),
        ('Japan Track Suit', 'XS, S, M, L, XL', 50, 48, 'LOW_STOCK', v_org_id, v_g3, v_now),
        ('Brazil T-Shirt Kit', 'S, M, L, XL, XXL', 45, 30, 'HEALTHY', v_org_id, v_g4, v_now),
        ('Germany Team Vest', 'M, L, XL', 35, 35, 'OUT_OF_STOCK', v_org_id, v_g5, v_now);

    -- ========================================================================
    -- 9. LAUNDRY — Bags & Processing
    -- ========================================================================
    INSERT INTO public.laundry_requests (client_name, group_name, service_type, items_count, status, organization_id, group_id, created_at) VALUES
        ('France Olympic', 'France', 'Standard Wash', 45, 'IN_PROGRESS', v_org_id, v_g1, v_now),
        ('Monaco Protocol', 'Monaco', 'Dry Cleaning Only', 8, 'RETURNED', v_org_id, v_g2, v_now),
        ('Japan Olympic', 'Japan', 'Delicate Fabric Steam', 12, 'COLLECTED', v_org_id, v_g3, v_now),
        ('Brazil Delegation', 'Brazil', 'Express Wash (6h)', 20, 'COLLECTED', v_org_id, v_g4, v_now),
        ('Germany Olympic', 'Germany', 'Standard Wash', 30, 'READY', v_org_id, v_g5, v_now);

    -- ========================================================================
    -- 10. ADDITIONAL SERVICES — Catalog
    -- ========================================================================
    INSERT INTO public.additional_services (title, service_type, price, sold_count, limit_count, organization_id, group_id, created_at) VALUES
        ('France VIP Lagoon Tour', 'TOURISM_HOTEL', 120.00, 12, 20, v_org_id, v_g1, v_now),
        ('Monaco Private Transfer', 'TRANSFERS', 80.00, 6, 0, v_org_id, v_g2, v_now),
        ('Japan Premium Dinner', 'PREMIUM_MEALS', 200.00, 8, 15, v_org_id, v_g3, v_now),
        ('Brazil Equipment Rental', 'EQUIPMENT', 45.00, 10, 15, v_org_id, v_g4, v_now),
        ('Germany Helicopter Tour', 'TOURISM_HOTEL', 350.00, 3, 5, v_org_id, v_g5, v_now);

    -- ========================================================================
    -- 11. DELIVERIES — Incoming Logistics
    -- ========================================================================
    INSERT INTO public.deliveries (site, status, scheduled_time, detail, organization_id, group_id, created_at) VALUES
        ('Olympic Village', 'RECEIVED', v_now - interval '2 hours', 'France: 50 Welcome Kits', v_org_id, v_g1, v_now),
        ('Olympic Village', 'EN_ROUTE', v_now + interval '1 hour', 'Monaco: 20 Protocol Gifts', v_org_id, v_g2, v_now),
        ('Olympic Village', 'PENDING', v_now + interval '3 hours', 'Japan: 30 Tech Equipment', v_org_id, v_g3, v_now),
        ('Main Stadium', 'RECEIVED', v_now - interval '1 hour', 'Brazil: 40 Sport Kits', v_org_id, v_g4, v_now),
        ('Olympic Village', 'DELAYED', v_now - interval '4 hours', 'Germany: 25 Medical Supplies', v_org_id, v_g5, v_now);

    -- ========================================================================
    -- 12. PORTAL REQUESTS — Client requests for group changes and signals
    -- ========================================================================
    INSERT INTO public.client_requests (organization_id, module_type, title, description, status, client_name, created_at) VALUES
        (v_org_id, 'transport', 'Transport supplémentaire', 'Besoin de 2 bus pour le défilé d''ouverture', 'PENDING', 'France', v_now - interval '1 day'),
        (v_org_id, 'accommodation', 'Changement de chambre', 'Demande de 2 suites supplémentaires', 'APPROVED', 'Monaco', v_now - interval '2 days'),
        (v_org_id, 'catering', 'Régime spécial', 'Besoin de menus sans gluten pour 5 athlètes', 'PENDING', 'Japan', v_now - interval '12 hours'),
        (v_org_id, 'transport', 'Changement de groupe', 'Un membre souhaite changer de groupe', 'PENDING', 'France', v_now - interval '6 hours');

    RAISE NOTICE '✅ Seed complete! Org: %, Groups: %', v_org_id, v_groups;
END $$;
