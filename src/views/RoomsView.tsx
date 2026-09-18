import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageView } from '../types';
import { formatWhatsAppUrl } from '../data';
import { RoomCardMedia } from '../components/RoomCardMedia';
import { useHotelData } from '../context/HotelDataContext';

interface RoomsViewProps {
  setActivePage?: (page: PageView) => void;
}

export const RoomsView: React.FC<RoomsViewProps> = ({ setActivePage }) => {
  const navigate = useNavigate();
  const { rooms, initialLoading } = useHotelData();
  const [filter, setFilter] = useState<string>('All');

  const handleBookClick = () => {
    if (setActivePage) setActivePage('book');
    navigate('/book');
  };

  const categories = ['All', 'Standard', 'Suite', 'Superior', 'Executive', 'Apartment'];

  const getCategoryCount = (cat: string) => {
    if (cat === 'All') return rooms.length;
    return rooms.filter(r => r.category.toLowerCase() === cat.toLowerCase()).length;
  };

  const filteredRooms = filter === 'All' 
    ? rooms 
    : rooms.filter(r => r.category.toLowerCase() === filter.toLowerCase());

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
              {cat} {rooms.length > 0 && `(${getCategoryCount(cat)})`}
            </button>
          ))}
        </div>

        {/* Loading skeleton or Rooms Grid */}
        {initialLoading && rooms.length === 0 ? (
          <div className="grid grid--2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="room-card animate-pulse">
                <div className="h-64 bg-[#E8DED0]/60 rounded-t-xl" />
                <div className="room-card__body space-y-4">
                  <div className="h-6 bg-[#E8DED0] rounded w-3/4" />
                  <div className="h-4 bg-[#E8DED0]/60 rounded w-1/2" />
                  <div className="h-12 bg-[#E8DED0]/40 rounded w-full" />
                  <div className="h-10 bg-[#E8DED0] rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
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
                      onClick={handleBookClick}
                      className="btn btn--secondary"
                    >
                      Book Online
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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
