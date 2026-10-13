'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export async function redeemOffer(formData: FormData) {
  const offerId = String(formData.get('offer_id') || '');
  const { supabase, user, profile } = await getSession();

  if (!user) redirect(`/login?next=${encodeURIComponent('/offers/' + offerId)}`);
  if (profile?.status !== 'approved') redirect(`/offers/${offerId}`);

  const { data: offer } = await supabase
    .from('offers')
    .select('id, redeem_type, redeem_url, active')
    .eq('id', offerId)
    .maybeSingle();
  if (!offer || !offer.active) redirect('/offers');

  const { error } = await supabase.from('redemptions').insert({
    offer_id: offer.id,
    user_id: user.id,
    employer_id: profile.employer_id,
  });
  if (error) redirect(`/offers/${offerId}?error=${encodeURIComponent('We could not record that redemption. Try again.')}`);

  if (offer.redeem_type === 'link' && offer.redeem_url) redirect(offer.redeem_url);
  redirect(`/offers/${offerId}?redeemed=1`);
}
