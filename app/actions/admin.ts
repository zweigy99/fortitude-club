'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin, memberId } from '@/lib/auth';
import { sendApprovedEmail, sendRejectedEmail, sendBatch, announcementMessage, partnerReportMessage } from '@/lib/email';
import { siteUrl } from '@/lib/auth';

const str = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? '').trim();
  return v === '' ? null : v;
};

export async function setMemberStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id'));
  const status = String(formData.get('status'));
  if (!['approved', 'rejected', 'pending'].includes(status)) return;
  const { data: before } = await supabase
    .from('profiles')
    .select('status, work_email, full_name, member_number, approval_email_sent_at, employers(name)')
    .eq('id', id)
    .maybeSingle();
  const update: Record<string, unknown> = { status, reviewed_at: status === 'pending' ? null : new Date().toISOString() };
  const { error } = await supabase.from('profiles').update(update).eq('id', id);
  if (!error && before && before.status !== status) {
    const emp = (before as any).employers?.name ?? null;
    if (status === 'approved') {
      const sent = await sendApprovedEmail({ email: before.work_email, name: before.full_name, employer: emp, memberId: memberId(before.member_number) });
      if (sent) await supabase.from('profiles').update({ approval_email_sent_at: new Date().toISOString() }).eq('id', id);
    } else if (status === 'rejected') {
      await sendRejectedEmail({ email: before.work_email, name: before.full_name });
    }
  }
  revalidatePath('/admin');
}

export async function setMemberEmployer(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase
    .from('profiles')
    .update({ employer_id: str(formData, 'employer_id') })
    .eq('id', String(formData.get('id')));
  revalidatePath('/admin');
}

export async function setMemberRole(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = String(formData.get('id'));
  const role = String(formData.get('role'));
  if (id === user!.id || !['member', 'admin', 'employer'].includes(role)) return;
  await supabase.from('profiles').update({ role }).eq('id', id);
  revalidatePath('/admin');
}

// ---------- Employers ----------
export async function saveEmployer(formData: FormData) {
  const { supabase } = await requireAdmin();
  const name = str(formData, 'name');
  if (!name) redirect('/admin/employers?error=' + encodeURIComponent('Enter the employer name.'));
  const domain = str(formData, 'email_domain')?.replace(/^@/, '').toLowerCase() ?? null;
  const { error } = await supabase.from('employers').insert({ name, email_domain: domain });
  if (error) redirect('/admin/employers?error=' + encodeURIComponent(error.message));
  revalidatePath('/admin/employers');
}

export async function updateEmployer(formData: FormData) {
  const { supabase } = await requireAdmin();
  const domain = str(formData, 'email_domain')?.replace(/^@/, '').toLowerCase() ?? null;
  await supabase
    .from('employers')
    .update({ name: str(formData, 'name'), email_domain: domain, active: formData.get('active') === 'on' })
    .eq('id', String(formData.get('id')));
  revalidatePath('/admin/employers');
}

// ---------- Partners ----------
function partnerFields(f: FormData) {
  return {
    name: str(f, 'name'),
    category: str(f, 'category') ?? 'Fitness',
    neighbourhood: str(f, 'neighbourhood'),
    address: str(f, 'address'),
    website: str(f, 'website'),
    image_url: str(f, 'image_url'),
    logo_url: str(f, 'logo_url'),
    slug: (str(f, 'slug') ?? str(f, 'name') ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || null,
    hours: str(f, 'hours'),
    photos: str(f, 'photos'),
    lat: str(f, 'lat') ? Number(str(f, 'lat')) : null,
    lng: str(f, 'lng') ? Number(str(f, 'lng')) : null,
    contact_email: str(f, 'contact_email'),
    description: str(f, 'description'),
    active: f.get('active') === 'on',
  };
}

export async function createPartner(formData: FormData) {
  const { supabase } = await requireAdmin();
  const fields = partnerFields(formData);
  if (!fields.name) redirect('/admin/offers?error=' + encodeURIComponent('Enter the partner name.'));
  const { data, error } = await supabase.from('partners').insert(fields).select('id').single();
  if (error) redirect('/admin/offers?error=' + encodeURIComponent(error.message));
  redirect(`/admin/partners/${data.id}?saved=1`);
}

export async function updatePartner(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id'));
  const { error } = await supabase.from('partners').update(partnerFields(formData)).eq('id', id);
  if (error) redirect(`/admin/partners/${id}?error=` + encodeURIComponent(error.message));
  revalidatePath('/', 'layout');
  redirect(`/admin/partners/${id}?saved=1`);
}

// ---------- Offers ----------
function offerFields(f: FormData) {
  return {
    partner_id: str(f, 'partner_id'),
    title: str(f, 'title'),
    kind: str(f, 'kind') ?? 'Member offer',
    description: str(f, 'description'),
    steps: str(f, 'steps'),
    terms: str(f, 'terms'),
    redeem_type: str(f, 'redeem_type') ?? 'show_card',
    promo_code: str(f, 'promo_code'),
    redeem_url: str(f, 'redeem_url'),
    sort_order: Number(str(f, 'sort_order') ?? 0) || 0,
    active: f.get('active') === 'on',
  };
}

function validateOffer(o: ReturnType<typeof offerFields>): string | null {
  if (!o.partner_id) return 'Choose a partner.';
  if (!o.title) return 'Enter an offer title.';
  if (o.redeem_type === 'code' && !o.promo_code) return 'Add the promo code members will see.';
  if (o.redeem_type === 'link' && !/^https?:\/\//.test(o.redeem_url ?? '')) return 'Add a full booking link starting with https://';
  return null;
}

export async function createOffer(formData: FormData) {
  const { supabase } = await requireAdmin();
  const fields = offerFields(formData);
  const problem = validateOffer(fields);
  if (problem) redirect('/admin/offers?error=' + encodeURIComponent(problem));
  const { data, error } = await supabase.from('offers').insert(fields).select('id').single();
  if (error) redirect('/admin/offers?error=' + encodeURIComponent(error.message));
  redirect(`/admin/offers/${data.id}?saved=1`);
}

export async function updateOffer(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id'));
  const fields = offerFields(formData);
  const problem = validateOffer(fields);
  if (problem) redirect(`/admin/offers/${id}?error=` + encodeURIComponent(problem));
  const { error } = await supabase.from('offers').update(fields).eq('id', id);
  if (error) redirect(`/admin/offers/${id}?error=` + encodeURIComponent(error.message));
  revalidatePath('/', 'layout');
  redirect(`/admin/offers/${id}?saved=1`);
}

export async function toggleOffer(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase
    .from('offers')
    .update({ active: formData.get('active') === 'true' })
    .eq('id', String(formData.get('id')));
  revalidatePath('/', 'layout');
}

export async function deleteOffer(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from('offers').delete().eq('id', String(formData.get('id')));
  revalidatePath('/', 'layout');
  redirect('/admin/offers');
}

// ---------- Site content ----------
export async function saveStat(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, 'id');
  const row = { label: str(formData, 'label') ?? '', value: str(formData, 'value') ?? '', sort_order: Number(str(formData, 'sort_order') ?? 0) || 0 };
  if (!row.label || !row.value) redirect('/admin/site?error=' + encodeURIComponent('Each stat needs a number and a label.'));
  if (id) await supabase.from('site_stats').update(row).eq('id', id);
  else await supabase.from('site_stats').insert(row);
  revalidatePath('/', 'layout');
  redirect('/admin/site?saved=1');
}

export async function deleteStat(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from('site_stats').delete().eq('id', String(formData.get('id')));
  revalidatePath('/', 'layout');
  redirect('/admin/site?saved=1');
}

export async function saveSetting(formData: FormData) {
  const { supabase } = await requireAdmin();
  const key = String(formData.get('key'));
  const value = str(formData, 'value') ?? '';
  if (key === 'booking_link' && value && !/^https?:\/\//.test(value)) redirect('/admin/site?error=' + encodeURIComponent('The booking link must start with https://'));
  await supabase.from('site_settings').upsert({ key, value });
  revalidatePath('/', 'layout');
  redirect('/admin/site?saved=1');
}

// ---------- Member announcements ----------
export async function sendAnnouncement(formData: FormData) {
  const { supabase } = await requireAdmin();
  const subject = str(formData, 'subject');
  const body = str(formData, 'body');
  const audience = str(formData, 'audience') ?? 'all';
  const includeNew = formData.get('include_new') === 'on';
  if (!subject || !body) redirect('/admin/announcements?error=' + encodeURIComponent('Add a subject and a message.'));
  let q = supabase.from('profiles').select('work_email, full_name').eq('status', 'approved');
  if (audience !== 'all') q = q.eq('employer_id', audience);
  const { data: members } = await q;
  let newOffers: { title: string; partner: string; url: string }[] = [];
  if (includeNew) {
    const since = new Date(Date.now() - 31 * 864e5).toISOString();
    const { data } = await supabase.from('offers').select('id, title, partners(name)').eq('active', true).gte('created_at', since);
    newOffers = (data ?? []).map((o: any) => ({ title: o.title, partner: o.partners?.name ?? '', url: `${siteUrl()}/offers/${o.id}` }));
  }
  const msgs = (members ?? []).map((m: any) => announcementMessage({ to: m.work_email, name: m.full_name, subject: subject!, body: body!, newOffers }));
  const sent = await sendBatch(msgs);
  await supabase.from('announcements').insert({ subject, body, audience, recipients: sent });
  redirect(`/admin/announcements?sent=${sent}&of=${msgs.length}`);
}

// ---------- Partner reports ----------
export async function sendPartnerReport(formData: FormData) {
  const { supabase } = await requireAdmin();
  const partnerId = String(formData.get('partner_id'));
  const days = Number(formData.get('days') || 30);
  const { data: partner } = await supabase.from('partners').select('name, contact_email').eq('id', partnerId).maybeSingle();
  const to = str(formData, 'to') ?? partner?.contact_email;
  if (!partner || !to) redirect('/admin/reports?error=' + encodeURIComponent('Add the partner\'s contact email (in Edit partner, or in the box) first.'));
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const { data: rows } = await supabase.from('redemptions').select('user_id, offers!inner(title, partner_id)').eq('offers.partner_id', partnerId).gte('created_at', since);
  const list = (rows ?? []) as any[];
  const byOfferMap = new Map<string, number>();
  list.forEach((r) => byOfferMap.set(r.offers.title, (byOfferMap.get(r.offers.title) ?? 0) + 1));
  const period = `last ${days} days (to ${new Date().toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })})`;
  const msg = partnerReportMessage({ to: to!, partner: partner!.name, period, total: list.length, members: new Set(list.map((r) => r.user_id)).size, byOffer: [...byOfferMap].map(([title, n]) => ({ title, n })) });
  const sent = await sendBatch([msg]);
  await supabase.from('partner_reports').insert({ partner_id: partnerId, period_label: period, sent_to: to, redemptions: list.length });
  redirect(`/admin/reports?sent=${sent}`);
}
