import React, { useState } from 'react';
import { PageView } from '../types';
import { formatWhatsAppUrl, submitContactMessage } from '../data';
import { useHotelData } from '../context/HotelDataContext';

interface ContactViewProps {
  setActivePage: (page: PageView) => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ setActivePage }) => {
  const { landmarks } = useHotelData();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitted(true);

    // Dual-write: 1. Persist to Supabase
    try {
      await submitContactMessage({
        full_name: contactData.name,
        phone: contactData.phone,
        email: contactData.email || undefined,
        message: contactData.message
      });
    } catch (err) {
      console.warn('Supabase contact insert notice:', err);
    } finally {
      setIsSubmitting(false);
    }

    // Dual-write: 2. Always open WhatsApp
    const msg = `Hello ROYAL MGWASI HOTEL, message from website:\nName: ${contactData.name}\nPhone: ${contactData.phone}\n${contactData.email ? `Email: ${contactData.email}\n` : ''}Message: ${contactData.message}`;
    window.open(formatWhatsAppUrl(msg), '_blank');
  };

  return (
    <div className="section">
      <div className="container">
        <div className="page-header">
          <span className="eyebrow">Location &amp; Inquiries</span>
          <h1>Contact Us</h1>
          <p className="lede">
            We are located in Forest Mpya, Mbeya, right near Mzumbe University. Reach our 24/7 reception desk anytime via WhatsApp, phone, or email.
          </p>
        </div>

        <div className="grid grid--2 mb-12">
          {/* Contact Details Card */}
          <div className="space-y-6">
            <div className="info-card">
              <h3>Hotel Address &amp; Location</h3>
              <p className="mt-2 text-base font-medium text-[#2A2620]">
                ROYAL MGWASI HOTEL<br />
                Forest Mpya &middot; Mzumbe University area<br />
                Mbeya 54113, Tanzania<br />
                <span className="text-xs text-[#6E6559] mt-1 block">Google Plus Code: 3CQX+M4 Mbeya</span>
              </p>
            </div>

            <div className="info-card">
              <h3>Direct Communication</h3>
              <div className="mt-4 space-y-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1D5D4C]">WhatsApp / Phone (24/7):</span>
                  <a href="https://wa.me/255762555557" target="_blank" rel="noopener noreferrer" className="block text-lg font-bold text-[#2A2620] hover:text-[#1D5D4C]">
                    +255 762 555 557
                  </a>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1D5D4C]">Response Promise:</span>
                  <p className="text-sm font-semibold text-[#2A2620]">Guaranteed reply within 15 minutes</p>
                </div>
              </div>
            </div>

            <div className="landmark-box">
              <h4>Nearby Distance References</h4>
              <ul className="mt-3">
                {landmarks.map((lm, i) => (
                  <li key={i} className="flex justify-between py-1 border-b border-[#DCD3C1] last:border-none">
                    <span>{lm.name}</span>
                    <span className="font-semibold">{lm.distance}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Direct Message Form */}
          <div className="form-panel">
            <h3 className="text-2xl font-serif text-[#2A2620] mb-2">Send a Direct Message</h3>
            <p className="text-sm text-[#6E6559] mb-6">Have questions about directions, room rates, or shuttle services?</p>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Maria Joseph"
                  value={contactData.name}
                  onChange={e => setFormData({...contactData, name: e.target.value})}
                />
              </div>

              <div className="field-row mt-4">
                <div className="field">
                  <label>Phone / WhatsApp *</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="+255 762 555 557"
                    value={contactData.phone}
                    onChange={e => setFormData({...contactData, phone: e.target.value})}
                  />
                </div>
                <div className="field">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="name@example.com"
                    value={contactData.email}
                    onChange={e => setFormData({...contactData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="field mt-4">
                <label>Your Message *</label>
                <textarea 
                  rows={4} 
                  required
                  placeholder="How can we assist you with your upcoming visit to Mbeya?"
                  value={contactData.message}
                  onChange={e => setFormData({...contactData, message: e.target.value})}
                ></textarea>
              </div>

              {submitted && (
                <div className="form-success is-visible my-3">
                  Thank you! Opening WhatsApp to deliver your message instantly...
                </div>
              )}

              <button type="submit" className="btn btn--primary btn--block btn--lg mt-6">
                Send Message via WhatsApp
              </button>
            </form>
          </div>
        </div>

        {/* Map Block */}
        <div className="map-block relative overflow-hidden group min-h-[420px]">
          <iframe
            title="Live Google Map of Royal Mgwasi Hotel Mbeya"
            src="https://maps.google.com/maps?q=ROYAL%20MGWASI%20HOTEL%2C%20Forest%20Mpya%2C%20Mbeya%2C%20Tanzania&t=&z=15&ie=UTF8&iwloc=&output=embed"
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="map-block__label relative z-10 pointer-events-auto shadow-lg bg-black/75 backdrop-blur-sm">
            <h4>Location Map</h4>
            <p>ROYAL MGWASI HOTEL &middot; Forest Mpya, Mbeya</p>
            <p className="text-xs text-white opacity-80 mt-2">Near Mzumbe University Campus &middot; Easy access from Songwe Airport (MJA)</p>
            <a 
              href="https://maps.google.com/?q=ROYAL+MGWASI+HOTEL,+Forest+Mpya,+Mbeya,+Tanzania" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-white bg-[#1D5D4C] hover:bg-[#154639] px-3 py-1.5 rounded-md transition-colors"
            >
              Get Turn-by-Turn Directions
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
