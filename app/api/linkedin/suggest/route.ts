import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { siteUrl } from '@/lib/auth';
import { torontoToUtc } from '@/lib/time';
import { sendSimple } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_POSTS_MODEL || 'claude-sonnet-5-5';
const TOPICS = [
  'a partner spotlight on one partner (pick one that has not been featured recently)',
  'a notable member offer from one partner, without any promo code',
  'why local wellness perks beat a traditional gym benefit for retention and engagement',
  'a practical wellness idea HR leaders can use with their team this week',
  'an invitation for Toronto employers to book a call and bring Fortitude to their team',
  'a short story-style post about what a Fortitude member week could look like across partners',
];

/** Runs once a day (Vercel cron): writes one LinkedIn draft for the next free weekday and emails the team. */
export async function GET(req: Request) {
  const fromCron = (req.headers.get('user-agent') || '').toLowerCase().includes('vercel-cron');
  const secret = process.env.CRON_SECRET;
  const authed = secret ? req.headers.get('authorization') === `Bearer ${secret}` : fromCron;
  if (!authed) return NextResponse.json({ error: 'Not allowed' }, { status: 401 });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: 'ANTHROPIC_API_KEY missing' }, { status: 500 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data: prep, error: prepErr } = await supabase.rpc('linkedin_daily_prep');
  if (prepErr) return NextResponse.json({ error: prepErr.message }, { status: 500 });
  const p: any = prep;
  if (p?.skip) return NextResponse.json({ ok: true, skipped: 'already suggested today' });

  const { data: partners } = await supabase
    .from('partners')
    .select('name, slug, category, neighbourhood, description, offers(title, kind, active)')
    .eq('active', true);
  const site = siteUrl();
  const partnerText = ((partners ?? []) as any[])
    .map((x) => `- ${x.name} [slug: ${x.slug}] (${x.category}, ${x.neighbourhood}): ${x.description ?? ''} Offers: ${(x.offers ?? []).filter((o: any) => o.active).map((o: any) => `${o.kind}: ${o.title}`).join('; ') || 'none yet'}`)
    .join('\n');
  const topic = TOPICS[new Date().getUTCDate() % TOPICS.length];

  const prompt = `Write ONE LinkedIn post for the Fortitude Club company page.

About Fortitude Club: a Toronto workplace wellness membership. Employers give employees free membership; members get exclusive offers at premium local wellness partners (studios, gyms, recovery, sauna). Website: ${site}.

Partners:
${partnerText}

Audience: HR and People leaders, founders and managers at Toronto companies (50 to 500 staff).
Today's angle: ${topic}.
Do not repeat or closely resemble these recent headlines: ${((p?.recent ?? []) as string[]).join(' | ') || 'none'}

Rules:
- English only. Warm, confident, professional; no hype or clich\u00e9s.
- 60 to 160 words, short paragraphs, at most 2 emojis, end with 3 to 5 relevant hashtags.
- Never include promo codes. Point people to ${site} or to book a call at ${site}/employers.
- Only state facts given above; don't invent partners, prices, statistics or quotes.

Reply with only JSON, no other text: {"headline": "max 55 characters for the image card", "body": "...", "partner_slug": "slug or null"}`;

  let post: any;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 1200, messages: [{ role: 'user', content: prompt }] }),
    });
    const j: any = await res.json();
    if (!res.ok) throw new Error(j?.error?.message ?? `AI error ${res.status}`);
    const text = (j.content ?? []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('').replace(/```json|```/g, '').trim();
    post = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  } catch (e: any) {
    return NextResponse.json({ error: 'Could not write post: ' + (e?.message ?? 'unknown') }, { status: 500 });
  }
  if (!post?.body) return NextResponse.json({ error: 'Empty post' }, { status: 500 });

  const when = torontoToUtc(p.date, '09:00');
  const { data: id, error } = await supabase.rpc('linkedin_add_daily', {
    p_headline: String(post.headline ?? ''),
    p_body: String(post.body).trim(),
    p_partner_slug: post.partner_slug && post.partner_slug !== 'null' ? String(post.partner_slug) : null,
    p_when: when,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!id) return NextResponse.json({ ok: true, skipped: 'already suggested today' });

  const day = new Date(when).toLocaleString('en-CA', { timeZone: 'America/Toronto', weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  await sendSimple(
    'info@fortitudeclub.ca',
    `New LinkedIn post ready to review: ${post.headline ?? ''}`,
    'Today\u2019s suggested LinkedIn post',
    [`Scheduled for ${day} (only if you approve it).`, String(post.body).trim()],
    { label: 'Review and approve', url: `${site}/admin/linkedin#post-${id}` }
  ).catch(() => null);

  return NextResponse.json({ ok: true, id, date: p.date });
}
