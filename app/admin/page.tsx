import Link from 'next/link';
import { requireAdmin, memberId } from '@/lib/auth';
import { setMemberStatus, setMemberEmployer, setMemberRole } from '@/app/actions/admin';

const TABS = [
  { key: 'pending', label: 'Waiting for review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default async function AdminMembers({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const { supabase, user } = await requireAdmin();
  const status = TABS.some((t) => t.key === searchParams.status) ? searchParams.status! : 'pending';
  const q = (searchParams.q ?? '').trim();

  let query = supabase
    .from('profiles')
    .select('*, employers(name, email_domain)')
    .eq('status', status)
    .order('created_at', { ascending: status === 'pending' })
    .limit(300);
  const safe = q.replace(/[%*,()]/g, ' ').trim();
  if (safe) query = query.or(`full_name.ilike.*${safe}*,work_email.ilike.*${safe}*`);
  const { data: members } = await query;

  const { data: employers } = await supabase.from('employers').select('id, name').order('name');
  const counts = await Promise.all(
    TABS.map(async (t) => {
      const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', t.key);
      return count ?? 0;
    })
  );

  return (
    <div className="stack-lg">
      <div className="stack">
        <h1 style={{ fontSize: 56 }}>Members</h1>
        <p className="muted">Check each work email against the employer, then approve or reject. A green match means the email domain matches the employer's domain.</p>
      </div>

      <div className="row" style={{ justifyContent: 'space-between' }}>
        <nav className="filters" aria-label="Member status">
          {TABS.map((t, i) => (
            <Link key={t.key} href={`/admin?status=${t.key}`} className="chip" aria-current={status === t.key ? 'page' : undefined}>
              {t.label} ({counts[i]})
            </Link>
          ))}
        </nav>
        <form className="row" action="/admin" role="search">
          <input type="hidden" name="status" value={status} />
          <label htmlFor="q" style={{ position: 'absolute', left: -9999 }}>Search members</label>
          <input id="q" type="search" name="q" defaultValue={q} placeholder="Name or email" style={{ width: 240 }} />
          <button className="btn btn-ghost btn-small" type="submit">Search</button>
        </form>
      </div>

      {members && members.length > 0 ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Work email</th><th>Employer</th><th>Member ID</th><th>Signed up</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m: any) => {
                const domain = (m.work_email.split('@')[1] || '').toLowerCase();
                const expected = m.employers?.email_domain?.toLowerCase();
                const match = expected ? domain === expected || domain.endsWith('.' + expected) : null;
                return (
                  <tr key={m.id}>
                    <td>
                      {m.full_name || '(no name)'}
                      {m.role === 'admin' && <> <span className="badge badge-ok">Admin</span></>}
                    </td>
                    <td>
                      {m.work_email}{' '}
                      {match === true && <span className="badge badge-ok">Domain matches</span>}
                      {match === false && <span className="badge badge-warn">Domain differs</span>}
                    </td>
                    <td>
                      <form action={setMemberEmployer} className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        <input type="hidden" name="id" value={m.id} />
                        <label htmlFor={`emp-${m.id}`} style={{ position: 'absolute', left: -9999 }}>Employer for {m.work_email}</label>
                        <select id={`emp-${m.id}`} name="employer_id" defaultValue={m.employer_id ?? ''} style={{ minHeight: 36, padding: '4px 8px', minWidth: 140 }}>
                          <option value="">No employer</option>
                          {(employers ?? []).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                        <button className="btn btn-ghost btn-small" type="submit">Save</button>
                      </form>
                    </td>
                    <td>{memberId(m.member_number)}</td>
                    <td>{new Date(m.created_at).toLocaleDateString('en-CA')}</td>
                    <td>
                      <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        {status !== 'approved' && (
                          <form action={setMemberStatus}>
                            <input type="hidden" name="id" value={m.id} />
                            <input type="hidden" name="status" value="approved" />
                            <button className="btn btn-primary btn-small" type="submit">Approve</button>
                          </form>
                        )}
                        {status !== 'rejected' && m.id !== user!.id && (
                          <form action={setMemberStatus}>
                            <input type="hidden" name="id" value={m.id} />
                            <input type="hidden" name="status" value="rejected" />
                            <button className="btn btn-danger btn-small" type="submit">{status === 'approved' ? 'Revoke' : 'Reject'}</button>
                          </form>
                        )}
                        {status === 'approved' && m.id !== user!.id && (
                          <form action={setMemberRole}>
                            <input type="hidden" name="id" value={m.id} />
                            <input type="hidden" name="role" value={m.role === 'admin' ? 'member' : 'admin'} />
                            <button className="linkbtn small" type="submit">{m.role === 'admin' ? 'Remove admin' : 'Make admin'}</button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="panel">
          <p className="muted">{status === 'pending' ? 'No one is waiting for review.' : 'No members here yet.'}</p>
        </div>
      )}
    </div>
  );
}
