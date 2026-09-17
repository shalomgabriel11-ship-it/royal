import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useHotelData } from '../context/HotelDataContext';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const POPUP_DELAY_MS = 60 * 1000; // 60 seconds
const STORAGE_KEY = 'rmh_membership_popup_dismissed';

export const MembershipPopup: React.FC = () => {
  const { 
    user, 
    isMembershipModalOpen, 
    setIsMembershipModalOpen, 
    closeMembershipModal 
  } = useHotelData();

  const [isVisible, setIsVisible] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Synchronize with context manual modal open trigger
  useEffect(() => {
    if (isMembershipModalOpen && !user) {
      setIsVisible(true);
    } else if (user) {
      setIsVisible(false);
    }
  }, [isMembershipModalOpen, user]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let timer: NodeJS.Timeout | null = null;

    const checkAndSchedule = async () => {
      // 1. Never show if user is already signed in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return;
      }

      // 2. Check localStorage 7-day suppression
      try {
        const dismissedAt = localStorage.getItem(STORAGE_KEY);
        if (dismissedAt) {
          const elapsed = Date.now() - parseInt(dismissedAt, 10);
          if (!isNaN(elapsed) && elapsed < SEVEN_DAYS_MS) {
            return; // Suppressed for 7 days
          }
        }
      } catch (e) {
        console.warn('Storage read warning:', e);
      }

      // 3. Start 60-second timer
      timer = setTimeout(() => {
        setIsVisible(true);
        setIsMembershipModalOpen(true);
      }, POPUP_DELAY_MS);
    };

    checkAndSchedule();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [setIsMembershipModalOpen]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    closeMembershipModal(7);
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch (e) {
      console.warn('Storage write warning:', e);
    }
  }, [closeMembershipModal]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
        },
      });
      if (error) {
        console.error('Google sign-in error:', error.message);
        setIsSigningIn(false);
      }
    } catch (err) {
      console.error('OAuth initiation failure:', err);
      setIsSigningIn(false);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleDismiss]);

  // If already signed in or not visible, do not render
  if (!isVisible || user) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="membership-popup-title"
      onClick={(e) => {
        // Dismiss when clicking the backdrop
        if (e.target === e.currentTarget) {
          handleDismiss();
        }
      }}
    >
      <div 
        className="relative w-full max-w-lg bg-[#FAF7F2] text-[#2A2620] rounded-2xl shadow-2xl border border-[#DCD3C1] p-6 sm:p-8 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative corner accent */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#1D5D4C]/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-[#DCD3C1]/40 rounded-full blur-lg pointer-events-none" />

        {/* Close (X) button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-[#6E6559] hover:text-[#2A2620] hover:bg-[#EFE8D9] rounded-full transition-colors focus:outline-none"
          aria-label="Close membership popup"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Brand / Crest Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#1D5D4C] text-[#F4EFE6] flex items-center justify-center font-bold text-xs shadow-sm">
            RM
          </div>
          <span className="text-xs font-semibold tracking-wider text-[#1D5D4C] uppercase">
            Royal Mgwasi Hotel &middot; Member Club
          </span>
        </div>

        {/* Headline */}
        <h2 
          id="membership-popup-title" 
          className="font-serif text-2xl sm:text-3xl font-bold leading-snug text-[#2A2620] mb-3"
        >
          Never miss what's happening at Royal Mgwasi
        </h2>

        {/* Subtext */}
        <p className="text-sm sm:text-base leading-relaxed text-[#6E6559] mb-6">
          Join free with Google. Members get first access to offers, weekend live-band updates, and everything happening at the hotel — before anyone else.
        </p>

        {/* Benefits list (compact) */}
        <div className="bg-[#F4EFE6] border border-[#E8DED0] rounded-xl p-3.5 mb-6 text-xs sm:text-sm text-[#524B40] space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="text-[#1D5D4C] font-bold">✓</span>
            <span>Early &amp; exclusive access to promotional rates and packages</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[#1D5D4C] font-bold">✓</span>
            <span>Weekend live band lineup and dining updates</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[#1D5D4C] font-bold">✓</span>
            <span>Fast reservations and priority table seating</span>
          </div>
        </div>

        {/* Continue with Google button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 bg-[#1D5D4C] hover:bg-[#164B3D] text-[#F4EFE6] font-semibold text-sm sm:text-base py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isSigningIn ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Connecting to Google...
              </span>
            ) : (
              <>
                {/* Official Google G Logo SVG */}
                <div className="w-5 h-5 bg-white rounded-full p-0.5 flex items-center justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* "Not now" text link */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-[#6E6559] hover:text-[#2A2620] hover:underline transition-colors py-1 px-2 focus:outline-none"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
