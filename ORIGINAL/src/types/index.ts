export type EntityStatus = 'ACTIVE' | 'INACTIVE' | 'ONBOARDING' | 'MAINTENANCE';

export interface Profile {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'OPERATOR' | 'VIEWER';
  organization_id: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  domain: string;
  brand_color: string;
  logo_url: string;
}

export interface Provider {
  id: string;
  name: string;
  type: string;
  contact_name: string;
  contact_email: string;
  status: EntityStatus;
  created_at?: string;
}

export interface Client {
  id: string;
  name: string;
  type: string;
  contact_name: string;
  contact_email: string;
  status: EntityStatus;
  created_at?: string;
}

export interface TransportShift {
  id: string;
  driver_name: string;
  vehicle_id: string;
  route: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  start_time: string;
  end_time: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  detail: string;
  created_at: string;
  user_id?: string;
}
