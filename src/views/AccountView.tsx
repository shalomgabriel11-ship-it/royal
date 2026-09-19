import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useHotelData } from '../context/HotelDataContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { BookingStatus, BookingRow } from '../components/admin/AdminBookingsSection';
import { ReviewRow } from '../components/admin/AdminReviewsSection';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  confirmed: { label: 'Confirmed', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  checked_in: { label: 'Checked In', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  checked_out: { label: 'Checked Out', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  cancelled: { label: 'Cancelled', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
  no_show: { label: 'No Show', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
};

export const AccountView: React.FC = () => {
  const { 
    user, 
    memberProfile, 
    initialLoading, 
    refreshMemberProfile, 
    rooms, 
    signInWithGoogle 
  } = useHotelData();

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Direct login form state (for visitors on /account)
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Bookings state
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Reviews state
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Handle direct login from /account page
  const handleDirectAccountLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: accountEmail.trim(),
        password: accountPassword
      });

      if (error) {
        setLoginError(error.message);
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Failed to sign in');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sync profile fields with state
  useEffect(() => {
    if (user) {
      setFullName(memberProfile?.full_name || (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || '');
      setPhone(memberProfile?.phone || (user.user_metadata?.phone as string) || '');
    }
  }, [user, memberProfile]);

  // Fetch Member Bookings
  const fetchMemberBookings = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setLoadingBookings(false);
      return;
    }

    try {
      setLoadingBookings(true);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('member_id', user.id)
        .order('check_in', { ascending: false });

      if (error) {
        console.warn('Notice loading member bookings:', error.message);
        setBookings([]);
      } else if (data) {
        setBookings(data as BookingRow[]);
      }
    } catch (err) {
      console.warn('Error fetching member bookings:', err);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [user]);

  // Fetch Member Reviews
  const fetchMemberReviews = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setLoadingReviews(false);
      return;
    }

    try {
      setLoadingReviews(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('member_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Notice loading member reviews:', error.message);
        setReviews([]);
      } else if (data) {
        setReviews(data as ReviewRow[]);
      }
    } catch (err) {
      console.warn('Error fetching member reviews:', err);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMemberBookings();
      fetchMemberReviews();
    }
  }, [user, fetchMemberBookings, fetchMemberReviews]);

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSavingProfile) return;

    setIsSavingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const avatarUrl = memberProfile?.avatar_url || (user.user_metadata?.avatar_url as string) || (user.user_metadata?.picture as string) || null;
      const profileDataWithPhone = {
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        email: user.email,
        avatar_url: avatarUrl
      };
      const profileDataNoPhone = {
        full_name: fullName.trim() || null,
        email: user.email,
        avatar_url: avatarUrl
      };

      // 1. Update Supabase Auth user metadata (always succeeds for authenticated user)
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: fullName.trim(),
            name: fullName.trim(),
            phone: phone.trim(),
          }
        });
      } catch (authErr) {
        console.warn('Could not update auth user_metadata:', authErr);
      }

      // 2. Try update first if member profile already exists in members table
      let saveError: any = null;
      if (memberProfile) {
        let res = await supabase
          .from('members')
          .update(profileDataWithPhone)
          .eq('id', user.id);
        
        if (res.error && (res.error.code === '42703' || res.error.message.includes('phone'))) {
          res = await supabase
            .from('members')
            .update(profileDataNoPhone)
            .eq('id', user.id);
        }
        saveError = res.error;
      }

      // If no memberProfile yet or update couldn't find row, do upsert
      if (!memberProfile || (saveError && !saveError.message.includes('policy'))) {
        let res = await supabase
          .from('members')
          .upsert({
            id: user.id,
            ...profileDataWithPhone
          }, { onConflict: 'id' });

        if (res.error && (res.error.code === '42703' || res.error.message.includes('phone'))) {
          res = await supabase
            .from('members')
            .upsert({
              id: user.id,
              ...profileDataNoPhone
            }, { onConflict: 'id' });
        }
        saveError = res.error;
      }

      if (saveError) {
        if (saveError.code === '42501' || saveError.message.includes('policy')) {
          setProfileError('Database policy error: public.members is missing an RLS policy for insert/update. Please run the provided SQL in Supabase SQL Editor.');
        } else {
          setProfileError(saveError.message);
        }
        return;
      }

      await refreshMemberProfile();
      setProfileSuccess('Your profile details have been saved successfully.');
      setTimeout(() => setProfileSuccess(null), 5000);
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 1. Initial Auth verification loading
  if (initialLoading) {
    return (
      <div className="section min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#1D5D4C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#6E6559]">Loading account...</p>
        </div>
      </div>
    );
  }

  // 2. If visitor is NOT logged in, show dedicated sign-in card
  if (!user) {
    return (
      <div className="section min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#FAF7F2] rounded-2xl p-8 border border-[#DCD3C1] shadow-xl">
          <div className="text-center mb-6">
            <span className="eyebrow">Royal Mgwasi Hotel</span>
            <h2 className="text-2xl font-serif font-bold text-[#2A2620] mt-1 mb-2">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-[#6E6559]">
              Enter your credentials to access your Member Account.
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 shrink-0 text-red-500 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleDirectAccountLogin} className="space-y-4">
            <div className="field">
              <label>Email Address</label>
              <input
                type="email"
                required
                value={accountEmail}
                onChange={e => setAccountEmail(e.target.value)}
                placeholder="e.g. name@example.com"
                className="w-full"
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                required
                value={accountPassword}
                onChange={e => setAccountPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="btn btn--primary w-full py-3 inline-flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#DCD3C1]" />
            </div>
            <span className="relative px-3 bg-[#FAF7F2] text-[11px] font-semibold text-[#8C8275] uppercase tracking-wider">
              Or continue with
            </span>
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full py-2.5 px-4 rounded-xl border border-[#DCD3C1] bg-white hover:bg-[#F4EFE6] text-xs font-semibold text-[#2A2620] transition-colors flex items-center justify-center gap-2.5 shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Google Account</span>
          </button>

          <div className="mt-6 pt-4 border-t border-[#E8DED0] text-center">
            <Link to="/" className="text-xs text-[#6E6559] hover:text-[#1D5D4C] transition-colors">
              ← Return to Hotel Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const avatarUrl = memberProfile?.avatar_url || (user.user_metadata?.avatar_url as string) || (user.user_metadata?.picture as string) || null;
  const initial = (fullName?.[0] || user.email?.[0] || 'M').toUpperCase();

  // Helper to resolve room name
  const getRoomName = (roomId: string) => {
    const matched = rooms.find(r => r.id === roomId || r.slug === roomId);
    return matched ? matched.name : (roomId || 'Room Reservation');
  };

  // Helper to format dates
  const formatDateRange = (checkIn: string, checkOut: string) => {
    try {
      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      return `${inDate.toLocaleDateString('en-US', options)} — ${outDate.toLocaleDateString('en-US', options)}`;
    } catch {
      return `${checkIn} to ${checkOut}`;
    }
  };

  return (
    <div className="section">
      <div className="container">
        {/* Page Header */}
        <div className="page-header text-left">
          <span className="eyebrow">Loyalty Club</span>
          <h1>My Account</h1>
          <p className="lede">
            Welcome back to Royal Mgwasi Hotel. View your direct bookings, update your profile, and manage your reviews.
          </p>
        </div>

        <div className="grid grid--2 mb-12 items-start gap-8">
          {/* Section 1: Profile & Identity */}
          <div className="space-y-6">
            <div className="form-panel">
              {/* Member Card Header */}
              <div className="flex items-center gap-4 pb-6 border-b border-[#E8DED0]">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName || 'Member'}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#DCD3C1] shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#1D5D4C] text-[#F4EFE6] flex items-center justify-center font-bold text-2xl shadow-sm">
                    {initial}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-serif font-bold text-[#2A2620]">
                      {fullName || 'Loyalty Member'}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1D5D4C]/10 text-[#1D5D4C] text-[11px] font-bold uppercase tracking-wider">
                      ★ Royal Member
                    </span>
                  </div>
                  <p className="text-sm text-[#6E6559] mt-0.5">{user.email}</p>
                  {memberProfile?.joined_at && (
                    <p className="text-xs text-[#8C6D3B] mt-1">
                      Member since {new Date(memberProfile.joined_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>

              {/* Editable Profile Form */}
              <form onSubmit={handleProfileSubmit} className="mt-6">
                <h4 className="text-base font-serif text-[#2A2620] mb-4">Edit Personal Information</h4>

                <div className="field">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    placeholder="e.g. John Mwasambili"
                    onChange={e => {
                      setProfileSuccess(null);
                      setProfileError(null);
                      setFullName(e.target.value);
                    }}
                  />
                </div>

                <div className="field">
                  <label>Phone / WhatsApp Number (optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    placeholder="+255 762 555 557"
                    onChange={e => {
                      setProfileSuccess(null);
                      setProfileError(null);
                      setPhone(e.target.value);
                    }}
                  />
                  <p className="text-xs text-[#6E6559] mt-1">
                    Used to pre-fill your reservation requests and WhatsApp communications.
                  </p>
                </div>

                <div className="field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={user.email || ''}
                    className="opacity-75 cursor-not-allowed bg-[#EAE4D8]"
                  />
                  <p className="text-xs text-[#6E6559] mt-1">
                    Your Google authentication email is managed by your provider.
                  </p>
                </div>

                {profileSuccess && (
                  <div className="form-success is-visible my-4">
                    {profileSuccess}
                  </div>
                )}

                {profileError && (
                  <div className="p-3 my-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                    {profileError}
                  </div>
                )}

                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="btn btn--primary btn--block disabled:opacity-70"
                  >
                    {isSavingProfile ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Changes...</span>
                      </span>
                    ) : (
                      'Save Profile Details'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Member Benefits Sidebar */}
            <div className="dark-card">
              <h3>Royal Member Privileges</h3>
              <ul className="mt-4 space-y-3 text-sm text-[#B9B2A5]">
                <li className="flex items-start gap-2">
                  <span className="text-[#1D5D4C] font-bold bg-[#E4EEE9] rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</span>
                  <span><strong>Exclusive Member Rates:</strong> Unlock private discount packages on luxury suites.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1D5D4C] font-bold bg-[#E4EEE9] rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</span>
                  <span><strong>Priority Check-In:</strong> Express front desk arrival and early check-in upon request.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1D5D4C] font-bold bg-[#E4EEE9] rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</span>
                  <span><strong>Complimentary Breakfast:</strong> Full hot breakfast included on all reservations.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2 & 3: Bookings & Reviews */}
          <div className="space-y-8">
            {/* Section 2: My Bookings */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-serif text-[#2A2620]">My Bookings</h3>
                  <p className="text-sm text-[#6E6559]">Reservations linked to your member account</p>
                </div>
                <Link
                  to="/book"
                  className="btn btn--primary text-xs py-2 px-4 shadow-sm"
                >
                  + New Booking
                </Link>
              </div>

              {loadingBookings ? (
                <div className="form-panel text-center py-10">
                  <div className="w-6 h-6 border-2 border-[#1D5D4C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-[#6E6559]">Loading your bookings...</p>
                </div>
              ) : bookings.length === 0 ? (
                /* Empty state matching app empty state language */
                <div className="note-card text-center py-10 px-6">
                  <div className="w-12 h-12 rounded-full bg-[#E8DED0] text-[#1D5D4C] flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <h4 className="text-base font-serif font-bold text-[#2A2620]">No bookings found</h4>
                  <p className="text-xs text-[#6E6559] max-w-sm mx-auto mt-1 mb-5">
                    You have not made any room reservations linked to your member account yet. Book directly with guaranteed best rates.
                  </p>
                  <Link
                    to="/book"
                    className="btn btn--primary text-xs py-2.5 px-6 inline-flex items-center gap-2"
                  >
                    <span>Book a Room</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => {
                    const statusCfg = STATUS_CONFIG[booking.status] || {
                      label: booking.status,
                      bg: 'bg-gray-100',
                      text: 'text-gray-800',
                      border: 'border-gray-300'
                    };

                    return (
                      <div key={booking.id} className="note-card hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[11px] font-bold text-[#8C6D3B] tracking-wider uppercase">
                              {booking.booking_code || 'Direct Reservation'}
                            </span>
                            <h4 className="text-lg font-serif font-bold text-[#2A2620] mt-0.5">
                              {getRoomName(booking.room_id)}
                            </h4>
                          </div>
                          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border} uppercase tracking-wider`}>
                            {statusCfg.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#DCD3C1]/60 text-xs">
                          <div>
                            <span className="text-[#6E6559] block font-medium">Dates:</span>
                            <span className="font-bold text-[#2A2620]">
                              {formatDateRange(booking.check_in, booking.check_out)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#6E6559] block font-medium">Guests:</span>
                            <span className="font-bold text-[#2A2620]">
                              {booking.guest_count_label || 'Standard occupancy'}
                            </span>
                          </div>
                        </div>

                        {booking.special_requests && (
                          <div className="mt-3 pt-2.5 border-t border-[#DCD3C1]/40 text-xs">
                            <span className="text-[#6E6559] font-medium">Requests: </span>
                            <span className="text-[#2A2620] italic">{booking.special_requests}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 3: My Reviews */}
            <div className="pt-4 border-t border-[#DCD3C1]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-serif text-[#2A2620]">My Reviews</h3>
                  <p className="text-sm text-[#6E6559]">Feedback and ratings you have shared</p>
                </div>
                <Link
                  to="/reviews"
                  className="text-xs font-bold text-[#1D5D4C] hover:underline"
                >
                  Write a Review &rarr;
                </Link>
              </div>

              {loadingReviews ? (
                <div className="form-panel text-center py-8">
                  <div className="w-5 h-5 border-2 border-[#1D5D4C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-[#6E6559]">Loading your reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="note-card text-center py-8 px-6">
                  <div className="w-10 h-10 rounded-full bg-[#E8DED0] text-[#1D5D4C] flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-serif font-bold text-[#2A2620]">No reviews submitted yet</h4>
                  <p className="text-xs text-[#6E6559] max-w-sm mx-auto mt-1 mb-4">
                    Have you stayed with us in Forest Mpya? Share your genuine feedback to assist fellow travelers.
                  </p>
                  <Link
                    to="/reviews"
                    className="btn btn--primary text-xs py-2 px-5 inline-flex items-center gap-1.5"
                  >
                    Share Your Experience
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="note-card">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1 text-[#8C6D3B]">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="text-sm">
                              {i < rev.rating ? '★' : '☆'}
                            </span>
                          ))}
                          <span className="text-xs font-bold text-[#2A2620] ml-1.5">
                            {rev.rating}/5
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                            rev.is_published
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {rev.is_published ? 'Published' : 'Pending review'}
                        </span>
                      </div>

                      <p className="mt-3 text-xs sm:text-sm text-[#2A2620] leading-relaxed italic">
                        "{rev.comment}"
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-[#6E6559] mt-3 pt-2.5 border-t border-[#DCD3C1]/50">
                        <span>{rev.trip_type || 'Verified Stay'}</span>
                        <span>{new Date(rev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
