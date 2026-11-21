import { requireAdmin, siteUrl } from '@/lib/auth';
import { fmtToronto, utcToTorontoInput } from '@/lib/time';
import { generatePosts, savePost, approveAll, deletePost, createConnectionKey } from '@/app/actions/linkedin';
import CopyButton from '@/components/CopyButton';
import Alerts from '@/components/Alerts';

export const dynamic = 'force-dynamic';

const DAYS: [number, string][] = [[1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri']];

export default async function LinkedInStudio({ searchParams }: { searchParams: { error?: string; generated?: string; saved?: string; keyset?: string; show?: string } }) {
  const { supabase } = await requireAdmin();
  const [{ data: posts }, { data: keyDate }, { data: key }] = await Promise.all([
    supabase.from('linkedin_posts').select('*, partners(name)').in('status', ['draft', 'approved']).order('scheduled_for', { ascending: true }),
    supabase.rpc('linkedin_key_status'),
    searchParams.show || searchParams.keyset ? supabase.rpc('linkedin_get_key') : Promise.resolve({ data: null }),
  ]);
  const { data: sent } = await supabase.from('linkedin_posts').select('id, headline, body, sent_at').eq('status', 'sent').order('sent_at', { ascending: false }).limit(10);
  const drafts = (posts ?? []).filter((p: any) => p.status === 'draft').length;
  const site = siteUrl();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="stack-lg">
      <div className="stack">
        <h1 style={{ fontSize: 56 }}>LinkedIn posts</h1>
        <p className="muted">Write posts with AI, approve them, and Make publishes each one to the Fortitude Club company page on its scheduled day.</p>
      </div>
      <Alerts
        error={searchParams.error}
        notice={searchParams.generated ? `${searchParams.generated} new draft posts written. Review and approve them below.` : searchParams.saved ? 'Saved.' : searchParams.keyset ? 'New connection key created. Copy it into Make below.' : undefined}
      />

      <form action={generatePosts} className="panel form">
        <h3>Write new posts</h3>
        <div className="split" style={{ gap: 16 }}>
          <div className="field" style={{ maxWidth: 140 }}><label htmlFor="g-count">How many</label><input id="g-count" name="count" type="number" min={1} max={12} defaultValue={6} /></div>
          <div className="field" style={{ maxWidth: 200 }}><label htmlFor="g-start">Starting</label><input id="g-start" name="start" type="date" defaultValue={today} /></div>
          <div className="field" style={{ maxWidth: 140 }}><label htmlFor="g-time">Time (Toronto)</label><input id="g-time" name="time" type="time" defaultValue="09:00" /></div>
        </div>
        <fieldset className="row" style={{ border: 0, padding: 0, gap: 16 }}>
          <legend className="small" style={{ marginBottom: 6 }}>Days to post</legend>
          {DAYS.map(([n, l]) => (
            <label key={n} className="check"><input type="checkbox" name="days" value={n} defaultChecked={n === 2 || n === 4} /> {l}</label>
          ))}
        </fieldset>
        <div className="field"><label htmlFor="g-focus">Anything to focus on? (optional)</label><input id="g-focus" name="focus" placeholder="e.g. welcome Othership, push employer sign-ups before the holidays" /></div>
        <div><button className="btn btn-primary" type="submit">Write posts</button></div>
        <p className="small muted">Takes about 20 seconds. Posts use your live partners and offers, never include promo codes, and each gets a branded image.</p>
      </form>

      <div className="stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 32 }}>Upcoming ({(posts ?? []).length})</h2>
          {drafts > 0 && <form action={approveAll}><button className="btn btn-teal" type="submit">Approve all {drafts} drafts</button></form>}
        </div>
        <p className="small muted">Only <b>approved</b> posts are published. Make checks every morning and posts anything approved whose time has passed.</p>
        {(posts ?? []).length === 0 && <div className="panel"><p className="muted">No upcoming posts. Write some above.</p></div>}
        {(posts ?? []).map((p: any) => (
          <form key={p.id} id={`post-${p.id}`} action={savePost} className="panel form">
            <input type="hidden" name="id" value={p.id} />
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="row" style={{ gap: 10 }}>
                {p.status === 'approved' ? <span className="badge badge-ok">Approved</span> : <span className="badge badge-warn">Draft</span>}
                <span className="small">{fmtToronto(p.scheduled_for)}</span>
                {p.partners?.name && <span className="small muted">Partner: {p.partners.name}</span>}
              </div>
              <a href={`${site}/api/linkedin/image/${p.id}`} target="_blank" rel="noopener noreferrer" className="small">Open image</a>
            </div>
            <div className="split" style={{ gap: 16, alignItems: 'start' }}>
              <div className="stack" style={{ gap: 12 }}>
                <div className="field"><label htmlFor={`h-${p.id}`}>Image headline</label><input id={`h-${p.id}`} name="headline" defaultValue={p.headline ?? ''} maxLength={80} /></div>
                <div className="field"><label htmlFor={`b-${p.id}`}>Post text</label><textarea id={`b-${p.id}`} name="body" defaultValue={p.body} style={{ minHeight: 200 }} /></div>
                <div className="field" style={{ maxWidth: 240 }}><label htmlFor={`w-${p.id}`}>Post on (Toronto time)</label><input id={`w-${p.id}`} name="when" type="datetime-local" defaultValue={utcToTorontoInput(p.scheduled_for)} /></div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/linkedin/image/${p.id}`} alt="Post image preview" style={{ width: '100%', borderRadius: 4, border: '1px solid var(--line)' }} />
            </div>
            <div className="row">
              <button className="btn btn-ghost btn-small" type="submit" name="intent" value="save">Save</button>
              {p.status === 'draft' ? (
                <button className="btn btn-teal btn-small" type="submit" name="intent" value="approve">Approve</button>
              ) : (
                <button className="btn btn-ghost btn-small" type="submit" name="intent" value="unapprove">Back to draft</button>
              )}
              <button className="btn btn-ghost btn-small" type="submit" name="intent" value="now">Approve &amp; post at next check</button>
              <button className="btn btn-danger btn-small" type="submit" formAction={deletePost}>Skip</button>
            </div>
          </form>
        ))}
      </div>

      <div className="panel stack" id="automation">
        <h2 style={{ fontSize: 28 }}>Automatic posting (Make)</h2>
        <p className="small muted">Make asks the website for the next due post with this request. Keep the connection key private: anyone with it could trigger your approved posts early.</p>
        <div className="field"><label>Request URL (GET)</label><code style={{ wordBreak: 'break-all' }}>{site}/api/linkedin/due</code></div>
        <div className="field"><label>Header name</label><code>x-fortitude-key</code></div>
        <div className="field">
          <label>Connection key</label>
          {key ? (
            <div className="row" style={{ alignItems: 'center' }}>
              <textarea id="conn-key" readOnly defaultValue={key as string} style={{ minHeight: 44, fontFamily: 'monospace', fontSize: 13 }} />
              <CopyButton targetId="conn-key" label="Copy key" />
            </div>
          ) : keyDate ? (
            <p className="small">Created {fmtToronto(keyDate as string)}. <a href="/admin/linkedin?show=1#automation">Show key</a></p>
          ) : (
            <p className="small muted">No key yet.</p>
          )}
        </div>
        <form action={createConnectionKey}><button className="btn btn-primary btn-small" type="submit">{keyDate ? 'Replace connection key' : 'Create connection key'}</button></form>
        {keyDate && <p className="small muted">Replacing the key stops Make until you paste the new key into its HTTP module.</p>}
      </div>

      {(sent ?? []).length > 0 && (
        <div className="stack">
          <h2 style={{ fontSize: 28 }}>Recently sent to LinkedIn</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Sent</th><th>Headline</th><th>Start of post</th></tr></thead>
              <tbody>
                {(sent as any[]).map((s) => (
                  <tr key={s.id}><td className="small">{fmtToronto(s.sent_at)}</td><td className="small">{s.headline}</td><td className="small muted">{s.body.slice(0, 90)}…</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
