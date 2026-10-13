import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { updateOffer, deleteOffer } from '@/app/actions/admin';
import { OfferFields } from '@/components/AdminForms';
import Alerts from '@/components/Alerts';

export default async function EditOffer({ params, searchParams }: { params: { id: string }; searchParams: { error?: string; saved?: string } }) {
  const { supabase } = await requireAdmin();
  const { data: offer } = await supabase.from('offers').select('*').eq('id', params.id).maybeSingle();
  if (!offer) notFound();
  const { data: partners } = await supabase.from('partners').select('id, name').order('name');
  const { count } = await supabase.from('redemptions').select('id', { count: 'exact', head: true }).eq('offer_id', offer.id);

  return (
    <div className="stack-lg" style={{ maxWidth: 900 }}>
      <Link href="/admin/offers" className="small">Back to offers</Link>
      <div className="stack">
        <h1 style={{ fontSize: 48 }}>{offer.title}</h1>
        <p className="muted">Redeemed {count ?? 0} times. {offer.active && <Link href={`/offers/${offer.id}`}>View live page</Link>}</p>
      </div>
      <Alerts error={searchParams.error} notice={searchParams.saved ? 'Offer saved.' : undefined} />
      <form action={updateOffer} className="panel form">
        <input type="hidden" name="id" value={offer.id} />
        <OfferFields partners={partners ?? []} offer={offer} />
        <div><button className="btn btn-primary" type="submit">Save offer</button></div>
      </form>
      <form action={deleteOffer}>
        <input type="hidden" name="id" value={offer.id} />
        <button className="btn btn-danger btn-small" type="submit">Delete offer and its redemption history</button>
      </form>
    </div>
  );
}
