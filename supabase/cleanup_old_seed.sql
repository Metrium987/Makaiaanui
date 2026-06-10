-- ============================================================================
-- P4.2 — Nettoyage des anciennes données seed (sans group_id)
-- Supprime les enregistrements des anciens seeds qui n'ont pas de group_id
-- ============================================================================

DO $$
DECLARE
    v_org_id UUID;
    v_deleted INT;
BEGIN
    -- Find the org
    SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
    
    IF v_org_id IS NULL THEN
        RAISE NOTICE 'No organization found. Skipping cleanup.';
        RETURN;
    END IF;

    RAISE NOTICE 'Cleaning old seed data for organization: %', v_org_id;

    -- Delete records without group_id (old seed data)
    DELETE FROM public.transport_shifts WHERE organization_id = v_org_id AND group_id IS NULL;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE '  transport_shifts: % deleted', v_deleted;

    DELETE FROM public.transport_transfers WHERE organization_id = v_org_id AND group_id IS NULL;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE '  transport_transfers: % deleted', v_deleted;

    DELETE FROM public.accommodation_rooms WHERE organization_id = v_org_id AND group_id IS NULL;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE '  accommodation_rooms: % deleted', v_deleted;

    DELETE FROM public.catering_menus WHERE organization_id = v_org_id AND group_id IS NULL;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE '  catering_menus: % deleted', v_deleted;

    DELETE FROM public.hospitality_packages WHERE organization_id = v_org_id AND group_id IS NULL;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE '  hospitality_packages: % deleted', v_deleted;

    DELETE FROM public.hospitality_guests WHERE organization_id = v_org_id AND group_id IS NULL;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE '  hospitality_guests: % deleted', v_deleted;

    DELETE FROM public.accreditations WHERE organization_id = v_org_id AND group_id IS NULL;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE '  accreditations: % deleted', v_deleted;

    DELETE FROM public.uniforms WHERE organization_id = v_org_id AND group_id IS NULL;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE '  uniforms: % deleted', v_deleted;

    DELETE FROM public.laundry_requests WHERE organization_id = v_org_id AND group_id IS NULL;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE '  laundry_requests: % deleted', v_deleted;

    DELETE FROM public.additional_services WHERE organization_id = v_org_id AND group_id IS NULL;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE '  additional_services: % deleted', v_deleted;

    DELETE FROM public.deliveries WHERE organization_id = v_org_id AND group_id IS NULL;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE '  deliveries: % deleted', v_deleted;

    -- Clean old activity logs (no group_id column, delete all for this org except last 10)
    DELETE FROM public.activity_logs 
    WHERE organization_id = v_org_id 
    AND id NOT IN (SELECT id FROM public.activity_logs WHERE organization_id = v_org_id ORDER BY created_at DESC LIMIT 10);
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE '  activity_logs (old): % deleted', v_deleted;

    RAISE NOTICE '✅ Cleanup complete!';
END $$;
