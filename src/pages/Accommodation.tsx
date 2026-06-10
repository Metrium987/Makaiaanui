import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building, BedDouble, Plus, Trash2, X, Check, Edit2, RotateCw, DollarSign } from 'lucide-react';
import { useAccommodationRooms } from '../hooks/useApi';

const ACCOMMODATION_STATUSES = ['PENDING', 'CONFIRMED', 'CHECKED_IN'] as const;
const DEFAULT_ACCOMMODATION_STATUS = ACCOMMODATION_STATUSES[0];
const DEFAULT_ROOM_TYPE = 'Double';
const ACCOMMODATION_FILTERS = ['ALL', ...ACCOMMODATION_STATUSES] as const;
const DEFAULT_ALLOTMENTS = 120;
const MIN_HOTEL_COUNT = 4;
const ROOM_PRICES: Record<string, number> = { single: 150, double: 180, twin: 200, suite: 450 };
const REVENUE_MARGIN_RATE = 0.15;

export default function Accommodation() {
  const { t } = useTranslation();
  const {
    rooms,
    loading,
    addRoom,
    updateRoom,
    deleteRoom,
    refresh
  } = useAccommodationRooms();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(ACCOMMODATION_FILTERS[0]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);

  // Form states
  const [guestName, setGuestName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [roomType, setRoomType] = useState(DEFAULT_ROOM_TYPE);
  const [checkInDate, setCheckInDate] = useState('');
  const [status, setStatus] = useState(DEFAULT_ACCOMMODATION_STATUS);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [totalAllotments, setTotalAllotments] = useState(DEFAULT_ALLOTMENTS);

  // Calculate stats dynamically from data
  const occupiedCount = rooms.length;
  const occupancyRate = totalAllotments > 0 ? Math.round((occupiedCount / totalAllotments) * 100) : 0;
  
  // Custom hotel count
  const uniqueHotels = Array.from(new Set(rooms.map(r => r.hotel_name?.trim()).filter(Boolean)));
  const hotelCount = uniqueHotels.length || MIN_HOTEL_COUNT;

  // "Vision des coûts et recettes" - Pricing estimate by room types
  const getRoomPrice = (type: string) => {
    return ROOM_PRICES[type?.toLowerCase()] || ROOM_PRICES.double;
  };

  const totalEstimatedCost = rooms.reduce((sum, r) => sum + getRoomPrice(r.room_type), 0);
  const totalEstimatedRevenue = rooms.filter(r => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN').reduce((sum, r) => sum + getRoomPrice(r.room_type) * (1 + REVENUE_MARGIN_RATE), 0);

  const displayedRooms = rooms.filter(row => {
    const matchesSearch = !search || 
      row.guest_name?.toLowerCase().includes(search.toLowerCase()) ||
      row.group_name?.toLowerCase().includes(search.toLowerCase()) ||
      row.hotel_name?.toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && row.status === statusFilter;
  });

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !hotelName || !groupName) {
      setActionError('Guest name, group, and hotel selection are required.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await addRoom({
        guest_name: guestName,
        group_name: groupName,
        hotel_name: hotelName,
        room_type: roomType,
        check_in_date: checkInDate || new Date().toISOString().split('T')[0],
        status
      });
      // reset form
      setGuestName('');
      setGroupName('');
      setHotelName('');
      setRoomType('Double');
      setCheckInDate('');
      setStatus('PENDING');
      setShowAddModal(false);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to populate rooming list entry.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await updateRoom(editingRoom.id, {
        guest_name: guestName,
        group_name: groupName,
        hotel_name: hotelName,
        room_type: roomType,
        check_in_date: checkInDate,
        status
      });
      setEditingRoom(null);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update entry.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this rooming assignment?')) return;
    try {
      await deleteRoom(id);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete rooming entry.');
    }
  };

  const handleEditClick = (room: any) => {
    setEditingRoom(room);
    setGuestName(room.guest_name);
    setGroupName(room.group_name);
    setHotelName(room.hotel_name);
    setRoomType(room.room_type || 'Double');
    setCheckInDate(room.check_in_date ? new Date(room.check_in_date).toISOString().split('T')[0] : '');
    setStatus(room.status || 'PENDING');
    setActionError(null);
  };

  const handleRefreshData = async () => {
    setActionLoading(true);
    try {
      await refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">{t('accommodation.title', 'Hébergement & Allotements')}</h2>
          <p className="mt-1 text-sm text-slate-500 font-sans">Manage contract allotments, rooming-lists, occupant registrations, and financial budget estimations.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handleRefreshData}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0"
            title="Refresh rooming lists"
          >
            <RotateCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            type="button"
            onClick={() => {
              setGuestName('');
              setGroupName('');
              setHotelName('');
              setRoomType('Double');
              setCheckInDate('');
              setStatus('PENDING');
              setActionError(null);
              setShowAddModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors shrink-0 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
            <Building className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Partner Hotels</p>
            <span className="text-2xl font-light text-slate-900">{loading ? '...' : hotelCount}</span>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
            <BedDouble className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Room Allotments</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-light text-slate-900">{occupiedCount}</span>
              <span className="text-xs font-bold text-slate-400">/ {totalAllotments} occupied</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Global Occupancy</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-light text-slate-900">{occupancyRate}%</span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${occupancyRate}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Est. Cost / Revenue</p>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-950">Cost: €{totalEstimatedCost}</span>
              <span className="text-xs text-emerald-600 font-bold">Rev: €{Math.round(totalEstimatedRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[450px]">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-sm uppercase tracking-wider text-slate-700">Rooming Lists - Centralized View</h2>
            <div className="flex rounded-md border border-slate-200 bg-white p-0.5 select-none text-[10px] font-bold uppercase tracking-wider text-slate-600">
              {['ALL', 'PENDING', 'CONFIRMED', 'CHECKED_IN'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setStatusFilter(filterOption)}
                  className={`px-3 py-1 rounded transition-colors ${statusFilter === filterOption ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-500'}`}
                >
                  {filterOption.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={t('accommodation.searchPlaceholder', 'Search by name, hotel, or group...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-sm border border-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-64 font-sans"
              />
          </div>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-bold">Guest Name</th>
                <th className="px-6 py-4 font-bold">Group / Delegation</th>
                <th className="px-6 py-4 font-bold">Hotel Location</th>
                <th className="px-6 py-4 font-bold">Room Type</th>
                <th className="px-6 py-4 font-bold">Check-In</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-600">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                    Loading rooming lists from Supabase...
                  </td>
                </tr>
              )}
              {!loading && displayedRooms.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No matching records found. Use "Add Entry" to create new allocations.
                  </td>
                </tr>
              )}
              {!loading && displayedRooms.map((row, i) => (
                <tr key={row.id || i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{row.guest_name}</td>
                  <td className="px-6 py-4 font-sans">{row.group_name}</td>
                  <td className="px-6 py-4 font-bold text-slate-700">{row.hotel_name}</td>
                  <td className="px-6 py-4 text-slate-500">
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs font-mono">
                      {row.room_type} (€{getRoomPrice(row.room_type)})
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {row.check_in_date ? new Date(row.check_in_date).toISOString().split('T')[0] : ''}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                      row.status === 'CONFIRMED' ? 'bg-indigo-50 text-indigo-600' :
                      row.status === 'CHECKED_IN' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(row)}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Edit Accommodation Assignee"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(row.id)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete Assignee"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT ASSIGNEE */}
      {(showAddModal || editingRoom) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                {editingRoom ? 'Edit Rooming Entry' : 'Add Rooming Entry'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRoom(null);
                }} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={editingRoom ? handleUpdateRoom : handleCreateRoom} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-red-50 text-red-600 rounded text-xs leading-relaxed font-semibold">
                  {actionError}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Guest / Occupant Name</label>
                <input 
                  type="text" 
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Marie Curie"
                  className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Group / Delegation</label>
                <input 
                  type="text" 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. France National Olympic Delegation"
                  className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hotel Name / Location</label>
                <input 
                  type="text" 
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  placeholder="e.g. Hilton Olympic Bay Resort"
                  className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Room Type</label>
                  <select 
                    value={roomType} 
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Single">Single (€150/n)</option>
                    <option value="Double">Double (€180/n)</option>
                    <option value="Twin">Twin (€200/n)</option>
                    <option value="Suite">Suite (€450/n)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Check-In Date</label>
                  <input 
                    type="date" 
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Allocation Status</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="CHECKED_IN">CHECKED_IN</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingRoom(null);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold uppercase tracking-wider disabled:bg-indigo-400"
                >
                  {actionLoading ? 'Saving...' : editingRoom ? 'Save Changes' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
