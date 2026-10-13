import Link from 'next/link';
import MemberCard from '@/components/MemberCard';
import OfferTile, { OfferRow } from '@/components/OfferTile';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = createClient();
  const { data: offers } = await supabase
    .from('offers')
    .select('id, title, description, partners(name, category, neighbourhood, image_url)')
    .eq('active', true)
    .order('sort_order')
    .limit(3);

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <h1>Your work perk at Toronto's best studios.</h1>
            <p className="lede">
              Fortitude connects employers with premium local wellness providers, so every employee benefit actually
              gets used. Sign up with your work email, carry your membership card on your phone, and redeem offers in a
              tap.
            </p>
            <div className="row">
              <Link href="/signup" className="btn btn-primary">Get my membership card</Link>
              <Link href="/offers" className="btn btn-ghost">Browse offers</Link>
            </div>
          </div>
          <div className="hero-card">
            <MemberCard name="Your name" employer="Your employer" memberId="FC-001001" since="2026" tilt />
          </div>
        </div>
      </section>

      <section className="band section">
        <div className="wrap stack-lg">
          <h2>How it works</h2>
          <div className="steps">
            <div className="step">
              <span className="step-n">1</span>
              <h3>Sign up with your work email</h3>
              <p>Create an account with the email your employer gave you, then confirm it from your inbox.</p>
            </div>
            <div className="step">
              <span className="step-n">2</span>
              <h3>We verify you</h3>
              <p>Our team confirms your employer is a Fortitude member. Your card switches on as soon as you're approved.</p>
            </div>
            <div className="step">
              <span className="step-n">3</span>
              <h3>Show your card and redeem</h3>
              <p>Pick an offer, tap Redeem, and show your live membership card at the front desk.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap stack-lg">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <h2>Member offers</h2>
            <Link href="/offers" style={{ fontWeight: 600 }}>See all offers</Link>
          </div>
          {offers && offers.length > 0 ? (
            <div className="grid">
              {offers.map((o) => <OfferTile key={o.id} offer={o as unknown as OfferRow} />)}
            </div>
          ) : (
            <p className="muted">New partner offers are being added. Sign up now and you'll see them as soon as they go live.</p>
          )}
        </div>
      </section>

      <section className="section" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="wrap split">
          <div className="panel stack">
            <h2 style={{ fontSize: 44 }}>For employers</h2>
            <p>Give your team a wellness benefit they actually use, within budget. You see participation; your people choose where they go.</p>
            <div><Link href="/employers" className="btn btn-primary">How it works for employers</Link></div>
          </div>
          <div className="panel stack">
            <h2 style={{ fontSize: 44 }}>For wellness partners</h2>
            <p>Reach highly engaged local professionals. Members book through your own system, so nothing changes at your front desk.</p>
            <div><Link href="/partners" className="btn btn-primary">Become a partner</Link></div>
          </div>
        </div>
      </section>
    </>
  );
}
