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
