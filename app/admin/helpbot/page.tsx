import { requireAdmin } from '@/lib/auth';
import { saveFaq, deleteFaq } from '@/app/actions/helpbot';
import Alerts from '@/components/Alerts';

export default async function HelpBotAdmin({ searchParams }: { searchParams: { saved?: string; handoff?: string } }) {
  const { supabase } = await requireAdmin();
  let q = supabase.from('chat_logs').select('*').order('created_at', { ascending: false }).limit(60);
  if (searchParams.handoff) q = q.eq('handoff', true);
  const [{ data: logs }, { data: faqs }, { count: week }, { count: handoffs }] = await Promise.all([
    q,
    supabase.from('help_faqs').select('*').order('sort_order'),
    supabase.from('chat_logs').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 864e5).toISOString()),
    supabase.from('chat_logs').select('id', { count: 'exact', head: true }).eq('handoff', true).gte('created_at', new Date(Date.now() - 30 * 864e5).toISOString()),
  ]);
  const keySet = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div className="stack-lg">
      <div className="stack">
        <h1 style={{ fontSize: 56 }}>Help bot</h1>
        <p className="muted">&quot;Ask Fortitude&quot; answers member questions using your live partners, offers and the FAQs below. It never shares promo codes.</p>
      </div>
      {!keySet && <div className="alert alert-error">The bot isn&apos;t switched on yet: add <b>ANTHROPIC_API_KEY</b> in Vercel. Until then it tells visitors to email info@fortitudeclub.ca.</div>}
      <Alerts notice={searchParams.saved ? 'Saved. The bot uses it straight away.' : undefined} />
      <div className="stats-strip">
        <div className="stat-item"><span className="stat-value">{week ?? 0}</span><span className="stat-label">Questions, 7 days</span></div>
        <div className="stat-item"><span className="stat-value">{handoffs ?? 0}</span><span className="stat-label">Needed a person, 30 days</span></div>
        <div className="stat-item"><span className="stat-value">{(faqs ?? []).length}</span><span className="stat-label">FAQ answers</span></div>
      </div>

      <div className="stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 32 }}>What people are asking</h2>
          <a href={searchParams.handoff ? '/admin/helpbot' : '/admin/helpbot?handoff=1'} className="small">{searchParams.handoff ? 'Show all' : 'Show only questions it couldn\u2019t answer'}</a>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>When</th><th>Question</th><th>Answer</th></tr></thead>
            <tbody>
              {(logs ?? []).map((l: any) => (
                <tr key={l.id}>
                  <td className="small">{new Date(l.created_at).toLocaleString('en-CA', { dateStyle: 'short', timeStyle: 'short' })}{l.handoff && <><br /><span className="badge badge-warn">Needed a person</span></>}</td>
                  <td className="small">{l.question}</td>
                  <td className="small muted" style={{ whiteSpace: 'pre-line' }}>{l.answer}</td>
                </tr>
              ))}
              {(logs ?? []).length === 0 && <tr><td colSpan={3} className="muted">No questions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="stack">
        <h2 style={{ fontSize: 32 }}>FAQ answers the bot uses</h2>
        <p className="small muted">Add an answer whenever the bot couldn&apos;t help with something. Partner and offer details come from your partner records automatically.</p>
        {(faqs ?? []).map((f: any) => (
          <form key={f.id} action={saveFaq} className="panel form">
            <input type="hidden" name="id" value={f.id} />
            <div className="split" style={{ gap: 16 }}>
              <div className="field"><label>Question</label><input name="question" defaultValue={f.question} /></div>
              <div className="field" style={{ maxWidth: 110 }}><label>Order</label><input name="sort_order" type="number" defaultValue={f.sort_order} /></div>
            </div>
            <div className="field"><label>Answer</label><textarea name="answer" defaultValue={f.answer} /></div>
            <div className="row">
              <button className="btn btn-primary btn-small" type="submit">Save</button>
              <button className="btn btn-danger btn-small" type="submit" formAction={deleteFaq}>Remove</button>
            </div>
          </form>
        ))}
        <form action={saveFaq} className="panel form">
          <h3>Add an answer</h3>
          <div className="field"><label>Question</label><input name="question" required placeholder="e.g. Can I bring a friend?" /></div>
          <div className="field"><label>Answer</label><textarea name="answer" required /></div>
          <input type="hidden" name="sort_order" value="50" />
          <div><button className="btn btn-primary btn-small" type="submit">Add</button></div>
        </form>
      </div>
    </div>
  );
}
