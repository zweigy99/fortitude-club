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
          <PartnerMap
            points={partners.flatMap((p) => {
              const base = { href: p.slug ? `/partners/${p.slug}` : '/partners', logo: p.logo_url ?? null, offers: p.offers.length };
              const locs = (((p as any).locations ?? []) as any[]).filter((l) => l && l.lat != null && l.lng != null);
              if (locs.length) return locs.map((l) => ({ ...base, name: l.label ? `${p.name} \u00b7 ${l.label}` : p.name, lat: Number(l.lat), lng: Number(l.lng), place: l.address ?? p.neighbourhood ?? '' }));
              return p.lat != null && p.lng != null ? [{ ...base, name: p.name, lat: p.lat as number, lng: p.lng as number, place: p.neighbourhood ?? '' }] : [];
            })}
          />
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
