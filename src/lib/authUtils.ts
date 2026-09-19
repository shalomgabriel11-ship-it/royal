import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';

export interface AdminCheckResult {
  isAdmin: boolean;
  role: string;
  profile: {
    id: string;
    role: string;
    full_name?: string;
  } | null;
}

const ADMIN_ROLES = ['admin', 'superadmin', 'manager', 'owner', 'staff'];

/**
 * Checks whether a Supabase user has registered administrator/staff privileges.
 * Checks multiple sources:
 * 1. Supabase `profiles` table (the primary administrative role table)
 * 2. Supabase Auth user_metadata and app_metadata (role, roles, is_admin)
 * 3. Registered administrator email addresses (e.g. shalomgabriel11@gmail.com)
 * 4. Supabase `members` table (if role column exists)
 * 
 * If a user is verified as admin via metadata or email but lacks a `profiles` row,
 * it automatically self-heals / upserts their row in `profiles` table so that
 * all Supabase SQL RLS policies using `is_admin()` work seamlessly.
 */
export async function checkUserIsAdmin(user: User | null | undefined): Promise<AdminCheckResult> {
  if (!user || !isSupabaseConfigured) {
    return { isAdmin: false, role: '', profile: null };
  }

  const userId = user.id;
  const userEmail = (user.email || '').toLowerCase().trim();

  // 1. Check profiles table first
  try {
    const { data: profileRow, error: profileErr } = await supabase
      .from('profiles')
      .select('id, role, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (!profileErr && profileRow) {
      const roleStr = (profileRow.role || 'staff').toLowerCase().trim();
      // If role is any staff/admin role or non-customer
      if (roleStr !== 'customer' && roleStr !== 'member') {
        return {
          isAdmin: true,
          role: profileRow.role || 'staff',
          profile: profileRow
        };
      }
    }
  } catch (err) {
    console.warn('Notice checking admin profiles table:', err);
  }

  // 2. Check Auth Metadata (app_metadata and user_metadata)
  const appRole = String(user.app_metadata?.role || '').toLowerCase().trim();
  const appRoles = Array.isArray(user.app_metadata?.roles) 
    ? user.app_metadata.roles.map((r: any) => String(r).toLowerCase().trim()) 
    : [];
  const userRole = String(user.user_metadata?.role || '').toLowerCase().trim();
  const isMetaAdminFlag = Boolean(
    user.user_metadata?.is_admin ||
    user.app_metadata?.is_admin ||
    user.app_metadata?.claims_admin
  );

  const hasAdminRoleInMetadata = 
    ADMIN_ROLES.includes(appRole) ||
    ADMIN_ROLES.includes(userRole) ||
    appRoles.some(r => ADMIN_ROLES.includes(r)) ||
    isMetaAdminFlag;

  // 3. Check registered admin email addresses
  const isRegisteredAdminEmail = 
    userEmail === 'shalomgabriel11@gmail.com' ||
    userEmail.endsWith('@royalmgwasi.com');

  if (hasAdminRoleInMetadata || isRegisteredAdminEmail) {
    const resolvedRole = appRole || userRole || (isRegisteredAdminEmail ? 'admin' : 'staff');
    const fullName = 
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split('@')[0] ||
      'Hotel Administrator';

    // Auto-sync / upsert to profiles table so Supabase RLS is_admin() passes
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        full_name: fullName,
        role: resolvedRole
      }, { onConflict: 'id' });
    } catch (upsertErr) {
      console.warn('Notice syncing admin profile row:', upsertErr);
    }

    return {
      isAdmin: true,
      role: resolvedRole,
      profile: {
        id: userId,
        role: resolvedRole,
        full_name: fullName
      }
    };
  }

  // 4. Check members table in case role was registered there
  try {
    const { data: memberRow, error: memberErr } = await supabase
      .from('members')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (!memberErr && memberRow && memberRow.role) {
      const memberRole = String(memberRow.role).toLowerCase().trim();
      if (ADMIN_ROLES.includes(memberRole)) {
        const fullName = 
          (user.user_metadata?.full_name as string) ||
          user.email?.split('@')[0] ||
          'Hotel Administrator';

        try {
          await supabase.from('profiles').upsert({
            id: userId,
            full_name: fullName,
            role: memberRole
          }, { onConflict: 'id' });
        } catch (e) {}

        return {
          isAdmin: true,
          role: memberRole,
          profile: {
            id: userId,
            role: memberRole,
            full_name: fullName
          }
        };
      }
    }
  } catch (e) {}

  return { isAdmin: false, role: '', profile: null };
}
