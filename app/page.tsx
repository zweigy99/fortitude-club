import Link from 'next/link';
import MemberCard from '@/components/MemberCard';
import { PartnerBlock, LogoStrip } from '@/components/OfferTile';
import { getPartnersWithOffers } from '@/components/partners';
import { getSession, getSetting } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const partners = (await getPartnersWithOffers()).filter((p) => p.offers.length > 0);
  const { user } = await getSession();
  const { data: stats } = await createClient().from('site_stats').select('id, label, value').order('sort_order');
  const booking = await getSetting('booking_link');

  return (
    <>
      <section
        className="fc-intro has-photo"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1717500252297-b09508db7ceb?fm=jpg&q=70&w=2400&auto=format&fit=crop')" }}
      >
        <div className="wrap intro-inner">
          <span className="label">Fortitude Club</span>
          <h1>Better benefits.<br />Healthier teams.</h1>
          <div className="intro-actions">
            <Link href={user ? '/card' : '/login'} className="btn btn-outline-light">{user ? 'My membership card' : 'Employee login'}</Link>
            <a href="#learn" className="btn btn-outline-light">Learn more</a>
          </div>
        </div>
        <a
          href="https://unsplash.com/photos/a-room-filled-with-lots-of-machines-and-a-plant-7UoAoaVVyRE"
          target="_blank"
          rel="noopener noreferrer"
          style={{ position: 'absolute', right: 16, bottom: 12, fontSize: 11, color: 'rgba(248,246,241,.55)', textDecoration: 'none' }}
        >
          Photo: Ahmet Kurt / Unsplash
        </a>
      </section>

      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="wrap stack-lg">
          <div className="stack" style={{ gap: 10 }}>
            <span className="label">Who is Fortitude for?</span>
            <h2>Choose your path.</h2>
          </div>
          <div className="audience">
            <Link href={user ? '/card' : '/signup'} className="audience-tile">
              <span className="label">I&apos;m an employee</span>
              <span className="audience-title">Get my membership card</span>
              <span className="muted">Sign up with your work email and unlock exclusive local wellness offers.</span>
              <span className="audience-go">{user ? 'Open my card' : 'Join now'} →</span>
            </Link>
            <Link href="/employers" className="audience-tile">
              <span className="label">I&apos;m an employer</span>
              <span className="audience-title">Bring Fortitude to my team</span>
              <span className="muted">Better benefits, healthier teams, and wellness benefits that actually get used.</span>
              <span className="audience-go">See how it works →</span>
            </Link>
            <Link href="/partners#become-a-partner" className="audience-tile">
              <span className="label">I&apos;m a studio or clinic</span>
              <span className="audience-title">Become a partner</span>
              <span className="muted">Reach highly engaged local professionals with no change to your front desk.</span>
              <span className="audience-go">Partner with us →</span>
            </Link>
          </div>
          {stats && stats.length > 0 && (
            <div className="stats-strip">
              {stats.map((st: any) => (
                <div key={st.id} className="stat-item">
                  <span className="stat-value">{st.value}</span>
                  <span className="stat-label">{st.label}</span>
                </div>
              ))}
            </div>
          )}
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

      {partners.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap stack" style={{ gap: 20 }}>
            <span className="label-quiet">Our partners</span>
            <LogoStrip partners={partners} />
          </div>
        </section>
      )}

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
                <p>We're adding new partners all the time. See who's participating on the partners page.</p>
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
            <p>We also host employee-only moments: partner-led lunch &amp; learns and open studio sessions.</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="wrap split">
          <div className="panel stack">
            <span className="label">For employers</span>
            <h2 style={{ fontSize: 36 }}>Ready to reimagine workplace wellness?</h2>
            <p>Fortitude helps employers deliver wellness benefits employees actually value, while connecting premium wellness providers with highly engaged customers.</p>
            <div className="row">
              {booking && <a href={booking} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Book a call</a>}
              <Link href="/employers" className={booking ? 'btn btn-ghost' : 'btn btn-primary'}>Let&apos;s start the conversation</Link>
            </div>
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
