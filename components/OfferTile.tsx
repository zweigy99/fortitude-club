import Link from 'next/link';

export type OfferRow = {
  id: string;
  title: string;
  kind: string | null;
  promo_code?: string | null;
  partner_id: string;
  sort_order?: number;
};

export type PartnerWithOffers = {
  id: string;
  name: string;
  category: string;
  neighbourhood: string | null;
  description: string | null;
  logo_url?: string | null;
  website?: string | null;
  offers: OfferRow[];
};

function PartnerMark({ partner, height = 52 }: { partner: PartnerWithOffers; height?: number }) {
  const inner = partner.logo_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={partner.logo_url} alt={partner.name} style={{ height, width: 'auto', maxWidth: 220, display: 'block', objectFit: 'contain' }} />
  ) : (
    <span className="partner-name">{partner.name}</span>
  );
  return partner.website ? (
    <a href={partner.website} target="_blank" rel="noopener noreferrer" aria-label={`${partner.name} website (opens in a new tab)`} style={{ display: 'inline-block', textDecoration: 'none', color: 'inherit' }}>
      {inner}
    </a>
  ) : (
    inner
  );
}

export function LogoStrip({ partners }: { partners: PartnerWithOffers[] }) {
  const withLogos = partners.filter((p) => p.logo_url);
  if (withLogos.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'stretch' }}>
      {withLogos.map((p) => (
        <div key={p.id} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 4, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '1 1 200px', minHeight: 96 }}>
          <PartnerMark partner={p} height={p.name.toLowerCase().includes('totum') ? 64 : 44} />
        </div>
      ))}
    </div>
  );
}

export function PartnerBlock({ partner, linkOffers = true }: { partner: PartnerWithOffers; linkOffers?: boolean }) {
  const offers = [...(partner.offers ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return (
    <article className="partner">
      <div>
        <PartnerMark partner={partner} height={partner.name.toLowerCase().includes('totum') ? 72 : 48} />
        {partner.neighbourhood && <div className="label-quiet partner-place">{partner.neighbourhood}</div>}
        {partner.website && (
          <a href={partner.website} target="_blank" rel="noopener noreferrer" className="small" style={{ display: 'inline-block', marginTop: 8 }}>Visit website</a>
        )}
      </div>
      <div className="stack" style={{ gap: 20 }}>
        {partner.description && <p className="muted">{partner.description}</p>}
        {offers.length > 0 && (
          <div className="offers">
            {offers.map((o) => {
              const intro = (o.kind ?? '').toLowerCase().startsWith('intro');
              const body = (
                <>
                  <span className={intro ? 'label' : 'label-quiet'}>{o.kind || 'Member offer'}</span>
                  <span className="offer-title">{o.title}</span>
                  {linkOffers && <span className="offer-more">View offer and how to redeem</span>}
                </>
              );
              return linkOffers ? (
                <Link key={o.id} href={`/offers/${o.id}`} className={`offer${intro ? ' intro' : ''}`}>{body}</Link>
              ) : (
                <div key={o.id} className={`offer${intro ? ' intro' : ''}`}>{body}</div>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}
