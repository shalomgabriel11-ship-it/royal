import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageView } from '../types';
import { formatWhatsAppUrl } from '../data';
import { RoomCardMedia } from '../components/RoomCardMedia';
import { useHotelData } from '../context/HotelDataContext';

interface HomeViewProps {
  setActivePage?: (page: PageView) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ setActivePage }) => {
  const navigate = useNavigate();
  const { rooms, reviews, landmarks, initialLoading } = useHotelData();
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(false);

  const goTo = (page: PageView) => {
    if (setActivePage) setActivePage(page);
    navigate(page === 'home' ? '/' : `/${page}`);
  };

  // Calculate scroll distance: one full card width + track gap
  const getScrollAmount = useCallback(() => {
    if (!trackRef.current) return 360;
    const firstCard = trackRef.current.querySelector('.rooms-scroller__card') as HTMLElement | null;
    if (!firstCard) return 360;
    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = parseFloat(window.getComputedStyle(trackRef.current).gap) || 24;
    return cardWidth + gap;
  }, []);

  // Check scroll boundary and update disabled states on navigation arrows
  const updateArrows = useCallback(() => {
    if (!trackRef.current) return;
    const track = trackRef.current;
    const maxScrollLeft = track.scrollWidth - track.clientWidth - 2;
    const currentScroll = track.scrollLeft;

    setIsPrevDisabled(currentScroll <= 2);
    setIsNextDisabled(currentScroll >= maxScrollLeft);
  }, []);

  const handlePrev = () => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({
      left: -getScrollAmount(),
      behavior: 'smooth',
    });
  };

  const handleNext = () => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({
      left: getScrollAmount(),
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let rafId: number;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateArrows);
    };

    track.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateArrows, { passive: true });

    // Initial boundary check
    updateArrows();

    return () => {
      track.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateArrows);
      cancelAnimationFrame(rafId);
    };
  }, [updateArrows]);

  return (
    <>
      {/* HERO SECTION */}
      <section className="hero">
        <div className="container">
          <div className="hero__card">
            <div className="hero__content">
              <span className="eyebrow">Forest Mpya &middot; Mbeya</span>
              <h1>A warm welcome, in the centre of Mbeya.</h1>
              <p>Calm rooms, thoughtful service and a dependable place to land&mdash;whether you're arriving for work, family or the road ahead.</p>
              <div className="hero__actions">
                <a 
                  href={formatWhatsAppUrl("Hello ROYAL MGWASI HOTEL, I'd like to know more about staying with you.")} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary btn--lg"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.79.47 3.46 1.29 4.9L2 22l5.31-1.39a9.87 9.87 0 0 0 4.73 1.2h.01c5.46 0 9.9-4.45 9.9-9.9C21.96 6.45 17.5 2 12.04 2Zm5.8 14.06c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.79-4.17-4.94-4.36-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.26-.28.57-.35.76-.35h.55c.18 0 .42-.07.65.5.24.58.82 2 .89 2.14.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.36-.42.48-.14.13-.28.28-.12.55.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.19-.28.37-.23.62-.14.26.09 1.64.77 1.92.91.28.14.44.12.6-.07.16-.19.68-.79.86-1.06Z"/>
                  </svg> 
                  WhatsApp us
                </a>
                <button onClick={() => goTo('rooms')} className="btn btn--secondary btn--lg">
                  View rooms
                </button>
              </div>
              <div className="hero__meta">
                <div className="brand-line">ROYAL MGWASI HOTEL</div>
                <div className="hero__rating">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" style={{ color: '#C9A227' }}>
                    <path d="M10 1.5l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.6-4.1 6.1-.6z"/>
                  </svg> 
                  <strong>4.3</strong> from 118 Google reviews &middot; Forest Mpya
                </div>
                <div className="hero__rate">Contact us for today's best rate</div>
              </div>
            </div>
            <div className="hero__image ph">
              <div className="hero__slide hero__slide--1" aria-hidden="true"></div>
              <div className="hero__slide hero__slide--2" aria-hidden="true"></div>
              <div className="hero__slide hero__slide--3" aria-hidden="true"></div>
              <div className="ph__label">
                Royal Mgwasi Hotel Exterior &amp; Gardens
                <small>Welcome to Forest Mpya, Mbeya</small>
              </div>
            </div>
          </div>

          <div className="trust-bar">
            <div className="trust-card">
              <h4>15-minute reply</h4>
              <p>Every day, via WhatsApp</p>
            </div>
            <div className="trust-card">
              <h4>Free cancellation</h4>
              <p>Simple changes, clearly explained</p>
            </div>
            <div className="trust-card">
              <h4>Mobile money welcome</h4>
              <p>Deposit with M-Pesa or TigoPesa</p>
            </div>
            <div className="trust-card">
              <h4>Halal-friendly</h4>
              <p>Fresh halal meals &amp; prayer space</p>
            </div>
          </div>
        </div>
      </section>

      {/* ROOMS HIGHLIGHT SECTION */}
      <section className="section section--tight">
        <div className="container">
          <div className="section-head section-head--row">
            <div>
              <span className="eyebrow">Stay your way</span>
              <h2>Rooms made for proper rest.</h2>
            </div>
            <button onClick={() => goTo('rooms')} className="btn btn--secondary">
              See all rooms
            </button>
          </div>

          <div className="rooms-scroller">
            {/* Left Navigation Arrow */}
            <button
              type="button"
              className="rooms-scroller__arrow rooms-scroller__arrow--prev"
              aria-label="Previous rooms"
              disabled={isPrevDisabled}
              onClick={handlePrev}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>

            {/* Right Navigation Arrow */}
            <button
              type="button"
              className="rooms-scroller__arrow rooms-scroller__arrow--next"
              aria-label="Next rooms"
              disabled={isNextDisabled}
              onClick={handleNext}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>

            {/* Horizontally Scrollable Track */}
            <div
              ref={trackRef}
              className="rooms-scroller__track"
              tabIndex={0}
              role="region"
              aria-label="Featured rooms"
            >
              {initialLoading && rooms.length === 0 ? (
                [1, 2, 3].map((n) => (
                  <article key={n} className="room-card rooms-scroller__card animate-pulse">
                    <div className="room-card__media bg-[#E8DED0] h-[220px]" />
                    <div className="room-card__body space-y-3">
                      <div className="h-6 bg-[#E8DED0] rounded w-3/4" />
                      <div className="h-4 bg-[#E8DED0]/60 rounded w-1/2" />
                      <div className="h-12 bg-[#E8DED0]/40 rounded w-full" />
                      <div className="h-10 bg-[#E8DED0] rounded w-full mt-4" />
                    </div>
                  </article>
                ))
              ) : (
                rooms.map((room) => (
                  <article key={room.id} className="room-card rooms-scroller__card">
                    <RoomCardMedia room={room} />
                    <div className="room-card__body">
                      <h3>{room.name}</h3>
                      <p className="room-card__tags">{room.tags.join(' · ')}</p>
                      <p className="room-card__desc">{room.description}</p>
                      <div className="room-card__foot">
                        <a 
                          href={formatWhatsAppUrl(`Hello ROYAL MGWASI HOTEL, I'd like to ask about the ${room.name}.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn--primary btn--block"
                        >
                          Ask about {room.name.split(' ')[0]}
                        </a>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MORE AT ROYAL MGWASI HOTEL */}
      <section className="section section--alt">
        <div className="container">
          <span className="eyebrow">More at ROYAL MGWASI HOTEL</span>
          <h2 className="mt-12">Everything you need, before you arrive.</h2>
          <p className="lede mt-12">Explore the essentials here, then open each page for the full details, photos and booking support.</p>

          <div className="hub-panel">
            <div className="hub-panel__head">
              <h3>Dining at ROYAL MGWASI HOTEL</h3>
              <button onClick={() => goTo('dining')} className="link-arrow">
                More dining details 
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 7h10M8 3l4 4-4 4"/>
                </svg>
              </button>
            </div>
            <div className="hub-tiles">
              <div className="ph ph--sand">
                <div className="ph__label">Fresh Breakfast</div>
              </div>
              <div className="ph ph--forest">
                <div className="ph__label">Signature Tilapia</div>
              </div>
              <div className="ph ph--dusk">
                <div className="ph__label">Weekend Live Band</div>
              </div>
            </div>
          </div>

          <div className="hub-panel tan">
            <div className="hub-panel__head">
              <h3>Amenities at ROYAL MGWASI HOTEL</h3>
              <button onClick={() => goTo('dining')} className="link-arrow">
                More amenities details 
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 7h10M8 3l4 4-4 4"/>
                </svg>
              </button>
            </div>
            <div className="hub-tiles">
              <div className="ph ph--slate"><div className="ph__label">Outdoor Pool</div></div>
              <div className="ph ph--sand">
                <div className="ph__label">Breakfast &amp; Restaurant</div>
              </div>
              <div className="ph ph--dusk">
                <div className="ph__label">Weekend Live Music</div>
              </div>
            </div>
            <ul className="amenity-list">
              <li>&#127946; Outdoor Pool</li>
              <li>&#127947; Fitness Center</li>
              <li>&#128246; Free High-Speed Wi-Fi</li>
              <li>&#127359; Secure Free Parking</li>
              <li>&#127869; Daily Free Breakfast</li>
              <li>&#127869; On-site Restaurant</li>
              <li>&#129531; Express Laundry Service</li>
              <li>&#127925; Live Band Every Weekend</li>
            </ul>
          </div>

          <div className="grid grid--3 mt-24">
            <div onClick={() => goTo('gallery')} className="link-card">
              <h3>Gallery</h3>
              <p>Honest photography of rooms, dining and shared spaces.</p>
              <span className="link-arrow">
                Browse the gallery 
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
              </span>
            </div>
            <div onClick={() => goTo('our-story')} className="link-card">
              <h3>Our Story</h3>
              <p>Meet the people and purpose behind your stay in Mbeya.</p>
              <span className="link-arrow">
                Meet the hotel 
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
              </span>
            </div>
            <div onClick={() => goTo('reviews')} className="link-card">
              <h3>Guest Reviews</h3>
              <p>Read real guest feedback from Google reviews and past stays.</p>
              <span className="link-arrow">
                Read reviews 
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
              </span>
            </div>
            <div onClick={() => goTo('book')} className="link-card green">
              <h3>Book Your Stay</h3>
              <p>Send your dates and get a direct response in 15 minutes.</p>
              <span className="link-arrow">
                Start booking 
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
              </span>
            </div>
            <div onClick={() => goTo('offers')} className="link-card">
              <h3>Offers &amp; Packages</h3>
              <p>Weekend escape, corporate delegate, and long-stay plans.</p>
              <span className="link-arrow">
                See current offers 
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
              </span>
            </div>
            <div onClick={() => goTo('events')} className="link-card">
              <h3>Events &amp; Weddings</h3>
              <p>Conference hall, outdoor garden lawn, and banquet quotes.</p>
              <span className="link-arrow">
                Plan an event 
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
              </span>
            </div>
          </div>

          <div className="hub-panel">
            <div className="hub-panel__head">
              <h3>Location &amp; Contact</h3>
              <button onClick={() => goTo('contact')} className="link-arrow">
                Plan your arrival 
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
              </button>
            </div>
            <div className="location-panel">
              <div className="map-block relative overflow-hidden group">
                <iframe
                  title="Live Google Map of Royal Mgwasi Hotel Mbeya"
                  src="https://maps.google.com/maps?q=ROYAL%20MGWASI%20HOTEL%2C%20Forest%20Mpya%2C%20Mbeya%2C%20Tanzania&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="map-block__label relative z-10 pointer-events-auto shadow-lg bg-black/75 backdrop-blur-sm">
                  <h4>ROYAL MGWASI HOTEL</h4>
                  <p>Forest Mpya &middot; Mzumbe University area &middot; Mbeya (Plus Code: 3CQX+M4)</p>
                  <a 
                    href="https://maps.google.com/?q=ROYAL+MGWASI+HOTEL,+Forest+Mpya,+Mbeya,+Tanzania" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-white bg-[#1D5D4C] hover:bg-[#154639] px-3 py-1.5 rounded-md transition-colors"
                  >
                    Open in Google Maps
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
                  </a>
                </div>
              </div>
              <div className="landmark-box">
                <h4>Nearby reference points</h4>
                <ul>
                  {landmarks.slice(0, 6).map((lm, idx) => (
                    <li key={idx}>
                      {lm.name} <span>&middot; {lm.distance} ({lm.note})</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => goTo('contact')} className="link-arrow mt-16" style={{ display: 'inline-flex' }}>
                  Open map for live travel times 
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7h10M8 3l4 4-4 4"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 STEPS TO BOOK */}
      <section className="section section--tight">
        <div className="container">
          <h2 className="text-center">Book in four clear steps.</h2>
          <div className="steps mt-32">
            <div className="step">
              <span className="step__num">01</span>
              <h3>Message</h3>
              <p>Send us your check-in dates on WhatsApp or via our booking form.</p>
            </div>
            <div className="step">
              <span className="step__num">02</span>
              <h3>Pick</h3>
              <p>Select your preferred room type with our instant guidance.</p>
            </div>
            <div className="step">
              <span className="step__num">03</span>
              <h3>Deposit</h3>
              <p>Secure your room with a deposit via mobile money or card.</p>
            </div>
            <div className="step is-active">
              <span className="step__num">04</span>
              <h3>Confirmed</h3>
              <p>Receive instant confirmation and arrival details in 15 mins.</p>
            </div>
          </div>

          <div className="stat-strip mt-40">
            <div className="stat-strip__item">4-Star<span>Hotel Rating</span></div>
            <div className="stat-strip__item">24 Hours<span>Front Desk Service</span></div>
            <div className="stat-strip__item">4.3 &#9733;<span>118 Google Reviews</span></div>
            <div className="stat-strip__item">Fri&ndash;Sun<span>Live Band Music</span></div>
          </div>
        </div>
      </section>

      {/* REVIEWS SUMMARY */}
      <section className="section section--alt">
        <div className="container">
          <h2>What guests remember.</h2>
          <p className="lede mt-12">A 4.3 rating from 118 Google reviews. Here are verified highlights from past guests.</p>

          <div className="grid grid--3 mt-32">
            {reviews.slice(0, 3).map((review) => (
              <article key={review.id} className="testimonial">
                <div className="testimonial__name">{review.name}</div>
                <div className="testimonial__trip">{review.tripType}</div>
                <div className="testimonial__stars">
                  {'★'.repeat(review.rating)}
                </div>
                <p>{review.comment}</p>
              </article>
            ))}
          </div>
          <div className="text-center mt-32">
            <button onClick={() => goTo('reviews')} className="btn btn--secondary">
              Read all reviews
            </button>
          </div>
        </div>
      </section>
    </>
  );
};
