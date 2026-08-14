import React, { useState, useEffect } from 'react';
import { PageView } from '../types';
import { formatWhatsAppUrl } from '../data';

interface EventsViewProps {
  setActivePage: (page: PageView) => void;
}

const CONFERENCE_IMAGES = [
  'https://i.ibb.co/2YhShZQg/royal-mgwasi-hotel-C-1-XYnk-N-0-F-1.jpg',
  'https://i.ibb.co/8nRcCvW6/royal-mgwasi-hotel-C-1-XYnk-N-0-F-2.jpg'
];

export const EventsView: React.FC<EventsViewProps> = ({ setActivePage }) => {
  const [mediaMode, setMediaMode] = useState<'video' | 'photos'>('video');
  const [conferenceImgIdx, setConferenceImgIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    eventType: 'Conference / Seminar',
    guests: '50-100 Guests',
    date: '',
    notes: ''
  });

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setConferenceImgIdx((prev) => (prev + 1) % CONFERENCE_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const msg = `Hello ROYAL MGWASI HOTEL, I'd like an Event Quote.\nName: ${formData.name}\nPhone: ${formData.phone}\nEvent Type: ${formData.eventType}\nGuests: ${formData.guests}\nTarget Date: ${formData.date}\nNotes: ${formData.notes}`;
    window.open(formatWhatsAppUrl(msg), '_blank');
  };

  return (
    <div className="section">
      <div className="container">
        <div className="page-header">
          <span className="eyebrow">Meetings, Conferences &amp; Celebrations</span>
          <h1>Events &amp; Weddings</h1>
          <p className="lede">
            Host your conference, corporate seminar, or dream wedding in Mbeya. Royal Mgwasi Hotel offers versatile halls, landscaped gardens, full catering, and dedicated event management.
          </p>
        </div>

        {/* Venues Grid */}
        <div className="grid grid--3 mb-12">
          <div className="info-card">
            {/* Media Selector */}
            <div className="flex items-center gap-1.5 mb-3 bg-[#EFE8D9] p-1 rounded-md text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMediaMode('video')}
                className={`flex-1 py-1.5 px-2 rounded transition-all flex items-center justify-center gap-1.5 ${
                  mediaMode === 'video' ? 'bg-[#1D5D4C] text-white shadow-xs' : 'text-[#2A2620] hover:text-black'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Watch Video Tour
              </button>
              <button
                type="button"
                onClick={() => setMediaMode('photos')}
                className={`flex-1 py-1.5 px-2 rounded transition-all flex items-center justify-center gap-1.5 ${
                  mediaMode === 'photos' ? 'bg-[#1D5D4C] text-white shadow-xs' : 'text-[#2A2620] hover:text-black'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Photos (2)
              </button>
            </div>

            {mediaMode === 'video' ? (
              <div className="relative w-full aspect-[9/16] max-h-[360px] bg-black rounded-lg overflow-hidden mb-4 shadow-md mx-auto">
                <iframe
                  src="https://player.vimeo.com/video/1218139293?title=0&amp;byline=0&amp;portrait=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="mwijaku_DIYiAkeOrfc"
                />
              </div>
            ) : (
              <div 
                className="ph ph--forest h-52 mb-4 relative overflow-hidden group select-none cursor-pointer"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {CONFERENCE_IMAGES.map((imgSrc, idx) => (
                  <img
                    key={idx}
                    src={imgSrc}
                    alt={`Main Conference Hall view ${idx + 1} at Royal Mgwasi Hotel`}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                      conferenceImgIdx === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                    }`}
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                ))}

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none z-[1]" />
                
                {/* Navigation Arrows */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConferenceImgIdx((prev) => (prev === 0 ? CONFERENCE_IMAGES.length - 1 : prev - 1));
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Previous image"
                >
                  &#8249;
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConferenceImgIdx((prev) => (prev + 1) % CONFERENCE_IMAGES.length);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next image"
                >
                  &#8250;
                </button>

                {/* Indicators */}
                <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
                  {CONFERENCE_IMAGES.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConferenceImgIdx(idx);
                      }}
                      className={`h-1.5 rounded-full transition-all ${
                        conferenceImgIdx === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="ph__label z-[2] relative">
                  Main Conference Hall
                  <small className="block text-[11px] opacity-85 mt-0.5">Photo {conferenceImgIdx + 1} of {CONFERENCE_IMAGES.length}</small>
                </div>
              </div>
            )}
            <h3>Main Conference Hall</h3>
            <p className="text-xs font-bold text-[#1D5D4C] uppercase tracking-wider mb-2">Capacity: Up to 150 Guests</p>
            <p>Air-conditioned hall equipped with PA system, projector, stage, and flexible seating arrangements for workshops and seminars.</p>
          </div>

          <div className="info-card">
            <div className="ph ph--sand h-44 mb-4"><div className="ph__label">Garden Wedding Lawn</div></div>
            <h3>Outdoor Garden Lawn</h3>
            <p className="text-xs font-bold text-[#1D5D4C] uppercase tracking-wider mb-2">Capacity: Up to 300 Guests</p>
            <p>Picturesque green lawn for romantic outdoor wedding receptions, evening galas, and cocktail parties under the stars.</p>
          </div>

          <div className="info-card">
            <div className="ph ph--slate h-44 mb-4"><div className="ph__label">Executive Boardroom</div></div>
            <h3>Executive Boardroom</h3>
            <p className="text-xs font-bold text-[#1D5D4C] uppercase tracking-wider mb-2">Capacity: Up to 25 Guests</p>
            <p>Intimate boardroom setting with executive seating, high-speed Wi-Fi, and private refreshment service for VIP meetings.</p>
          </div>
        </div>

        {/* Quotation Request Form */}
        <div className="form-panel max-w-2xl mx-auto">
          <h3 className="text-2xl font-serif text-[#2A2620] mb-2">Request Event Quote</h3>
          <p className="text-sm text-[#6E6559] mb-6">Fill in your event details below to receive a customized price proposal in 15 minutes.</p>

          <form onSubmit={handleSubmit}>
            <div className="field-row">
              <div className="field">
                <label>Your Full Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Dr. Frank Mwaikenda"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="field">
                <label>Phone / WhatsApp Number *</label>
                <input 
                  type="tel" 
                  required 
                  placeholder="e.g. +255 762 555 557"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="field-row mt-4">
              <div className="field">
                <label>Event Type</label>
                <select 
                  value={formData.eventType}
                  onChange={e => setFormData({...formData, eventType: e.target.value})}
                >
                  <option value="Conference / Seminar">Conference / Seminar</option>
                  <option value="Wedding Reception">Wedding Reception</option>
                  <option value="Corporate Workshop">Corporate Workshop</option>
                  <option value="Private Dinner / Party">Private Dinner / Party</option>
                  <option value="University Event">University Event</option>
                </select>
              </div>
              <div className="field">
                <label>Expected Guests</label>
                <select 
                  value={formData.guests}
                  onChange={e => setFormData({...formData, guests: e.target.value})}
                >
                  <option value="Under 25 Guests">Under 25 Guests</option>
                  <option value="25 - 50 Guests">25 - 50 Guests</option>
                  <option value="50 - 100 Guests">50 - 100 Guests</option>
                  <option value="100 - 200 Guests">100 - 200 Guests</option>
                  <option value="200+ Guests">200+ Guests</option>
                </select>
              </div>
            </div>

            <div className="field mt-4">
              <label>Target Event Date</label>
              <input 
                type="date" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>

            <div className="field mt-4">
              <label>Catering &amp; Special Requirements</label>
              <textarea 
                rows={3} 
                placeholder="Specify if you require buffet catering, sound equipment, hall decoration, or accommodation for guests."
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              ></textarea>
            </div>

            {submitted && (
              <div className="form-success is-visible my-4">
                Thank you! Opening WhatsApp with your event details...
              </div>
            )}

            <div className="mt-6">
              <button type="submit" className="btn btn--primary btn--block btn--lg">
                Submit &amp; Get Quote on WhatsApp
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
