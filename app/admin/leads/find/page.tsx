import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { findLeads, runSavedSearches, deleteSearch } from '@/app/actions/leadfinder';
import Alerts from '@/components/Alerts';

const AREAS = ['King West', 'Financial District', 'Entertainment District', 'Liberty Village', 'Queen West', 'Yorkville', 'St. Lawrence Market', 'Distillery District', 'Leslieville', 'Ossington', 'Annex', 'Midtown Yonge and Eglinton', 'Waterfront'];
const CATEGORIES = ['reformer Pilates studio', 'yoga studio', 'hot yoga studio', 'spin cycling studio', 'boxing gym', 'Muay Thai gym', 'HIIT boutique gym', 'strength training gym', 'CrossFit gym', 'recovery studio sauna cold plunge', 'infrared sauna studio', 'float spa', 'physiotherapy clinic', 'chiropractor', 'registered massage therapy clinic', 'naturopath clinic', 'registered dietitian', 'psychotherapy clinic', 'climbing gym', 'barre studio'];

export default async function FindLeads({ searchParams }: { searchParams: { added?: string; skipped?: string; q?: string; error?: string } }) {
  const { supabase } = await requireAdmin();
  const { data: searches } = await supabase.from('lead_searches').select('*').order('created_at', { ascending: false });
  const { data: recent } = await supabase.from('leads').select('id, name, category, neighbourhood, rating, review_count, phone, website').eq('source', 'google maps').order('created_at', { ascending: false }).limit(25);
  const keySet = !!process.env.GOOGLE_PLACES_API_KEY;

  return (
    <div className="stack-lg">
      <Link href="/admin/leads" className="small">Back to leads</Link>
      <div className="stack">
        <h1 style={{ fontSize: 56 }}>Find new studios</h1>
        <p className="muted">Searches Google Maps and adds studios you don&apos;t already have as new leads. Existing leads, current partners and (optionally) big chains are skipped.</p>
      </div>
      {!keySet && (
        <div className="alert alert-error">The Google Maps key isn&apos;t set up yet, so searches won&apos;t run. Add <b>GOOGLE_PLACES_API_KEY</b> in Vercel.</div>
      )}
      <Alerts
        error={searchParams.error}
        notice={searchParams.added ? `${searchParams.q}: added ${searchParams.added} new lead${searchParams.added === '1' ? '' : 's'}, skipped ${searchParams.skipped} (already in your list, chains or too few reviews).` : undefined}
      />

      <form action={findLeads} className="panel form">
        <div className="split" style={{ gap: 16 }}>
          <div className="field">
            <label htmlFor="area">Area</label>
            <input id="area" name="area" list="areas" required placeholder="e.g. King West" />
            <datalist id="areas">{AREAS.map((a) => <option key={a} value={a} />)}</datalist>
          </div>
          <div className="field">
            <label htmlFor="cat">Type of studio</label>
            <input id="cat" name="category" list="cats" required placeholder="e.g. reformer Pilates studio" />
            <datalist id="cats">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div className="field" style={{ maxWidth: 170 }}>
            <label htmlFor="mr">Minimum Google reviews</label>
            <input id="mr" name="min_reviews" type="number" defaultValue={10} min={0} />
          </div>
        </div>
        <div className="row" style={{ gap: 24 }}>
          <label className="check"><input type="checkbox" name="skip_chains" defaultChecked /> Skip big chains</label>
          <label className="check"><input type="checkbox" name="save" defaultChecked /> Save this search to re-run later</label>
        </div>
        <div><button className="btn btn-primary" type="submit" disabled={!keySet}>Find studios</button></div>
        <p className="small muted">Each search checks up to 40 places. Google gives phone and website but not email, so add the owner&apos;s email when you find it.</p>
      </form>

      <div className="stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 32 }}>Saved searches</h2>
          {(searches ?? []).length > 0 && (
            <form action={runSavedSearches}><button className="btn btn-ghost" type="submit" disabled={!keySet}>Run all saved searches</button></form>
          )}
        </div>
        <p className="small muted">Run these every week or two to catch new studios as they open.</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Type</th><th>Area</th><th>Last run</th><th>New last time</th><th></th></tr></thead>
            <tbody>
              {(searches ?? []).map((s: any) => (
                <tr key={s.id}>
                  <td>{s.category}</td><td>{s.area}</td>
                  <td className="small">{s.last_run_at ? new Date(s.last_run_at).toLocaleDateString('en-CA') : 'Never'}</td>
                  <td>{s.last_added}</td>
                  <td><form action={deleteSearch}><input type="hidden" name="id" value={s.id} /><button className="linkbtn small" type="submit">Remove</button></form></td>
                </tr>
              ))}
              {(searches ?? []).length === 0 && <tr><td colSpan={5} className="muted">No saved searches yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="stack">
        <h2 style={{ fontSize: 32 }}>Recently found</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Studio</th><th>Type · Area</th><th>Google rating</th><th>Phone</th></tr></thead>
            <tbody>
              {(recent ?? []).map((l: any) => (
                <tr key={l.id}>
                  <td><Link href={`/admin/leads/${l.id}`} style={{ fontWeight: 600 }}>{l.name}</Link>{l.website && <><br /><a href={l.website} target="_blank" rel="noopener noreferrer" className="small">Website</a></>}</td>
                  <td className="small">{l.category} · {l.neighbourhood}</td>
                  <td className="small">{l.rating ? `${l.rating} (${l.review_count})` : '—'}</td>
                  <td className="small">{l.phone ?? '—'}</td>
                </tr>
              ))}
              {(recent ?? []).length === 0 && <tr><td colSpan={4} className="muted">Nothing found yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
