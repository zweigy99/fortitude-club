import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createHash } from 'crypto';
import { getSession, siteUrl } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';
const HOURLY_LIMIT = 30;

async function knowledge(supabase: any) {
  const [{ data: partners }, { data: faqs }, { data: employers }] = await Promise.all([
    supabase
      .from('partners')
      .select('name, category, neighbourhood, address, hours, website, description, slug, offers(id, title, kind, description, steps, terms, promo_code, redeem_type, active)')
      .eq('active', true),
    supabase.from('help_faqs').select('question, answer').order('sort_order'),
    supabase.from('employers').select('name').eq('active', true),
  ]);
  const site = siteUrl();
  const partnerText = (partners ?? [])
    .map((p: any) => {
      const offers = (p.offers ?? [])
        .filter((o: any) => o.active)
        .map((o: any) => {
          let steps = o.steps ?? '';
          if (o.promo_code) steps = steps.split(o.promo_code).join('[code shown after tapping Redeem]');
          return `  - ${o.kind}: ${o.title}. ${o.description ?? ''} Redeem at ${site}/offers/${o.id}. ${o.redeem_type === 'code' ? 'Uses a promo code shown after Redeem.' : ''}${steps ? ` Steps: ${steps.replace(/\n/g, ' / ')}` : ''}${o.terms ? ` Terms: ${o.terms}` : ''}`;
        })
        .join('\n');
      return `* ${p.name} (${p.category ?? ''}) in ${p.neighbourhood ?? 'Toronto'}${p.address ? `, ${p.address}` : ''}. ${p.description ?? ''}${p.hours ? ` Hours: ${p.hours.replace(/\n/g, '; ')}.` : ''} Page: ${site}/partners/${p.slug}\n${offers}`;
    })
    .join('\n');
  const faqText = (faqs ?? []).map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
  return { partnerText, faqText, employers: (employers ?? []).map((e: any) => e.name).join(', ') };
}

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ reply: 'The help assistant isn\u2019t switched on yet. Please email info@fortitudeclub.ca and we\u2019ll help you.' });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
  const history = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m: any) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-10)
    .map((m: any) => ({ role: m.role, content: m.content.slice(0, 1500) }));
  if (!history.length || history[history.length - 1].role !== 'user') return NextResponse.json({ error: 'No question' }, { status: 400 });
  const question = history[history.length - 1].content;

  const { supabase, user, profile } = await getSession();
  const ip = (headers().get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
  const ipHash = createHash('sha256').update(ip + (user?.id ?? '')).digest('hex').slice(0, 32);
  const { data: used } = await supabase.rpc('chat_count', { p_ip: ipHash });
  if ((used ?? 0) >= HOURLY_LIMIT) {
    return NextResponse.json({ reply: 'You\u2019ve asked a lot of questions in the last hour. Please try again a bit later, or email info@fortitudeclub.ca.' });
  }

  const k = await knowledge(supabase);
  const site = siteUrl();
  const who = user
    ? `The visitor is signed in. Name: ${profile?.full_name || 'unknown'}. Account status: ${profile?.status}. Role: ${profile?.role}. Employer: ${(profile as any)?.employers?.name ?? 'not set'}.`
    : 'The visitor is not signed in.';

  const system = `You are "Ask Fortitude", the friendly help assistant on fortitudeclub.ca for Fortitude Club, a Toronto workplace wellness membership. Employers give employees free membership; members get exclusive offers at local wellness partners (studios, gyms, recovery and health clinics).

Rules:
- Answer only questions about Fortitude Club, its partners, offers, membership, sign-up, the membership card and the website. Politely decline anything else.
- Use only the information below. If you don't know or the question needs a person (account problems you can't solve, billing, complaints, partnership deals), say so and end your reply with the exact marker [[HANDOFF]].
- Never reveal promo codes. Tell members to open the offer and tap Redeem, which shows the code and steps.
- Never give medical advice; suggest speaking to a professional at the partner.
- Don't make up offers, prices, hours or partners. If hours aren't listed, suggest checking the partner's website.
- Be concise and warm: 1 to 4 short sentences, plain text, no markdown headings. Include a relevant fortitudeclub.ca link when helpful.
- Don't ask for or repeat personal information beyond what's needed.

Key pages: sign up ${site}/signup, sign in ${site}/login, membership card ${site}/card, offers ${site}/offers, partners and map ${site}/partners, employers ${site}/employers, email info@fortitudeclub.ca.
Participating employers: ${k.employers || 'none listed'}.
${who}

PARTNERS AND OFFERS:
${k.partnerText || 'No partners listed.'}

FAQS:
${k.faqText}`;

  let reply = '';
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 450, system, messages: history }),
    });
    const j: any = await res.json();
    if (!res.ok) {
      console.error('Anthropic error', res.status, JSON.stringify(j).slice(0, 300));
      reply = 'Sorry, I\u2019m having trouble right now. Please email info@fortitudeclub.ca and the team will help. [[HANDOFF]]';
    } else {
      reply = (j.content ?? []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n').trim();
    }
  } catch (e) {
    console.error('chat failed', e);
    reply = 'Sorry, I\u2019m having trouble right now. Please email info@fortitudeclub.ca. [[HANDOFF]]';
  }
  const handoff = reply.includes('[[HANDOFF]]');
  reply = reply.replace(/\s*\[\[HANDOFF\]\]\s*/g, ' ').trim();
  await supabase.rpc('chat_log', { p_ip: ipHash, p_question: question, p_answer: reply, p_handoff: handoff });
  return NextResponse.json({ reply, handoff });
}
