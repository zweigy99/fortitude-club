'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin, siteUrl } from '@/lib/auth';
import { sendOutreach } from '@/lib/email';
import { addDays } from '@/lib/crm';

const str = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? '').trim();
  return v === '' ? null : v;
};

function leadFields(f: FormData) {
  return {
    name: str(f, 'name'),
    category: str(f, 'category'),
    neighbourhood: str(f, 'neighbourhood'),
    address: str(f, 'address'),
    phone: str(f, 'phone'),
    email: str(f, 'email')?.toLowerCase() ?? null,
    contact_name: str(f, 'contact_name'),
    website: str(f, 'website'),
    why: str(f, 'why'),
    notes: str(f, 'notes'),
    owner: str(f, 'owner'),
    next_follow_up: str(f, 'next_follow_up'),
    updated_at: new Date().toISOString(),
  };
}

export async function createLead(formData: FormData) {
  const { supabase } = await requireAdmin();
  const fields = leadFields(formData);
  if (!fields.name) redirect('/admin/leads?error=' + encodeURIComponent('Enter the studio name.'));
  const { data, error } = await supabase.from('leads').insert(fields).select('id').single();
  if (error) redirect('/admin/leads?error=' + encodeURIComponent(error.message.includes('duplicate') ? 'That studio is already in your leads.' : error.message));
  redirect(`/admin/leads/${data.id}`);
}

export async function updateLead(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id'));
  await supabase.from('leads').update(leadFields(formData)).eq('id', id);
  revalidatePath('/admin/leads');
  redirect(`/admin/leads/${id}?saved=1`);
}

export async function setStage(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id'));
  const stage = String(formData.get('stage'));
  const back = String(formData.get('back') || `/admin/leads/${id}`);
  const { data: before } = await supabase.from('leads').select('stage').eq('id', id).maybeSingle();
  await supabase.from('leads').update({ stage, updated_at: new Date().toISOString() }).eq('id', id);
  if (before && before.stage !== stage) {
    await supabase.from('lead_activities').insert({ lead_id: id, kind: 'stage', subject: `Stage changed to ${stage.replace('_', ' ')}` });
  }
  revalidatePath('/admin/leads');
  redirect(back);
}

export async function addActivity(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id'));
  const kind = String(formData.get('kind') || 'note');
  const body = str(formData, 'body');
  if (!body) redirect(`/admin/leads/${id}?error=` + encodeURIComponent('Write something to log.'));
  await supabase.from('lead_activities').insert({ lead_id: id, kind, subject: kind === 'call' ? 'Phone call' : kind === 'visit' ? 'In-person visit' : 'Note', body });
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (kind === 'call' || kind === 'visit') patch.last_contacted_at = new Date().toISOString();
  const follow = str(formData, 'next_follow_up');
  if (follow) patch.next_follow_up = follow;
  await supabase.from('leads').update(patch).eq('id', id);
  redirect(`/admin/leads/${id}?saved=1`);
}

export async function sendLeadEmail(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id'));
  const subject = str(formData, 'subject');
  const body = str(formData, 'body');
  const followDays = Number(formData.get('follow_days') || 5);
  const { data: lead } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();
  if (!lead) redirect('/admin/leads');
  const back = (msg: string) => redirect(`/admin/leads/${id}?error=` + encodeURIComponent(msg));
  if (lead.do_not_contact) back('This studio unsubscribed from outreach emails.');
  if (!lead.email) back('Add the studio\'s email address first (Edit details).');
  if (!subject || !body) back('Add a subject and a message.');

  const { data: settings } = await supabase.from('site_settings').select('key, value').in('key', ['outreach_from_name', 'outreach_from_email', 'outreach_reply_to', 'business_address']);
  const s = Object.fromEntries((settings ?? []).map((r: any) => [r.key, r.value]));
  const result = await sendOutreach({
    fromName: s.outreach_from_name || 'Fortitude Club',
    fromEmail: s.outreach_from_email || 'hello@fortitudeclub.ca',
    replyTo: s.outreach_reply_to || 'info@fortitudeclub.ca',
    to: lead.email,
    subject: subject!,
    body: body!,
    address: s.business_address || 'Fortitude Club, Toronto, ON',
    unsubscribeUrl: `${siteUrl()}/unsubscribe?t=${lead.unsub_token}`,
  });
  if (!result.ok) back(result.error ?? 'The email could not be sent.');

  await supabase.from('lead_activities').insert({ lead_id: id, kind: 'email', subject, body });
  const nextStage = lead.stage === 'new' ? 'contacted' : lead.stage === 'contacted' ? 'follow_up' : lead.stage;
  await supabase
    .from('leads')
    .update({ last_contacted_at: new Date().toISOString(), next_follow_up: followDays > 0 ? addDays(followDays) : null, stage: nextStage, updated_at: new Date().toISOString() })
    .eq('id', id);
  revalidatePath('/admin/leads');
  redirect(`/admin/leads/${id}?sent=1`);
}

export async function convertToPartner(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id'));
  const { data: lead } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();
  if (!lead) redirect('/admin/leads');
  if (lead.partner_id) redirect(`/admin/partners/${lead.partner_id}`);
  const slug = lead.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const { data: partner, error } = await supabase
    .from('partners')
    .insert({ name: lead.name, category: lead.category ?? 'Fitness', neighbourhood: lead.neighbourhood, address: lead.address, website: lead.website, description: lead.why, contact_email: lead.email, slug, active: false })
    .select('id')
    .single();
  if (error) redirect(`/admin/leads/${id}?error=` + encodeURIComponent(error.message));
  await supabase.from('leads').update({ partner_id: partner.id, stage: 'signed', updated_at: new Date().toISOString() }).eq('id', id);
  await supabase.from('lead_activities').insert({ lead_id: id, kind: 'stage', subject: 'Signed and converted to a partner' });
  redirect(`/admin/partners/${partner.id}?saved=1`);
}

export async function deleteLead(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from('leads').delete().eq('id', String(formData.get('id')));
  redirect('/admin/leads');
}

export async function saveTemplate(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, 'id');
  const row = { name: str(formData, 'name') ?? 'Untitled', subject: str(formData, 'subject') ?? '', body: str(formData, 'body') ?? '', sort_order: Number(str(formData, 'sort_order') ?? 0) || 0 };
  if (id) await supabase.from('email_templates').update(row).eq('id', id);
  else await supabase.from('email_templates').insert(row);
  redirect('/admin/leads/templates?saved=1');
}

export async function deleteTemplate(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from('email_templates').delete().eq('id', String(formData.get('id')));
  redirect('/admin/leads/templates?saved=1');
}

export async function saveOutreachSettings(formData: FormData) {
  const { supabase } = await requireAdmin();
  const keys = ['outreach_from_name', 'outreach_from_email', 'outreach_reply_to', 'business_address'];
  const fromEmail = str(formData, 'outreach_from_email') ?? '';
  if (fromEmail && !/@fortitudeclub\.ca$/i.test(fromEmail)) redirect('/admin/leads/templates?error=' + encodeURIComponent('The "send from" address must end in @fortitudeclub.ca.'));
  await supabase.from('site_settings').upsert(keys.map((key) => ({ key, value: str(formData, key) ?? '' })));
  redirect('/admin/leads/templates?saved=1');
}
