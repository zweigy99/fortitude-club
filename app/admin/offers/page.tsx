import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createOffer, createPartner, toggleOffer } from '@/app/actions/admin';
import { OfferFields, PartnerFields } from '@/components/AdminForms';
import Alerts from '@/components/Alerts';

const REDEEM_LABEL: Record<string, string> = { show_card: 'Show card', code: 'Promo code', link: 'Booking link' };

export default async function AdminOffers({ searchParams }: { searchParams: { error?: string } }) {
  const { supabase } = await requireAdmin();
  const { data: partners } = await supabase.from('partners').select('*').order('name');
  const { data: offers } = await supabase.from('offers').select('*, partners(name)').order('sort_order').order('created_at');

  return (
    <div className="stack-lg">
      <div className="stack">
        <h1 style={{ fontSize: 56 }}>Offers and partners</h1>
        <p className="muted">Only offers marked Live appear to members. Partners you hide also hide their offers.</p>
      </div>
      <Alerts error={searchParams.error} />

      <div className="stack">
        <h2 style={{ fontSize: 36 }}>Offers</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Offer</th><th>Partner</th><th>Redeem by</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {(offers ?? []).map((o: any) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/offers/${o.id}`}>{o.title}</Link></td>
                  <td>{o.partners?.name}</td>
                  <td>{REDEEM_LABEL[o.redeem_type]}</td>
                  <td>{o.active ? <span className="badge badge-ok">Live</span> : <span className="badge badge-off">Hidden</span>}</td>
                  <td>
                    <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                      <form action={toggleOffer}>
                        <input type="hidden" name="id" value={o.id} />
                        <input type="hidden" name="active" value={o.active ? 'false' : 'true'} />
                        <button className="btn btn-ghost btn-small" type="submit">{o.active ? 'Hide' : 'Go live'}</button>
                      </form>
                      <Link href={`/admin/offers/${o.id}`} className="btn btn-ghost btn-small">Edit</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <details className="panel">
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Add an offer</summary>
        <form action={createOffer} className="form" style={{ marginTop: 20 }}>
          <OfferFields partners={partners ?? []} />
          <div><button className="btn btn-primary" type="submit">Create offer</button></div>
        </form>
      </details>

      <div className="stack">
        <h2 style={{ fontSize: 36 }}>Partners</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Partner</th><th>Category</th><th>Neighbourhood</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {(partners ?? []).map((p: any) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>{p.neighbourhood}</td>
                  <td>{p.active ? <span className="badge badge-ok">Shown</span> : <span className="badge badge-off">Hidden</span>}</td>
                  <td><Link href={`/admin/partners/${p.id}`} className="btn btn-ghost btn-small">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <details className="panel">
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Add a partner</summary>
        <form action={createPartner} className="form" style={{ marginTop: 20 }}>
          <PartnerFields />
          <div><button className="btn btn-primary" type="submit">Create partner</button></div>
        </form>
      </details>
    </div>
  );
}
