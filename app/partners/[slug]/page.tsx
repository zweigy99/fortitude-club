import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PartnerMap from '@/components/PartnerMap';

export const dynamic = 'force-dynamic';

async function load(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from('partners')
    .select('*, offers(id, title, kind, active, sort_order)')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();
  return data as any;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await load(params.slug);
  if (!p) return { title: 'Partner not found | Fortitude Club' };
  return {
    title: `${p.name} | Fortitude Club partner`,
    description: p.description ?? `Fortitude Club member offers at ${p.name}.`,
    openGraph: { title: `${p.name} on Fortitude Club`, description: p.description ?? undefined },
  };
}

export default async function PartnerPage({ params }: { params: { slug: string } }) {
  const p = await load(params.slug);
  if (!p) notFound();
  const offers = (p.offers ?? []).filter((o: any) => o.active).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const photos: string[] = (p.photos ?? '').split('\n').map((x: string) => x.trim()).filter((x: string) => /^https?:\/\//.test(x));
  const hours: string[] = (p.hours ?? '').split('\n').map((x: string) => x.trim()).filter(Boolean);

  return (
    <section className="section">
      <div className="wrap stack-lg">
        <Link href="/partners" className="small">All partners</Link>
        <div className="split" style={{ gap: 40, alignItems: 'start' }}>
          <div className="stack" style={{ gap: 16 }}>
            {p.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.logo_url} alt={p.name} style={{ height: 72, width: 'auto', maxWidth: 280, objectFit: 'contain', alignSelf: 'flex-start' }} />
            ) : null}
            <h1 style={{ fontSize: 'clamp(38px, 5vw, 60px)' }}>{p.name}</h1>
            {p.neighbourhood && <span className="label-quiet">{p.neighbourhood}</span>}
            {p.description && <p className="lede">{p.description}</p>}
            <div className="row">
              {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Visit website</a>}
              <Link href="/offers" className="btn btn-ghost">All member offers</Link>
            </div>
          </div>
          <div className="panel stack" style={{ gap: 14 }}>
            {p.address && (<div className="stack" style={{ gap: 4 }}><span className="label-quiet">Address</span><p>{p.address}</p></div>)}
            {hours.length > 0 && (<div className="stack" style={{ gap: 4 }}><span className="label-quiet">Hours</span>{hours.map((h, i) => <p key={i}>{h}</p>)}</div>)}
            {p.lat != null && p.lng != null && (
              <PartnerMap points={[{ name: p.name, lat: p.lat, lng: p.lng, href: `/partners/${p.slug}`, place: p.neighbourhood ?? '' }]} />
            )}
          </div>
        </div>

        {photos.length > 0 && (
          <div className="gallery">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {photos.map((src, i) => <img key={i} src={src} alt={`${p.name} photo ${i + 1}`} loading="lazy" />)}
          </div>
        )}

        <div className="stack" style={{ gap: 16 }}>
          <span className="label">Member offers</span>
          {offers.length ? (
            <div className="offers">
              {offers.map((o: any) => {
                const intro = (o.kind ?? '').toLowerCase().startsWith('intro');
                return (
                  <Link key={o.id} href={`/offers/${o.id}`} className={`offer${intro ? ' intro' : ''}`}>
                    <span className={intro ? 'label' : 'label-quiet'}>{o.kind || 'Member offer'}</span>
                    <span className="offer-title">{o.title}</span>
                    <span className="offer-more">View offer and how to redeem</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="muted">New offers coming soon.</p>
          )}
        </div>
      </div>
    </section>
  );
}
