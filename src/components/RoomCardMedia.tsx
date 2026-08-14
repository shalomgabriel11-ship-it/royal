import React, { useState, useEffect } from 'react';
import { RoomOption } from '../types';

interface RoomCardMediaProps {
  room: RoomOption;
  labelSubtitle?: string;
}

export const RoomCardMedia: React.FC<RoomCardMediaProps> = ({ room, labelSubtitle }) => {
  const imageList = room.images && room.images.length > 0 ? room.images : (room.image ? [room.image] : []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const hasMultipleImages = imageList.length > 1;

  // Auto cycle every 4.5 seconds if multiple images and not hovered
  useEffect(() => {
    if (!hasMultipleImages || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % imageList.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [hasMultipleImages, isPaused, imageList.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % imageList.length);
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  };

  return (
    <div 
      className={`ph ${room.colorClass} relative overflow-hidden group select-none`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Images container */}
      {imageList.length > 0 ? (
        <div className="absolute inset-0 w-full h-full">
          {imageList.map((imgUrl, idx) => (
            <img
              key={idx}
              src={imgUrl}
              alt={`${room.name} - view ${idx + 1}`}
              loading={idx === 0 ? 'eager' : 'lazy'}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                idx === currentIndex ? 'opacity-100 scale-100 z-[1]' : 'opacity-0 scale-105 z-0 pointer-events-none'
              }`}
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ))}
        </div>
      ) : null}

      {/* Dark gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none z-[2]" />

      {/* Multi-image counter badge */}
      {hasMultipleImages && (
        <div className="absolute top-3 right-3 z-[4] px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold rounded-full flex items-center gap-1.5 shadow-sm border border-white/10">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
          <span>{currentIndex + 1} / {imageList.length}</span>
        </div>
      )}

      {/* Left/Right Interactive Arrow Navigation */}
      {hasMultipleImages && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous image"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-[4] w-8 h-8 rounded-full bg-black/55 hover:bg-[#1D5D4C] text-white flex items-center justify-center backdrop-blur-sm transition-all duration-200 opacity-90 sm:opacity-0 group-hover:opacity-100 hover:scale-110 shadow-md border border-white/20 active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next image"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-[4] w-8 h-8 rounded-full bg-black/55 hover:bg-[#1D5D4C] text-white flex items-center justify-center backdrop-blur-sm transition-all duration-200 opacity-90 sm:opacity-0 group-hover:opacity-100 hover:scale-110 shadow-md border border-white/20 active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </>
      )}

      {/* Pagination Dot Indicators */}
      {hasMultipleImages && (
        <div className="absolute bottom-11 left-0 right-0 z-[4] flex items-center justify-center gap-1.5 pointer-events-auto">
          {imageList.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => handleDotClick(idx, e)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-5 bg-[#C59B27] shadow-sm'
                  : 'w-1.5 bg-white/60 hover:bg-white'
              }`}
            />
          ))}
        </div>
      )}

      {/* Room Title Label */}
      <div className="ph__label z-[3] relative">
        <span className="block text-white font-serif text-[17px] leading-snug drop-shadow-sm">
          {room.name}
        </span>
        {labelSubtitle && (
          <small className="block text-[#E8DED0] text-[12px] opacity-90 mt-0.5">
            {labelSubtitle}
          </small>
        )}
      </div>
    </div>
  );
};
