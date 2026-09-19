import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { checkUserIsAdmin } from '../lib/authUtils';
import { 
  CalendarCheck, 
  Mail, 
  Star, 
  Tag, 
  BedDouble, 
  Image as ImageIcon, 
  Settings, 
  LogOut, 
  ExternalLink, 
  Menu, 
  X, 
  Shield, 
  User, 
  RefreshCw,
  Home
} from 'lucide-react';

import { AdminBookingsSection } from '../components/admin/AdminBookingsSection';
import { AdminInquiriesSection } from '../components/admin/AdminInquiriesSection';
import { AdminReviewsSection } from '../components/admin/AdminReviewsSection';
import { AdminOffersSection } from '../components/admin/AdminOffersSection';
import { AdminRoomsSection } from '../components/admin/AdminRoomsSection';
import { AdminGallerySection } from '../components/admin/AdminGallerySection';
import { AdminSettingsSection } from '../components/admin/AdminSettingsSection';

export type AdminSection = 
  | 'bookings' 
  | 'inquiries' 
  | 'reviews' 
  | 'offers' 
  | 'rooms' 
  | 'gallery' 
  | 'settings';

interface AdminDashboardViewProps {
  navigate: (path: string) => void;
}

interface AdminProfile {
  id: string;
  email: string;
  role: string;
  fullName?: string;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ navigate }) => {
  const [currentSection, setCurrentSection] = useState<AdminSection>('bookings');
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Badge notification counts
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [newInquiriesCount, setNewInquiriesCount] = useState(0);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);

  // Protect route & load admin credentials
  useEffect(() => {
    let isMounted = true;

    const verifyAdmin = async () => {
      try {
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (sessionErr || !user) {
          if (isMounted) navigate('/admin/login');
          return;
        }

        // Verify admin role via profiles, metadata, or registered admin email
        const adminCheck = await checkUserIsAdmin(user);

        if (!adminCheck.isAdmin) {
          // Unauthorized: Redirect to login or home
          if (isMounted) navigate('/admin/login');
          return;
        }

        if (isMounted) {
          setProfile({
            id: user.id,
            email: user.email || '',
            role: adminCheck.role || 'admin',
            fullName: adminCheck.profile?.full_name || (user.user_metadata?.full_name as string) || 'Hotel Staff'
          });
        }

        // Fetch notification counts in background
        const [bookingsRes, contactRes, eventRes, reviewsRes] = await Promise.all([
          supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
          supabase.from('event_inquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
          supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('is_published', false)
        ]);

        if (isMounted) {
          setPendingBookingsCount(bookingsRes.count || 0);
          setNewInquiriesCount((contactRes.count || 0) + (eventRes.count || 0));
          setPendingReviewsCount(reviewsRes.count || 0);
        }
      } catch (err) {
        console.error('Admin verification error:', err);
        if (isMounted) navigate('/admin/login');
      } finally {
        if (isMounted) setLoadingAuth(false);
      }
    };

    verifyAdmin();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      navigate('/admin/login');
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#1D5D4C] mx-auto" />
          <p className="text-sm font-medium text-[#6E6559]">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  const NAV_ITEMS = [
    {
      id: 'bookings' as AdminSection,
      label: 'Bookings',
      icon: CalendarCheck,
      badge: pendingBookingsCount > 0 ? pendingBookingsCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'inquiries' as AdminSection,
      label: 'Messages & Leads',
      icon: Mail,
      badge: newInquiriesCount > 0 ? newInquiriesCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'reviews' as AdminSection,
      label: 'Reviews Moderation',
      icon: Star,
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'offers' as AdminSection,
      label: 'Offers & Packages',
      icon: Tag,
    },
    {
      id: 'rooms' as AdminSection,
      label: 'Rooms & Photos',
      icon: BedDouble,
    },
    {
      id: 'gallery' as AdminSection,
      label: 'Gallery Photos',
      icon: ImageIcon,
    },
    {
      id: 'settings' as AdminSection,
      label: 'Site Settings',
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4EFE6] flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#1D5D4C] text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#C59B27]" />
          <span className="font-serif font-bold text-base tracking-wide">Royal Mgwasi Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-white hover:bg-white/10 rounded-lg"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          mobileMenuOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-[#154639] text-[#EAE2D2] flex flex-col justify-between shrink-0 shadow-lg md:sticky md:top-0 md:h-screen z-40`}
      >
        {/* Top brand */}
        <div>
          <div className="p-5 border-b border-white/10 hidden md:block">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#C59B27]/20 border border-[#C59B27]/40 flex items-center justify-center text-[#C59B27]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-sm text-white tracking-wide">
                  Royal Mgwasi Hotel
                </h1>
                <p className="text-[11px] text-[#C59B27] uppercase tracking-widest font-semibold">
                  Staff Management
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#C59B27] text-[#154639] font-bold shadow-xs'
                      : 'text-[#EAE2D2] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: User info & Actions */}
        <div className="p-4 border-t border-white/10 bg-black/15">
          {profile && (
            <div className="mb-3 px-2">
              <div className="flex items-center gap-2 text-white text-xs font-medium truncate">
                <User className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                <span className="truncate">{profile.fullName || profile.email}</span>
              </div>
              <div className="text-[10px] text-[#C59B27] uppercase tracking-wider font-semibold ml-5">
                Role: {profile.role}
              </div>
            </div>
          )}

          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#EAE2D2] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>View Public Website</span>
            </button>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 hover:text-rose-100 hover:bg-rose-900/30 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Render current section */}
        {currentSection === 'bookings' && <AdminBookingsSection />}
        {currentSection === 'inquiries' && <AdminInquiriesSection />}
        {currentSection === 'reviews' && <AdminReviewsSection />}
        {currentSection === 'offers' && <AdminOffersSection />}
        {currentSection === 'rooms' && <AdminRoomsSection />}
        {currentSection === 'gallery' && <AdminGallerySection />}
        {currentSection === 'settings' && <AdminSettingsSection />}
      </main>
    </div>
  );
};
