import React from 'react';
import { PageView } from '../types';
import { OFFERS, formatWhatsAppUrl } from '../data';

interface OffersViewProps {
  setActivePage: (page: PageView) => void;
}

export const OffersView: React.FC<OffersViewProps> = ({ setActivePage }) => {
  return (
    <div className="section">
      <div className="container">
        <div className="page-header">
          <span className="eyebrow">Special Rates</span>
          <h1>Offers &amp; Packages</h1>
          <p className="lede">
            Enjoy additional value during your stay in Mbeya. Whether you're visiting for a weekend music retreat, corporate conference, or extended month-long stay.
          </p>
        </div>

        <div className="grid grid--3">
          {OFFERS.map((offer) => (
            <div key={offer.id} className="info-card flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-[#1D5D4C] text-[#F4EFE6] rounded-full inline-block mb-4">
                  {offer.badge}
                </span>
                <h3>{offer.title}</h3>
                <p className="mt-3">{offer.description}</p>

                <div className="mt-6 pt-4 border-t border-[#DCD3C1]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1D5D4C] mb-2">Package Inclusions:</h4>
                  <ul className="space-y-2 text-sm text-[#6E6559]">
                    {offer.perks.map((perk, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-[#1D5D4C]">✓</span> {perk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-sm font-bold text-[#2A2620] mb-3">{offer.priceNote}</p>
                <a
                  href={formatWhatsAppUrl(`Hello ROYAL MGWASI HOTEL, I'd like to claim the '${offer.title}' package.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary btn--block"
                >
                  Claim Offer via WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Group Offer */}
        <div className="dark-card mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3>Need a Custom Group or Conference Package?</h3>
            <p className="max-w-xl">
              We provide tailored quotes for university delegations, NGO workshops, wedding parties, and tour groups staying in Mbeya.
            </p>
          </div>
          <button onClick={() => setActivePage('events')} className="btn btn--primary whitespace-nowrap">
            Request Custom Event Quote
          </button>
        </div>
      </div>
    </div>
  );
};
