import Link from 'next/link';
import { PartnerBlock } from '@/components/OfferTile';
import { getPartnersWithOffers } from '@/lib/partners';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Member offers | Fortitude Club' };

export default async function OffersPage({ searchParams }: { searchParams: { category?: string } }) {
  const all = (await getPartnersWithOffers()).filter((p) => p.offers.length > 0);
  const categories = Array.from(new Set(all.map((p) => p.category).filter(Boolean))).sort();
  const category = searchParams.category;
  const partners = all.filter((p) => !category || p.category === category);

  return (
    <section className="section">
      <div className="wrap stack-lg">
        <div className="stack" style={{ gap: 16 }}>
          <span className="label">Your Fortitude offers</span>
          <h1>Member offers</h1>
          <p className="lede">Every partner has an intro offer to try them out and a standard offer for after. Signed-in members tap an offer to reveal its code and the steps to redeem it.</p>
        </div>

        {categories.length > 1 && (
          <nav className="filters" aria-label="Filter by category">
            <Link href="/offers" className="chip" aria-current={!category ? 'page' : undefined}>All</Link>
            {categories.map((c) => (
              <Link key={c} href={`/offers?category=${encodeURIComponent(c)}`} className="chip" aria-current={category === c ? 'page' : undefined}>
                {c}
              </Link>
            ))}
          </nav>
        )}

        {partners.length > 0 ? (
          <div>{partners.map((p) => <PartnerBlock key={p.id} partner={p} />)}</div>
        ) : (
          <div className="panel stack">
            <h3>No offers here yet</h3>
            <p className="muted">Try another category, or check back soon as new partners join.</p>
            <div><Link href="/offers" className="btn btn-ghost">Show all offers</Link></div>
          </div>
        )}
      </div>
    </section>
  );
}
