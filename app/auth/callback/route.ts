import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeNext, memberId } from '@/lib/auth';
import { sendApprovedEmail } from '@/lib/email';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Members auto-approved on confirmation get their "you're approved" email once
      try {
        const { data: claim } = await supabase.rpc('claim_approval_email');
        if (claim === true) {
          const { data: { user } } = await supabase.auth.getUser();
          const { data: p } = await supabase
            .from('profiles')
            .select('work_email, full_name, member_number, employers(name)')
            .eq('id', user!.id)
            .maybeSingle();
          if (p) await sendApprovedEmail({ email: p.work_email, name: p.full_name, employer: (p as any).employers?.name ?? null, memberId: memberId(p.member_number) });
        }
      } catch (e) {
        console.error('approval email step failed', e);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  const msg = 'That link has expired or was opened on a different device. Sign in, or request a new link.';
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(msg)}`);
}
