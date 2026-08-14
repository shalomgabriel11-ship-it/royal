import React from 'react';
import { PageView } from '../types';
import { formatWhatsAppUrl } from '../data';

interface DiningViewProps {
  setActivePage: (page: PageView) => void;
}

export const DiningView: React.FC<DiningViewProps> = ({ setActivePage }) => {
  return (
    <div className="section">
      <div className="container">
        <div className="page-header">
          <span className="eyebrow">Food, Drinks &amp; Entertainment</span>
          <h1>Dining at Royal Mgwasi Hotel</h1>
          <p className="lede">
            Savor authentic Tanzanian flavors and international favorites. Renowned across Mbeya for our fresh signature Tilapia, generous breakfasts, and vibrant weekend live music.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid--3">
          <div className="info-card">
            <div className="ph ph--sand h-48 mb-6 relative overflow-hidden group">
              <img 
                src="https://i.ibb.co/zhX93XPd/royal-mgwasi-hotel-DG04-ECy-Mad-H.jpg" 
                alt="Complimentary Breakfast at Royal Mgwasi Hotel" 
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none z-[1]" />
              <div className="ph__label z-[2] relative">Complimentary Breakfast</div>
            </div>
            <h3>Fresh Daily Breakfast</h3>
            <p>
              Served hot every morning for all hotel guests. Enjoy local coffee, tea, fresh tropical fruits, eggs cooked to order, mandazi, and warm pastries.
            </p>
            <p className="mt-4 text-xs font-bold text-[#1D5D4C]">Hours: 6:30 AM – 10:00 AM Daily</p>
          </div>

          <div className="info-card">
            <div className="ph ph--forest h-48 mb-6 relative overflow-hidden group">
              <img 
                src="https://i.ibb.co/Csw3gnrP/9a7f5ffd9ad17bdccb016bf655dcca0c.jpg" 
                alt="Signature Tilapia at Royal Mgwasi Hotel" 
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none z-[1]" />
              <div className="ph__label z-[2] relative">Signature Tilapia &amp; Local Dishes</div>
            </div>
            <h3>Our Renowned Tilapia</h3>
            <p>
              Prepared fresh to order—pan-fried, grilled, or stewed in rich coconut &amp; tomato spices served alongside ugali, chips, or fried rice.
            </p>
            <p className="mt-4 text-xs font-bold text-[#1D5D4C]">Lunch &amp; Dinner: 11:30 AM – 10:30 PM</p>
          </div>

          <div className="info-card">
            <div className="ph ph--dusk h-48 mb-6 relative overflow-hidden group">
              <img 
                src="https://i.ibb.co/LXg7MpS7/06a8c9b511fe7a3a2aba57ad1c0d47c5.jpg" 
                alt="Weekend Live Band at Royal Mgwasi Hotel" 
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none z-[1]" />
              <div className="ph__label z-[2] relative">Weekend Live Band</div>
            </div>
            <h3>Live Music Atmosphere</h3>
            <p>
              Join us every Friday, Saturday, and Sunday evening as Mbeya's finest live band performs poolside. Relax with cold drinks, fresh barbecue, and great company.
            </p>
            <p className="mt-4 text-xs font-bold text-[#1D5D4C]">Fri &ndash; Sun: 7:00 PM – 11:00 PM</p>
          </div>
        </div>

        {/* Full Menu Highlights */}
        <div className="hub-panel mt-12">
          <div className="hub-panel__head">
            <h3>Popular Menu Highlights</h3>
            <a 
              href={formatWhatsAppUrl("Hello ROYAL MGWASI HOTEL, I'd like to reserve a table / ask about today's menu.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--primary"
            >
              Reserve a Table
            </a>
          </div>

          <div className="grid grid--2 mt-6">
            <div className="p-6 bg-[#F4EFE6] rounded-xl border border-[#DCD3C1]">
              <h4 className="text-lg font-serif text-[#1D5D4C] mb-3">Tanzanian Specialties</h4>
              <ul className="space-y-3 text-sm text-[#6E6559]">
                <li className="flex justify-between border-b border-[#DCD3C1] pb-2">
                  <span>Whole Fresh Lake Tilapia (Grilled / Fried)</span>
                  <strong className="text-[#2A2620]">Specialty</strong>
                </li>
                <li className="flex justify-between border-b border-[#DCD3C1] pb-2">
                  <span>Beef / Chicken Nyama Choma (Barbecue)</span>
                  <strong className="text-[#2A2620]">Popular</strong>
                </li>
                <li className="flex justify-between border-b border-[#DCD3C1] pb-2">
                  <span>Kuku wa Kienyeji (Traditional Chicken Stew)</span>
                  <strong className="text-[#2A2620]">House Special</strong>
                </li>
                <li className="flex justify-between pb-1">
                  <span>Chips Mayai &amp; Fresh Kachumbari Salad</span>
                  <strong className="text-[#2A2620]">Local Favorite</strong>
                </li>
              </ul>
            </div>

            <div className="p-6 bg-[#F4EFE6] rounded-xl border border-[#DCD3C1]">
              <h4 className="text-lg font-serif text-[#1D5D4C] mb-3">Drinks &amp; Refreshments</h4>
              <ul className="space-y-3 text-sm text-[#6E6559]">
                <li className="flex justify-between border-b border-[#DCD3C1] pb-2">
                  <span>Freshly Squeezed Mango / Passion Juices</span>
                  <strong className="text-[#2A2620]">Fresh Daily</strong>
                </li>
                <li className="flex justify-between border-b border-[#DCD3C1] pb-2">
                  <span>Tanzanian Highland Coffee &amp; Spiced Tea</span>
                  <strong className="text-[#2A2620]">Local Sourced</strong>
                </li>
                <li className="flex justify-between border-b border-[#DCD3C1] pb-2">
                  <span>Chilled Local &amp; Premium Beers</span>
                  <strong className="text-[#2A2620]">Ice Cold</strong>
                </li>
                <li className="flex justify-between pb-1">
                  <span>Wine Selection &amp; Non-Alcoholic Mocktails</span>
                  <strong className="text-[#2A2620]">Full Bar</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Halal & Room Service Banner */}
        <div className="cta-banner mt-12">
          <div>
            <p className="text-white text-base">Halal-friendly kitchen &amp; 24/7 Room Service available.</p>
            <p className="text-sm text-[#B9B2A5] mt-1">Prefer to dine in your room? We deliver fresh hot meals right to your door.</p>
          </div>
          <button onClick={() => setActivePage('book')} className="btn btn--primary">
            Book Stay &amp; Meals
          </button>
        </div>
      </div>
    </div>
  );
};
