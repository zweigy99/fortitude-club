import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { STAGES, stageLabel } from '@/lib/crm';
import { createLead, setStage } from '@/app/actions/crm';
import Alerts from '@/components/Alerts';

export default async function AdminLeads({ searchParams }: { searchParams: { stage?: string; q?: string; due?: string; error?: string } }) {
  const { supabase } = await requireAdmin();
  const { data: all } = await supabase
    .from('leads')
    .select('id, name, category, neighbourhood, address, email, phone, stage, owner, next_follow_up, last_contacted_at, do_not_contact')
    .order('updated_at', { ascending: false });
  const leads = (all ?? []) as any[];
  const today = new Date().toISOString().slice(0, 10);
  const isDue = (l: any) => l.next_follow_up && l.next_follow_up <= today && !['signed', 'not_now'].includes(l.stage);
  const counts = Object.fromEntries(STAGES.map((s) => [s.key, leads.filter((l) => l.stage === s.key).length]));
  const dueCount = leads.filter(isDue).length;
  const q = (searchParams.q ?? '').trim().toLowerCase();
  const shown = leads.filter(
    (l) =>
      (!searchParams.stage || l.stage === searchParams.stage) &&
      (!searchParams.due || isDue(l)) &&
      (!q || `${l.name} ${l.category ?? ''} ${l.address ?? ''} ${l.owner ?? ''}`.toLowerCase().includes(q))
  );
  const signed = counts.signed ?? 0;
  const active = leads.length - (counts.new ?? 0) - (counts.not_now ?? 0);

  return (
    <div className="stack-lg">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div className="stack">
          <h1 style={{ fontSize: 56 }}>Partner leads</h1>
          <p className="muted">Every studio you could bring on, where it stands, and who&apos;s due a follow-up.</p>
        </div>
        <div className="row"><Link href="/admin/leads/find" className="btn btn-primary">Find new studios</Link><Link href="/admin/leads/templates" className="btn btn-ghost">Email templates &amp; sender</Link></div>
      </div>
      <Alerts error={searchParams.error} />

      <div className="stats-strip">
        <div className="stat-item"><span className="stat-value">{leads.length}</span><span className="stat-label">Leads</span></div>
        <div className="stat-item"><span className="stat-value">{active}</span><span className="stat-label">In conversation</span></div>
        <div className="stat-item"><span className="stat-value">{counts.meeting ?? 0}</span><span className="stat-label">Meetings booked</span></div>
        <div className="stat-item"><span className="stat-value">{signed}</span><span className="stat-label">Signed</span></div>
      </div>

      {dueCount > 0 && (
        <Link href="/admin/leads?due=1" className="alert alert-ok" style={{ textDecoration: 'none' }}>
          <strong>{dueCount} follow-up{dueCount === 1 ? '' : 's'} due today or overdue.</strong> Click to see them.
        </Link>
      )}

      <div className="row" style={{ justifyContent: 'space-between' }}>
        <nav className="filters" aria-label="Filter by stage">
          <Link href="/admin/leads" className="chip" aria-current={!searchParams.stage && !searchParams.due ? 'page' : undefined}>All ({leads.length})</Link>
          {STAGES.map((s) => (
            <Link key={s.key} href={`/admin/leads?stage=${s.key}`} className="chip" aria-current={searchParams.stage === s.key ? 'page' : undefined}>
              {s.label} ({counts[s.key] ?? 0})
            </Link>
          ))}
        </nav>
        <form className="row" action="/admin/leads" role="search">
          {searchParams.stage && <input type="hidden" name="stage" value={searchParams.stage} />}
          <label htmlFor="lq" className="sr-only">Search leads</label>
          <input id="lq" type="search" name="q" defaultValue={searchParams.q ?? ''} placeholder="Name, category, street, owner" style={{ width: 260 }} />
          <button className="btn btn-ghost btn-small" type="submit">Search</button>
        </form>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Studio</th><th>Category</th><th>Contact</th><th>Stage</th><th>Follow-up</th><th>Owner</th></tr></thead>
          <tbody>
            {shown.map((l) => (
              <tr key={l.id}>
                <td>
                  <Link href={`/admin/leads/${l.id}`} style={{ fontWeight: 600 }}>{l.name}</Link>
                  {l.do_not_contact && <> <span className="badge badge-bad">Unsubscribed</span></>}
                  <br /><span className="muted small">{l.address}</span>
                </td>
                <td className="small">{l.category}</td>
                <td className="small">{l.email ?? <span className="muted">No email yet</span>}<br />{l.phone}</td>
                <td>
                  <form action={setStage} className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="back" value={`/admin/leads${searchParams.stage ? `?stage=${searchParams.stage}` : ''}`} />
                    <label htmlFor={`st-${l.id}`} className="sr-only">Stage for {l.name}</label>
                    <select id={`st-${l.id}`} name="stage" defaultValue={l.stage} style={{ minHeight: 34, padding: '2px 8px', minWidth: 130 }}>
                      {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                    <button className="btn btn-ghost btn-small" type="submit">Set</button>
                  </form>
                </td>
                <td className="small">
                  {l.next_follow_up ? (isDue(l) ? <span className="badge badge-warn">Due {l.next_follow_up}</span> : l.next_follow_up) : <span className="muted">—</span>}
                  {l.last_contacted_at && <><br /><span className="muted">Last: {new Date(l.last_contacted_at).toLocaleDateString('en-CA')}</span></>}
                </td>
                <td className="small">{l.owner ?? <span className="muted">—</span>}</td>
              </tr>
            ))}
            {shown.length === 0 && (<tr><td colSpan={6} className="muted">No leads match. {stageLabel(searchParams.stage ?? '')}</td></tr>)}
          </tbody>
        </table>
      </div>

      <details className="panel">
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Add a lead</summary>
        <form action={createLead} className="form" style={{ marginTop: 16 }}>
          <div className="split" style={{ gap: 16 }}>
            <div className="field"><label htmlFor="n-name">Studio name</label><input id="n-name" name="name" required /></div>
            <div className="field"><label htmlFor="n-cat">Category</label><input id="n-cat" name="category" placeholder="e.g. Pilates & movement" /></div>
            <div className="field"><label htmlFor="n-hood">Neighbourhood</label><input id="n-hood" name="neighbourhood" placeholder="e.g. King West" /></div>
          </div>
          <div className="split" style={{ gap: 16 }}>
            <div className="field"><label htmlFor="n-addr">Address</label><input id="n-addr" name="address" /></div>
            <div className="field"><label htmlFor="n-email">Email</label><input id="n-email" name="email" type="email" /></div>
            <div className="field"><label htmlFor="n-phone">Phone</label><input id="n-phone" name="phone" /></div>
          </div>
          <div className="split" style={{ gap: 16 }}>
            <div className="field"><label htmlFor="n-web">Website</label><input id="n-web" name="website" type="url" placeholder="https://" /></div>
            <div className="field"><label htmlFor="n-owner">Owner on our team</label><input id="n-owner" name="owner" placeholder="e.g. Hayden" /></div>
          </div>
          <div className="field"><label htmlFor="n-why">Why they fit</label><textarea id="n-why" name="why" /></div>
          <div><button className="btn btn-primary" type="submit">Add lead</button></div>
        </form>
      </details>
    </div>
  );
}
