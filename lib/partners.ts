import { createClient } from '@/lib/supabase/server';
import type { PartnerWithOffers } from '@/components/OfferTile';

export async function getPartnersWithOffers(): Promise<PartnerWithOffers[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('partners')
    .select('id, name, category, neighbourhood, description, logo_url, website, created_at, offers(id, title, kind, partner_id, sort_order, active)')
    .eq('active', true)
    .eq('offers.active', true)
    .order('created_at');
  return ((data ?? []) as any[]).map((p) => ({
    ...p,
    offers: (p.offers ?? []).filter((o: any) => o.active),
  }));
}
