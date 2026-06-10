import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Provider, Client, ActivityLog, TransportShift } from '../types';
import { useAppStore } from '../store/appStore';

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProviders() {
      try {
        const { data, error } = await supabase.from('providers').select('*').order('name');
        if (error) throw error;
        setProviders(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setLoading(false);
      }
    }
    fetchProviders();
  }, []);

  return { providers, loading, error };
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchClients() {
      try {
        const { data, error } = await supabase.from('clients').select('*').order('name');
        if (error) throw error;
        setClients(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  return { clients, loading, error };
}

export function useActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(10);
        if (error) throw error;
        setLogs(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();

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
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organizationId } = useAppStore();

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('transport_shifts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setShifts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [organizationId]);

  const addShift = async (shift: { driver_name: string; vehicle: string; time?: string; status?: string; progress?: string }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase.from('transport_shifts').insert({
      ...shift,
      organization_id: organizationId
    }).select().single();
    if (error) throw error;
    setShifts(prev => [data, ...prev]);
    return data;
  };

  const updateShift = async (id: string, updates: Partial<{ driver_name: string; vehicle: string; time: string; status: string; progress: string }>) => {
    const { data, error } = await supabase.from('transport_shifts').update(updates).eq('id', id).select().single();
    if (error) throw error;
    setShifts(prev => prev.map(s => s.id === id ? data : s));
    return data;
  };

  const deleteShift = async (id: string) => {
    const { error } = await supabase.from('transport_shifts').delete().eq('id', id);
    if (error) throw error;
    setShifts(prev => prev.filter(s => s.id !== id));
  };

  return { shifts, loading, error, refresh: fetchShifts, addShift, updateShift, deleteShift };
}

export function useTransportTransfers() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organizationId } = useAppStore();

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('transport_transfers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setTransfers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [organizationId]);

  const addTransfer = async (transfer: { time: string; from_location: string; to_location: string; pax: number }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase.from('transport_transfers').insert({
      ...transfer,
      organization_id: organizationId
    }).select().single();
    if (error) throw error;
    setTransfers(prev => [data, ...prev]);
    return data;
  };

  const updateTransfer = async (id: string, updates: Partial<{ time: string; from_location: string; to_location: string; pax: number }>) => {
    const { data, error } = await supabase.from('transport_transfers').update(updates).eq('id', id).select().single();
    if (error) throw error;
    setTransfers(prev => prev.map(t => t.id === id ? data : t));
    return data;
  };

  const deleteTransfer = async (id: string) => {
    const { error } = await supabase.from('transport_transfers').delete().eq('id', id);
    if (error) throw error;
    setTransfers(prev => prev.filter(t => t.id !== id));
  };

  return { transfers, loading, error, refresh: fetchTransfers, addTransfer, updateTransfer, deleteTransfer };
}

export function useAccommodationRooms() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organizationId } = useAppStore();

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accommodation_rooms')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRooms(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [organizationId]);

  const addRoom = async (room: { guest_name: string; group_name: string; hotel_name: string; room_type: string; check_in_date?: string; status?: string }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase
      .from('accommodation_rooms')
      .insert({
        ...room,
        organization_id: organizationId
      })
      .select()
      .single();
    if (error) throw error;
    setRooms(prev => [data, ...prev]);
    return data;
  };

  const updateRoom = async (id: string, updates: Partial<{ guest_name: string; group_name: string; hotel_name: string; room_type: string; check_in_date: string; status: string }>) => {
    const { data, error } = await supabase
      .from('accommodation_rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setRooms(prev => prev.map(r => r.id === id ? data : r));
    return data;
  };

  const deleteRoom = async (id: string) => {
    const { error } = await supabase
      .from('accommodation_rooms')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setRooms(prev => prev.filter(r => r.id !== id));
  };

  return { rooms, loading, error, refresh: fetchRooms, addRoom, updateRoom, deleteRoom };
}

export function useDeliveries() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organizationId } = useAppStore();

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .order('scheduled_time', { ascending: true });
      if (error) throw error;
      setDeliveries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [organizationId]);

  const addDelivery = async (delivery: { site: string; status: string; scheduled_time: string; detail: string }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase
      .from('deliveries')
      .insert({
        ...delivery,
        organization_id: organizationId
      })
      .select()
      .single();
    if (error) throw error;
    setDeliveries(prev => [...prev, data]);
    return data;
  };

  const updateDelivery = async (id: string, updates: Partial<{ site: string; status: string; scheduled_time: string; detail: string }>) => {
    const { data, error } = await supabase
      .from('deliveries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setDeliveries(prev => prev.map(d => d.id === id ? data : d));
    return data;
  };

  const deleteDelivery = async (id: string) => {
    const { error } = await supabase
      .from('deliveries')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setDeliveries(prev => prev.filter(d => d.id !== id));
  };

  return { deliveries, loading, error, refresh: fetchDeliveries, addDelivery, updateDelivery, deleteDelivery };
}

export function useHospitalityPackages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organizationId } = useAppStore();

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hospitality_packages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPackages(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchPackages();
    } else {
      setPackages([]);
      setLoading(false);
    }
  }, [organizationId]);

  const addPackage = async (pkg: { title: string; price: string; capacity: number; sold: number; total: number }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase
      .from('hospitality_packages')
      .insert({
        ...pkg,
        organization_id: organizationId
      })
      .select()
      .single();
    if (error) throw error;
    setPackages(prev => [data, ...prev]);
    return data;
  };

  const updatePackage = async (id: string, updates: Partial<{ title: string; price: string; capacity: number; sold: number; total: number }>) => {
    const { data, error } = await supabase
      .from('hospitality_packages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setPackages(prev => prev.map(p => p.id === id ? data : p));
    return data;
  };

  const deletePackage = async (id: string) => {
    const { error } = await supabase
      .from('hospitality_packages')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setPackages(prev => prev.filter(p => p.id !== id));
  };

  return { packages, loading, error, refresh: fetchPackages, addPackage, updatePackage, deletePackage };
}

export function useHospitalityGuests() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organizationId } = useAppStore();

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hospitality_guests')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setGuests(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchGuests();
    } else {
      setGuests([]);
      setLoading(false);
    }
  }, [organizationId]);

  const addGuest = async (guestData: { section: string; guest: string; seat_num: string }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase
      .from('hospitality_guests')
      .insert({
        ...guestData,
        organization_id: organizationId
      })
      .select()
      .single();
    if (error) throw error;
    setGuests(prev => [...prev, data]);
    return data;
  };

  const deleteGuest = async (id: string) => {
    const { error } = await supabase
      .from('hospitality_guests')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setGuests(prev => prev.filter(g => g.id !== id));
  };

  return { guests, loading, error, refresh: fetchGuests, addGuest, deleteGuest };
}

export function useAccreditations() {
  const [accreditations, setAccreditations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organizationId } = useAppStore();

  const fetchAccreditations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accreditations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAccreditations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccreditations();
  }, [organizationId]);

  const addAccreditation = async (acc: { code: string; name: string; count: number; pending: number; zones: string[] }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase
      .from('accreditations')
      .insert({
        ...acc,
        organization_id: organizationId
      })
      .select()
      .single();
    if (error) throw error;
    setAccreditations(prev => [data, ...prev]);
    return data;
  };

  const updateAccreditation = async (id: string, updates: Partial<{ code: string; name: string; count: number; pending: number; zones: string[] }>) => {
    const { data, error } = await supabase
      .from('accreditations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setAccreditations(prev => prev.map(a => a.id === id ? data : a));
    return data;
  };

  const deleteAccreditation = async (id: string) => {
    const { error } = await supabase
      .from('accreditations')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setAccreditations(prev => prev.filter(a => a.id !== id));
  };

  return { accreditations, loading, error, refresh: fetchAccreditations, addAccreditation, updateAccreditation, deleteAccreditation };
}

export function useUniforms() {
  const [uniforms, setUniforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organizationId } = useAppStore();

  const fetchUniforms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('uniforms')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUniforms(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniforms();
  }, [organizationId]);

  const addUniform = async (uniform: { item_name: string; sizes: string; total: number; deployed: number; status?: string }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase
      .from('uniforms')
      .insert({
        ...uniform,
        organization_id: organizationId
      })
      .select()
      .single();
    if (error) throw error;
    setUniforms(prev => [data, ...prev]);
    return data;
  };

  const updateUniform = async (id: string, updates: Partial<{ item_name: string; sizes: string; total: number; deployed: number; status: string }>) => {
    const { data, error } = await supabase
      .from('uniforms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setUniforms(prev => prev.map(u => u.id === id ? data : u));
    return data;
  };

  const deleteUniform = async (id: string) => {
    const { error } = await supabase
      .from('uniforms')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setUniforms(prev => prev.filter(u => u.id !== id));
  };

  return { uniforms, loading, error, refresh: fetchUniforms, addUniform, updateUniform, deleteUniform };
}

export function useLaundryRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organizationId } = useAppStore();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('laundry_requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [organizationId]);

  const addRequest = async (request: { client_name: string; group_name: string; service_type: string; items_count: number; status?: string }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase
      .from('laundry_requests')
      .insert({
        ...request,
        organization_id: organizationId
      })
      .select()
      .single();
    if (error) throw error;
    setRequests(prev => [data, ...prev]);
    return data;
  };

  const updateRequest = async (id: string, updates: Partial<{ client_name: string; group_name: string; service_type: string; items_count: number; status: string }>) => {
    const { data, error } = await supabase
      .from('laundry_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setRequests(prev => prev.map(r => r.id === id ? data : r));
    return data;
  };

  const deleteRequest = async (id: string) => {
    const { error } = await supabase
      .from('laundry_requests')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  return { requests, loading, error, refresh: fetchRequests, addRequest, updateRequest, deleteRequest };
}

export function useAdditionalServices() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organizationId } = useAppStore();

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('additional_services')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [organizationId]);

  const addService = async (service: { title: string; service_type: string; price: number; sold_count: number; limit_count: number }) => {
    if (!organizationId) throw new Error('No organization context');
    const { data, error } = await supabase
      .from('additional_services')
      .insert({
        ...service,
        organization_id: organizationId
      })
      .select()
      .single();
    if (error) throw error;
    setServices(prev => [data, ...prev]);
    return data;
  };

  const updateService = async (id: string, updates: Partial<{ title: string; service_type: string; price: number; sold_count: number; limit_count: number }>) => {
    const { data, error } = await supabase
      .from('additional_services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setServices(prev => prev.map(s => s.id === id ? data : s));
    return data;
  };

  const deleteService = async (id: string) => {
    const { error } = await supabase
      .from('additional_services')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setServices(prev => prev.filter(s => s.id !== id));
  };

  return { services, loading, error, refresh: fetchServices, addService, updateService, deleteService };
}
export function useCateringMenus() {
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { organizationId } = useAppStore();

  const mapMenuFromDb = (menu: any) => ({
    ...menu,
    title: menu.title || '',
    pax: menu.pax_pax || 0,
    veg: menu.pax_veg || 0,
    vgn: menu.pax_vgn || 0,
    gf: menu.pax_gf || 0,
    halal: menu.pax_halal || 0
  });
  
  const fetchMenus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('catering_menus')
        .select('*')
        .order('start_time', { ascending: true });
      if (error) throw error;
      setMenus((data || []).map(mapMenuFromDb));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchMenus();
    } else {
      setMenus([]);
      setLoading(false);
    }
  }, [organizationId]);

  const addMenu = async (menu: { title: string; start_time: string; end_time: string; service_type: string; pax?: number; veg?: number; vgn?: number; gf?: number; halal?: number }) => {
    if (!organizationId) throw new Error('No organization context');
    const { pax, veg, vgn, gf, halal, title, ...rest } = menu;
    
    const { data, error } = await supabase
      .from('catering_menus')
      .insert({
        ...rest,
        title: title || '',
        pax_pax: pax || 0,
        pax_veg: veg || 0,
        pax_vgn: vgn || 0,
        pax_gf: gf || 0,
        pax_halal: halal || 0,
        organization_id: organizationId
      })
      .select()
      .single();
    if (error) throw error;
    const mapped = mapMenuFromDb(data);
    setMenus(prev => [...prev, mapped]);
    return mapped;
  };

  const updateMenu = async (id: string, updates: Partial<{ title: string; start_time: string; end_time: string; service_type: string; pax: number; veg: number; vgn: number; gf: number; halal: number }>) => {
    const { pax, veg, vgn, gf, halal, title, ...rest } = updates;
    
    const updatePayload: any = { ...rest };
    if (title !== undefined) updatePayload.title = title;
    if (pax !== undefined) updatePayload.pax_pax = pax;
    if (veg !== undefined) updatePayload.pax_veg = veg;
    if (vgn !== undefined) updatePayload.pax_vgn = vgn;
    if (gf !== undefined) updatePayload.pax_gf = gf;
    if (halal !== undefined) updatePayload.pax_halal = halal;

    const { data, error } = await supabase
      .from('catering_menus')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const mapped = mapMenuFromDb(data);
    setMenus(prev => prev.map(m => m.id === id ? mapped : m));
    return mapped;
  };

  const deleteMenu = async (id: string) => {
    const { error } = await supabase
      .from('catering_menus')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setMenus(prev => prev.filter(m => m.id !== id));
  };

  return { menus, loading, error, refresh: fetchMenus, addMenu, updateMenu, deleteMenu };
}
