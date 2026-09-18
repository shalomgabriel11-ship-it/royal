import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import { AccountView } from './views/AccountView';
import { AdminLoginView } from './views/AdminLoginView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { MembershipPopup } from './components/MembershipPopup';
import { RouteMetadata } from './components/RouteMetadata';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');

  if (location.pathname === '/admin/login') {
    return (
      <>
        <RouteMetadata />
        <AdminLoginView navigate={navigate} />
      </>
    );
  }

  if (isAdmin) {
    return (
      <>
        <RouteMetadata />
        <AdminDashboardView navigate={navigate} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4EFE6] text-[#2A2620]">
      <RouteMetadata />
      <Navbar />
      <main className="flex-1" id="main-content">
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/rooms" element={<RoomsView />} />
          <Route path="/dining" element={<DiningView />} />
          <Route path="/gallery" element={<GalleryView />} />
          <Route path="/offers" element={<OffersView />} />
          <Route path="/events" element={<EventsView />} />
          <Route path="/our-story" element={<StoryView />} />
          <Route path="/reviews" element={<ReviewsView />} />
          <Route path="/contact" element={<ContactView />} />
          <Route path="/book" element={<BookView />} />
          <Route path="/account" element={<AccountView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <MembershipPopup />
    </div>
  );
}

export default function App() {
  return (
    <HotelDataProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </HotelDataProvider>
  );
}
