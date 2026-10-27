'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin, siteUrl } from '@/lib/auth';
import { sendSimple } from '@/lib/email';

const ALLOWED = ['title', 'kind', 'description', 'terms', 'steps', 'promo_code', 'redeem_type', 'redeem_url'];

async function notify(supabase: any, req: any, approved: boolean, adminNote: string | null) {
  const { data: staff } = await supabase.from('profiles').select('work_email').eq('role', 'partner').eq('partner_id', req.partner_id);
  const { data: partner } = await supabase.from('partners').select('name, contact_email').eq('id', req.partner_id).maybeSingle();
  const to = new Set<string>([...(staff ?? []).map((s: any) => s.work_email), ...(partner?.contact_email ? [partner.contact_email] : [])]);
  for (const email of to) {
    await sendSimple(
      email,
      approved ? 'Your Fortitude Club offer change is live' : 'About your Fortitude Club offer request',
      approved ? 'Your change has been approved' : 'Your request wasn\u2019t approved this time',
      [
        approved ? `We\u2019ve approved your ${req.action === 'new' ? 'new offer' : 'offer update'} for ${partner?.name ?? 'your studio'}. It\u2019s live on fortitudeclub.ca now.` : `We reviewed your request for ${partner?.name ?? 'your studio'} and didn\u2019t approve it as submitted.`,
        adminNote ? `Note from Fortitude Club: ${adminNote}` : '',
      ].filter(Boolean),
      { label: 'Open the partner portal', url: `${siteUrl()}/partner` }
    );
  }
}

export async function decideRequest(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id'));
  const decision = String(formData.get('decision'));
  const adminNote = String(formData.get('admin_note') || '').trim() || null;
  const { data: req } = await supabase.from('offer_requests').select('*').eq('id', id).maybeSingle();
  if (!req || req.status !== 'pending') redirect('/admin/requests');

  if (decision === 'approve') {
    const changes: Record<string, any> = {};
    for (const k of ALLOWED) if (req.changes?.[k] !== undefined) changes[k] = req.changes[k] === '' ? null : req.changes[k];
    let error: any = null;
    if (req.action === 'new') {
      ({ error } = await supabase.from('offers').insert({ ...changes, partner_id: req.partner_id, title: changes.title ?? 'New offer', active: true, redeem_type: changes.redeem_type ?? 'show_card' }));
    } else if (req.action === 'pause' || req.action === 'resume') {
      ({ error } = await supabase.from('offers').update({ active: req.action === 'resume' }).eq('id', req.offer_id).eq('partner_id', req.partner_id));
    } else {
      ({ error } = await supabase.from('offers').update(changes).eq('id', req.offer_id).eq('partner_id', req.partner_id));
    }
    if (error) redirect('/admin/requests?error=' + encodeURIComponent(error.message));
  }
  await supabase.from('offer_requests').update({ status: decision === 'approve' ? 'approved' : 'rejected', admin_note: adminNote, decided_at: new Date().toISOString() }).eq('id', id);
  await notify(supabase, req, decision === 'approve', adminNote);
  revalidatePath('/', 'layout');
  redirect('/admin/requests?done=' + decision);
}

export async function invitePartnerUser(formData: FormData) {
  const { supabase } = await requireAdmin();
  const partnerId = String(formData.get('partner_id'));
  const email = String(formData.get('email') || '').trim().toLowerCase();
  if (!email.includes('@')) redirect(`/admin/partners/${partnerId}?error=` + encodeURIComponent('Enter an email address.'));
  await supabase.from('partner_invites').upsert({ email, partner_id: partnerId });
  // If they already have an account, link it now
  const { data: existing } = await supabase.from('profiles').select('id').eq('work_email', email).maybeSingle();
  if (existing) await supabase.from('profiles').update({ role: 'partner', partner_id: partnerId, status: 'approved' }).eq('id', existing.id);
  const { data: partner } = await supabase.from('partners').select('name').eq('id', partnerId).maybeSingle();
  const personal = String(formData.get('note') || '').trim();
  await sendSimple(
    email,
    `Your ${partner?.name ?? ''} partner portal on Fortitude Club`,
    'You\u2019re invited to the Fortitude Club partner portal',
    [
      `You can now manage ${partner?.name ?? 'your studio'} on fortitudeclub.ca: update your description, hours, photos and logo, see how many members redeem with you, and suggest offer changes.`,
      ...(personal ? personal.split(/\n{2,}|\n/).map((x) => x.trim()).filter(Boolean) : []),
      existing ? 'Your existing login now opens the partner portal.' : 'Create your login with this email address using the button below, then confirm your email.',
    ],
    { label: existing ? 'Open the partner portal' : 'Create my partner login', url: existing ? `${siteUrl()}/partner` : `${siteUrl()}/signup?type=partner&email=${encodeURIComponent(email)}` }
  );
  redirect(`/admin/partners/${partnerId}?saved=1#logins`);
}

export async function removePartnerUser(formData: FormData) {
  const { supabase } = await requireAdmin();
  const partnerId = String(formData.get('partner_id'));
  const email = String(formData.get('email') || '').toLowerCase();
  await supabase.from('partner_invites').delete().eq('email', email);
  await supabase.from('profiles').update({ role: 'member', partner_id: null }).eq('work_email', email).eq('role', 'partner');
  redirect(`/admin/partners/${partnerId}?saved=1#logins`);
}
