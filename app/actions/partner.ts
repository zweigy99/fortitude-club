'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession, siteUrl } from '@/lib/auth';
import { sendSimple } from '@/lib/email';

async function requirePartner() {
  const s = await getSession();
  if (!s.user) redirect('/login?next=/partner');
  if (s.profile?.role !== 'partner' || !s.profile.partner_id) redirect('/card');
  return s as typeof s & { profile: { partner_id: string } };
}

const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return v === null ? undefined : String(v).trim();
};

async function uploadFile(supabase: any, partnerId: string, file: File, kind: string) {
  if (!file || file.size === 0) return null;
  if (file.size > 5 * 1024 * 1024) throw new Error('Images must be under 5 MB.');
  if (!/^image\/(png|jpe?g|webp|svg\+xml|gif)$/.test(file.type)) throw new Error('Upload a PNG, JPG, WebP or SVG image.');
  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${partnerId}/${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('partner-media').upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from('partner-media').getPublicUrl(path).data.publicUrl as string;
}

export async function updateDetails(formData: FormData) {
  const { supabase, profile } = await requirePartner();
  const pid = profile.partner_id;
  const patch: Record<string, string> = {};
  for (const k of ['description', 'neighbourhood', 'address', 'hours', 'website', 'contact_email', 'logo_url']) {
    const v = str(formData, k);
    if (v !== undefined) patch[k] = v;
  }
  if (patch.website && !/^https?:\/\//.test(patch.website)) patch.website = 'https://' + patch.website;
  let photos = (str(formData, 'photos') ?? '').split('\n').map((x) => x.trim()).filter(Boolean);
  try {
    const logo = formData.get('logo_file') as File | null;
    const logoUrl = logo ? await uploadFile(supabase, pid, logo, 'logo') : null;
    if (logoUrl) patch.logo_url = logoUrl;
    const newPhotos = formData.getAll('photo_files') as File[];
    for (const f of newPhotos) {
      const u = await uploadFile(supabase, pid, f, 'photo');
      if (u) photos.push(u);
    }
  } catch (e: any) {
    redirect('/partner?error=' + encodeURIComponent(e.message));
  }
  patch.photos = photos.slice(0, 12).join('\n');
  const { error } = await supabase.rpc('partner_update_details', { p: patch });
  if (error) redirect('/partner?error=' + encodeURIComponent(error.message));
  revalidatePath('/', 'layout');
  redirect('/partner?saved=1#details');
}

export async function submitOfferRequest(formData: FormData) {
  const { supabase, user, profile } = await requirePartner();
  const action = String(formData.get('action') || 'edit');
  const offerId = str(formData, 'offer_id') || null;
  const changes: Record<string, string> = {};
  for (const k of ['title', 'kind', 'description', 'terms', 'steps', 'promo_code', 'redeem_type', 'redeem_url']) {
    const v = str(formData, k);
    if (v !== undefined) changes[k] = v;
  }
  if (action === 'new' && !changes.title) redirect('/partner/request?new=1&error=' + encodeURIComponent('Give the offer a title.'));
  const { error } = await supabase.from('offer_requests').insert({
    partner_id: profile.partner_id,
    offer_id: offerId,
    requested_by: user!.id,
    action,
    changes: action === 'pause' || action === 'resume' ? {} : changes,
    note: str(formData, 'note') || null,
  });
  if (error) redirect('/partner?error=' + encodeURIComponent(error.message));
  const { data: partner } = await supabase.from('partners').select('name').eq('id', profile.partner_id).maybeSingle();
  await sendSimple(
    'info@fortitudeclub.ca',
    `Offer request from ${partner?.name ?? 'a partner'}`,
    `${partner?.name ?? 'A partner'} suggested an offer change`,
    [`Type: ${action === 'new' ? 'New offer' : action === 'pause' ? 'Pause an offer' : action === 'resume' ? 'Turn an offer back on' : 'Edit an offer'}`, changes.title ? `Offer: ${changes.title}` : '', str(formData, 'note') ? `Note: ${str(formData, 'note')}` : ''].filter(Boolean),
    { label: 'Review in Admin', url: `${siteUrl()}/admin/requests` }
  );
  redirect('/partner?requested=1#offers');
}

export async function switchStudio(formData: FormData) {
  const { supabase } = await requirePartner();
  const id = String(formData.get('partner_id') || '');
  const { error } = await supabase.rpc('switch_partner', { p: id });
  if (error) redirect('/partner?error=' + encodeURIComponent('You don\u2019t have access to that studio.'));
  redirect('/partner');
}
