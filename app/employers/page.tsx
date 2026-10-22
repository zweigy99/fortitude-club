import Link from 'next/link';
import { getSetting } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'For employers | Fortitude Club' };

export default async function EmployersPage() {
  const booking = await getSetting('booking_link');
  return (
    <>
      <section className="section">
        <div className="wrap stack-lg">
          <div className="stack" style={{ gap: 18 }}>
            <span className="label">For employers</span>
            <h1>Better benefits.<br />Healthier teams.</h1>
            <p className="lede">
              Fortitude connects employers with premium local wellness providers, making it easier for employees to
              invest in their health while staying within budget.
            </p>
          </div>
          <div className="split">
            <div className="panel stack" style={{ gap: 8 }}>
              <h3>Benefits that get used</h3>
              <p className="muted">Connecting employers with premium local wellness providers, so every employee benefit actually gets used.</p>
            </div>
            <div className="panel stack" style={{ gap: 8 }}>
              <h3>Carefully selected partners</h3>
              <p className="muted">From fitness studios and recovery clinics to nutrition and mental wellness services, every partner is carefully selected to deliver measurable value.</p>
            </div>
            <div className="panel stack" style={{ gap: 8 }}>
              <h3>Within budget</h3>
              <p className="muted">Making it easier for employees to invest in their health while staying within budget.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="band section">
        <div className="wrap stack" style={{ maxWidth: 760, gap: 20 }}>
          <span className="label">Get in touch</span>
          <h2>Ready to reimagine workplace wellness?</h2>
          <p className="muted">Fortitude helps employers deliver wellness benefits employees actually value while connecting premium wellness providers with highly engaged customers. Let's start the conversation.</p>
          <div className="row">
            {booking && <a href={booking} target="_blank" rel="noopener noreferrer" className="btn btn-light">Book a call</a>}
            <a href="mailto:info@fortitudeclub.ca?subject=Fortitude%20Club%20for%20our%20team" className={booking ? 'btn btn-ghost' : 'btn btn-light'} style={booking ? { color: 'var(--paper)', borderColor: 'var(--paper)' } : undefined}>Email info@fortitudeclub.ca</a>
            <Link href="/offers" className="btn btn-ghost" style={{ color: 'var(--paper)', borderColor: 'var(--paper)' }}>See member offers</Link>
          </div>
        </div>
      </section>
    </>
  );
}
