import Link from 'next/link';

export type OfferRow = {
  id: string;
  title: string;
  description: string | null;
  partners: { name: string; category: string; neighbourhood: string | null; image_url: string | null } | null;
};

export default function OfferTile({ offer }: { offer: OfferRow }) {
  const p = offer.partners;
  return (
    <Link href={`/offers/${offer.id}`} className="tile">
      <div
        className="tile-img"
        style={p?.image_url ? { backgroundImage: `url(${JSON.stringify(p.image_url)})` } : undefined}
        aria-hidden="true"
      />
      <div className="tile-body">
        <span className="tile-partner">{p?.name}</span>
        <span className="tile-title">{offer.title}</span>
        {offer.description && <p className="muted small">{offer.description}</p>}
        <span className="small muted">
          {p?.category}
          {p?.neighbourhood ? `, ${p.neighbourhood}` : ''}
        </span>
      </div>
    </Link>
  );
}
