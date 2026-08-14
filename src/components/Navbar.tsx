import React, { useState, useEffect } from 'react';
import { PageView } from '../types';
import { WHATSAPP_NUMBER, formatWhatsAppUrl } from '../data';

interface NavbarProps {
  activePage: PageView;
  setActivePage: (page: PageView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, setActivePage }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (page: PageView) => {
    setActivePage(page);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks: { id: PageView; label: string }[] = [
    { id: 'rooms', label: 'Rooms' },
    { id: 'dining', label: 'Dining' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'offers', label: 'Offers' },
    { id: 'events', label: 'Events' },
    { id: 'our-story', label: 'Our Story' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'contact', label: 'Contact' }
  ];

  return (
    <>
      <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="container site-header__inner">
          <button 
            onClick={() => handleNavClick('home')} 
            className="brand text-left focus:outline-none"
            style={{ background: 'none', border: 'none', padding: 0 }}
          >
            ROYAL MGWASI HOTEL
          </button>
          
          <nav className="main-nav" aria-label="Primary">
            <div className="main-nav__links">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={activePage === link.id ? 'is-active' : ''}
                >
                  {link.label}
                </button>
              ))}
            </div>
            <div className="header-cta">
              <button 
                onClick={() => handleNavClick('book')} 
                className="btn btn--primary"
              >
                Book your stay
              </button>
            </div>
          </nav>

          <button 
            className="menu-toggle" 
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={`mobile-nav ${mobileOpen ? 'is-open' : ''}`} aria-hidden={!mobileOpen}>
        <div className="mobile-nav__top">
          <span className="brand" onClick={() => handleNavClick('home')}>ROYAL MGWASI HOTEL</span>
          <button 
            className="mobile-nav__close" 
            onClick={() => setMobileNavOpen(false)} 
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="5" y1="5" x2="19" y2="19"/>
              <line x1="19" y1="5" x2="5" y2="19"/>
            </svg>
          </button>
        </div>

        <nav className="mobile-nav__links" aria-label="Mobile">
          <button 
            onClick={() => handleNavClick('home')} 
            className={activePage === 'home' ? 'is-active' : ''}
          >
            Home
          </button>
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={activePage === link.id ? 'is-active' : ''}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="mobile-nav__cta">
          <button 
            onClick={() => handleNavClick('book')} 
            className="btn btn--primary btn--block btn--lg"
          >
            Book your stay
          </button>
          <a 
            href={formatWhatsAppUrl("Hello ROYAL MGWASI HOTEL, I'd like some help with a room booking.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--secondary btn--block btn--lg"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.79.47 3.46 1.29 4.9L2 22l5.31-1.39a9.87 9.87 0 0 0 4.73 1.2h.01c5.46 0 9.9-4.45 9.9-9.9C21.96 6.45 17.5 2 12.04 2Zm5.8 14.06c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.79-4.17-4.94-4.36-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.26-.28.57-.35.76-.35h.55c.18 0 .42-.07.65.5.24.58.82 2 .89 2.14.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.36-.42.48-.14.13-.28.28-.12.55.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.19-.28.37-.23.62-.14.26.09 1.64.77 1.92.91.28.14.47.21.53.33.07.12.07.68-.17 1.36Z"/>
            </svg> 
            WhatsApp us
          </a>
        </div>

        <p className="mobile-nav__meta">
          Forest Mpya, Mzumbe University area &middot; Mbeya 54113<br />
          WhatsApp / Call: +255 762 555 557
        </p>
      </div>
    </>
  );
};
