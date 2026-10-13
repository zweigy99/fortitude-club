import Link from 'next/link';
import OfferTile, { OfferRow } from '@/components/OfferTile';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Member offers | Fortitude Club' };

export default async function OffersPage({ searchParams }: { searchParams: { category?: string; q?: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from('offers')
    .select('id, title, description, partners!inner(name, category, neighbourhood, image_url, active)')
    .eq('active', true)
    .eq('partners.active', true)
    .order('sort_order');

  const all = (data ?? []) as unknown as OfferRow[];
  const categories = Array.from(new Set(all.map((o) => o.partners?.category).filter(Boolean))).sort() as string[];
  const category = searchParams.category;
  const q = (searchParams.q ?? '').trim().toLowerCase();
  const offers = all.filter(
    (o) =>
      (!category || o.partners?.category === category) &&
      (!q || `${o.title} ${o.description ?? ''} ${o.partners?.name}`.toLowerCase().includes(q))
  );

  return (
    <section className="section">
      <div className="wrap stack-lg">
        <div className="stack">
          <h1>Member offers</h1>
          <p className="lede">Browse what's on. Signed-in members can redeem any offer from its page.</p>
        </div>

        <form className="row" action="/offers" role="search">
          {category && <input type="hidden" name="category" value={category} />}
          <label htmlFor="q" className="small" style={{ position: 'absolute', left: -9999 }}>Search offers</label>
          <input id="q" type="search" name="q" defaultValue={searchParams.q ?? ''} placeholder="Search by studio or offer" style={{ maxWidth: 360 }} />
          <button className="btn btn-ghost" type="submit">Search</button>
        </form>

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

        {offers.length > 0 ? (
          <div className="grid">{offers.map((o) => <OfferTile key={o.id} offer={o} />)}</div>
        ) : (
          <div className="panel stack">
            <h3>No offers match that</h3>
            <p className="muted">Try another category or clear your search.</p>
            <div><Link href="/offers" className="btn btn-ghost">Show all offers</Link></div>
          </div>
        )}
      </div>
    </section>
  );
}
