import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Provider, Client, ActivityLog, TransportShiftRow, TransportTransferRow, AccommodationRoomRow, CateringMenu, HospitalityPackageRow, HospitalityGuestRow, AccreditationRow, UniformRow, LaundryRequestRow, AdditionalServiceRow, DeliveryRow, Profile, ClientRequest } from '../types';
import type { AppRole } from '../types';
import { useAppStore } from '../store/appStore';

const DEFAULT_PAGE_SIZE = 10;

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProviders = async (p: number) => {
    try {
      setLoading(true);
      const from = (p - 1) * DEFAULT_PAGE_SIZE;
      const to = from + DEFAULT_PAGE_SIZE - 1;
      const { data, count, error } = await supabase
        .from('providers').select('*', { count: 'exact' }).is('deleted_at', null).order('name')
        .range(from, to);
      if (error) throw error;
      setProviders(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders(1);
  }, []);

  const goToPage = (p: number) => {
    setPage(p);
    fetchProviders(p);
  };

  return { providers, loading, error, page, pageSize: DEFAULT_PAGE_SIZE, totalCount, goToPage };
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchClients = async (p: number) => {
    try {
      setLoading(true);
      const from = (p - 1) * DEFAULT_PAGE_SIZE;
      const to = from + DEFAULT_PAGE_SIZE - 1;
      const { data, count, error } = await supabase
        .from('clients').select('*', { count: 'exact' }).is('deleted_at', null).order('name')
        .range(from, to);
      if (error) throw error;
      setClients(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients(1);
  }, []);

  const goToPage = (p: number) => {
    setPage(p);
    fetchClients(p);
  };

  return { clients, loading, error, page, pageSize: DEFAULT_PAGE_SIZE, totalCount, goToPage };
}

export function useActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Separate effect for initial data fetch (runs once)
  useEffect(() => {
    async function fetchLogs() {
      try {
        const { data, error } = await supabase.from('activity_logs').select('*').is('deleted_at', null).order('created_at', { ascending: false }).limit(10);
        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  // Separate effect for realtime subscription (cleanup on unmount)
  useEffect(() => {
    const subscription = supabase
      .channel('activity-logs-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        setLogs(current => [payload.new as ActivityLog, ...current].slice(0, 10));
      })
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, []);

  return { logs, loading, error };
}

export function useTransportShifts() {
  const [shifts, setShifts] = useState<TransportShiftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { organizationId } = useAppStore();
  const groupId = useAppStore(s => s.groupId);
  const role = useAppStore(s => s.role);
  const isMember = role === 'MEMBER';

  const fetchShifts = async (p: number) => {
    try {
      setLoading(true);
      const from = (p - 1) * DEFAULT_PAGE_SIZE;
      const to = from + DEFAULT_PAGE_SIZE - 1;
      const query = supabase
        .from('transport_shifts').select('*', { count: 'exact' }).is('deleted_at', null).order('created_at', { ascending: false })
        .range(from, to);
      if (organizationId) query.eq('organization_id', organizationId);
      if (isMember && groupId) query.eq('group_id', groupId);
      const { data, count, error } = await query;
      if (error) throw error;
      setShifts(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(organizationId){fetchShifts(1);}else{setShifts([]);setLoading(false);}
  }, [organizationId]);

  const goToPage = (p: number) => {
    setPage(p);
    fetchShifts(p);
  };

  const addShift = async (shift: { driver_name: string; vehicle: string; time?: string; status?: string; progress?: string; group_id?: string }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase.from('transport_shifts').insert({
      ...shift,
      organization_id: organizationId
    }).select().single();
    if (error) throw error;
    setShifts(prev => [data, ...prev]);
    setTotalCount(c => c + 1);
    return data;
  };

  const updateShift = async (id: string, updates: Partial<{ driver_name: string; vehicle: string; time: string; status: string; progress: string }>) => {
    const { data, error } = await supabase.from('transport_shifts').update(updates).eq('id', id).select().single();
    if (error) throw error;
    setShifts(prev => prev.map(s => s.id === id ? data : s));
    return data;
  };

  const deleteShift = async (id: string) => {
    const { error } = await supabase.from('transport_shifts').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    setShifts(prev => prev.filter(s => s.id !== id));
    setTotalCount(c => Math.max(0, c - 1));
  };

  return { shifts, loading, error, refresh: () => fetchShifts(1), addShift, updateShift, deleteShift, page, pageSize: DEFAULT_PAGE_SIZE, totalCount, goToPage };
}

export function useTransportTransfers() {
  const [transfers, setTransfers] = useState<TransportTransferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { organizationId } = useAppStore();
  const groupId = useAppStore(s => s.groupId);
  const role = useAppStore(s => s.role);
  const isMember = role === 'MEMBER';

  const fetchTransfers = async (p: number) => {
    try {
      setLoading(true);
      const from = (p - 1) * DEFAULT_PAGE_SIZE;
      const to = from + DEFAULT_PAGE_SIZE - 1;
      const query = supabase
        .from('transport_transfers').select('*', { count: 'exact' }).is('deleted_at', null).order('created_at', { ascending: false })
        .range(from, to);
      if (organizationId) query.eq('organization_id', organizationId);
      if (isMember && groupId) query.eq('group_id', groupId);
      const { data, count, error } = await query;
      if (error) throw error;
      setTransfers(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(organizationId){fetchTransfers(1);}else{setTransfers([]);setLoading(false);}
  }, [organizationId]);

  const goToPage = (p: number) => {
    setPage(p);
    fetchTransfers(p);
  };

  const addTransfer = async (transfer: { time: string; from_location: string; to_location: string; pax: number; assigned_driver?: string; group_id?: string }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase.from('transport_transfers').insert({
      ...transfer,
      organization_id: organizationId
    }).select().single();
    if (error) throw error;
    setTransfers(prev => [data, ...prev]);
    setTotalCount(c => c + 1);
    return data;
  };

  const updateTransfer = async (id: string, updates: Partial<{ time?: string; from_location: string; to_location: string; pax: number; assigned_driver?: string }>) => {
    const { data, error } = await supabase.from('transport_transfers').update(updates).eq('id', id).select().single();
    if (error) throw error;
    setTransfers(prev => prev.map(t => t.id === id ? data : t));
    return data;
  };

  const deleteTransfer = async (id: string) => {
    const { error } = await supabase.from('transport_transfers').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    setTransfers(prev => prev.filter(t => t.id !== id));
    setTotalCount(c => Math.max(0, c - 1));
  };

  return { transfers, loading, error, refresh: () => fetchTransfers(1), addTransfer, updateTransfer, deleteTransfer, page, pageSize: DEFAULT_PAGE_SIZE, totalCount, goToPage };
}

export function useAccommodationRooms() {
  const [rooms, setRooms] = useState<AccommodationRoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { organizationId } = useAppStore();
  const groupId = useAppStore(s => s.groupId);
  const role = useAppStore(s => s.role);
  const isMember = role === 'MEMBER';

  const fetchRooms = async (p: number) => {
    try {
      setLoading(true);
      const from = (p - 1) * DEFAULT_PAGE_SIZE;
      const to = from + DEFAULT_PAGE_SIZE - 1;
      const query = supabase
        .from('accommodation_rooms').select('*', { count: 'exact' }).is('deleted_at', null).order('created_at', { ascending: false })
        .range(from, to);
      if (organizationId) query.eq('organization_id', organizationId);
      if (isMember && groupId) query.eq('group_id', groupId);
      const { data, count, error } = await query;
      if (error) throw error;
      setRooms(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(organizationId){fetchRooms(1);}else{setRooms([]);setLoading(false);}
  }, [organizationId]);

  const goToPage = (p: number) => {
    setPage(p);
    fetchRooms(p);
  };

  const addRoom = async (room: { guest_name: string; group_name: string; hotel_name: string; room_type: string; check_in_date?: string; status?: string; group_id?: string }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase
      .from('accommodation_rooms')
      .insert({ ...room, organization_id: organizationId })
      .select().single();
    if (error) throw error;
    setRooms(prev => [data, ...prev]);
    setTotalCount(c => c + 1);
    return data;
  };

  const updateRoom = async (id: string, updates: Partial<{ guest_name: string; group_name: string; hotel_name: string; room_type: string; check_in_date: string; status: string; group_id?: string }>) => {
    const { data, error } = await supabase
      .from('accommodation_rooms')
      .update(updates).eq('id', id).select().single();
    if (error) throw error;
    setRooms(prev => prev.map(r => r.id === id ? data : r));
    return data;
  };

  const deleteRoom = async (id: string) => {
    const { error } = await supabase.from('accommodation_rooms').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    setRooms(prev => prev.filter(r => r.id !== id));
    setTotalCount(c => Math.max(0, c - 1));
  };

  return { rooms, loading, error, refresh: () => fetchRooms(1), addRoom, updateRoom, deleteRoom, page, pageSize: DEFAULT_PAGE_SIZE, totalCount, goToPage };
}

export function useDeliveries() {
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { organizationId } = useAppStore();
  const groupId = useAppStore(s => s.groupId);
  const role = useAppStore(s => s.role);
  const isMember = role === 'MEMBER';

  const fetchDeliveries = async (p: number) => {
    try {
      setLoading(true);
      const from = (p - 1) * DEFAULT_PAGE_SIZE;
      const to = from + DEFAULT_PAGE_SIZE - 1;
      const query = supabase
        .from('deliveries').select('*', { count: 'exact' }).is('deleted_at', null).order('scheduled_time', { ascending: true })
        .range(from, to);
      if (organizationId) query.eq('organization_id', organizationId);
      if (isMember && groupId) query.eq('group_id', groupId);
      const { data, count, error } = await query;
      if (error) throw error;
      setDeliveries(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(organizationId){fetchDeliveries(1);}else{setDeliveries([]);setLoading(false);}
  }, [organizationId]);

  const goToPage = (p: number) => {
    setPage(p);
    fetchDeliveries(p);
  };

  const addDelivery = async (delivery: { site: string; status: string; scheduled_time: string; detail: string; group_id?: string }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase
      .from('deliveries')
      .insert({ ...delivery, organization_id: organizationId })
      .select().single();
    if (error) throw error;
    setDeliveries(prev => [...prev, data]);
    setTotalCount(c => c + 1);
    return data;
  };

  const updateDelivery = async (id: string, updates: Partial<{ site: string; status: string; scheduled_time: string; detail: string; group_id?: string }>) => {
    const { data, error } = await supabase
      .from('deliveries').update(updates).eq('id', id).select().single();
    if (error) throw error;
    setDeliveries(prev => prev.map(d => d.id === id ? data : d));
    return data;
  };

  const deleteDelivery = async (id: string) => {
    const { error } = await supabase.from('deliveries').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    setDeliveries(prev => prev.filter(d => d.id !== id));
    setTotalCount(c => Math.max(0, c - 1));
  };

  return { deliveries, loading, error, refresh: () => fetchDeliveries(1), addDelivery, updateDelivery, deleteDelivery, page, pageSize: DEFAULT_PAGE_SIZE, totalCount, goToPage };
}

export function useHospitalityPackages() {
  const [packages, setPackages] = useState<HospitalityPackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { organizationId } = useAppStore();
  const groupId = useAppStore(s => s.groupId);
  const role = useAppStore(s => s.role);
  const isMember = role === 'MEMBER';

  const fetchPackages = async (p: number) => {
    try {
      setLoading(true);
      const from = (p - 1) * DEFAULT_PAGE_SIZE;
      const to = from + DEFAULT_PAGE_SIZE - 1;
      const query = supabase
        .from('hospitality_packages').select('*', { count: 'exact' }).is('deleted_at', null).order('created_at', { ascending: false })
        .range(from, to);
      if (organizationId) query.eq('organization_id', organizationId);
      if (isMember && groupId) query.eq('group_id', groupId);
      const { data, count, error } = await query;
      if (error) throw error;
      setPackages(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchPackages(1);
    } else {
      setPackages([]);
      setLoading(false);
    }
  }, [organizationId]);

  const goToPage = (p: number) => {
    setPage(p);
    fetchPackages(p);
  };

  const addPackage = async (pkg: { title: string; price: number; capacity: number; sold: number; total: number; group_id?: string }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase
      .from('hospitality_packages')
      .insert({ ...pkg, organization_id: organizationId })
      .select().single();
    if (error) throw error;
    setPackages(prev => [data, ...prev]);
    setTotalCount(c => c + 1);
    return data;
  };

  const updatePackage = async (id: string, updates: Partial<{ title: string; price: number; capacity: number; sold: number; total: number; group_id?: string }>) => {
    const { data, error } = await supabase
      .from('hospitality_packages').update(updates).eq('id', id).select().single();
    if (error) throw error;
    setPackages(prev => prev.map(p => p.id === id ? data : p));
    return data;
  };

  const deletePackage = async (id: string) => {
    const { error } = await supabase.from('hospitality_packages').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    setPackages(prev => prev.filter(p => p.id !== id));
    setTotalCount(c => Math.max(0, c - 1));
  };

  return { packages, loading, error, refresh: () => fetchPackages(1), addPackage, updatePackage, deletePackage, page, pageSize: DEFAULT_PAGE_SIZE, totalCount, goToPage };
}

export function useHospitalityGuests() {
  const [guests, setGuests] = useState<HospitalityGuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { organizationId } = useAppStore();
  const groupId = useAppStore(s => s.groupId);
  const role = useAppStore(s => s.role);
  const isMember = role === 'MEMBER';

  const fetchGuests = async (p: number) => {
    try {
      setLoading(true);
      const from = (p - 1) * DEFAULT_PAGE_SIZE;
      const to = from + DEFAULT_PAGE_SIZE - 1;
      const query = supabase
        .from('hospitality_guests')
        .select('*', { count: 'exact' }).is('deleted_at', null).order('created_at', { ascending: true })
        .range(from, to);
      if (organizationId) query.eq('organization_id', organizationId);
      if (isMember && groupId) query.eq('group_id', groupId);
      const { data, count, error } = await query;
      if (error) throw error;
      setGuests(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchGuests(1);
    } else {
      setGuests([]);
      setLoading(false);
    }
  }, [organizationId]);

  const goToPage = (p: number) => {
    setPage(p);
    fetchGuests(p);
  };

  const addGuest = async (guestData: { section: string; guest: string; seat_num: string; group_id?: string }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase
      .from('hospitality_guests')
      .insert({ ...guestData, organization_id: organizationId })
      .select().single();
    if (error) throw error;
    setGuests(prev => [...prev, data]);
    setTotalCount(c => c + 1);
    return data;
  };

  const deleteGuest = async (id: string) => {
    const { error } = await supabase.from('hospitality_guests').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    setGuests(prev => prev.filter(g => g.id !== id));
    setTotalCount(c => Math.max(0, c - 1));
  };

  return { guests, loading, error, refresh: () => fetchGuests(1), addGuest, deleteGuest, page, pageSize: DEFAULT_PAGE_SIZE, totalCount, goToPage };
}

export function useAccreditations() {
  const [accreditations, setAccreditations] = useState<AccreditationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { organizationId } = useAppStore();
  const groupId = useAppStore(s => s.groupId);
  const role = useAppStore(s => s.role);
  const isMember = role === 'MEMBER';

  const fetchAccreditations = async (p: number) => {
    try {
      setLoading(true);
      const from = (p - 1) * DEFAULT_PAGE_SIZE;
      const to = from + DEFAULT_PAGE_SIZE - 1;
      const query = supabase
        .from('accreditations').select('*', { count: 'exact' }).is('deleted_at', null).order('created_at', { ascending: false })
        .range(from, to);
      if (organizationId) query.eq('organization_id', organizationId);
      if (isMember && groupId) query.eq('group_id', groupId);
      const { data, count, error } = await query;
      if (error) throw error;
      setAccreditations(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(organizationId){fetchAccreditations(1);}else{setAccreditations([]);setLoading(false);}
  }, [organizationId]);

  const goToPage = (p: number) => {
    setPage(p);
    fetchAccreditations(p);
  };

  const addAccreditation = async (acc: { code: string; name: string; count: number; pending: number; zones: string[]; group_id?: string }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase
      .from('accreditations')
      .insert({ ...acc, organization_id: organizationId })
      .select().single();
    if (error) throw error;
    setAccreditations(prev => [data, ...prev]);
    setTotalCount(c => c + 1);
    return data;
  };

  const updateAccreditation = async (id: string, updates: Partial<{ code: string; name: string; count: number; pending: number; zones: string[]; group_id?: string }>) => {
    const { data, error } = await supabase
      .from('accreditations').update(updates).eq('id', id).select().single();
    if (error) throw error;
    setAccreditations(prev => prev.map(a => a.id === id ? data : a));
    return data;
  };

  const deleteAccreditation = async (id: string) => {
    const { error } = await supabase.from('accreditations').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    setAccreditations(prev => prev.filter(a => a.id !== id));
    setTotalCount(c => Math.max(0, c - 1));
  };

  return { accreditations, loading, error, refresh: () => fetchAccreditations(1), addAccreditation, updateAccreditation, deleteAccreditation, page, pageSize: DEFAULT_PAGE_SIZE, totalCount, goToPage };
}

export function useUniforms() {
  const [uniforms, setUniforms] = useState<UniformRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { organizationId } = useAppStore();
  const groupId = useAppStore(s => s.groupId);
  const role = useAppStore(s => s.role);
  const isMember = role === 'MEMBER';

  const fetchUniforms = async (p: number) => {
    try {
      setLoading(true);
      const from = (p - 1) * DEFAULT_PAGE_SIZE;
      const to = from + DEFAULT_PAGE_SIZE - 1;
      const query = supabase
        .from('uniforms').select('*', { count: 'exact' }).is('deleted_at', null).order('created_at', { ascending: false })
        .range(from, to);
      if (organizationId) query.eq('organization_id', organizationId);
      if (isMember && groupId) query.eq('group_id', groupId);
      const { data, count, error } = await query;
      if (error) throw error;
      setUniforms(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(organizationId){fetchUniforms(1);}else{setUniforms([]);setLoading(false);}
  }, [organizationId]);

  const goToPage = (p: number) => {
    setPage(p);
    fetchUniforms(p);
  };

  const addUniform = async (uniform: { item_name: string; sizes: string; total: number; deployed: number; status?: string; group_id?: string }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase
      .from('uniforms')
      .insert({ ...uniform, organization_id: organizationId })
      .select().single();
    if (error) throw error;
    setUniforms(prev => [data, ...prev]);
    setTotalCount(c => c + 1);
    return data;
  };

  const updateUniform = async (id: string, updates: Partial<{ item_name: string; sizes: string; total: number; deployed: number; status: string; group_id?: string }>) => {
    const { data, error } = await supabase
      .from('uniforms').update(updates).eq('id', id).select().single();
    if (error) throw error;
    setUniforms(prev => prev.map(u => u.id === id ? data : u));
    return data;
  };

  const deleteUniform = async (id: string) => {
    const { error } = await supabase.from('uniforms').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    setUniforms(prev => prev.filter(u => u.id !== id));
    setTotalCount(c => Math.max(0, c - 1));
  };

  return { uniforms, loading, error, refresh: () => fetchUniforms(1), addUniform, updateUniform, deleteUniform, page, pageSize: DEFAULT_PAGE_SIZE, totalCount, goToPage };
}

export function useLaundryRequests() {
  const [requests, setRequests] = useState<LaundryRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { organizationId } = useAppStore();
  const groupId = useAppStore(s => s.groupId);
  const role = useAppStore(s => s.role);
  const isMember = role === 'MEMBER';

  const fetchRequests = async (p: number) => {
    try {
      setLoading(true);
      const from = (p - 1) * DEFAULT_PAGE_SIZE;
      const to = from + DEFAULT_PAGE_SIZE - 1;
      const query = supabase
        .from('laundry_requests').select('*', { count: 'exact' }).is('deleted_at', null).order('created_at', { ascending: false })
        .range(from, to);
      if (organizationId) query.eq('organization_id', organizationId);
      if (isMember && groupId) query.eq('group_id', groupId);
      const { data, count, error } = await query;
      if (error) throw error;
      setRequests(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(organizationId){fetchRequests(1);}else{setRequests([]);setLoading(false);}
  }, [organizationId]);

  const goToPage = (p: number) => {
    setPage(p);
    fetchRequests(p);
  };

  const addRequest = async (request: { client_name: string; group_name: string; service_type: string; items_count: number; status?: string; group_id?: string }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase
      .from('laundry_requests')
      .insert({ ...request, organization_id: organizationId })
      .select().single();
    if (error) throw error;
    setRequests(prev => [data, ...prev]);
    setTotalCount(c => c + 1);
    return data;
  };

  const updateRequest = async (id: string, updates: Partial<{ client_name: string; group_name: string; service_type: string; items_count: number; status: string; group_id?: string }>) => {
    const { data, error } = await supabase
      .from('laundry_requests').update(updates).eq('id', id).select().single();
    if (error) throw error;
    setRequests(prev => prev.map(r => r.id === id ? data : r));
    return data;
  };

  const deleteRequest = async (id: string) => {
    const { error } = await supabase.from('laundry_requests').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    setRequests(prev => prev.filter(r => r.id !== id));
    setTotalCount(c => Math.max(0, c - 1));
  };

  return { requests, loading, error, refresh: () => fetchRequests(1), addRequest, updateRequest, deleteRequest, page, pageSize: DEFAULT_PAGE_SIZE, totalCount, goToPage };
}

export function useAdditionalServices() {
  const [services, setServices] = useState<AdditionalServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { organizationId } = useAppStore();
  const groupId = useAppStore(s => s.groupId);
  const role = useAppStore(s => s.role);
  const isMember = role === 'MEMBER';

  const fetchServices = async (p: number) => {
    try {
      setLoading(true);
      const from = (p - 1) * DEFAULT_PAGE_SIZE;
      const to = from + DEFAULT_PAGE_SIZE - 1;
      const query = supabase
        .from('additional_services').select('*', { count: 'exact' }).is('deleted_at', null).order('created_at', { ascending: false })
        .range(from, to);
      if (organizationId) query.eq('organization_id', organizationId);
      if (isMember && groupId) query.eq('group_id', groupId);
      const { data, count, error } = await query;
      if (error) throw error;
      setServices(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(organizationId){fetchServices(1);}else{setServices([]);setLoading(false);}
  }, [organizationId]);

  const goToPage = (p: number) => {
    setPage(p);
    fetchServices(p);
  };

  const addService = async (service: { title: string; service_type: string; price: number; sold_count: number; limit_count: number; group_id?: string }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase
      .from('additional_services')
      .insert({ ...service, organization_id: organizationId })
      .select().single();
    if (error) throw error;
    setServices(prev => [data, ...prev]);
    setTotalCount(c => c + 1);
    return data;
  };

  const updateService = async (id: string, updates: Partial<{ title: string; service_type: string; price: number; sold_count: number; limit_count: number; group_id?: string }>) => {
    const { data, error } = await supabase
      .from('additional_services').update(updates).eq('id', id).select().single();
    if (error) throw error;
    setServices(prev => prev.map(s => s.id === id ? data : s));
    return data;
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase.from('additional_services').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    setServices(prev => prev.filter(s => s.id !== id));
    setTotalCount(c => Math.max(0, c - 1));
  };

  return { services, loading, error, refresh: () => fetchServices(1), addService, updateService, deleteService, page, pageSize: DEFAULT_PAGE_SIZE, totalCount, goToPage };
}

export function useCateringMenus() {
  const [menus, setMenus] = useState<CateringMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { organizationId } = useAppStore();
  const groupId = useAppStore(s => s.groupId);
  const role = useAppStore(s => s.role);
  const isMember = role === 'MEMBER';

  const mapMenuFromDb = (menu: any) => ({
    ...menu,
    title: menu.title || '',
    pax: menu.pax || 0,
    veg: menu.veg || 0,
    vgn: menu.vgn || 0,
    gf: menu.gf || 0,
    halal: menu.halal || 0
  });

  const fetchMenus = async (p: number) => {
    try {
      setLoading(true);
      const from = (p - 1) * DEFAULT_PAGE_SIZE;
      const to = from + DEFAULT_PAGE_SIZE - 1;
      const query = supabase
        .from('catering_menus').select('*', { count: 'exact' }).is('deleted_at', null).order('start_time', { ascending: true })
        .range(from, to);
      if (organizationId) query.eq('organization_id', organizationId);
      if (isMember && groupId) query.eq('group_id', groupId);
      const { data, count, error } = await query;
      if (error) throw error;
      setMenus((data || []).map(mapMenuFromDb));
      if (count !== null) setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchMenus(1);
    } else {
      setMenus([]);
      setLoading(false);
    }
  }, [organizationId]);

  const goToPage = (p: number) => {
    setPage(p);
    fetchMenus(p);
  };

  const addMenu = async (menu: { title: string; start_time: string; end_time: string; service_type: string; pax?: number; veg?: number; vgn?: number; gf?: number; halal?: number; group_id?: string }) => {
    if (!organizationId) throw new Error('No organization context');
    const { pax, veg, vgn, gf, halal, title, ...rest } = menu;
    const { data, error } = await supabase
      .from('catering_menus')
      .insert({
        ...rest,
        title: title || '',
        pax: pax || 0,
        veg: veg || 0,
        vgn: vgn || 0,
        gf: gf || 0,
        halal: halal || 0,
        organization_id: organizationId
      })
      .select().single();
    if (error) throw error;
    const mapped = mapMenuFromDb(data);
    setMenus(prev => [...prev, mapped]);
    setTotalCount(c => c + 1);
    return mapped;
  };

  const updateMenu = async (id: string, updates: Partial<{ title: string; start_time: string; end_time: string; service_type: string; pax: number; veg: number; vgn: number; gf: number; halal: number; group_id?: string }>) => {
    const { pax, veg, vgn, gf, halal, title, ...rest } = updates;
    const updatePayload: any = { ...rest };
    if (title !== undefined) updatePayload.title = title;
    if (pax !== undefined) updatePayload.pax = pax;
    if (veg !== undefined) updatePayload.veg = veg;
    if (vgn !== undefined) updatePayload.vgn = vgn;
    if (gf !== undefined) updatePayload.gf = gf;
    if (halal !== undefined) updatePayload.halal = halal;

    const { data, error } = await supabase
      .from('catering_menus').update(updatePayload).eq('id', id).select().single();
    if (error) throw error;
    const mapped = mapMenuFromDb(data);
    setMenus(prev => prev.map(m => m.id === id ? mapped : m));
    return mapped;
  };

  const deleteMenu = async (id: string) => {
    const { error } = await supabase.from('catering_menus').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    setMenus(prev => prev.filter(m => m.id !== id));
    setTotalCount(c => Math.max(0, c - 1));
  };

  return { menus, loading, error, refresh: () => fetchMenus(1), addMenu, updateMenu, deleteMenu, page, pageSize: DEFAULT_PAGE_SIZE, totalCount, goToPage };
}

// ============================================================================
// User Management (GAP-006)
// ============================================================================
export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { organizationId } = useAppStore();

  const fetchProfiles = async (p: number) => {
    try {
      setLoading(true);
      const from = (p - 1) * DEFAULT_PAGE_SIZE;
      const to = from + DEFAULT_PAGE_SIZE - 1;
      const query = supabase
        .from('profiles').select('*', { count: 'exact' }).is('deleted_at', null).order('created_at', { ascending: true })
        .range(from, to);
      if (organizationId) query.eq('organization_id', organizationId);
      const { data, count, error } = await query;
      if (error) throw error;
      setProfiles(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchProfiles(1);
    } else {
      setProfiles([]);
      setLoading(false);
    }
  }, [organizationId]);

  const goToPage = (p: number) => {
    setPage(p);
    fetchProfiles(p);
  };

  const updateRole = async (userId: string, role: AppRole) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: data.role } : p));
    return data;
  };

  const deleteProfile = async (userId: string) => {
    // Delete profile record (auth user removal requires service_role / admin API)
    const { error } = await supabase.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('id', userId);
    if (error) throw error;
    setProfiles(prev => prev.filter(p => p.id !== userId));
    setTotalCount(c => Math.max(0, c - 1));
  };

  const inviteUser = async (email: string, role: AppRole) => {
    if (!organizationId) throw new Error('No organization context');
    // Generate a temporary password — user will reset via Supabase email flow
    const tempPassword = Math.random().toString(36).slice(-16) + 'A1!';
    const { data, error } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) throw error;
    // Supabase triggers are synchronous: handle_new_user has already created the profile by now.
    if (data?.user) {
      await updateRole(data.user.id, role);
      // Send password reset so the user can set their own password
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      // Update organization_id on the profile
      await supabase
        .from('profiles')
        .update({ organization_id: organizationId })
        .eq('id', data.user.id);
      // Refresh the list
      await fetchProfiles(1);
    }
    return data;
  };

  return { profiles, loading, error, refresh: () => fetchProfiles(1), updateRole, deleteProfile, inviteUser, page, pageSize: DEFAULT_PAGE_SIZE, totalCount, goToPage };
}

// ============================================================================
// Audit Log Viewer (GAP-007)
// ============================================================================
export function useAuditLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);

  const AUDIT_PAGE_SIZE = 20;

  const fetchLogs = async (p: number, search?: string, from?: string | null, to?: string | null) => {
    try {
      setLoading(true);
      const fromIdx = (p - 1) * AUDIT_PAGE_SIZE;
      const toIdx = fromIdx + AUDIT_PAGE_SIZE - 1;
      let query = supabase
        .from('activity_logs').select('*', { count: 'exact' }).is('deleted_at', null).order('created_at', { ascending: false })
        .range(fromIdx, toIdx);
      if (search) query = query.or(`action.ilike.%${search}%,detail.ilike.%${search}%`);
      if (from) query = query.gte('created_at', from);
      if (to) query = query.lte('created_at', to);
      const { data, count, error } = await query;
      if (error) throw error;
      setLogs(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const goToPage = (p: number) => {
    setPage(p);
    fetchLogs(p, searchTerm, dateFrom, dateTo);
  };

  const applyFilters = (search: string, from: string | null, to: string | null) => {
    setSearchTerm(search);
    setDateFrom(from);
    setDateTo(to);
    setPage(1);
    fetchLogs(1, search, from, to);
  };

  return { logs, loading, error, page, pageSize: AUDIT_PAGE_SIZE, totalCount, goToPage, applyFilters, refresh: () => fetchLogs(1, searchTerm, dateFrom, dateTo) };
}

// ============================================================================
// Client Portal (GAP-012)
// ============================================================================
export function useClientRequests(statusFilter?: string, moduleFilter?: string) {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { organizationId } = useAppStore();
  const userId = useAppStore(s => s.session?.user?.id);
  const role = useAppStore(s => s.role);
  const isMember = role === 'MEMBER';

  const fetchRequests = async (p: number, status?: string, module?: string) => {
    try {
      setLoading(true);
      const from = (p - 1) * DEFAULT_PAGE_SIZE;
      const to = from + DEFAULT_PAGE_SIZE - 1;
      let query = supabase
        .from('client_requests').select('*', { count: 'exact' }).is('deleted_at', null).order('created_at', { ascending: false })
        .range(from, to);
      if (organizationId) query = query.eq('organization_id', organizationId);
      if (status && status !== 'ALL') query = query.eq('status', status);
      if (module && module !== 'ALL') query = query.eq('module_type', module);
      if (isMember && userId) query = query.eq('created_by', userId);
      const { data, count, error } = await query;
      if (error) throw error;
      setRequests(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      setPage(1);
      fetchRequests(1, statusFilter, moduleFilter);
    } else {
      setRequests([]);
      setLoading(false);
    }
  }, [organizationId, statusFilter, moduleFilter]);

  const goToPage = (p: number) => {
    setPage(p);
    fetchRequests(p, statusFilter, moduleFilter);
  };

  const addRequest = async (req: { module_type: string; title: string; description?: string; client_name?: string; client_email?: string; details?: Record<string, unknown> }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase
      .from('client_requests')
      .insert({ ...req, organization_id: organizationId, status: 'PENDING', created_by: userId })
      .select().single();
    if (error) throw error;
    setRequests(prev => [data, ...prev]);
    setTotalCount(c => c + 1);
    return data;
  };

  const updateRequest = async (id: string, updates: Partial<{ status: string; rejection_reason: string; approved_by?: string }>) => {
    const payload: any = { ...updates };
    if (updates.status === 'APPROVED') {
      payload.approved_at = new Date().toISOString();
    }
    const { data, error } = await supabase
      .from('client_requests').update(payload).eq('id', id).select().single();
    if (error) throw error;
    setRequests(prev => prev.map(r => r.id === id ? data : r));
    return data;
  };

  const deleteRequest = async (id: string) => {
    const { error } = await supabase.from('client_requests').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    setRequests(prev => prev.filter(r => r.id !== id));
    setTotalCount(c => Math.max(0, c - 1));
  };

  return { requests, loading, error, refresh: () => fetchRequests(1, statusFilter, moduleFilter), addRequest, updateRequest, deleteRequest, page, pageSize: DEFAULT_PAGE_SIZE, totalCount, goToPage };
}
