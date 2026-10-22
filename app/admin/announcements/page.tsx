import { requireAdmin } from '@/lib/auth';
import { sendAnnouncement } from '@/app/actions/admin';
import Alerts from '@/components/Alerts';

export default async function AdminAnnouncements({ searchParams }: { searchParams: { error?: string; sent?: string; of?: string } }) {
  const { supabase } = await requireAdmin();
  const { data: employers } = await supabase.from('employers').select('id, name').order('name');
  const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved');
  const { data: history } = await supabase.from('announcements').select('*').order('sent_at', { ascending: false }).limit(20);
  const since = new Date(Date.now() - 31 * 864e5).toISOString();
  const { count: newCount } = await supabase.from('offers').select('id', { count: 'exact', head: true }).eq('active', true).gte('created_at', since);

  return (
    <div className="stack-lg">
      <div className="stack">
        <h1 style={{ fontSize: 56 }}>Member emails</h1>
        <p className="muted">Send news to approved members, e.g. a monthly &quot;what&apos;s new&quot; email. There are {count ?? 0} approved members.</p>
      </div>
      <Alerts error={searchParams.error} notice={searchParams.sent ? `Sent to ${searchParams.sent} of ${searchParams.of} members.` : undefined} />
      <form action={sendAnnouncement} className="panel form">
        <div className="field"><label htmlFor="su">Subject</label><input id="su" name="subject" required placeholder="New on Fortitude Club this month" /></div>
        <div className="field">
          <label htmlFor="bo">Message</label>
          <textarea id="bo" name="body" required style={{ minHeight: 180 }} placeholder={'Leave a blank line between paragraphs.'} />
        </div>
        <div className="split" style={{ gap: 16 }}>
          <div className="field">
            <label htmlFor="au">Send to</label>
            <select id="au" name="audience" defaultValue="all">
              <option value="all">All approved members</option>
              {(employers ?? []).map((e) => <option key={e.id} value={e.id}>{e.name} members only</option>)}
            </select>
          </div>
          <label className="check" style={{ alignSelf: 'end', paddingBottom: 12 }}>
            <input type="checkbox" name="include_new" defaultChecked /> Add the list of new offers ({newCount ?? 0} in the last month)
          </label>
        </div>
        <p className="small muted">Emails go out immediately and can&apos;t be unsent. Send a test first by choosing a small group. Resend&apos;s free plan sends up to 100 emails a day.</p>
        <div><button className="btn btn-primary" type="submit">Send email</button></div>
      </form>
      <div className="stack">
        <h2 style={{ fontSize: 32 }}>Sent</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Subject</th><th>Recipients</th></tr></thead>
            <tbody>
              {(history ?? []).map((h: any) => (
                <tr key={h.id}><td>{new Date(h.sent_at).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}</td><td>{h.subject}</td><td>{h.recipients}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
