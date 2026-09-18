import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageView } from '../types';
import { useHotelData } from '../context/HotelDataContext';

interface GalleryViewProps {
  setActivePage?: (page: PageView) => void;
}

interface VideoItem {
  id: string;
  vimeoId: string;
  title: string;
  tag: string;
  description: string;
  aspect: '9/16' | 'square';
}

const HOTEL_VIDEOS: VideoItem[] = [
  {
    id: '1',
    vimeoId: '1218139293',
    title: 'Hotel Experience & Tour',
    tag: 'Feat. Mwijaku',
    description: 'An exclusive look at the hotel vibe, hospitality, and dining experience.',
    aspect: '9/16'
  },
  {
    id: '2',
    vimeoId: '1218139241',
    title: 'Grounds & Facilities',
    tag: 'Property Tour',
    description: 'Walk-through of the serene environment, lush gardens, and room comfort.',
    aspect: '9/16'
  },
  {
    id: '3',
    vimeoId: '1218139285',
    title: 'Clouds FM Spotlight',
    tag: 'Media Feature',
    description: 'Clouds FM media feature exploring Royal Mgwasi Hotel in Mbeya.',
    aspect: 'square'
  },
  {
    id: '4',
    vimeoId: '1218139242',
    title: 'Suites & Ambience Walkthrough',
    tag: 'Rooms & Relaxation',
    description: 'Detailed showcase of executive guest suites, room appointments, and tranquility.',
    aspect: '9/16'
  },
  {
    id: '5',
    vimeoId: '1218139246',
    title: 'Hospitality & Dining Moments',
    tag: 'Guest Experience',
    description: 'Authentic moments of exceptional Tanzanian service, food, and hospitality.',
    aspect: '9/16'
  },
  {
    id: '6',
    vimeoId: '1218139277',
    title: 'Celebrations & Hotel Atmosphere',
    tag: 'Atmosphere & Events',
    description: 'Vibrant ambience, memorable gatherings, and pleasant stays at Royal Mgwasi Hotel.',
    aspect: '9/16'
  }
];

export const GalleryView: React.FC<GalleryViewProps> = ({ setActivePage }) => {
  const navigate = useNavigate();
  const { galleryImages, initialLoading } = useHotelData();
  const [activeTab, setActiveTab] = useState<string>('All');

  const handleBookClick = () => {
    if (setActivePage) setActivePage('book');
    navigate('/book');
  };

  const categories = ['All', 'Videos', 'Rooms', 'Dining', 'Pool', 'Grounds', 'Events'];

  const filteredImages = activeTab === 'All'
    ? galleryImages
    : activeTab === 'Videos'
      ? []
      : galleryImages.filter(img => img.category.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="section">
      <div className="container">
        <div className="page-header">
          <span className="eyebrow">Visual Tour</span>
          <h1>Hotel Gallery</h1>
          <p className="lede">
            Explore authentic glimpses of Royal Mgwasi Hotel in Forest Mpya, Mbeya—our serene bedrooms, outdoor pool, vibrant dining area, and lush green garden grounds.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-10 border-b border-[#DCD3C1] pb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === cat 
                  ? 'bg-[#1D5D4C] text-[#F4EFE6]' 
                  : 'bg-[#EFE8D9] text-[#2A2620] hover:bg-[#E8DED0]'
              }`}
            >
              {cat === 'Videos' ? `▶ Videos (${HOTEL_VIDEOS.length})` : cat}
            </button>
          ))}
        </div>

        {/* Video Feature Section */}
        {(activeTab === 'All' || activeTab === 'Videos') && (
          <div className="mb-12 p-6 md:p-8 bg-[#EFE8D9] rounded-2xl border border-[#DCD3C1] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1D5D4C]">Video Showcase</span>
                <h3 className="text-2xl font-bold text-[#2A2620] mt-0.5">Experience Royal Mgwasi in Motion</h3>
              </div>
              <span className="text-xs font-medium text-[#1D5D4C] bg-white/80 px-3 py-1.5 rounded-full border border-[#DCD3C1] self-start sm:self-auto">
                {HOTEL_VIDEOS.length} Video Tours Available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {HOTEL_VIDEOS.map((video) => (
                <div key={video.id} className="bg-white/70 p-4 rounded-xl border border-[#DCD3C1]/80 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <h4 className="font-bold text-[#2A2620] text-sm line-clamp-1">{video.title}</h4>
                      <span className="text-[10px] font-semibold bg-[#1D5D4C]/10 text-[#1D5D4C] px-2 py-0.5 rounded-full whitespace-nowrap">
                        {video.tag}
                      </span>
                    </div>
                    <div className={`relative w-full ${video.aspect === 'square' ? 'aspect-square' : 'aspect-[9/16]'} max-h-[460px] bg-black rounded-lg overflow-hidden shadow-md mx-auto`}>
                      <iframe
                        src={`https://player.vimeo.com/video/${video.vimeoId}?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479`}
                        className="w-full h-full border-0"
                        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        title={video.title}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-[#7D766A] mt-3">
                    {video.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery Grid */}
        {initialLoading && filteredImages.length === 0 && activeTab !== 'Videos' ? (
          <div className="grid grid--3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="min-h-[260px] rounded-xl bg-[#E8DED0]/60 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid--3">
            {filteredImages.map((img) => (
              <div key={img.id} className={`ph ${img.colorClass} min-h-[260px] relative overflow-hidden group`}>
                {img.image && (
                  <img 
                    src={img.image} 
                    alt={img.title} 
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none z-[1]" />
                <div className="ph__label z-[2] relative">
                  {img.title}
                  <small>Category: {img.category} &middot; Royal Mgwasi Hotel</small>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="note-card mt-12 text-center">
          <h4>Want to see a live video tour before booking?</h4>
          <p className="mt-2">
            Our reception team can send you video walk-throughs of our current rooms on WhatsApp.
          </p>
          <div className="mt-6">
            <button onClick={handleBookClick} className="btn btn--primary">
              Book Your Visit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
