import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { redeemOffer } from '@/app/actions/member';
import Alerts from '@/components/Alerts';

export const dynamic = 'force-dynamic';

function stepsOf(text: string | null | undefined) {
  return (text ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

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
  const approved = profile?.status === 'approved';
  const redeemed = searchParams.redeemed === '1' && approved;
  const steps = stepsOf(offer.steps);
  const intro = (offer.kind ?? '').toLowerCase().startsWith('intro');

  return (
    <section className="section">
      <div className="wrap stack-lg">
        <Link href="/offers" className="small">Back to all offers</Link>
        <div className="split" style={{ alignItems: 'start', gap: 48 }}>
          <div className="stack" style={{ gap: 18 }}>
            <span className={intro ? 'label' : 'label-quiet'}>{offer.kind || 'Member offer'} at {p?.name}</span>
            <h1 style={{ fontSize: 'clamp(38px, 5vw, 60px)' }}>{offer.title}</h1>
            {offer.description && <p className="lede" style={{ whiteSpace: 'pre-line' }}>{offer.description}</p>}
            <hr className="rule" />
            <div className="stack" style={{ gap: 6 }}>
              <h3>{p?.name}</h3>
              {p?.neighbourhood && <span className="label-quiet">{p.neighbourhood}</span>}
              {p?.description && <p className="muted">{p.description}</p>}
            </div>
            {offer.terms && <p className="muted small" style={{ whiteSpace: 'pre-line' }}>{offer.terms}</p>}
          </div>

          <div className="panel stack">
            <Alerts error={searchParams.error} />
            {redeemed ? (
              <>
                <span className="label">How to redeem</span>
                {offer.promo_code ? (
                  <div className="reveal stack" style={{ gap: 4 }}>
                    <span className="label-quiet">Your code</span>
                    <span className="code">{offer.promo_code}</span>
                  </div>
                ) : (
                  <p>The code for this offer is to follow. Show your Fortitude membership card in person for now.</p>
                )}
                {steps.length > 0 && (
                  <div className="steps">
                    {steps.map((s, i) => (
                      <div className="step" key={i}>
                        <span className="step-n">{i + 1}</span>
                        <p>{s}</p>
                      </div>
                    ))}
                  </div>
                )}
                <p className="small muted">Have your Fortitude membership card with you when you arrive.</p>
                <div className="row">
                  {offer.redeem_url && (
                    <a href={offer.redeem_url} className="btn btn-primary" target="_blank" rel="noopener noreferrer">Open {p?.name} booking</a>
                  )}
                  <Link href="/card" className="btn btn-ghost">Open my card</Link>
                </div>
              </>
            ) : !user ? (
              <>
                <span className="label">Members only</span>
                <h2 style={{ fontSize: 32 }}>Sign in to redeem</h2>
                <p>Sign in with your work email to see the code and step-by-step instructions for this offer.</p>
                <div className="row">
                  <Link href={`/login?next=/offers/${offer.id}`} className="btn btn-primary">Sign in</Link>
                  <Link href="/signup" className="btn btn-ghost">Join</Link>
                </div>
              </>
            ) : approved ? (
              <>
                <span className="label">Ready when you are</span>
                <h2 style={{ fontSize: 32 }}>Redeem this offer</h2>
                <p>Tap below to reveal {offer.promo_code ? 'your code' : 'how to claim this offer'} and the steps to book with {p?.name}.</p>
                <form action={redeemOffer}>
                  <input type="hidden" name="offer_id" value={offer.id} />
                  <button type="submit" className="btn btn-teal" style={{ width: '100%' }}>Redeem offer</button>
                </form>
              </>
            ) : profile?.status === 'rejected' ? (
              <>
                <h2 style={{ fontSize: 32 }}>Membership not active</h2>
                <p>We couldn't verify your membership. Email <a href="mailto:info@fortitudeclub.ca">info@fortitudeclub.ca</a> and we'll sort it out.</p>
              </>
            ) : (
              <>
                <span className="label">Almost there</span>
                <h2 style={{ fontSize: 32 }}>We're verifying your membership</h2>
                <p>You can redeem offers as soon as your membership is approved.</p>
                <div><Link href="/card" className="btn btn-ghost">Check my status</Link></div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
