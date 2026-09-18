import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Mail, 
  PartyPopper, 
  Search, 
  Filter, 
  Phone, 
  MessageSquare, 
  RefreshCw, 
  Calendar, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Users
} from 'lucide-react';

export interface ContactMessageRow {
  id: string;
  full_name: string;
  phone: string;
  email?: string | null;
  message: string;
  status: string;
  created_at: string;
}

export interface EventInquiryRow {
  id: string;
  full_name: string;
  phone: string;
  event_type?: string | null;
  guest_count?: string | null;
  target_date?: string | null;
  notes?: string | null;
  status: string;
  created_at: string;
}

export const AdminInquiriesSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'contact' | 'events'>('contact');
  const [messages, setMessages] = useState<ContactMessageRow[]>([]);
  const [eventInquiries, setEventInquiries] = useState<EventInquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [messagesRes, eventsRes] = await Promise.all([
        supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
        supabase.from('event_inquiries').select('*').order('created_at', { ascending: false })
      ]);

      if (messagesRes.error) throw messagesRes.error;
      if (eventsRes.error) throw eventsRes.error;

      setMessages(messagesRes.data || []);
      setEventInquiries(eventsRes.data || []);
    } catch (err: any) {
      console.error('Error fetching inquiries:', err);
      showToast(err?.message || 'Failed to fetch messages & inquiries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMessageStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
      showToast(`Contact message marked as ${newStatus}`);
    } catch (err: any) {
      console.error('Error updating message status:', err);
      showToast(err?.message || 'Failed to update message status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEventStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('event_inquiries')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setEventInquiries(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
      showToast(`Event inquiry marked as ${newStatus}`);
    } catch (err: any) {
      console.error('Error updating event status:', err);
      showToast(err?.message || 'Failed to update event status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this message?')) return;
    try {
      const { error } = await supabase.from('contact_messages').delete().eq('id', id);
      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== id));
      showToast('Message deleted');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete message', 'error');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this event inquiry?')) return;
    try {
      const { error } = await supabase.from('event_inquiries').delete().eq('id', id);
      if (error) throw error;
      setEventInquiries(prev => prev.filter(e => e.id !== id));
      showToast('Event inquiry deleted');
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete event inquiry', 'error');
    }
  };

  const newMessagesCount = useMemo(() => messages.filter(m => m.status === 'new').length, [messages]);
  const newEventsCount = useMemo(() => eventInquiries.filter(e => e.status === 'new').length, [eventInquiries]);

  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.full_name.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        m.message.toLowerCase().includes(q)
      );
    });
  }, [messages, statusFilter, searchQuery]);

  const filteredEvents = useMemo(() => {
    return eventInquiries.filter(e => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.full_name.toLowerCase().includes(q) ||
        e.phone.toLowerCase().includes(q) ||
        (e.event_type && e.event_type.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q))
      );
    });
  }, [eventInquiries, statusFilter, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      case 'contacted':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'closed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'quoted':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
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
            <Mail className="w-6 h-6 text-[#1D5D4C]" />
            Guest Inquiries &amp; Event Leads
          </h2>
          <p className="text-sm text-[#6E6559] mt-0.5">
            Website inquiries &amp; conference/banquet booking leads synced from guest contact forms.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-3.5 py-2 text-sm font-medium text-[#2A2620] bg-[#F4EFE6] hover:bg-[#EAE2D2] rounded-lg border border-[#DCD3C1] transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#1D5D4C]' : ''}`} />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#DCD3C1] gap-4">
        <button
          onClick={() => { setActiveTab('contact'); setStatusFilter('all'); }}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 relative transition-colors ${
            activeTab === 'contact' ? 'text-[#1D5D4C]' : 'text-[#6E6559] hover:text-[#2A2620]'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Contact Messages ({messages.length})</span>
          {newMessagesCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
              {newMessagesCount} new
            </span>
          )}
          {activeTab === 'contact' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1D5D4C]" />
          )}
        </button>

        <button
          onClick={() => { setActiveTab('events'); setStatusFilter('all'); }}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 relative transition-colors ${
            activeTab === 'events' ? 'text-[#1D5D4C]' : 'text-[#6E6559] hover:text-[#2A2620]'
          }`}
        >
          <PartyPopper className="w-4 h-4" />
          <span>Event &amp; Banquet Inquiries ({eventInquiries.length})</span>
          {newEventsCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
              {newEventsCount} new
            </span>
          )}
          {activeTab === 'events' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1D5D4C]" />
          )}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#DCD3C1]/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6E6559] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'contact' ? 'Search messages by name, phone, message text...' : 'Search event inquiries...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-[#FBF9F5] border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C] focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#6E6559]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm px-3 py-2 bg-[#FBF9F5] border border-[#DCD3C1] rounded-lg focus:outline-none focus:border-[#1D5D4C]"
          >
            <option value="all">All Statuses</option>
            <option value="new">New / Unaddressed</option>
            <option value="contacted">Contacted</option>
            {activeTab === 'events' && <option value="quoted">Quoted</option>}
            {activeTab === 'events' && <option value="confirmed">Confirmed</option>}
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-[#DCD3C1] text-center text-[#6E6559]">
          <RefreshCw className="w-8 h-8 animate-spin text-[#1D5D4C] mx-auto mb-2" />
          <p className="text-sm">Loading guest inquiries from Supabase...</p>
        </div>
      ) : activeTab === 'contact' ? (
        /* Contact Messages Table */
        <div className="bg-white rounded-xl border border-[#DCD3C1]/80 shadow-xs overflow-hidden">
          {filteredMessages.length === 0 ? (
            <div className="p-12 text-center text-[#6E6559]">
              <Mail className="w-10 h-10 text-[#DCD3C1] mx-auto mb-2" />
              <p className="font-serif font-bold text-[#2A2620]">No contact messages found</p>
              <p className="text-xs text-[#6E6559] mt-1">
                {messages.length === 0 ? 'No website contact messages have been submitted yet.' : 'No messages match filter criteria.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#DCD3C1] bg-[#F8F5EE] text-xs font-semibold uppercase tracking-wider text-[#6E6559]">
                    <th className="py-3.5 px-4">Guest Contact</th>
                    <th className="py-3.5 px-4">Message</th>
                    <th className="py-3.5 px-4">Received</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE8D9]">
                  {filteredMessages.map((msg) => {
                    const cleanPhone = msg.phone.replace(/[^0-9]/g, '');
                    return (
                      <tr key={msg.id} className="hover:bg-[#FDFBF7] transition-colors">
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-semibold text-[#2A2620]">{msg.full_name}</div>
                          <div className="text-xs text-[#6E6559] flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-[#1D5D4C]" />
                            <span>{msg.phone}</span>
                          </div>
                          {msg.email && (
                            <div className="text-xs text-[#6E6559] flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3 text-[#6E6559]" />
                              <span>{msg.email}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 max-w-md">
                          <p className="text-[#2A2620] whitespace-pre-line text-sm line-clamp-3 hover:line-clamp-none">
                            {msg.message}
                          </p>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-xs text-[#6E6559]">
                          <div>{new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          <div className="text-[11px] opacity-75">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <select
                            value={msg.status}
                            disabled={updatingId === msg.id}
                            onChange={(e) => handleMessageStatus(msg.id, e.target.value)}
                            className={`text-xs px-2.5 py-1 rounded border ${getStatusBadge(msg.status)}`}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>

                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                  `Hello ${msg.full_name}, thank you for reaching out to Royal Mgwasi Hotel regarding your message.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded"
                                title="Reply via WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1.5 text-[#6E6559] hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                              title="Delete message"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Event Inquiries Table */
        <div className="bg-white rounded-xl border border-[#DCD3C1]/80 shadow-xs overflow-hidden">
          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center text-[#6E6559]">
              <PartyPopper className="w-10 h-10 text-[#DCD3C1] mx-auto mb-2" />
              <p className="font-serif font-bold text-[#2A2620]">No event inquiries found</p>
              <p className="text-xs text-[#6E6559] mt-1">
                {eventInquiries.length === 0 ? 'No event or conference inquiries have been submitted yet.' : 'No event inquiries match filter criteria.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#DCD3C1] bg-[#F8F5EE] text-xs font-semibold uppercase tracking-wider text-[#6E6559]">
                    <th className="py-3.5 px-4">Client Contact</th>
                    <th className="py-3.5 px-4">Event Type</th>
                    <th className="py-3.5 px-4">Guests</th>
                    <th className="py-3.5 px-4">Target Date</th>
                    <th className="py-3.5 px-4">Notes / Requirements</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE8D9]">
                  {filteredEvents.map((evt) => {
                    const cleanPhone = evt.phone.replace(/[^0-9]/g, '');
                    return (
                      <tr key={evt.id} className="hover:bg-[#FDFBF7] transition-colors">
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-semibold text-[#2A2620]">{evt.full_name}</div>
                          <div className="text-xs text-[#6E6559] flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-[#1D5D4C]" />
                            <span>{evt.phone}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-serif font-medium text-[#1D5D4C]">
                            {evt.event_type || 'Conference / Event'}
                          </span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-xs text-[#2A2620]">
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-[#6E6559]" />
                            <span>{evt.guest_count || 'Not specified'}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-xs text-[#2A2620]">
                          {evt.target_date ? (
                            <div className="flex items-center gap-1 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-[#1D5D4C]" />
                              <span>{new Date(evt.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                          ) : (
                            <span className="text-[#6E6559] italic">Flexible</span>
                          )}
                        </td>

                        <td className="py-4 px-4 max-w-xs">
                          <p className="text-xs text-[#6E6559] line-clamp-2">
                            {evt.notes || 'No extra notes provided.'}
                          </p>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <select
                            value={evt.status}
                            disabled={updatingId === evt.id}
                            onChange={(e) => handleEventStatus(evt.id, e.target.value)}
                            className={`text-xs px-2.5 py-1 rounded border ${getStatusBadge(evt.status)}`}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="quoted">Quoted</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>

                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                  `Hello ${evt.full_name}, this is Royal Mgwasi Hotel concerning your event inquiry for ${evt.event_type || 'your event'}.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded"
                                title="Reply via WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteEvent(evt.id)}
                              className="p-1.5 text-[#6E6559] hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                              title="Delete inquiry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
