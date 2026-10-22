import { PartnerBlock } from '@/components/OfferTile';
import { getPartnersWithOffers } from '@/components/partners';
import PartnerMap from '@/components/PartnerMap';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Partners | Fortitude Club' };

export default async function PartnersPage() {
  const partners = await getPartnersWithOffers();
  return (
    <>
      <section className="section">
        <div className="wrap stack-lg">
          <div className="stack" style={{ gap: 16 }}>
            <span className="label">Our partners</span>
            <h1>Premium local wellness.</h1>
            <p className="lede">From fitness studios and recovery clinics to nutrition and mental wellness services, every partner is carefully selected to deliver measurable value.</p>
          </div>
          <PartnerMap points={partners.filter((p) => p.lat != null && p.lng != null).map((p) => ({ name: p.name, lat: p.lat as number, lng: p.lng as number, href: p.slug ? `/partners/${p.slug}` : '/partners', place: p.neighbourhood ?? '', logo: p.logo_url ?? null, offers: p.offers.length }))} />
          <div>{partners.map((p) => <PartnerBlock key={p.id} partner={p} />)}</div>
        </div>
      </section>
      <section className="band section" id="become-a-partner">
        <div className="wrap stack" style={{ maxWidth: 760, gap: 20 }}>
          <span className="label">Become a partner</span>
          <h2>Connect with highly engaged customers.</h2>
          <p className="muted">Fortitude connects premium wellness providers with highly engaged customers from local employers. Members book through your own system, so nothing changes at your front desk.</p>
          <div><a href="mailto:info@fortitudeclub.ca?subject=Partnering%20with%20Fortitude%20Club" className="btn btn-light">Email us about partnering</a></div>
        </div>
      </section>
    </>
  );
}
