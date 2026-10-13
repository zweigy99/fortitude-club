import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Partners | Fortitude Club' };

export default async function PartnersPage() {
  const supabase = createClient();
  const { data: partners } = await supabase
    .from('partners')
    .select('id, name, category, neighbourhood, address, website, description')
    .eq('active', true)
    .order('name');

  return (
    <>
      <section className="section">
        <div className="wrap stack-lg">
          <div className="stack">
            <h1>Our partners</h1>
            <p className="lede">Every partner is carefully selected to deliver measurable value, from fitness studios and recovery clinics to nutrition and mental wellness.</p>
          </div>
          <div className="grid">
            {(partners ?? []).map((p) => (
              <article key={p.id} className="panel stack" style={{ gap: 8 }}>
                <span className="small muted">{p.category}{p.neighbourhood ? `, ${p.neighbourhood}` : ''}</span>
                <h3>{p.name}</h3>
                {p.description && <p>{p.description}</p>}
                {p.address && <p className="small muted">{p.address}</p>}
                {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer">Visit website</a>}
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="band section">
        <div className="wrap stack" style={{ maxWidth: 760 }}>
          <h2>Become a partner</h2>
          <p>Fortitude sends highly engaged local professionals your way. Members keep booking through your own system, so nothing changes at your front desk, and you only offer what makes sense for your business.</p>
          <div><a href="mailto:info@fortitudeclub.ca?subject=Partnering%20with%20Fortitude%20Club" className="btn btn-brass">Email us about partnering</a></div>
        </div>
      </section>
    </>
  );
}
