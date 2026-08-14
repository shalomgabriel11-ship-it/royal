import React, { useState } from 'react';
import { PageView } from '../types';
import { ROOMS, formatWhatsAppUrl } from '../data';
import { FamilyRoomGallery } from '../components/FamilyRoomGallery';
import { RoomCardMedia } from '../components/RoomCardMedia';

interface RoomsViewProps {
  setActivePage: (page: PageView) => void;
}

export const RoomsView: React.FC<RoomsViewProps> = ({ setActivePage }) => {
  const [filter, setFilter] = useState<string>('All');

  const categories = ['All', 'Deluxe', 'Standard', 'Family', 'Suite'];

  const filteredRooms = filter === 'All' 
    ? ROOMS 
    : ROOMS.filter(r => r.category.toLowerCase() === filter.toLowerCase());

  return (
    <div className="section">
      <div className="container">
        <div className="page-header text-left">
          <span className="eyebrow">Accommodation</span>
          <h1>Rooms &amp; Suites at Royal Mgwasi</h1>
          <p className="lede">
            Designed for peaceful rest in Mbeya. Every room reservation includes complimentary hot breakfast, high-speed Wi-Fi, daily housekeeping, and secure parking.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2 mb-10 border-b border-[#DCD3C1] pb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === cat 
                  ? 'bg-[#1D5D4C] text-[#F4EFE6]' 
                  : 'bg-[#EFE8D9] text-[#2A2620] hover:bg-[#E8DED0]'
              }`}
            >
              {cat} {cat === 'All' ? `(${ROOMS.length})` : ''}
            </button>
          ))}
        </div>

        {/* Rooms Grid */}
        <div className="grid grid--2">
          {filteredRooms.map((room) => (
            <div key={room.id} className="room-card">
              <RoomCardMedia 
                room={room} 
                labelSubtitle={`${room.capacity} · ${room.price}`}
              />
              <div className="room-card__body">
                <div className="flex items-center justify-between">
                  <h3>{room.name}</h3>
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-[#E4EEE9] text-[#1D5D4C] rounded-full">
                    {room.category}
                  </span>
                </div>
                <p className="room-card__tags text-sm text-[#6E6559] font-medium">
                  {room.tags.join(' · ')}
                </p>
                <p className="room-card__desc mt-2">
                  {room.description}
                </p>

                <div className="mt-4 pt-4 border-t border-[#DCD3C1]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1D5D4C] mb-2">Room Amenities:</h4>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities.map((am, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 bg-[#F4EFE6] text-[#2A2620] rounded-md border border-[#DCD3C1]">
                        ✓ {am}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="room-card__foot mt-6 flex flex-col sm:flex-row gap-3">
                  <a
                    href={formatWhatsAppUrl(`Hello ROYAL MGWASI HOTEL, I'd like to check availability for the ${room.name}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--primary flex-1"
                  >
                    WhatsApp Reservation
                  </a>
                  <button
                    onClick={() => setActivePage('book')}
                    className="btn btn--secondary"
                  >
                    Book Online
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Family Room Horizontal Photo Gallery Feature */}
        <div className="mt-14">
          <FamilyRoomGallery />
        </div>

        {/* Room Guarantee Note */}
        <div className="note-card mt-12">
          <h4>Looking for group bookings or special check-in times?</h4>
          <p>
            We accommodate early business check-ins, group delegations for university seminars, and custom room arrangements. Contact our 24/7 reception via WhatsApp at +255 762 555 557 for immediate assistance.
          </p>
        </div>
      </div>
    </div>
  );
};
