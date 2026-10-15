import Link from 'next/link';
import MemberCard from '@/components/MemberCard';
import { PartnerBlock } from '@/components/OfferTile';
import { getPartnersWithOffers } from '@/components/partners';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const partners = (await getPartnersWithOffers()).filter((p) => p.offers.length > 0);
  const { user } = await getSession();

  return (
    <>
      <section className="fc-intro">
        <div className="wrap intro-inner">
          <span className="label">Fortitude Club</span>
          <h1>Better benefits.<br />Healthier teams.</h1>
          <div className="intro-actions">
            <Link href={user ? '/card' : '/login'} className="btn btn-outline-light">{user ? 'My membership card' : 'Employee login'}</Link>
            <a href="#learn" className="btn btn-outline-light">Learn more</a>
          </div>
        </div>
      </section>

      <section className="hero" id="learn">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="label">Workplace wellness</span>
            <h2 style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}>Your wellness benefit, on your phone.</h2>
            <p className="lede">
              Fortitude connects employers with premium local wellness providers, making it easier for employees to
              invest in their health while staying within budget.
            </p>
            <div className="row">
              <Link href="/signup" className="btn btn-primary">Join with your work email</Link>
              <Link href="/offers" className="btn btn-ghost">Explore offers</Link>
            </div>
          </div>
          <div className="hero-card">
            <MemberCard name="Your name" employer="Your employer" memberId="FC-001001" since="2026" />
          </div>
        </div>
      </section>

      <section className="band section">
        <div className="wrap split" style={{ gap: 56, alignItems: 'start' }}>
          <div className="stack" style={{ gap: 20 }}>
            <span className="label">How to use Fortitude Club</span>
            <h2>Exclusive local wellness, on us.</h2>
            <p className="muted">
              Fortitude Club connects you with select gyms, studios, recovery facilities and wellness providers in your
              neighbourhood, with offers and discounts you won't find through a typical membership.
            </p>
            <div><Link href="/signup" className="btn btn-light">Sign up for your membership</Link></div>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step-n">1</span>
              <div className="stack" style={{ gap: 4 }}>
                <h3>Sign up for your membership</h3>
                <p>Join with your work email. It takes about a minute, and we verify every member with their employer.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-n">2</span>
              <div className="stack" style={{ gap: 4 }}>
                <h3>Keep your Fortitude card handy</h3>
                <p>Once you're verified, your membership card lives on your phone at fortitudeclub.ca, so it's with you at the door.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-n">3</span>
              <div className="stack" style={{ gap: 4 }}>
                <h3>Redeem in studio</h3>
                <p>Show your Fortitude card in person and quote the discount code for the offer you want.</p>
              </div>
            </div>
            <div className="step">
              <span className="step-n">4</span>
              <div className="stack" style={{ gap: 4 }}>
                <h3>Keep exploring</h3>
                <p>New partners join through the pilot. See who's participating on the partners page.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap stack-lg">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div className="stack" style={{ gap: 12 }}>
              <span className="label">Your Fortitude offers</span>
              <h2>Partners to start with.</h2>
            </div>
            <Link href="/offers" style={{ fontWeight: 500 }}>See all offers</Link>
          </div>
          {partners.length > 0 ? (
            <div>{partners.map((p) => <PartnerBlock key={p.id} partner={p} />)}</div>
          ) : (
            <p className="muted">Partner offers are being added. Sign up now and you'll see them as soon as they go live.</p>
          )}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap stack" style={{ gap: 20 }}>
          <span className="label-quiet">A few things to know</span>
          <div className="split" style={{ gap: 20 }}>
            <p>Bring your membership card to every visit and follow the partner's own booking or redemption instructions.</p>
            <p>Through the pilot we'll host employee-only moments: partner-led lunch &amp; learns and open studio sessions.</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="wrap split">
          <div className="panel stack">
            <span className="label">For employers</span>
            <h2 style={{ fontSize: 36 }}>Ready to reimagine workplace wellness?</h2>
            <p>Fortitude helps employers deliver wellness benefits employees actually value, while connecting premium wellness providers with highly engaged customers.</p>
            <div><Link href="/employers" className="btn btn-primary">Let's start the conversation</Link></div>
          </div>
          <div className="panel stack">
            <span className="label">For wellness partners</span>
            <h2 style={{ fontSize: 36 }}>Reach highly engaged customers.</h2>
            <p>From fitness studios and recovery clinics to nutrition and mental wellness services, every partner is carefully selected to deliver measurable value.</p>
            <div><Link href="/partners" className="btn btn-primary">Become a partner</Link></div>
          </div>
        </div>
      </section>
    </>
  );
}
