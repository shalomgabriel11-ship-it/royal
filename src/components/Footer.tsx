import React from 'react';
import { PageView } from '../types';

interface FooterProps {
  setActivePage: (page: PageView) => void;
}

export const Footer: React.FC<FooterProps> = ({ setActivePage }) => {
  const handlePageClick = (page: PageView) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-col">
          <h5>Location</h5>
          <p>Forest Mpya, Mzumbe University area &middot; Mbeya 54113 &middot; Plus Code 3CQX+M4</p>
          <button onClick={() => handlePageClick('contact')} className="mt-8 hover:underline">
            View on Map &amp; Directions &rarr;
          </button>
        </div>
        <div className="footer-col">
          <h5>Quick Navigation</h5>
          <button onClick={() => handlePageClick('rooms')}>Rooms &amp; Suites</button>
          <button onClick={() => handlePageClick('dining')}>Dining &amp; Live Band</button>
          <button onClick={() => handlePageClick('offers')}>Packages &amp; Special Offers</button>
          <button onClick={() => handlePageClick('events')}>Events &amp; Conferences</button>
        </div>
        <div className="footer-col">
          <h5>Contact &amp; Booking</h5>
          <a href="https://wa.me/255762555557" target="_blank" rel="noopener noreferrer">
            WhatsApp: +255 762 555 557
          </a>
          <p className="mt-8">Open 24 Hours &middot; 15-Min Response Guarantee</p>
          <button onClick={() => handlePageClick('book')} className="mt-12 text-sm underline">
            Book Online Form
          </button>
        </div>
        <div className="footer-col">
          <h5>Payments &amp; Policy</h5>
          <p>Cash &middot; Visa/Mastercard &middot; Mobile Money (M-Pesa, TigoPesa, Airtel Money)</p>
          <p className="mt-12 text-xs opacity-75">
            &copy; {new Date().getFullYear()} ROYAL MGWASI HOTEL. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
