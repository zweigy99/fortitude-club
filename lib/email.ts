import { siteUrl } from '@/lib/auth';

const FROM = 'Fortitude Club <noreply@fortitudeclub.ca>';
const REPLY_TO = 'info@fortitudeclub.ca';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

function layout(bodyHtml: string) {
  return `<!doctype html><html><body style="margin:0;background:#f8f6f1;font-family:Helvetica,Arial,sans-serif;color:#141414">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6f1"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e1ddd3">
<tr><td style="padding:28px 32px 8px;font-size:12px;letter-spacing:4px;text-transform:uppercase">Fortitude Club</td></tr>
<tr><td style="padding:8px 32px 32px;font-size:16px;line-height:1.6">${bodyHtml}</td></tr>
</table>
<p style="font-size:12px;color:#5c5a55;margin:16px 0 0">Fortitude Club · <a href="mailto:${REPLY_TO}" style="color:#5c5a55">${REPLY_TO}</a></p>
</td></tr></table></body></html>`;
}

async function send(to: string, subject: string, html: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('RESEND_API_KEY is not set; skipped email to', to);
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], reply_to: REPLY_TO, subject, html, text }),
    });
    if (!res.ok) console.error('Resend error', res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error('Email send failed', e);
    return false;
  }
}

export async function sendApprovedEmail(p: { email: string; name?: string | null; employer?: string | null; memberId: string }) {
  const first = (p.name || '').trim().split(' ')[0] || 'there';
  const card = `${siteUrl()}/card`;
  const offers = `${siteUrl()}/offers`;
  const html = layout(`
<h1 style="font-size:28px;font-weight:300;margin:0 0 16px">You're in, ${esc(first)}.</h1>
<p style="margin:0 0 16px">Your Fortitude Club membership${p.employer ? ` through <strong>${esc(p.employer)}</strong>` : ''} is now active.</p>
<p style="margin:0 0 24px">Member ID: <strong>${esc(p.memberId)}</strong></p>
<p style="margin:0 0 24px"><a href="${card}" style="display:inline-block;background:#141414;color:#f8f6f1;text-decoration:none;padding:14px 22px;font-size:15px">Open my membership card</a></p>
<p style="margin:0 0 8px">Browse partner offers and tap <strong>Redeem</strong> to see codes and booking steps: <a href="${offers}" style="color:#12776b">${offers}</a></p>
<p style="margin:0;color:#5c5a55;font-size:14px">Tip: add fortitudeclub.ca to your phone's home screen so your card is always one tap away.</p>`);
  const text = `You're in, ${first}.\n\nYour Fortitude Club membership${p.employer ? ` through ${p.employer}` : ''} is now active.\nMember ID: ${p.memberId}\n\nOpen your card: ${card}\nBrowse offers: ${offers}\n`;
  return send(p.email, "You're in: your Fortitude Club membership is active", html, text);
}

export async function sendRejectedEmail(p: { email: string; name?: string | null }) {
  const first = (p.name || '').trim().split(' ')[0] || 'there';
  const html = layout(`
<h1 style="font-size:28px;font-weight:300;margin:0 0 16px">Hi ${esc(first)},</h1>
<p style="margin:0 0 16px">We weren't able to verify your Fortitude Club membership with your employer, so your account isn't active right now.</p>
<p style="margin:0">If you think this is a mistake, reply to this email or write to <a href="mailto:${REPLY_TO}" style="color:#12776b">${REPLY_TO}</a> from your work email and we'll sort it out.</p>`);
  const text = `Hi ${first},\n\nWe weren't able to verify your Fortitude Club membership with your employer, so your account isn't active right now.\n\nIf you think this is a mistake, reply to this email or write to ${REPLY_TO} from your work email.\n`;
  return send(p.email, 'About your Fortitude Club sign-up', html, text);
}

type Msg = { to: string; subject: string; html: string; text: string };

/** Sends many emails via Resend's batch API (100 per request). Returns how many were accepted. */
export async function sendBatch(messages: Msg[]) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return 0;
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100).map((m) => ({ from: FROM, reply_to: REPLY_TO, to: [m.to], subject: m.subject, html: m.html, text: m.text }));
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(chunk),
    });
    if (res.ok) sent += chunk.length;
    else console.error('Resend batch error', res.status, await res.text());
  }
  return sent;
}

export function announcementMessage(p: { to: string; name?: string | null; subject: string; body: string; newOffers: { title: string; partner: string; url: string }[] }): Msg {
  const first = (p.name || '').trim().split(' ')[0] || 'there';
  const paras = p.body.split(/\n{2,}/).map((t) => `<p style="margin:0 0 16px">${esc(t).replace(/\n/g, '<br>')}</p>`).join('');
  const offersHtml = p.newOffers.length
    ? `<p style="margin:8px 0 8px;font-weight:bold">New on Fortitude Club</p><ul style="margin:0 0 16px;padding-left:18px">${p.newOffers
        .map((o) => `<li style="margin:0 0 6px"><a href="${o.url}" style="color:#12776b">${esc(o.title)}</a> at ${esc(o.partner)}</li>`)
        .join('')}</ul>`
    : '';
  const html = layout(`<p style="margin:0 0 16px">Hi ${esc(first)},</p>${paras}${offersHtml}
<p style="margin:0"><a href="${siteUrl()}/card" style="display:inline-block;background:#141414;color:#f8f6f1;text-decoration:none;padding:12px 20px;font-size:15px">Open my membership</a></p>`);
  const text = `Hi ${first},\n\n${p.body}\n\n${p.newOffers.map((o) => `- ${o.title} at ${o.partner}: ${o.url}`).join('\n')}\n\nOpen your membership: ${siteUrl()}/card\n`;
  return { to: p.to, subject: p.subject, html, text };
}

export function partnerReportMessage(p: { to: string; partner: string; period: string; total: number; members: number; byOffer: { title: string; n: number }[] }): Msg {
  const rows = p.byOffer.map((o) => `<tr><td style="padding:6px 0;border-bottom:1px solid #e1ddd3">${esc(o.title)}</td><td style="padding:6px 0;border-bottom:1px solid #e1ddd3;text-align:right"><strong>${o.n}</strong></td></tr>`).join('');
  const html = layout(`<h1 style="font-size:24px;font-weight:300;margin:0 0 12px">Your Fortitude Club report</h1>
<p style="margin:0 0 16px">${esc(p.partner)} · ${esc(p.period)}</p>
<p style="margin:0 0 16px;font-size:20px"><strong>${p.total}</strong> redemptions by <strong>${p.members}</strong> members</p>
${rows ? `<table role="presentation" width="100%" style="border-collapse:collapse;font-size:15px;margin:0 0 16px">${rows}</table>` : ''}
<p style="margin:0;color:#5c5a55;font-size:14px">Questions or ideas for a new member offer? Just reply to this email.</p>`);
  const text = `Your Fortitude Club report\n${p.partner} · ${p.period}\n\n${p.total} redemptions by ${p.members} members\n${p.byOffer.map((o) => `${o.title}: ${o.n}`).join('\n')}\n`;
  return { to: p.to, subject: `Fortitude Club report: ${p.partner}, ${p.period}`, html, text };
}

/** Outreach email to a prospective partner, with the business address and unsubscribe link Canada's anti-spam law expects. */
export async function sendOutreach(p: { fromName: string; fromEmail: string; replyTo: string; to: string; subject: string; body: string; address: string; unsubscribeUrl: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: 'RESEND_API_KEY is not set in Vercel.' };
  const paras = p.body.split(/\n{2,}/).map((t) => `<p style="margin:0 0 14px">${esc(t).replace(/\n/g, '<br>')}</p>`).join('');
  const html = `<!doctype html><html><body style="margin:0;padding:24px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#141414">${paras}
<p style="margin:28px 0 0;font-size:12px;color:#8a877f">${esc(p.address)} · <a href="${p.unsubscribeUrl}" style="color:#8a877f">Unsubscribe</a> from Fortitude Club partnership emails.</p></body></html>`;
  const text = `${p.body}\n\n--\n${p.address}\nUnsubscribe: ${p.unsubscribeUrl}\n`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${p.fromName} <${p.fromEmail}>`,
        to: [p.to],
        reply_to: p.replyTo,
        subject: p.subject,
        html,
        text,
        headers: { 'List-Unsubscribe': `<${p.unsubscribeUrl}>` },
      }),
    });
    if (!res.ok) return { ok: false, error: `Email service error (${res.status}): ${(await res.text()).slice(0, 160)}` };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}

export async function sendSimple(to: string, subject: string, heading: string, lines: string[], cta?: { label: string; url: string }) {
  const html = layout(`<h1 style="font-size:24px;font-weight:300;margin:0 0 14px">${esc(heading)}</h1>${lines
    .map((l) => `<p style="margin:0 0 12px">${esc(l)}</p>`)
    .join('')}${cta ? `<p style="margin:16px 0 0"><a href="${cta.url}" style="display:inline-block;background:#141414;color:#f8f6f1;text-decoration:none;padding:12px 20px;font-size:15px">${esc(cta.label)}</a></p>` : ''}`);
  const text = `${heading}\n\n${lines.join('\n\n')}${cta ? `\n\n${cta.label}: ${cta.url}` : ''}\n`;
  return send(to, subject, html, text);
}
