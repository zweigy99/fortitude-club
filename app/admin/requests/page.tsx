import { requireAdmin } from '@/lib/auth';
import { decideRequest } from '@/app/actions/requests';
import Alerts from '@/components/Alerts';

const FIELDS: [string, string][] = [['title', 'Title'], ['kind', 'Type'], ['description', 'Description'], ['steps', 'Steps'], ['redeem_type', 'Redeem by'], ['promo_code', 'Promo code'], ['redeem_url', 'Booking link'], ['terms', 'Terms']];
const LABEL: Record<string, string> = { edit: 'Edit an offer', new: 'New offer', pause: 'Pause an offer', resume: 'Turn an offer back on' };

export default async function Requests({ searchParams }: { searchParams: { done?: string; error?: string; all?: string } }) {
  const { supabase } = await requireAdmin();
  let q = supabase.from('offer_requests').select('*, partners(name), offers(*), profiles:requested_by(full_name, work_email)').order('created_at', { ascending: false });
  if (!searchParams.all) q = q.eq('status', 'pending');
  const { data: reqs } = await q.limit(50);

  return (
    <div className="stack-lg">
      <div className="stack">
        <h1 style={{ fontSize: 56 }}>Partner requests</h1>
        <p className="muted">Offer changes suggested by partners. Nothing goes live until you approve it. Partners are emailed your decision.</p>
        <a href={searchParams.all ? '/admin/requests' : '/admin/requests?all=1'} className="small">{searchParams.all ? 'Show pending only' : 'Show all, including decided'}</a>
      </div>
      <Alerts error={searchParams.error} notice={searchParams.done ? (searchParams.done === 'approve' ? 'Approved. It\u2019s live and the partner has been emailed.' : 'Declined. The partner has been emailed.') : undefined} />
      {(reqs ?? []).length === 0 && <div className="panel"><p className="muted">No pending requests.</p></div>}
      {(reqs ?? []).map((r: any) => (
        <div key={r.id} className="panel stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <strong>{r.partners?.name}</strong> · {LABEL[r.action]}{r.offers?.title ? `: ${r.offers.title}` : ''}
              <br /><span className="small muted">From {r.profiles?.full_name || r.profiles?.work_email} · {new Date(r.created_at).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <span className={`badge ${r.status === 'pending' ? 'badge-warn' : r.status === 'approved' ? 'badge-ok' : 'badge-bad'}`}>{r.status}</span>
          </div>
          {r.note && <p className="small"><b>Partner note:</b> {r.note}</p>}
          {(r.action === 'edit' || r.action === 'new') && (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Field</th>{r.action === 'edit' && <th>Now</th>}<th>Proposed</th></tr></thead>
                <tbody>
                  {FIELDS.filter(([k]) => r.changes?.[k] !== undefined).map(([k, label]) => {
                    const now = r.offers?.[k] ?? '';
                    const next = r.changes[k] ?? '';
                    const changed = String(now) !== String(next);
                    return (
                      <tr key={k} style={changed ? { background: '#fff8e8' } : undefined}>
                        <td className="small"><b>{label}</b>{changed && r.action === 'edit' ? ' \u2022 changed' : ''}</td>
                        {r.action === 'edit' && <td className="small" style={{ whiteSpace: 'pre-line' }}>{String(now)}</td>}
                        <td className="small" style={{ whiteSpace: 'pre-line' }}>{String(next)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {r.status === 'pending' ? (
            <form action={decideRequest} className="form">
              <input type="hidden" name="id" value={r.id} />
              <div className="field"><label htmlFor={`n-${r.id}`}>Note to the partner (optional)</label><input id={`n-${r.id}`} name="admin_note" placeholder="e.g. Approved, thanks! / Could you add an end date?" /></div>
              <div className="row">
                <button className="btn btn-teal" type="submit" name="decision" value="approve">Approve and publish</button>
                <button className="btn btn-danger" type="submit" name="decision" value="reject">Decline</button>
              </div>
            </form>
          ) : (
            r.admin_note && <p className="small muted">Your note: {r.admin_note}</p>
          )}
        </div>
      ))}
    </div>
  );
}
