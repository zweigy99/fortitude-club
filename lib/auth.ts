import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Profile = {
  id: string;
  full_name: string;
  work_email: string;
  employer_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  role: 'member' | 'admin' | 'employer' | 'partner';
  partner_id?: string | null;
  member_number: number;
  created_at: string;
  reviewed_at: string | null;
  employers?: { name: string } | null;
};

export async function getSession() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null as Profile | null };
  const load = () => supabase.from('profiles').select('*, employers(name)').eq('id', user.id).maybeSingle();
  let { data: profile } = await load();
  if (!profile) {
    // Self-repair: recreate a missing membership record for this login
    await supabase.rpc('ensure_my_profile');
    ({ data: profile } = await load());
  }
  return { supabase, user, profile: (profile as Profile) ?? null };
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session.user) redirect('/login?next=/admin');
  if (session.profile?.role !== 'admin') redirect('/card');
  return session;
}

export function memberId(n: number | null | undefined) {
  return 'FC-' + String(n ?? 0).padStart(6, '0');
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export function safeNext(next: string | null | undefined, fallback = '/card') {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback;
  return next;
}

export async function getSetting(key: string) {
  const supabase = createClient();
  const { data } = await supabase.from('site_settings').select('value').eq('key', key).maybeSingle();
  return (data?.value ?? '').trim();
}
