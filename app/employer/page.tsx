import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Employer dashboard | Fortitude Club' };

export default async function EmployerDashboard({ searchParams }: { searchParams: { id?: string } }) {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect('/login?next=/employer');
  const isAdmin = profile?.role === 'admin';
  if (!isAdmin && profile?.role !== 'employer') redirect('/card');

  const { data: employers } = isAdmin ? await supabase.from('employers').select('id, name').order('name') : { data: null };
  const employerId = isAdmin ? searchParams.id ?? employers?.[0]?.id : profile?.employer_id;
  const { data: d } = employerId ? await supabase.rpc('employer_dashboard', { p_employer: employerId }) : { data: null };
  const s: any = d ?? {};
  const max = Math.max(1, ...((s.by_month ?? []) as any[]).map((m: any) => m.n));

  return (
    <section className="section">
      <div className="wrap stack-lg">
        <div className="stack" style={{ gap: 12 }}>
          <span className="label">Employer dashboard</span>
          <h1 style={{ fontSize: 'clamp(38px, 5vw, 60px)' }}>{s.employer ?? 'Your team'}</h1>
          <p className="muted">How your team is using Fortitude Club. Individual names are never shown, only totals.</p>
        </div>

        {isAdmin && employers && (
          <nav className="filters" aria-label="Choose employer">
            {employers.map((e) => (
              <Link key={e.id} href={`/employer?id=${e.id}`} className="chip" aria-current={e.id === employerId ? 'page' : undefined}>{e.name}</Link>
            ))}
          </nav>
        )}

        {!d ? (
          <div className="panel"><p className="muted">No employer is linked to this account yet. Email info@fortitudeclub.ca.</p></div>
        ) : (
          <>
            <div className="stats-strip">
              <div className="stat-item"><span className="stat-value">{s.approved}</span><span className="stat-label">Active members</span></div>
              <div className="stat-item"><span className="stat-value">{s.active_members_30d}</span><span className="stat-label">Used it in 30 days</span></div>
              <div className="stat-item"><span className="stat-value">{s.redemptions_30d}</span><span className="stat-label">Redemptions, 30 days</span></div>
              <div className="stat-item"><span className="stat-value">{s.redemptions_total}</span><span className="stat-label">Redemptions, all time</span></div>
            </div>

            <div className="split" style={{ alignItems: 'start' }}>
              <div className="panel stack">
                <h3>Redemptions by month</h3>
                {(s.by_month ?? []).length ? (
                  <div className="stack" style={{ gap: 8 }}>
                    {(s.by_month as any[]).map((m) => (
                      <div key={m.month} style={{ display: 'grid', gridTemplateColumns: '72px 1fr 36px', gap: 10, alignItems: 'center', fontSize: 14 }}>
                        <span className="muted">{m.month}</span>
                        <span style={{ height: 12, background: 'var(--teal)', width: `${(m.n / max) * 100}%`, minWidth: 4, borderRadius: 2 }} />
                        <span style={{ textAlign: 'right' }}>{m.n}</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="muted">No redemptions yet.</p>}
              </div>
              <div className="panel stack">
                <h3>Most popular offers</h3>
                {(s.by_offer ?? []).length ? (
                  <table>
                    <tbody>
                      {(s.by_offer as any[]).map((o, i) => (
                        <tr key={i}><td>{o.offer}<br /><span className="muted small">{o.partner}</span></td><td style={{ textAlign: 'right' }}><strong>{o.n}</strong></td></tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="muted">No redemptions yet.</p>}
              </div>
            </div>
            {s.pending > 0 && <p className="muted small">{s.pending} sign-up(s) from your team are waiting for verification.</p>}
          </>
        )}
      </div>
    </section>
  );
}
