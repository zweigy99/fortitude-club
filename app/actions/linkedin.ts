'use server';

import { redirect } from 'next/navigation';
import { requireAdmin, siteUrl } from '@/lib/auth';
import { torontoToUtc } from '@/lib/time';

const MODEL = process.env.ANTHROPIC_POSTS_MODEL || 'claude-sonnet-5-5';

function nextDates(start: string, weekdays: number[], count: number) {
  const out: string[] = [];
  const d = new Date(`${start}T12:00:00Z`);
  for (let i = 0; out.length < count && i < 120; i++) {
    if (weekdays.includes(d.getUTCDay())) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

export async function generatePosts(formData: FormData) {
  const { supabase } = await requireAdmin();
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) redirect('/admin/linkedin?error=' + encodeURIComponent('ANTHROPIC_API_KEY is not set in Vercel.'));
  const count = Math.min(12, Math.max(1, Number(formData.get('count') || 6)));
  const start = String(formData.get('start') || new Date().toISOString().slice(0, 10));
  const time = String(formData.get('time') || '09:00');
  const weekdays = formData.getAll('days').map(Number).filter((n) => n >= 0 && n <= 6);
  const focus = String(formData.get('focus') || '').trim();
  const days = weekdays.length ? weekdays : [2, 4];

  const [{ data: partners }, { count: members }, { count: employers }, { data: recent }] = await Promise.all([
    supabase.from('partners').select('id, name, slug, category, neighbourhood, description, offers(title, kind, active)').eq('active', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('employers').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('linkedin_posts').select('headline').order('created_at', { ascending: false }).limit(20),
  ]);
  const partnerText = ((partners ?? []) as any[])
    .map((p) => `- ${p.name} [slug: ${p.slug}] (${p.category}, ${p.neighbourhood}): ${p.description ?? ''} Offers: ${(p.offers ?? []).filter((o: any) => o.active).map((o: any) => `${o.kind}: ${o.title}`).join('; ') || 'none yet'}`)
    .join('\n');

  const prompt = `Write ${count} LinkedIn posts for the Fortitude Club company page.

About Fortitude Club: a Toronto workplace wellness membership. Employers give employees free membership; members get exclusive offers at premium local wellness partners (studios, gyms, recovery, sauna). Website: ${siteUrl()}. Launched November 2026. ${employers ?? 0} employer(s), ${members ?? 0} members so far (only mention numbers if impressive; otherwise don't).

Partners:
${partnerText}

Audience: HR and People leaders, founders and managers at Toronto companies (50 to 500 staff), plus local wellness studios we might partner with.

Mix of posts: partner spotlights (one partner each), new or notable offers, why local wellness perks beat traditional gym benefits for retention and engagement, practical wellness ideas for teams, and a call for employers to book a call.
${focus ? `Extra focus requested by the team: ${focus}` : ''}
Avoid repeating these recent headlines: ${((recent ?? []) as any[]).map((r) => r.headline).filter(Boolean).join(' | ') || 'none'}

Rules:
- English only. Warm, confident, professional; no hype, no clich\u00e9s like "game-changer".
- Each post 60 to 160 words, short paragraphs, at most 2 emojis, end with 3 to 5 relevant hashtags.
- Never include promo codes. Point people to ${siteUrl()} or to "book a call" at ${siteUrl()}/employers.
- Only state facts given above; don't invent partners, prices, statistics or quotes.
- "headline" is a short punchy line (max 55 characters) for the post's image card.
- "partner_slug" is the slug of the partner the post is about, or null.

Reply with only a JSON array, no other text: [{"headline": "...", "body": "...", "partner_slug": "slug-or-null"}]`;

  let posts: any[] = [];
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key!, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }),
    });
    const j: any = await res.json();
    if (!res.ok) throw new Error(j?.error?.message ?? `AI error ${res.status}`);
    const text = (j.content ?? []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('');
    const clean = text.replace(/```json|```/g, '').trim();
    posts = JSON.parse(clean.slice(clean.indexOf('['), clean.lastIndexOf(']') + 1));
  } catch (e: any) {
    redirect('/admin/linkedin?error=' + encodeURIComponent('Could not write posts: ' + (e?.message ?? 'unknown error')));
  }

  const dates = nextDates(start, days, posts.length);
  const bySlug = Object.fromEntries(((partners ?? []) as any[]).map((p) => [p.slug, p.id]));
  const rows = posts.slice(0, dates.length).map((p, i) => ({
    headline: String(p.headline ?? '').slice(0, 80),
    body: String(p.body ?? '').trim(),
    partner_id: p.partner_slug && bySlug[p.partner_slug] ? bySlug[p.partner_slug] : null,
    scheduled_for: torontoToUtc(dates[i], time),
    status: 'draft',
  })).filter((r) => r.body);
  if (rows.length) await supabase.from('linkedin_posts').insert(rows);
  redirect(`/admin/linkedin?generated=${rows.length}`);
}

export async function savePost(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id'));
  const when = String(formData.get('when') || '');
  const intent = String(formData.get('intent') || 'save');
  const patch: Record<string, unknown> = {
    headline: String(formData.get('headline') || '').trim() || null,
    body: String(formData.get('body') || '').trim(),
  };
  if (when) patch.scheduled_for = torontoToUtc(when.slice(0, 10), when.slice(11, 16));
  if (intent === 'approve') patch.status = 'approved';
  if (intent === 'unapprove') patch.status = 'draft';
  if (intent === 'skip') patch.status = 'skipped';
  if (intent === 'now') {
    patch.status = 'approved';
    patch.scheduled_for = new Date().toISOString();
  }
  await supabase.from('linkedin_posts').update(patch).eq('id', id).neq('status', 'sent');
  redirect('/admin/linkedin?saved=1#post-' + id);
}

export async function approveAll() {
  const { supabase } = await requireAdmin();
  await supabase.from('linkedin_posts').update({ status: 'approved' }).eq('status', 'draft');
  redirect('/admin/linkedin?saved=1');
}

export async function deletePost(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from('linkedin_posts').update({ status: 'skipped' }).eq('id', String(formData.get('id'))).neq('status', 'sent');
  redirect('/admin/linkedin?saved=1');
}

export async function createConnectionKey() {
  const { supabase } = await requireAdmin();
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const k = 'fc_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const { error } = await supabase.rpc('set_linkedin_key', { p_key: k });
  if (error) redirect('/admin/linkedin?error=' + encodeURIComponent(error.message));
  redirect('/admin/linkedin?keyset=1#automation');
}
