'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin, memberId } from '@/lib/auth';
import { sendApprovedEmail, sendRejectedEmail } from '@/lib/email';

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
  if (id === user!.id || !['member', 'admin'].includes(role)) return;
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
