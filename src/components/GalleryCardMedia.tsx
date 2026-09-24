import React, { useState, useEffect, useMemo } from 'react';
import { GalleryItem } from '../types';
import { getGalleryImageUrl } from '../lib/supabase';

interface GalleryCardMediaProps {
  item: GalleryItem;
}

export const GalleryCardMedia: React.FC<GalleryCardMediaProps> = ({ item }) => {
  // Collect images and associated descriptions
  const { imageList, descriptions } = useMemo(() => {
    let images: string[] = [];
    let descs: (string | null | undefined)[] = [];

    if (item.gallery_images && item.gallery_images.length > 0) {
      images = item.gallery_images
        .map(img => img.image_url || getGalleryImageUrl(img.storage_path))
        .filter((url): url is string => Boolean(url));
      descs = item.gallery_images.map(img => img.description);
    } else if (item.images && item.images.length > 0) {
      images = item.images.map(img => {
        if (!img) return '';
        if (img.startsWith('http://') || img.startsWith('https://')) return img;
        return getGalleryImageUrl(img) || img;
      }).filter(Boolean);
    } else if (item.image) {
      images = [item.image];
    } else if (item.storage_path) {
      const url = getGalleryImageUrl(item.storage_path);
      if (url) images = [url];
    }

    return { imageList: images, descriptions: descs };
  }, [item]);

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

  const currentDesc = descriptions[currentIndex];

  return (
    <div 
      className={`ph ${item.colorClass} min-h-[260px] relative overflow-hidden group select-none`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Images layer */}
      {imageList.length > 0 ? (
        <div className="absolute inset-0 w-full h-full">
          {imageList.map((imgUrl, idx) => (
            <img
              key={idx}
              src={imgUrl}
              alt={`${item.title} - photo ${idx + 1}`}
              loading={idx === 0 ? 'eager' : 'lazy'}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                idx === currentIndex 
                  ? 'opacity-100 scale-100 z-[1]' 
                  : 'opacity-0 scale-105 z-0 pointer-events-none'
              }`}
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ))}
        </div>
      ) : null}

      {/* Dark gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none z-[2]" />

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
            aria-label="Previous gallery photo"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-[4] w-8 h-8 rounded-full bg-black/55 hover:bg-[#1D5D4C] text-white flex items-center justify-center backdrop-blur-sm transition-all duration-200 opacity-90 sm:opacity-0 group-hover:opacity-100 hover:scale-110 shadow-md border border-white/20 active:scale-95 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next gallery photo"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-[4] w-8 h-8 rounded-full bg-black/55 hover:bg-[#1D5D4C] text-white flex items-center justify-center backdrop-blur-sm transition-all duration-200 opacity-90 sm:opacity-0 group-hover:opacity-100 hover:scale-110 shadow-md border border-white/20 active:scale-95 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </>
      )}

      {/* Pagination Dot Indicators */}
      {hasMultipleImages && (
        <div className="absolute bottom-12 left-0 right-0 z-[4] flex items-center justify-center gap-1.5 pointer-events-auto">
          {imageList.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => handleDotClick(idx, e)}
              aria-label={`Go to photo ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-5 bg-[#C59B27] shadow-sm'
                  : 'w-1.5 bg-white/60 hover:bg-white'
              }`}
            />
          ))}
        </div>
      )}

      {/* Gallery Item Title & Photo Description Label */}
      <div className="ph__label z-[3] relative">
        <span className="block text-white font-serif text-[17px] leading-snug drop-shadow-sm">
          {item.title}
        </span>
        <small className="block text-[#E8DED0] text-[12px] opacity-90 mt-0.5 line-clamp-2">
          {currentDesc ? currentDesc : `Category: ${item.category} · Royal Mgwasi Hotel`}
        </small>
      </div>
    </div>
  );
};
