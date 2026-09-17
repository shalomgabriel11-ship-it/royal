import React from 'react';
import { PageView } from '../types';
import { formatWhatsAppUrl } from '../data';
import { useHotelData } from '../context/HotelDataContext';

interface OffersViewProps {
  setActivePage: (page: PageView) => void;
}

export const OffersView: React.FC<OffersViewProps> = ({ setActivePage }) => {
  const { offers, user, memberProfile, openMembershipModal } = useHotelData();

  // Show members_only offers strictly to signed-in members, keeping them hidden for unauthenticated visitors
  const visibleOffers = offers.filter((offer) => !offer.members_only || Boolean(user));

  const memberName = memberProfile?.full_name || 
    user?.user_metadata?.full_name || 
    user?.user_metadata?.name || 
    user?.email?.split('@')[0] || 
    'Member';
  const firstName = memberName.split(' ')[0] || 'Member';

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

        {/* Member Status Banner */}
        {user ? (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-[#EFE8D9] border border-[#DCD3C1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1D5D4C] text-[#F4EFE6] flex items-center justify-center font-bold text-base shadow-sm">
                ★
              </div>
              <div>
                <p className="text-sm font-bold text-[#2A2620]">
                  Royal Member Privileges Active &middot; Welcome, {firstName}
                </p>
                <p className="text-xs text-[#6E6559]">
                  Your authenticated session unlocks member-exclusive discounts and VIP perks across all accommodations.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#1D5D4C] text-[#F4EFE6] whitespace-nowrap">
              Member Pricing Enabled
            </span>
          </div>
        ) : (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-[#F4EFE6] border border-[#E8DED0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#DCD3C1]/60 text-[#1D5D4C] flex items-center justify-center font-bold text-sm">
                RM
              </div>
              <div>
                <p className="text-sm font-bold text-[#2A2620]">
                  Are you a Royal Member?
                </p>
                <p className="text-xs text-[#6E6559]">
                  Sign in with Google to unlock exclusive member-only packages, guaranteed late check-out, and welcome perks.
                </p>
              </div>
            </div>
            <button
              onClick={openMembershipModal}
              className="btn btn--secondary whitespace-nowrap text-xs py-2 px-4"
            >
              Sign In to Unlock Member Rates
            </button>
          </div>
        )}

        <div className="grid grid--3">
          {visibleOffers.map((offer) => (
            <div 
              key={offer.id} 
              className={`info-card flex flex-col justify-between ${offer.members_only ? 'border-2 border-[#1D5D4C]/30 bg-[#FAF7F2]' : ''}`}
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-[#1D5D4C] text-[#F4EFE6] rounded-full inline-block">
                    {offer.badge}
                  </span>
                  {offer.members_only && (
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-[#8C6D3B] text-[#F4EFE6] rounded-full inline-flex items-center gap-1 shadow-sm">
                      <span>★</span> Member Exclusive
                    </span>
                  )}
                </div>
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
