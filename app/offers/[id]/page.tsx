import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { redeemOffer } from '@/app/actions/member';
import Alerts from '@/components/Alerts';

export const dynamic = 'force-dynamic';

export default async function OfferPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { redeemed?: string; error?: string };
}) {
  const { supabase, user, profile } = await getSession();
  const { data: offer } = await supabase
    .from('offers')
    .select('*, partners(*)')
    .eq('id', params.id)
    .maybeSingle();
  if (!offer || !offer.active) notFound();
  const p = offer.partners;
  const redeemed = searchParams.redeemed === '1' && profile?.status === 'approved';

  return (
    <section className="section">
      <div className="wrap split" style={{ alignItems: 'start' }}>
        <div className="stack">
          <Link href="/offers" className="small">Back to all offers</Link>
          <span className="tile-partner">{p?.name}</span>
          <h1 style={{ fontSize: 'clamp(44px, 6vw, 72px)' }}>{offer.title}</h1>
          {offer.description && <p className="lede" style={{ whiteSpace: 'pre-line' }}>{offer.description}</p>}
          {offer.terms && (
            <div className="stack" style={{ gap: 6 }}>
              <h3 style={{ fontSize: 22 }}>Terms</h3>
              <p className="muted" style={{ whiteSpace: 'pre-line' }}>{offer.terms}</p>
            </div>
          )}
          <div className="stack" style={{ gap: 4 }}>
            <h3 style={{ fontSize: 22 }}>{p?.name}</h3>
            {p?.description && <p>{p.description}</p>}
            {p?.address && <p className="muted">{p.address}</p>}
            {p?.website && <a href={p.website} target="_blank" rel="noopener noreferrer">Visit website</a>}
          </div>
        </div>

        <div className="panel stack">
          <Alerts error={searchParams.error} />
          {redeemed ? (
            <>
              <h2 style={{ fontSize: 40 }}>Offer redeemed</h2>
              {offer.redeem_type === 'code' && offer.promo_code ? (
                <div className="reveal stack" style={{ gap: 6 }}>
                  <span className="small muted">Your promo code</span>
                  <span className="code">{offer.promo_code}</span>
                </div>
              ) : (
                <p>Show your live membership card at the front desk to claim this offer.</p>
              )}
              <div className="row">
                <Link href="/card" className="btn btn-primary">Open my card</Link>
                {offer.redeem_url && (
                  <a href={offer.redeem_url} className="btn btn-ghost" target="_blank" rel="noopener noreferrer">Book with {p?.name}</a>
                )}
              </div>
            </>
          ) : !user ? (
            <>
              <h2 style={{ fontSize: 40 }}>Members only</h2>
              <p>Sign in with your work email to redeem this offer.</p>
              <div className="row">
                <Link href={`/login?next=/offers/${offer.id}`} className="btn btn-primary">Sign in to redeem</Link>
                <Link href="/signup" className="btn btn-ghost">Join</Link>
              </div>
            </>
          ) : profile?.status === 'approved' ? (
            <>
              <h2 style={{ fontSize: 40 }}>Ready when you are</h2>
              <p>
                {offer.redeem_type === 'link'
                  ? `Tap Redeem and we'll take you to ${p?.name}'s booking page.`
                  : offer.redeem_type === 'code'
                  ? 'Tap Redeem to reveal your promo code.'
                  : 'Tap Redeem, then show your membership card at the front desk.'}
              </p>
              <form action={redeemOffer}>
                <input type="hidden" name="offer_id" value={offer.id} />
                <button type="submit" className="btn btn-brass" style={{ width: '100%' }}>Redeem offer</button>
              </form>
            </>
          ) : profile?.status === 'rejected' ? (
            <>
              <h2 style={{ fontSize: 40 }}>Membership not active</h2>
              <p>We couldn't verify your membership. Email <a href="mailto:info@fortitudeclub.ca">info@fortitudeclub.ca</a> and we'll sort it out.</p>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 40 }}>Almost there</h2>
              <p>We're verifying your work email. You can redeem offers as soon as your membership is approved.</p>
              <div><Link href="/card" className="btn btn-ghost">Check my status</Link></div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
