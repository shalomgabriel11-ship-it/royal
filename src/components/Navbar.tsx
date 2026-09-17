import React, { useState, useEffect, useRef } from 'react';
import { PageView } from '../types';
import { WHATSAPP_NUMBER, formatWhatsAppUrl } from '../data';
import { useHotelData } from '../context/HotelDataContext';

interface NavbarProps {
  activePage: PageView;
  setActivePage: (page: PageView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, setActivePage }) => {
  const { user, memberProfile, openMembershipModal, signOut } = useHotelData();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (page: PageView) => {
    setActivePage(page);
    setMobileNavOpen(false);
    setUserMenuOpen(false);
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

  // Derived user details
  const fullName = memberProfile?.full_name || 
    user?.user_metadata?.full_name || 
    user?.user_metadata?.name || 
    user?.email?.split('@')[0] || 
    'Member';

  const firstName = fullName.split(' ')[0] || 'Member';
  const avatarUrl = memberProfile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const initial = firstName.charAt(0).toUpperCase();

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

            <div className="header-cta flex items-center gap-3">
              {/* Member Status / Sign-in */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-[#EFE8D9] hover:bg-[#E8DED0] border border-[#DCD3C1] text-xs font-semibold text-[#2A2620] transition-colors focus:outline-none shadow-sm"
                    aria-label="Member account options"
                    aria-expanded={userMenuOpen}
                  >
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt={firstName} 
                        className="w-6 h-6 rounded-full object-cover border border-[#DCD3C1]" 
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#1D5D4C] text-[#F4EFE6] flex items-center justify-center text-xs font-bold">
                        {initial}
                      </div>
                    )}
                    <span className="max-w-[100px] truncate">{firstName}</span>
                    <svg className={`w-3.5 h-3.5 text-[#6E6559] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-[#FAF7F2] rounded-xl shadow-xl border border-[#DCD3C1] py-2 z-50 animate-fadeIn">
                      <div className="px-4 py-2.5 border-b border-[#E8DED0]">
                        <p className="text-xs font-bold text-[#2A2620] truncate">{fullName}</p>
                        <p className="text-[11px] text-[#6E6559] truncate">{user.email}</p>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1D5D4C]/10 text-[#1D5D4C] text-[10px] font-bold uppercase tracking-wider">
                          <span>★</span> Royal Member
                        </div>
                      </div>
                      <div className="pt-1">
                        <button
                          onClick={async () => {
                            setUserMenuOpen(false);
                            await signOut();
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[#8B261E] hover:bg-[#F4EFE6] transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openMembershipModal}
                  className="hidden lg:inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-[#FAF7F2] hover:bg-[#EFE8D9] border border-[#DCD3C1] text-xs font-semibold text-[#1D5D4C] transition-colors focus:outline-none shadow-sm"
                  title="Join Royal Mgwasi Member Club"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Member Club</span>
                </button>
              )}

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

        {/* Member status banner in mobile menu */}
        {user ? (
          <div className="px-6 py-4 bg-[#EFE8D9] border-b border-[#DCD3C1] flex items-center justify-between">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-[#DCD3C1]" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#1D5D4C] text-[#F4EFE6] flex items-center justify-center font-bold text-sm">
                  {initial}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-[#2A2620] truncate">{fullName}</p>
                <span className="inline-block text-[10px] font-bold text-[#1D5D4C] uppercase tracking-wider">
                  ★ Royal Member
                </span>
              </div>
            </div>
            <button 
              onClick={async () => {
                setMobileNavOpen(false);
                await signOut();
              }}
              className="text-xs font-bold text-[#8B261E] px-3 py-1.5 rounded-lg border border-[#8B261E]/30 hover:bg-white transition-colors"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="px-6 py-3 bg-[#EFE8D9]/70 border-b border-[#DCD3C1]">
            <button
              onClick={() => {
                setMobileNavOpen(false);
                openMembershipModal();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#FAF7F2] border border-[#DCD3C1] text-xs font-bold text-[#1D5D4C] shadow-sm hover:bg-white transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Join / Sign In with Google</span>
            </button>
          </div>
        )}

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
