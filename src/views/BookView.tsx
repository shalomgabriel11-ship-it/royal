import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageView } from '../types';
import { formatWhatsAppUrl, submitBooking } from '../data';
import { useHotelData } from '../context/HotelDataContext';

interface BookViewProps {
  setActivePage?: (page: PageView) => void;
}

export const BookView: React.FC<BookViewProps> = ({ setActivePage }) => {
  const navigate = useNavigate();
  const { rooms, user, memberProfile } = useHotelData();
  const [guestName, setGuestName] = useState(memberProfile?.full_name || user?.user_metadata?.full_name || '');
  const [guestPhone, setGuestPhone] = useState(memberProfile?.phone || '');
  const [selectedRoom, setSelectedRoom] = useState(rooms[0]?.name || 'Junior Suite');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestCount, setGuestCount] = useState('2 Guests');
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const getMinCheckOut = (inDate: string) => {
    if (!inDate) return todayStr;
    const d = new Date(inDate);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const clearSubmissionState = () => {
    if (submitted) {
      setSubmitted(false);
      setDbError(false);
    }
  };

  const handleCheckInChange = (val: string) => {
    clearSubmissionState();
    setCheckIn(val);
    if (checkOut && val && checkOut <= val) {
      setDateError('Check-out date must be after check-in date.');
    } else {
      setDateError(null);
    }
  };

  const handleCheckOutChange = (val: string) => {
    clearSubmissionState();
    setCheckOut(val);
    if (checkIn && val && val <= checkIn) {
      setDateError('Check-out date must be after check-in date.');
    } else {
      setDateError(null);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (checkIn && checkOut && checkOut <= checkIn) {
      setDateError('Check-out date must be after check-in date.');
      return;
    }
    setDateError(null);

    setIsSubmitting(true);
    let dbSaveOk = false;

    // Identify matching room for DB row
    const matchedRoom = rooms.find(r => r.name === selectedRoom) || rooms[0];
    const roomId = matchedRoom?.id || rooms[0]?.id;

    // Dual-write: 1. Persist to Supabase
    try {
      if (roomId) {
        const res = await submitBooking({
          guest_name: guestName,
          guest_phone: guestPhone,
          room_id: roomId,
          check_in: checkIn,
          check_out: checkOut,
          guest_count_label: guestCount,
          special_requests: specialRequests || undefined,
          member_id: user?.id ?? null
        });
        dbSaveOk = Boolean(res?.success);
      }
    } catch (err) {
      console.warn('Supabase booking record notice:', err);
      dbSaveOk = false;
    }

    // Dual-write: 2. Always open WhatsApp confirmation link
    const messageLines = [
      "Hello ROYAL MGWASI HOTEL, I'd like to reserve a room.",
      `Guest Name: ${guestName || 'Not specified'}`,
      `Contact Phone: ${guestPhone || 'Not specified'}`,
      `Room Type: ${selectedRoom}`,
      `Check-In Date: ${checkIn || 'TBD'}`,
      `Check-Out Date: ${checkOut || 'TBD'}`,
      `Guests: ${guestCount}`,
    ];

    if (specialRequests.trim()) {
      messageLines.push(`Special Requests: ${specialRequests.trim()}`);
    }

    messageLines.push("\nPlease confirm availability and payment details.");

    const finalUrl = formatWhatsAppUrl(messageLines.join('\n'));
    window.open(finalUrl, '_blank');

    setIsSubmitting(false);
    setSubmitted(true);
    setDbError(!dbSaveOk);
  };

  return (
    <div className="section">
      <div className="container">
        <div className="page-header text-left">
          <span className="eyebrow">Direct Reservations</span>
          <h1>Book Your Stay</h1>
          <p className="lede">
            Book directly with us for guaranteed best rates, instant 15-minute response on WhatsApp, free hot breakfast, and flexible cancellation policies.
          </p>
        </div>

        <div className="grid grid--2 mb-12">
          {/* Reservation Form */}
          <div className="form-panel">
            <h3 className="text-2xl font-serif text-[#2A2620] mb-2">Reservation Form</h3>
            <p className="text-sm text-[#6E6559] mb-6">Complete the details below to generate your direct WhatsApp reservation request.</p>

            <form onSubmit={handleBookingSubmit}>
              <div className="field-row">
                <div className="field">
                  <label>Guest Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. John Mwasambili"
                    value={guestName}
                    onChange={e => {
                      clearSubmissionState();
                      setGuestName(e.target.value);
                    }}
                  />
                </div>
                <div className="field">
                  <label>WhatsApp / Phone *</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="+255 762 555 557"
                    value={guestPhone}
                    onChange={e => {
                      clearSubmissionState();
                      setGuestPhone(e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="field mt-4">
                <label>Select Room Type *</label>
                <select 
                  value={selectedRoom}
                  onChange={e => {
                    clearSubmissionState();
                    setSelectedRoom(e.target.value);
                  }}
                >
                  {rooms.map(rm => (
                    <option key={rm.id} value={rm.name}>
                      {rm.name} ({rm.capacity}) &mdash; {rm.tags[0] || rm.category}
                    </option>
                  ))}
                  <option value="Any available room">Any Available Room</option>
                </select>
              </div>

              <div className="field-row mt-4">
                <div className="field">
                  <label>Check-In Date *</label>
                  <input 
                    type="date" 
                    required
                    min={todayStr}
                    value={checkIn}
                    onChange={e => handleCheckInChange(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Check-Out Date *</label>
                  <input 
                    type="date" 
                    required
                    min={getMinCheckOut(checkIn)}
                    value={checkOut}
                    onChange={e => handleCheckOutChange(e.target.value)}
                  />
                </div>
              </div>
              {dateError && (
                <p className="text-xs text-[#8B261E] font-semibold mt-1.5">
                  {dateError}
                </p>
              )}

              <div className="field mt-4">
                <label>Number of Guests</label>
                <select 
                  value={guestCount}
                  onChange={e => {
                    clearSubmissionState();
                    setGuestCount(e.target.value);
                  }}
                >
                  <option value="1 Adult">1 Adult</option>
                  <option value="2 Guests">2 Guests (1 King/Queen or Twin)</option>
                  <option value="3 Guests">3 Guests (Family / Triple)</option>
                  <option value="4+ Family Group">4+ Family Group</option>
                </select>
              </div>

              <div className="field mt-4">
                <label>Special Requests or Arrival Time</label>
                <textarea 
                  rows={3} 
                  placeholder="e.g. Late night arrival at 10 PM, ground floor room request, or airport shuttle needed."
                  value={specialRequests}
                  onChange={e => {
                    clearSubmissionState();
                    setSpecialRequests(e.target.value);
                  }}
                ></textarea>
              </div>

              {submitted && !dbError && (
                <div className="form-success is-visible my-3">
                  Opening WhatsApp to send your reservation request directly to reception...
                </div>
              )}

              {submitted && dbError && (
                <div className="p-3.5 my-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm font-medium leading-relaxed">
                  We've opened WhatsApp with your reservation request, but our online database backup couldn't be saved. Please double check that your message sends on WhatsApp — if WhatsApp did not open, please call or message us directly at +255 762 555 557.
                </div>
              )}

              <div className="mt-6">
                <button 
                  type="submit" 
                  disabled={isSubmitting || Boolean(dateError)}
                  className="btn btn--primary btn--block btn--lg disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Opening WhatsApp...</span>
                    </span>
                  ) : (
                    'Send Booking Request on WhatsApp'
                  )}
                </button>
              </div>

              <p className="form-note">
                ⚡ 15-minute response guarantee &middot; No booking fees &middot; Pay upon arrival or via mobile money
              </p>
            </form>
          </div>

          {/* Benefits Sidebar */}
          <div className="space-y-6">
            <div className="dark-card">
              <h3>Why Book Directly With Us?</h3>
              <ul className="mt-4 space-y-3 text-sm text-[#B9B2A5]">
                <li className="flex items-start gap-2">
                  <span className="text-[#1D5D4C] font-bold bg-[#E4EEE9] rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</span>
                  <span><strong>Best Rate Guarantee:</strong> Direct bookings receive our lowest available nightly rates.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1D5D4C] font-bold bg-[#E4EEE9] rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</span>
                  <span><strong>Complimentary Breakfast:</strong> Full hot breakfast included for all guests.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1D5D4C] font-bold bg-[#E4EEE9] rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</span>
                  <span><strong>Flexible Payment:</strong> Pay deposit or total balance using M-Pesa, TigoPesa, card, or cash.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1D5D4C] font-bold bg-[#E4EEE9] rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</span>
                  <span><strong>Instant Confirmation:</strong> Our front desk responds in 15 minutes.</span>
                </li>
              </ul>
            </div>

            <div className="note-card">
              <h4>Direct Reception Contacts</h4>
              <p className="mt-2 text-sm">
                Phone / WhatsApp: <strong>+255 762 555 557</strong><br />
                Location: Forest Mpya, Mzumbe University area, Mbeya<br />
                Reception Hours: Open 24/7
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
