import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  CalendarCheck, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  Phone, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  RefreshCw, 
  Clock, 
  User, 
  AlertCircle,
  ArrowUpDown
} from 'lucide-react';

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export interface BookingRow {
  id: string;
  booking_code: string;
  guest_name: string;
  guest_phone: string;
  room_id: string;
  check_in: string;
  check_out: string;
  guest_count_label?: string | null;
  special_requests?: string | null;
  status: BookingStatus;
  source: string;
  created_at: string;
}

export interface RoomOptionMinimal {
  id: string;
  name: string;
  slug?: string;
  category?: string;
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  confirmed: { label: 'Confirmed', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  checked_in: { label: 'Checked In', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  checked_out: { label: 'Checked Out', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  cancelled: { label: 'Cancelled', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
  no_show: { label: 'No Show', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
};

export const AdminBookingsSection: React.FC = () => {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [rooms, setRooms] = useState<RoomOptionMinimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'check_in' | 'created_at'>('check_in');
  const [sortAsc, setSortAsc] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Booking Form State
  const [newBooking, setNewBooking] = useState({
    guest_name: '',
    guest_phone: '',
    room_id: '',
    check_in: new Date().toISOString().split('T')[0],
    check_out: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    guest_count_label: '2 Guests',
    special_requests: '',
    status: 'confirmed' as BookingStatus,
  });
  const [savingNew, setSavingNew] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, roomsRes] = await Promise.all([
        supabase.from('bookings').select('*').order('check_in', { ascending: false }),
        supabase.from('rooms').select('id, name, slug, category').order('sort_order', { ascending: true })
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      setBookings(bookingsRes.data || []);

      if (!roomsRes.error && roomsRes.data) {
        setRooms(roomsRes.data);
        if (roomsRes.data.length > 0 && !newBooking.room_id) {
          setNewBooking(prev => ({ ...prev, room_id: roomsRes.data[0].id }));
        }
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      showToast(err?.message || 'Failed to load bookings from Supabase', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const roomMap = useMemo(() => {
    const map = new Map<string, string>();
    rooms.forEach(r => {
      map.set(r.id, r.name);
      if (r.slug) map.set(r.slug, r.name);
    });
    return map;
  }, [rooms]);

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    setUpdatingId(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
      showToast(`Booking status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    } catch (err: any) {
      console.error('Error updating status:', err);
      showToast(err?.message || 'Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.guest_name.trim() || !newBooking.guest_phone.trim() || !newBooking.room_id) {
      showToast('Please provide guest name, phone, and select a room', 'error');
      return;
    }

    setSavingNew(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            guest_name: newBooking.guest_name.trim(),
            guest_phone: newBooking.guest_phone.trim(),
            room_id: newBooking.room_id,
            check_in: newBooking.check_in,
            check_out: newBooking.check_out,
            guest_count_label: newBooking.guest_count_label,
            special_requests: newBooking.special_requests || null,
            status: newBooking.status,
            source: 'admin_manual'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setBookings(prev => [data, ...prev]);
      }
      showToast(`Reservation created successfully #${data?.booking_code || ''}`);
      setShowAddModal(false);
      setNewBooking({
        guest_name: '',
        guest_phone: '',
        room_id: rooms[0]?.id || '',
        check_in: new Date().toISOString().split('T')[0],
        check_out: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        guest_count_label: '2 Guests',
        special_requests: '',
        status: 'confirmed',
      });
    } catch (err: any) {
      console.error('Error creating booking:', err);
      showToast(err?.message || 'Failed to create reservation', 'error');
    } finally {
      setSavingNew(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings
      .filter(b => {
        if (statusFilter !== 'all' && b.status !== statusFilter) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const roomName = (roomMap.get(b.room_id) || '').toLowerCase();
        return (
          b.guest_name.toLowerCase().includes(q) ||
          b.guest_phone.toLowerCase().includes(q) ||
          b.booking_code.toLowerCase().includes(q) ||
          roomName.includes(q)
        );
      })
      .sort((a, b) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [bookings, statusFilter, searchQuery, sortField, sortAsc, roomMap]);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      checked_in: bookings.filter(b => b.status === 'checked_in').length,
    };
  }, [bookings]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className={`p-4 rounded-lg text-sm font-medium flex items-center justify-between shadow-md border ${
          feedbackToast.type === 'error' 
            ? 'bg-rose-50 text-rose-800 border-rose-200' 
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <span>{feedbackToast.message}</span>
          <button onClick={() => setFeedbackToast(null)} className="text-xs underline ml-4">Dismiss</button>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#DCD3C1]/80 shadow-xs">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#1D5D4C] flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-[#1D5D4C]" />
            Guest Bookings
          </h2>
          <p className="text-sm text-[#6E6559] mt-0.5">
            Manage room reservations, update guest check-in states, and access contact records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3.5 py-2 text-sm font-medium text-[#2A2620] bg-[#F4EFE6] hover:bg-[#EAE2D2] rounded-lg border border-[#DCD3C1] transition-colors flex items-center gap-1.5"
            title="Refresh bookings from Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#1D5D4C]' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1D5D4C] hover:bg-[#154639] rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div 
          onClick={() => setStatusFilter('all')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === 'all' 
              ? 'bg-[#1D5D4C]/10 border-[#1D5D4C] ring-2 ring-[#1D5D4C]/20' 
              : 'bg-white border-[#DCD3C1]/80 hover:border-[#1D5D4C]/50'
          }`}
        >
          <div className="text-xs uppercase font-bold tracking-wider text-[#6E6559]">Total Bookings</div>
          <div className="text-2xl font-bold font-serif text-[#2A2620] mt-1">{stats.total}</div>
        </div>
        <div 
          onClick={() => setStatusFilter('pending')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === 'pending' 
              ? 'bg-amber-100/70 border-amber-500 ring-2 ring-amber-400/30' 
              : 'bg-white border-[#DCD3C1]/80 hover:border-amber-400'
          }`}
        >
          <div className="text-xs uppercase font-bold tracking-wider text-amber-700">Pending Review</div>
          <div className="text-2xl font-bold font-serif text-amber-800 mt-1">{stats.pending}</div>
        </div>
        <div 
          onClick={() => setStatusFilter('confirmed')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === 'confirmed' 
              ? 'bg-emerald-100/70 border-emerald-500 ring-2 ring-emerald-400/30' 
              : 'bg-white border-[#DCD3C1]/80 hover:border-emerald-400'
          }`}
        >
          <div className="text-xs uppercase font-bold tracking-wider text-emerald-700">Confirmed</div>
          <div className="text-2xl font-bold font-serif text-emerald-800 mt-1">{stats.confirmed}</div>
        </div>
        <div 
          onClick={() => setStatusFilter('checked_in')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            statusFilter === 'checked_in' 
              ? 'bg-blue-100/70 border-blue-500 ring-2 ring-blue-400/30' 
              : 'bg-white border-[#DCD3C1]/80 hover:border-blue-400'
          }`}
        >
          <div className="text-xs uppercase font-bold tracking-wider text-blue-700">Checked In</div>
          <div className="text-2xl font-bold font-serif text-blue-800 mt-1">{stats.checked_in}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#DCD3C1]/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6E6559] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by guest name, phone, booking code, or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#FBF9F5] border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C] focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6E6559] hover:text-[#2A2620]"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6E6559] uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm px-3 py-2 bg-[#FBF9F5] border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C] text-[#2A2620] font-medium"
          >
            <option value="all">All Statuses ({bookings.length})</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>

          <button
            onClick={() => {
              if (sortField === 'check_in') {
                setSortAsc(!sortAsc);
              } else {
                setSortField('check_in');
                setSortAsc(false);
              }
            }}
            className={`px-3 py-2 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-colors ${
              sortField === 'check_in' 
                ? 'bg-[#1D5D4C] text-white border-[#1D5D4C]' 
                : 'bg-[#FBF9F5] text-[#2A2620] border-[#DCD3C1] hover:bg-[#EFE8D9]'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Check-in ({sortAsc ? 'Asc' : 'Desc'})</span>
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-[#DCD3C1]/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#6E6559] flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#1D5D4C]" />
            <p className="text-sm font-medium">Loading bookings from Supabase database...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-[#6E6559] space-y-3">
            <AlertCircle className="w-10 h-10 text-[#DCD3C1] mx-auto" />
            <p className="text-base font-serif font-bold text-[#2A2620]">No bookings found</p>
            <p className="text-xs max-w-md mx-auto">
              {bookings.length === 0 
                ? 'No guest reservations have been recorded in the database yet. When guests book online or via WhatsApp, entries appear here.' 
                : 'No bookings match your current filter or search criteria.'}
            </p>
            {bookings.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-2 px-4 py-2 text-xs font-semibold text-white bg-[#1D5D4C] rounded-lg hover:bg-[#154639]"
              >
                Create First Reservation
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#DCD3C1] bg-[#F8F5EE] text-xs font-semibold uppercase tracking-wider text-[#6E6559]">
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Guest Details</th>
                  <th className="py-3.5 px-4">Room Reserved</th>
                  <th className="py-3.5 px-4">Check-In / Out</th>
                  <th className="py-3.5 px-4">Guests</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE8D9]">
                {filteredBookings.map((booking) => {
                  const statusInfo = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
                  const roomName = roomMap.get(booking.room_id) || 'Room Option';
                  const isExpanded = expandedId === booking.id;
                  const cleanPhone = booking.guest_phone.replace(/[^0-9]/g, '');

                  return (
                    <React.Fragment key={booking.id}>
                      <tr 
                        className={`hover:bg-[#FDFBF7] transition-colors ${
                          isExpanded ? 'bg-[#FBF9F5]' : ''
                        }`}
                      >
                        {/* Code */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs bg-[#EFE8D9] text-[#2A2620] px-2 py-0.5 rounded border border-[#DCD3C1]">
                              #{booking.booking_code}
                            </span>
                            <button
                              onClick={() => handleCopyCode(booking.booking_code)}
                              className="text-[#6E6559] hover:text-[#1D5D4C] p-1 transition-colors"
                              title="Copy booking code"
                            >
                              {copiedCode === booking.booking_code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Guest Details */}
                        <td className="py-4 px-4">
                          <div className="font-semibold text-[#2A2620]">{booking.guest_name}</div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-[#6E6559]">
                            <Phone className="w-3 h-3 text-[#1D5D4C]" />
                            <span>{booking.guest_phone}</span>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                  `Hello ${booking.guest_name}, this is Royal Mgwasi Hotel regarding your reservation #${booking.booking_code} for ${roomName}.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-700 hover:underline inline-flex items-center gap-0.5 font-medium ml-1"
                                title="Open WhatsApp chat"
                              >
                                WhatsApp &rarr;
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Room */}
                        <td className="py-4 px-4">
                          <div className="font-serif font-medium text-[#2A2620]">{roomName}</div>
                          <div className="text-[11px] text-[#6E6559] uppercase tracking-wider">
                            Source: {booking.source || 'Website'}
                          </div>
                        </td>

                        {/* Dates */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-medium text-[#2A2620]">
                            {new Date(booking.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="text-xs text-[#6E6559]">
                            to {new Date(booking.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </td>

                        {/* Guests Count */}
                        <td className="py-4 px-4 whitespace-nowrap text-xs text-[#6E6559]">
                          {booking.guest_count_label || 'Standard'}
                        </td>

                        {/* Status with instant Dropdown */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="relative inline-block">
                            <select
                              value={booking.status}
                              disabled={updatingId === booking.id}
                              onChange={(e) => handleStatusChange(booking.id, e.target.value as BookingStatus)}
                              className={`text-xs font-semibold px-2.5 py-1.5 rounded-md border appearance-none pr-7 cursor-pointer transition-all ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border} focus:outline-none focus:ring-2 focus:ring-[#1D5D4C]/30`}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="checked_in">Checked In</option>
                              <option value="checked_out">Checked Out</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="no_show">No Show</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-current absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                          </div>
                          {updatingId === booking.id && (
                            <span className="text-[10px] text-[#1D5D4C] block mt-0.5 animate-pulse">Saving...</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                            className="px-2.5 py-1 text-xs font-medium text-[#1D5D4C] hover:bg-[#1D5D4C]/10 rounded border border-[#1D5D4C]/30 transition-colors inline-flex items-center gap-1"
                          >
                            <span>{isExpanded ? 'Less' : 'Details'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-[#F8F5EE] border-b border-[#DCD3C1]">
                          <td colSpan={7} className="p-4 sm:p-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              <div className="bg-white p-3.5 rounded-lg border border-[#DCD3C1]">
                                <div className="font-bold text-[#1D5D4C] uppercase tracking-wider mb-2">
                                  Reservation Metadata
                                </div>
                                <div className="space-y-1.5 text-[#2A2620]">
                                  <div><span className="text-[#6E6559]">Booking Code:</span> #{booking.booking_code}</div>
                                  <div><span className="text-[#6E6559]">System ID:</span> <span className="font-mono text-[10px]">{booking.id}</span></div>
                                  <div><span className="text-[#6E6559]">Created:</span> {new Date(booking.created_at).toLocaleString()}</div>
                                  <div><span className="text-[#6E6559]">Source Channel:</span> {booking.source || 'Website direct'}</div>
                                </div>
                              </div>

                              <div className="bg-white p-3.5 rounded-lg border border-[#DCD3C1] md:col-span-2">
                                <div className="font-bold text-[#1D5D4C] uppercase tracking-wider mb-2">
                                  Special Requests &amp; Notes
                                </div>
                                <p className="text-[#2A2620] italic">
                                  {booking.special_requests || 'No special requests provided by guest.'}
                                </p>
                                <div className="mt-3 pt-3 border-t border-[#EFE8D9] flex flex-wrap gap-2">
                                  {cleanPhone && (
                                    <a
                                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                        `Royal Mgwasi Hotel greeting for booking #${booking.booking_code}. Welcome to Mbeya!`
                                      )}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold inline-flex items-center gap-1.5"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      Send WhatsApp Welcome Message
                                    </a>
                                  )}
                                  <a
                                    href={`tel:${booking.guest_phone}`}
                                    className="px-3 py-1.5 bg-[#F4EFE6] hover:bg-[#EAE2D2] text-[#2A2620] border border-[#DCD3C1] rounded text-xs font-semibold inline-flex items-center gap-1.5"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                    Call Guest Phone
                                  </a>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Booking Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#DCD3C1] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EFE8D9] pb-3 mb-4">
              <h3 className="text-xl font-serif font-bold text-[#1D5D4C]">
                Record New Reservation
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#6E6559] hover:text-[#2A2620] text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Guest Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dkt. Juma Mwambene"
                  value={newBooking.guest_name}
                  onChange={(e) => setNewBooking({ ...newBooking, guest_name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Guest Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +255 754 123 456"
                  value={newBooking.guest_phone}
                  onChange={(e) => setNewBooking({ ...newBooking, guest_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Room *
                </label>
                <select
                  required
                  value={newBooking.room_id}
                  onChange={(e) => setNewBooking({ ...newBooking, room_id: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.category || 'Standard'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newBooking.check_in}
                    onChange={(e) => setNewBooking({ ...newBooking, check_in: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newBooking.check_out}
                    onChange={(e) => setNewBooking({ ...newBooking, check_out: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                    Guest Count Label
                  </label>
                  <input
                    type="text"
                    value={newBooking.guest_count_label}
                    onChange={(e) => setNewBooking({ ...newBooking, guest_count_label: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newBooking.status}
                    onChange={(e) => setNewBooking({ ...newBooking, status: e.target.value as BookingStatus })}
                    className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="checked_in">Checked In</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1">
                  Special Requests / Guest Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Late arrival around 9pm, requests quiet room."
                  value={newBooking.special_requests}
                  onChange={(e) => setNewBooking({ ...newBooking, special_requests: e.target.value })}
                  className="w-full px-3 py-2 border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFE8D9]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#DCD3C1] rounded-lg text-[#6E6559] hover:bg-[#F4EFE6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNew}
                  className="px-5 py-2 bg-[#1D5D4C] text-white rounded-lg font-medium hover:bg-[#154639] disabled:opacity-50"
                >
                  {savingNew ? 'Saving...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
