import { requireAdmin, memberId } from '@/lib/auth';

export default async function AdminRedemptions() {
  const { supabase } = await requireAdmin();
  const [{ data: offerStats }, { data: employerStats }, { data: recent }, totals] = await Promise.all([
    supabase.rpc('offer_redemption_stats'),
    supabase.rpc('employer_stats'),
    supabase
      .from('redemptions')
      .select('id, created_at, offers(title, partners(name)), employers(name), profiles(full_name, work_email, member_number)')
      .order('created_at', { ascending: false })
      .limit(100),
    Promise.all([
      supabase.from('redemptions').select('id', { count: 'exact', head: true }),
      supabase.from('redemptions').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 864e5).toISOString()),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    ]),
  ]);
  const [all, last30, members] = totals.map((t) => t.count ?? 0);

  return (
    <div className="stack-lg">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div className="stack">
          <h1 style={{ fontSize: 56 }}>Redemptions</h1>
          <p className="muted">Every tap on Redeem is recorded with the member, offer, employer and time.</p>
        </div>
        <a href="/admin/redemptions/export" className="btn btn-ghost">Download all as CSV</a>
      </div>

      <div className="split">
        <div className="stat"><div className="stat-n">{all}</div><div className="muted">Redemptions, all time</div></div>
        <div className="stat"><div className="stat-n">{last30}</div><div className="muted">Redemptions, last 30 days</div></div>
        <div className="stat"><div className="stat-n">{members}</div><div className="muted">Approved members</div></div>
      </div>

      <div className="stack">
        <h2 style={{ fontSize: 36 }}>By offer</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Offer</th><th>Partner</th><th>All time</th><th>Last 30 days</th><th>Unique members</th></tr></thead>
            <tbody>
              {(offerStats ?? []).map((s: any) => (
                <tr key={s.offer_id}><td>{s.offer_title}</td><td>{s.partner_name}</td><td>{s.total}</td><td>{s.last_30_days}</td><td>{s.unique_members}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="stack">
        <h2 style={{ fontSize: 36 }}>By employer</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Employer</th><th>Approved members</th><th>Redemptions</th></tr></thead>
            <tbody>
              {(employerStats ?? []).map((s: any) => (
                <tr key={s.employer_id}><td>{s.employer_name}</td><td>{s.approved_members}</td><td>{s.redemptions}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="stack">
        <h2 style={{ fontSize: 36 }}>Latest 100</h2>
        {recent && recent.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>When</th><th>Member</th><th>Employer</th><th>Offer</th><th>Partner</th></tr></thead>
              <tbody>
                {recent.map((r: any) => (
                  <tr key={r.id}>
                    <td>{new Date(r.created_at).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td>{r.profiles?.full_name} <span className="muted small">{memberId(r.profiles?.member_number)}</span></td>
                    <td>{r.employers?.name}</td>
                    <td>{r.offers?.title}</td>
                    <td>{r.offers?.partners?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No redemptions yet. They appear here the moment a member taps Redeem.</p>
        )}
      </div>
    </div>
  );
}
