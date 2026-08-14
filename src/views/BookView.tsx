import React, { useState } from 'react';
import { PageView } from '../types';
import { ROOMS, formatWhatsAppUrl } from '../data';

interface BookViewProps {
  setActivePage: (page: PageView) => void;
}

export const BookView: React.FC<BookViewProps> = ({ setActivePage }) => {
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(ROOMS[0].name);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestCount, setGuestCount] = useState('2 Guests');
  const [specialRequests, setSpecialRequests] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

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
                    onChange={e => setGuestName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>WhatsApp / Phone *</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="+255 762 555 557"
                    value={guestPhone}
                    onChange={e => setGuestPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="field mt-4">
                <label>Select Room Type *</label>
                <select 
                  value={selectedRoom}
                  onChange={e => setSelectedRoom(e.target.value)}
                >
                  {ROOMS.map(rm => (
                    <option key={rm.id} value={rm.name}>
                      {rm.name} ({rm.capacity}) &mdash; {rm.tags[0]}
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
                    value={checkIn}
                    onChange={e => setCheckIn(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Check-Out Date *</label>
                  <input 
                    type="date" 
                    required
                    value={checkOut}
                    onChange={e => setCheckOut(e.target.value)}
                  />
                </div>
              </div>

              <div className="field mt-4">
                <label>Number of Guests</label>
                <select 
                  value={guestCount}
                  onChange={e => setGuestCount(e.target.value)}
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
                  onChange={e => setSpecialRequests(e.target.value)}
                ></textarea>
              </div>

              {submitted && (
                <div className="form-success is-visible my-3">
                  Opening WhatsApp to send your reservation request directly to reception...
                </div>
              )}

              <div className="mt-6">
                <button type="submit" className="btn btn--primary btn--block btn--lg">
                  Send Booking Request on WhatsApp
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
