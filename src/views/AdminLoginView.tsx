import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Lock, Mail, Eye, EyeOff, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

interface AdminLoginViewProps {
  navigate: (path: string) => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ navigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if already signed in with a valid profiles row
  useEffect(() => {
    let isMounted = true;
    const checkExistingSession = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (user) {
          // Check if user has a profile with staff/admin role
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          if (!error && profile) {
            if (isMounted) {
              navigate('/admin');
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Session check error:', err);
      } finally {
        if (isMounted) setCheckingSession(false);
      }
    };

    checkExistingSession();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please provide both email address and password');
      return;
    }

    setLoading(true);
    try {
      // 1. Sign in with email/password via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Invalid email or password');
      }

      const user = authData.user;

      // 2. CRITICAL ACCESS CONTROL GATE:
      // Query profiles table. Only accounts with a matching profiles row have admin dashboard access.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError || !profile) {
        // Sign back out immediately to revoke session
        await supabase.auth.signOut();
        throw new Error('This account does not have admin access.');
      }

      // 3. User verified as hotel staff/admin - proceed to dashboard
      navigate('/admin');
    } catch (err: any) {
      console.error('Admin login failed:', err);
      setErrorMessage(err?.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#1D5D4C] mx-auto" />
          <p className="text-sm font-medium text-[#6E6559]">Verifying management credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4EFE6] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Bar Back to Site */}
      <div className="max-w-md w-full mx-auto">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6E6559] hover:text-[#1D5D4C] transition-colors py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Hotel Website</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl p-8 border border-[#DCD3C1] shadow-lg my-auto">
        {/* Crest & Title */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-[#1D5D4C]/10 text-[#1D5D4C] flex items-center justify-center mx-auto mb-3 border border-[#1D5D4C]/20">
            <Shield className="w-7 h-7" />
          </div>
          <span className="text-xs uppercase tracking-widest font-bold text-[#8C6D3B]">
            Royal Mgwasi Hotel
          </span>
          <h1 className="text-2xl font-serif font-bold text-[#2A2620] mt-1">
            Staff &amp; Management Portal
          </h1>
          <p className="text-xs text-[#6E6559] mt-1.5">
            Authorized personnel login for reservations, guest inquiries, and content administration.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1.5">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6E6559] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                placeholder="admin@royalmgwasi.co.tz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#FBF9F5] border border-[#DCD3C1] rounded-lg text-sm text-[#2A2620] focus:outline-none focus:border-[#1D5D4C] focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6559] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6E6559] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-[#FBF9F5] border border-[#DCD3C1] rounded-lg text-sm text-[#2A2620] focus:outline-none focus:border-[#1D5D4C] focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6E6559] hover:text-[#2A2620] p-0.5"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-[#1D5D4C] hover:bg-[#154639] text-white font-semibold rounded-lg text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying Access...</span>
              </>
            ) : (
              <span>Sign In to Dashboard</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#EFE8D9] text-center">
          <p className="text-[11px] text-[#6E6559]">
            Access restricted to verified Royal Mgwasi Hotel administrative personnel.
          </p>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-xs text-[#6E6559] opacity-75">
        &copy; {new Date().getFullYear()} Royal Mgwasi Hotel &middot; Forest Mpya, Mbeya, Tanzania
      </div>
    </div>
  );
};
