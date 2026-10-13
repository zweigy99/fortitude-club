import Link from 'next/link';

export const metadata = { title: 'For employers | Fortitude Club' };

export default function EmployersPage() {
  return (
    <>
      <section className="section">
        <div className="wrap stack-lg">
          <div className="stack">
            <h1>Better benefits. Healthier teams.</h1>
            <p className="lede">
              Fortitude helps employers deliver wellness benefits employees actually value, while connecting premium
              local wellness providers with highly engaged customers.
            </p>
          </div>
          <div className="split">
            <div className="panel stack" style={{ gap: 8 }}>
              <h3>Within budget</h3>
              <p>One membership gives your whole team access to member offers across our partner network.</p>
            </div>
            <div className="panel stack" style={{ gap: 8 }}>
              <h3>Actually used</h3>
              <p>Employees sign up with their work email and redeem offers from their phone. No codes to lose, no forms to file.</p>
            </div>
            <div className="panel stack" style={{ gap: 8 }}>
              <h3>Local and premium</h3>
              <p>Fitness studios, recovery clinics, nutrition and mental wellness providers, chosen for quality.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="band section">
        <div className="wrap stack" style={{ maxWidth: 760 }}>
          <h2>Ready to reimagine workplace wellness?</h2>
          <p>Let's start the conversation.</p>
          <div className="row">
            <a href="mailto:info@fortitudeclub.ca?subject=Fortitude%20Club%20for%20our%20team" className="btn btn-brass">Email info@fortitudeclub.ca</a>
            <Link href="/offers" className="btn btn-ghost" style={{ color: 'var(--chalk)', borderColor: 'var(--chalk)' }}>See member offers</Link>
          </div>
        </div>
      </section>
    </>
  );
}
