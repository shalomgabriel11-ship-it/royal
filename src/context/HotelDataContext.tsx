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
  user: User | null;
  memberProfile: MemberProfile | null;
  isMember: boolean;
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
  user: null,
  memberProfile: null,
  isMember: false,
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
  refreshAll: async () => {},
});

export const HotelDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<RoomOption[]>(DEFAULT_ROOMS);
  const [reviews, setReviews] = useState<ReviewItem[]>(DEFAULT_REVIEWS);
  const [offers, setOffers] = useState<OfferItem[]>(DEFAULT_OFFERS);
  const [galleryImages, setGalleryImages] = useState<GalleryItem[]>(DEFAULT_GALLERY_IMAGES);
  const [settings, setSettings] = useState<Record<string, string>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);

  // Fetch member profile from 'members' table with automatic single retry for signup trigger race condition
  const fetchMemberProfile = useCallback(async (currentUserId: string, currentUser?: User | null) => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, email, full_name, avatar_url, joined_at, is_active')
        .eq('id', currentUserId)
        .maybeSingle();

      if (error) {
        console.error(`[Supabase Members] Error fetching member row for user ${currentUserId}:`, error);
      }

      if (data) {
        setMemberProfile(data);
        return;
      }

      // If the row doesn't exist yet, the signup trigger in Postgres may still be completing.
      // Retry once after a 1200ms delay rather than showing the visitor as signed-out.
      console.warn(`[Supabase Members] No member row found for ${currentUserId} on initial lookup. Waiting 1200ms for database trigger to create row...`);
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const retryResult = await supabase
        .from('members')
        .select('id, email, full_name, avatar_url, joined_at, is_active')
        .eq('id', currentUserId)
        .maybeSingle();

      if (retryResult.error) {
        console.error(`[Supabase Members] Retry failed fetching member row for user ${currentUserId}:`, retryResult.error);
      }

      if (retryResult.data) {
        setMemberProfile(retryResult.data);
        return;
      }

      // If row still not found after retry, construct resilient member profile from user metadata
      // so visitor is NEVER displayed as signed-out when a valid auth session exists
      console.warn(`[Supabase Members] Member row still not present after retry for ${currentUserId}. Using fallback profile from auth metadata.`);
      if (currentUser) {
        const fallback: MemberProfile = {
          id: currentUserId,
          email: currentUser.email || null,
          full_name: (currentUser.user_metadata?.full_name as string) || 
                     (currentUser.user_metadata?.name as string) || 
                     currentUser.email?.split('@')[0] || 
                     'Member',
          avatar_url: (currentUser.user_metadata?.avatar_url as string) || 
                      (currentUser.user_metadata?.picture as string) || 
                      null,
          joined_at: currentUser.created_at || new Date().toISOString(),
          is_active: true
        };
        setMemberProfile(fallback);
      }
    } catch (err) {
      console.error(`[Supabase Members] Unexpected exception while loading member profile for ${currentUserId}:`, err);
    }
  }, []);

  // Listen to Auth State reliably across app lifecycle
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // 1. App Load: Check existing session once
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('[Supabase Auth] Failed to retrieve session on app load:', error);
        }
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          fetchMemberProfile(currentUser.id, currentUser);
        } else {
          setMemberProfile(null);
        }
      })
      .catch((err) => {
        console.error('[Supabase Auth] Exception during initial getSession:', err);
      });

    // 2. Auth State Change: Subscribe to real-time sign-in and sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          setIsMembershipModalOpen(false);
          await fetchMemberProfile(currentUser.id, currentUser);
        } else {
          setMemberProfile(null);
        }

        // Re-fetch offers whenever auth state changes so member-only offers immediately reflect
        const freshOffers = await fetchOffers();
        if (freshOffers && freshOffers.length > 0) {
          setOffers(freshOffers);
        }
      } catch (err) {
        console.error(`[Supabase Auth] Error processing onAuthStateChange (${event}):`, err);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchMemberProfile]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
        }
      });
      if (error) {
        console.error('[Supabase Auth] Error initiating Google sign-in:', error);
      }
    } catch (err) {
      console.error('[Supabase Auth] Unexpected exception initiating Google sign-in:', err);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Supabase Auth] Error signing out from Supabase:', error);
      }
    } catch (err) {
      console.error('[Supabase Auth] Unexpected exception signing out:', err);
    } finally {
      setUser(null);
      setMemberProfile(null);
      try {
        const pubOffers = await fetchOffers();
        if (pubOffers && pubOffers.length > 0) setOffers(pubOffers);
      } catch (err) {
        console.error('[Supabase Offers] Error refreshing offers after sign out:', err);
      }
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
        user,
        memberProfile,
        isMember: Boolean(user),
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
