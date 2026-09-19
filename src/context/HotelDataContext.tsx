import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { RoomOption, ReviewItem, OfferItem, GalleryItem, LandmarkItem, MemberProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { 
  DEFAULT_ROOMS, 
  DEFAULT_REVIEWS, 
  DEFAULT_OFFERS, 
  DEFAULT_GALLERY_IMAGES, 
  DEFAULT_SETTINGS,
  LANDMARKS,
  fetchRooms, 
  fetchReviews, 
  fetchOffers, 
  fetchGallery, 
  fetchSiteSettings 
} from '../data';

interface HotelDataContextType {
  rooms: RoomOption[];
  reviews: ReviewItem[];
  offers: OfferItem[];
  galleryImages: GalleryItem[];
  landmarks: LandmarkItem[];
  settings: Record<string, string>;
  loading: boolean;
  initialLoading: boolean;
  user: User | null;
  memberProfile: MemberProfile | null;
  isMembershipModalOpen: boolean;
  setIsMembershipModalOpen: (open: boolean) => void;
  openMembershipModal: () => void;
  closeMembershipModal: (suppressDays?: number) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshRooms: () => Promise<void>;
  refreshReviews: () => Promise<void>;
  refreshOffers: () => Promise<void>;
  refreshGallery: () => Promise<void>;
  refreshMemberProfile: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const HotelDataContext = createContext<HotelDataContextType>({
  rooms: DEFAULT_ROOMS,
  reviews: DEFAULT_REVIEWS,
  offers: DEFAULT_OFFERS,
  galleryImages: DEFAULT_GALLERY_IMAGES,
  landmarks: LANDMARKS,
  settings: DEFAULT_SETTINGS,
  loading: false,
  initialLoading: true,
  user: null,
  memberProfile: null,
  isMembershipModalOpen: false,
  setIsMembershipModalOpen: () => {},
  openMembershipModal: () => {},
  closeMembershipModal: () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshRooms: async () => {},
  refreshReviews: async () => {},
  refreshOffers: async () => {},
  refreshGallery: async () => {},
  refreshMemberProfile: async () => {},
  refreshAll: async () => {},
});

export const HotelDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<RoomOption[]>(DEFAULT_ROOMS);
  const [reviews, setReviews] = useState<ReviewItem[]>(DEFAULT_REVIEWS);
  const [offers, setOffers] = useState<OfferItem[]>(DEFAULT_OFFERS);
  const [galleryImages, setGalleryImages] = useState<GalleryItem[]>(DEFAULT_GALLERY_IMAGES);
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);

  const fetchMemberProfile = useCallback(async (currentUserId: string) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', currentUserId)
        .maybeSingle();
      if (!error && data) {
        setMemberProfile(data);
      }
    } catch (err) {
      // Table may still be initializing or RLS active
      console.warn('Notice loading member profile:', err);
    }
  }, []);

  // Listen to Auth State
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchMemberProfile(currentUser.id);
      } else {
        setMemberProfile(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setIsMembershipModalOpen(false);
        fetchMemberProfile(currentUser.id);
      } else {
        setMemberProfile(null);
      }
      // Re-fetch offers whenever auth state changes so member-only offers immediately reflect
      fetchOffers().then(data => {
        if (data && data.length > 0) setOffers(data);
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchMemberProfile]);

  const signInWithGoogle = useCallback(async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
        },
      });
    } catch (err) {
      console.error('Error signing in with Google:', err);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setMemberProfile(null);
      // Refresh offers to public only
      const pubOffers = await fetchOffers();
      if (pubOffers && pubOffers.length > 0) setOffers(pubOffers);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  }, []);

  const openMembershipModal = useCallback(() => {
    setIsMembershipModalOpen(true);
  }, []);

  const closeMembershipModal = useCallback((suppressDays: number = 7) => {
    setIsMembershipModalOpen(false);
    if (suppressDays > 0) {
      try {
        localStorage.setItem('rmh_membership_popup_dismissed', Date.now().toString());
      } catch {
        // localStorage errors ignored
      }
    }
  }, []);

  const refreshRooms = useCallback(async () => {
    const data = await fetchRooms();
    if (data && data.length > 0) {
      setRooms(data);
    }
  }, []);

  const refreshReviews = useCallback(async () => {
    const data = await fetchReviews();
    if (data && data.length > 0) {
      setReviews(data);
    }
  }, []);

  const refreshOffers = useCallback(async () => {
    const data = await fetchOffers();
    if (data && data.length > 0) {
      setOffers(data);
    }
  }, []);

  const refreshGallery = useCallback(async () => {
    const data = await fetchGallery();
    if (data && data.length > 0) {
      setGalleryImages(data);
    }
  }, []);

  const refreshMemberProfile = useCallback(async () => {
    if (user?.id) {
      await fetchMemberProfile(user.id);
    }
  }, [user?.id, fetchMemberProfile]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsData, reviewsData, offersData, galleryData, settingsData] = await Promise.all([
        fetchRooms(),
        fetchReviews(),
        fetchOffers(),
        fetchGallery(),
        fetchSiteSettings()
      ]);

      if (roomsData && roomsData.length > 0) setRooms(roomsData);
      if (reviewsData && reviewsData.length > 0) setReviews(reviewsData);
      if (offersData && offersData.length > 0) setOffers(offersData);
      if (galleryData && galleryData.length > 0) setGalleryImages(galleryData);
      if (settingsData) setSettings(settingsData);
    } catch (err) {
      console.warn('Error fetching hotel data:', err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <HotelDataContext.Provider
      value={{
        rooms,
        reviews,
        offers,
        galleryImages,
        landmarks: LANDMARKS,
        settings,
        loading,
        initialLoading,
        user,
        memberProfile,
        isMembershipModalOpen,
        setIsMembershipModalOpen,
        openMembershipModal,
        closeMembershipModal,
        signInWithGoogle,
        signOut,
        refreshRooms,
        refreshReviews,
        refreshOffers,
        refreshGallery,
        refreshMemberProfile,
        refreshAll
      }}
    >
      {children}
    </HotelDataContext.Provider>
  );
};

export function useHotelData() {
  return useContext(HotelDataContext);
}
