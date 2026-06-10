// ============================================================================
// Application Role Types — matches DB roles (profiles.role + RLS policies)
// ============================================================================
export type AppRole = 'MEMBER' | 'FRONT_OFFICE' | 'BACK_OFFICE' | 'ADMIN';

// ============================================================================
// Core Entities
// ============================================================================
export interface Profile {
  id: string;
  email: string;
  role: AppRole;
  organization_id: string;
  created_at: string;
}

export interface Provider {
  id: string;
  name: string;
  type: string;
  contact_name: string;
  contact_email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ONBOARDING' | 'MAINTENANCE';
  created_at?: string;
}

export interface Client {
  id: string;
  name: string;
  type: string;
  contact_name: string;
  contact_email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ONBOARDING' | 'MAINTENANCE';
  created_at?: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  detail: string;
  created_at: string;
  user_id?: string;
}

// ============================================================================
// Module: Transport (2.1)
// ============================================================================
export interface TransportShiftRow {
  id: string;
  driver_name: string;
  vehicle: string;
  time: string | null;          // display range e.g. "08:00 - 16:00"
  status: string;
  progress: string | null;
  organization_id: string;
  created_at: string;
}

export interface TransportTransferRow {
  id: string;
  time: string | null;          // TIMESTAMPTZ ISO string
  from_location: string;
  to_location: string;
  pax: number;
  assigned_driver: string | null;
  organization_id: string;
  created_at: string;
}

// ============================================================================
// Module: Accommodation (2.2)
// ============================================================================
export interface AccommodationRoomRow {
  id: string;
  guest_name: string;
  group_name: string;
  hotel_name: string;
  room_type: string;
  check_in_date: string | null;
  status: string;
  organization_id: string;
  created_at: string;
}

// ============================================================================
// Module: Catering (2.3)
// ============================================================================
export interface CateringMenu {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  service_type: string;
  // Dietary counts (mapped from DB pax_pax/pax_veg/pax_vgn/pax_gf/pax_halal)
  pax: number;
  veg: number;
  vgn: number;
  gf: number;
  halal: number;
  organization_id: string;
  created_at: string;
}

// ============================================================================
// Module: Hospitalities (2.4)
// ============================================================================
export interface HospitalityPackageRow {
  id: string;
  title: string;
  price: number;                // NUMERIC stored as number
  capacity: number;
  sold: number;
  total: number;
  organization_id: string;
  created_at: string;
}

export interface HospitalityGuestRow {
  id: string;
  section: string;
  guest: string;
  seat_num: string;
  organization_id: string;
  created_at: string;
}

// ============================================================================
// Module: Accreditations (2.5)
// ============================================================================
export interface AccreditationRow {
  id: string;
  code: string;
  name: string;
  count: number;
  pending: number;
  zones: string[];
  organization_id: string;
  created_at: string;
}

// ============================================================================
// Module: Deliveries (2.6)
// ============================================================================
export interface DeliveryRow {
  id: string;
  site: string;
  status: string;
  scheduled_time: string | null;
  detail: string | null;
  organization_id: string;
  created_at: string;
}

// ============================================================================
// Module: Laundry (2.7)
// ============================================================================
export interface LaundryRequestRow {
  id: string;
  client_name: string;
  group_name: string;
  service_type: string;
  items_count: number;
  status: string;
  organization_id: string;
  created_at: string;
}

// ============================================================================
// Module: Uniforms (2.8)
// ============================================================================
export interface UniformRow {
  id: string;
  item_name: string;
  sizes: string;
  total: number;
  deployed: number;
  status: string;
  organization_id: string;
  created_at: string;
}

// ============================================================================
// Module: Additional Services (2.9)
// ============================================================================
export interface AdditionalServiceRow {
  id: string;
  title: string;
  service_type: string;
  price: number;
  sold_count: number;
  limit_count: number;
  organization_id: string;
  created_at: string;
}
