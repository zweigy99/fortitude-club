import { NextResponse } from 'next/server';
import { getSession, memberId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const esc = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(request: Request) {
  const { supabase, profile } = await getSession();
  if (profile?.role !== 'admin') return NextResponse.redirect(new URL('/login', request.url));

  const rows: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase
      .from('redemptions')
      .select('created_at, offers(title, partners(name)), employers(name), profiles(full_name, work_email, member_number)')
      .order('created_at', { ascending: false })
      .range(from, from + 999);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }

  const header = ['date', 'member_id', 'member_name', 'work_email', 'employer', 'partner', 'offer'];
  const lines = rows.map((r) =>
    [
      new Date(r.created_at).toISOString(),
      memberId(r.profiles?.member_number),
      r.profiles?.full_name,
      r.profiles?.work_email,
      r.employers?.name,
      r.offers?.partners?.name,
      r.offers?.title,
    ].map(esc).join(',')
  );
  return new NextResponse([header.join(','), ...lines].join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="fortitude-redemptions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
