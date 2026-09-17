import React, { useState, useEffect } from 'react';
import { PageView } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HotelDataProvider } from './context/HotelDataContext';
import { HomeView } from './views/HomeView';
import { RoomsView } from './views/RoomsView';
import { DiningView } from './views/DiningView';
import { GalleryView } from './views/GalleryView';
import { OffersView } from './views/OffersView';
import { EventsView } from './views/EventsView';
import { StoryView } from './views/StoryView';
import { ReviewsView } from './views/ReviewsView';
import { ContactView } from './views/ContactView';
import { BookView } from './views/BookView';
import { MembershipPopup } from './components/MembershipPopup';

export default function App() {
  const [activePage, setActivePage] = useState<PageView>('home');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activePage]);

  const renderView = () => {
    switch (activePage) {
      case 'home':
        return <HomeView setActivePage={setActivePage} />;
      case 'rooms':
        return <RoomsView setActivePage={setActivePage} />;
      case 'dining':
        return <DiningView setActivePage={setActivePage} />;
      case 'gallery':
        return <GalleryView setActivePage={setActivePage} />;
      case 'offers':
        return <OffersView setActivePage={setActivePage} />;
      case 'events':
        return <EventsView setActivePage={setActivePage} />;
      case 'our-story':
        return <StoryView setActivePage={setActivePage} />;
      case 'reviews':
        return <ReviewsView setActivePage={setActivePage} />;
      case 'contact':
        return <ContactView setActivePage={setActivePage} />;
      case 'book':
        return <BookView setActivePage={setActivePage} />;
      default:
        return <HomeView setActivePage={setActivePage} />;
    }
  };

  return (
    <HotelDataProvider>
      <div className="min-h-screen flex flex-col bg-[#F4EFE6] text-[#2A2620]">
        <Navbar activePage={activePage} setActivePage={setActivePage} />
        <main className="flex-1" id="main-content">
          {renderView()}
        </main>
        <Footer setActivePage={setActivePage} />
        <MembershipPopup />
      </div>
    </HotelDataProvider>
  );
}

