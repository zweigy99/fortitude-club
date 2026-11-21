import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { siteUrl } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

/** LinkedIn's API uses "little text format": escape its reserved characters, keep hashtags clickable. */
function toLittleText(s: string) {
  const escaped = s.replace(/[\\|{}@\[\]()<>#*_~]/g, (m) => '\\' + m);
  return escaped.replace(/\\#([A-Za-z][A-Za-z0-9]*)/g, (_m, tag) => `{hashtag|\\#|${tag}}`);
}

/**
 * Make calls this on a schedule with header "x-fortitude-key".
 * Returns the next approved LinkedIn post that is due (and marks it sent), or { post: null }.
 */
export async function GET(req: Request) {
  const key = req.headers.get('x-fortitude-key') || new URL(req.url).searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 401 });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false }, global: { fetch: (u: any, o: any) => fetch(u, { ...o, cache: 'no-store' }) } });
  const { data, error } = await supabase.rpc('linkedin_take_due', { p_key: key });
  if (error) return NextResponse.json({ error: error.message.includes('Invalid key') ? 'Invalid key' : 'Could not load posts' }, { status: error.message.includes('Invalid key') ? 401 : 500 });
  const row = (data as any[])?.[0];
  if (!row) return NextResponse.json({ has_post: false, post: null });
  return NextResponse.json({
    has_post: true,
    post: {
      id: row.id,
      text: row.body,
      text_linkedin: toLittleText(row.body),
      image_url: `${siteUrl()}/api/linkedin/image/${row.id}?v=${Date.now()}`,
      link: siteUrl(),
    },
  });
}
