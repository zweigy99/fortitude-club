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
  offers: OfferRow[];
};

export function PartnerBlock({ partner, linkOffers = true }: { partner: PartnerWithOffers; linkOffers?: boolean }) {
  const offers = [...(partner.offers ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return (
    <article className="partner">
      <div>
        <div className="partner-name">{partner.name}</div>
        {partner.neighbourhood && <div className="label-quiet partner-place">{partner.neighbourhood}</div>}
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
