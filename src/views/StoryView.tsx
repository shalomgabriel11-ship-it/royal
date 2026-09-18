import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageView } from '../types';

interface StoryViewProps {
  setActivePage?: (page: PageView) => void;
}

export const StoryView: React.FC<StoryViewProps> = ({ setActivePage }) => {
  const navigate = useNavigate();

  const handleBookClick = () => {
    if (setActivePage) setActivePage('book');
    navigate('/book');
  };

  return (
    <div className="section">
      <div className="container">
        <div className="page-header">
          <span className="eyebrow">Our Heritage</span>
          <h1>Our Story</h1>
          <p className="lede">
            Rooted in the welcoming spirit of the Southern Highlands. Discover how Royal Mgwasi Hotel grew into a trusted sanctuary for travelers, corporate guests, and local families in Mbeya.
          </p>
        </div>

        <div className="location-panel location-panel--wide my-8">
          <div className="ph ph--forest min-h-[360px]">
            <div className="ph__label">
              Royal Mgwasi Hotel &middot; Forest Mpya
              <small>Serving Mbeya with Pride</small>
            </div>
          </div>

          <div className="space-y-6 text-[#6E6559] leading-relaxed text-base">
            <h2 className="text-3xl font-serif text-[#2A2620]">Hospitality with Purpose</h2>
            <p>
              Located in the vibrant Forest Mpya neighborhood adjacent to Mzumbe University, Royal Mgwasi Hotel was established with a singular vision: to offer a clean, peaceful, and warm haven where guests experience true royal hospitality.
            </p>
            <p>
              Over the years, we have built a reputation based on consistency—impeccably clean rooms, hot showers, delicious food, and a staff team that treats every guest like family.
            </p>
          </div>
        </div>

        {/* Pillars */}
        <div className="grid grid--3 mt-12">
          <div className="note-card">
            <h4>1. Uncompromising Cleanliness</h4>
            <p className="mt-2">
              Every bedroom, bathroom, and dining area undergoes rigorous daily sanitation, ensuring you always step into a fresh, spotless room.
            </p>
          </div>
          <div className="note-card">
            <h4>2. Authentic Tanzanian Taste</h4>
            <p className="mt-2">
              We source our fresh tilapia, vegetables, and highland coffee directly from local farms and lakes, supporting Mbeya's local agricultural community.
            </p>
          </div>
          <div className="note-card">
            <h4>3. Community &amp; Culture</h4>
            <p className="mt-2">
              From hosting university celebrations to showcasing live local musicians every weekend, our hotel remains a vibrant cultural heart of Forest Mpya.
            </p>
          </div>
        </div>

        <div className="text-center mt-12">
          <button onClick={handleBookClick} className="btn btn--primary btn--lg">
            Experience Our Hospitality &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
