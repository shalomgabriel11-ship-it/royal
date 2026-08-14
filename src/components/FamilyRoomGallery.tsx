import React, { useRef, useState, useEffect, useCallback } from 'react';

const FAMILY_ROOM_PHOTOS = [
  {
    id: 1,
    src: 'https://lh3.googleusercontent.com/d/17MehthbwmpwIoxVQJm4BboK02OKC40-3',
    fallbackSrc: 'https://i.ibb.co/yBy6yrDC/royal-mgwasi-hotel-DGcu-Js-JMBj-X-1.jpg',
    alt: 'Royal Mgwasi Hotel Family Room — Master bedroom area with plush double bed and bespoke wooden furnishings',
    caption: 'Master Bedroom Area',
  },
  {
    id: 2,
    src: 'https://i.ibb.co/yBy6yrDC/royal-mgwasi-hotel-DGcu-Js-JMBj-X-1.jpg',
    fallbackSrc: 'images/family-room/family-2.jpg',
    alt: 'Royal Mgwasi Hotel Family Room — Secondary twin bed configuration with crisp clean linens and reading lamps',
    caption: 'Secondary Sleeping Setup',
  },
  {
    id: 3,
    src: 'https://i.ibb.co/xS4SdRHS/royal-mgwasi-hotel-DGcu-Js-JMBj-X-2.jpg',
    fallbackSrc: 'images/family-room/family-3.jpg',
    alt: 'Royal Mgwasi Hotel Family Room — Private en-suite bathroom with walk-in hot shower, mirror, and toiletries',
    caption: 'Private En-Suite Bathroom',
  },
  {
    id: 4,
    src: 'https://i.ibb.co/6cm30sRV/royal-mgwasi-hotel-DGcu-Js-JMBj-X-3.jpg',
    fallbackSrc: 'images/family-room/family-4.jpg',
    alt: 'Royal Mgwasi Hotel Family Room — Living area and lounge seating space with coffee table and wardrobe storage',
    caption: 'Family Lounge & Wardrobe',
  },
  {
    id: 5,
    src: 'https://i.ibb.co/jZjhNwzJ/royal-mgwasi-hotel-DGcu-Js-JMBj-X-4.jpg',
    fallbackSrc: 'images/family-room/family-5.jpg',
    alt: 'Royal Mgwasi Hotel Family Room — Dedicated study and workspace desk with complimentary tea and electric kettle',
    caption: 'Work Desk & Hospitality Station',
  },
  {
    id: 6,
    src: 'https://i.ibb.co/pv740Ckz/royal-mgwasi-hotel-DGcu-Js-JMBj-X-5.jpg',
    fallbackSrc: 'images/family-room/family-6.jpg',
    alt: 'Royal Mgwasi Hotel Family Room — Window panoramic view showing natural sunlight and hotel garden surroundings',
    caption: 'Garden View & Natural Lighting',
  },
];

export const FamilyRoomGallery: React.FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPrevDisabled, setIsPrevDisabled] = useState(true);
  const [isNextDisabled, setIsNextDisabled] = useState(false);

  // Helper: calculate effective scroll amount based on single card width + gap
  const getScrollAmount = useCallback(() => {
    if (!trackRef.current) return 320;
    const firstCard = trackRef.current.querySelector('.family-gallery__card') as HTMLElement | null;
    if (!firstCard) return 320;
    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = parseFloat(window.getComputedStyle(trackRef.current).gap) || 18;
    return cardWidth + gap;
  }, []);

  // Update disabled state on arrows at boundary conditions
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

    // Initial check
    updateArrows();

    return () => {
      track.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateArrows);
      cancelAnimationFrame(rafId);
    };
  }, [updateArrows]);

  return (
    <section className="family-gallery" aria-label="Family Room Photo Gallery">
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#1D5D4C]">
            Family Suite Experience
          </span>
          <h3 className="text-lg md:text-xl font-bold text-[#2A2620] mt-0.5">
            Explore the Family Room (6 Views)
          </h3>
        </div>
        <span className="text-xs text-[#6E6559] font-medium hidden sm:inline-block">
          Swipe or use arrows to view all photos
        </span>
      </div>

      <div className="family-gallery__wrapper">
        {/* Navigation Buttons */}
        <button
          type="button"
          className="family-gallery__arrow family-gallery__arrow--prev"
          aria-label="Scroll gallery left"
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

        <button
          type="button"
          className="family-gallery__arrow family-gallery__arrow--next"
          aria-label="Scroll gallery right"
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

        {/* Scrollable Track */}
        <div
          ref={trackRef}
          className="family-gallery__track"
          tabIndex={0}
          role="region"
          aria-label="Family Room Photo Carousel"
        >
          {FAMILY_ROOM_PHOTOS.map((photo) => (
            <div key={photo.id} className="family-gallery__card">
              <div className="family-gallery__media">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  onError={(e) => {
                    // Fallback seamlessly if local image path is not yet provisioned in filesystem
                    const target = e.currentTarget;
                    if (target.src !== photo.fallbackSrc) {
                      target.src = photo.fallbackSrc;
                    }
                  }}
                />
              </div>
              <span className="family-gallery__caption">{photo.caption}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
