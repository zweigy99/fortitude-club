import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { updateDetails, submitOfferRequest } from '@/app/actions/partner';
import Alerts from '@/components/Alerts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Partner portal | Fortitude Club' };

const ACTION_LABEL: Record<string, string> = { edit: 'Edit', new: 'New offer', pause: 'Pause', resume: 'Turn back on' };

export default async function PartnerPortal({ searchParams }: { searchParams: { saved?: string; requested?: string; error?: string } }) {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect('/login?next=/partner');
  if (profile?.role !== 'partner' || !profile.partner_id) redirect('/card');
  const pid = profile.partner_id;
  const [{ data: p }, { data: offers }, { data: requests }, { data: stats }] = await Promise.all([
    supabase.from('partners').select('*').eq('id', pid).maybeSingle(),
    supabase.from('offers').select('*').eq('partner_id', pid).order('sort_order'),
    supabase.from('offer_requests').select('*, offers(title)').eq('partner_id', pid).order('created_at', { ascending: false }).limit(20),
    supabase.rpc('partner_stats'),
  ]);
  if (!p) redirect('/card');
  const s: any = stats ?? {};
  const max = Math.max(1, ...((s.by_month ?? []) as any[]).map((m: any) => m.n));
  const pending = (requests ?? []).filter((r: any) => r.status === 'pending');
  const photos: string[] = (p.photos ?? '').split('\n').map((x: string) => x.trim()).filter(Boolean);

  return (
    <section className="section">
      <div className="wrap stack-lg">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div className="stack" style={{ gap: 10 }}>
            <span className="label">Partner portal</span>
            {p.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.logo_url} alt={p.name} style={{ height: 60, width: 'auto', maxWidth: 260, objectFit: 'contain' }} />
            ) : (
              <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>{p.name}</h1>
            )}
            <p className="muted">Hi {(profile.full_name || '').split(' ')[0] || 'there'}. Manage how {p.name} appears on Fortitude Club.</p>
          </div>
          {p.slug && <Link href={`/partners/${p.slug}`} className="btn btn-ghost" target="_blank">View my public page</Link>}
        </div>
        <Alerts
          error={searchParams.error}
          notice={searchParams.saved ? 'Saved. Your changes are live on fortitudeclub.ca.' : searchParams.requested ? 'Request sent. The Fortitude team will review it and email you when it\u2019s decided.' : undefined}
        />

        <div className="stack">
          <h2 style={{ fontSize: 32 }}>Your results</h2>
          <div className="stats-strip">
            <div className="stat-item"><span className="stat-value">{s.last_30 ?? 0}</span><span className="stat-label">Redemptions, 30 days</span></div>
            <div className="stat-item"><span className="stat-value">{s.total ?? 0}</span><span className="stat-label">Redemptions, all time</span></div>
            <div className="stat-item"><span className="stat-value">{s.members ?? 0}</span><span className="stat-label">Members who visited</span></div>
            <div className="stat-item"><span className="stat-value">{s.employers ?? 0}</span><span className="stat-label">Companies they work for</span></div>
          </div>
          {(s.by_month ?? []).length > 0 && (
            <div className="panel stack" style={{ gap: 8 }}>
              <h3>By month</h3>
              {(s.by_month as any[]).map((m) => (
                <div key={m.month} style={{ display: 'grid', gridTemplateColumns: '72px 1fr 36px', gap: 10, alignItems: 'center', fontSize: 14 }}>
                  <span className="muted">{m.month}</span>
                  <span style={{ height: 12, background: 'var(--teal)', width: `${(m.n / max) * 100}%`, minWidth: 4, borderRadius: 2 }} />
                  <span style={{ textAlign: 'right' }}>{m.n}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="stack" id="offers">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 32 }}>Your offers</h2>
            <Link href="/partner/request?new=1" className="btn btn-primary">Suggest a new offer</Link>
          </div>
          <p className="muted small">Offer changes are reviewed by the Fortitude team before going live, usually within one business day.</p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Offer</th><th>Status</th><th>Redeemed (30 days / all)</th><th></th></tr></thead>
              <tbody>
                {(offers ?? []).map((o: any) => {
                  const st = (s.by_offer ?? []).find((b: any) => b.title === o.title);
                  const hasPending = pending.some((r: any) => r.offer_id === o.id);
                  return (
                    <tr key={o.id}>
                      <td><span className="label-quiet">{o.kind}</span><br /><strong>{o.title}</strong>{o.promo_code && <><br /><span className="small muted">Code: {o.promo_code}</span></>}</td>
                      <td>{o.active ? <span className="badge badge-ok">Live</span> : <span className="badge badge-warn">Paused</span>}{hasPending && <><br /><span className="badge badge-warn" style={{ marginTop: 4 }}>Change pending</span></>}</td>
                      <td>{st?.n30 ?? 0} / {st?.n ?? 0}</td>
                      <td>
                        <div className="row" style={{ gap: 8 }}>
                          <Link href={`/partner/request?offer=${o.id}`} className="btn btn-ghost btn-small">Suggest edits</Link>
                          <form action={submitOfferRequest}>
                            <input type="hidden" name="offer_id" value={o.id} />
                            <input type="hidden" name="action" value={o.active ? 'pause' : 'resume'} />
                            <button className="linkbtn small" type="submit">{o.active ? 'Request pause' : 'Request turn on'}</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {(requests ?? []).length > 0 && (
            <details className="panel">
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Your requests ({pending.length} pending)</summary>
              <div className="table-wrap" style={{ marginTop: 12 }}>
                <table>
                  <thead><tr><th>Date</th><th>Request</th><th>Status</th><th>Note from Fortitude</th></tr></thead>
                  <tbody>
                    {(requests as any[]).map((r) => (
                      <tr key={r.id}>
                        <td className="small">{new Date(r.created_at).toLocaleDateString('en-CA')}</td>
                        <td className="small">{ACTION_LABEL[r.action]}: {r.changes?.title ?? r.offers?.title ?? ''}</td>
                        <td>{r.status === 'pending' ? <span className="badge badge-warn">Pending</span> : r.status === 'approved' ? <span className="badge badge-ok">Approved</span> : <span className="badge badge-bad">Not approved</span>}</td>
                        <td className="small">{r.admin_note ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </div>

        <form action={updateDetails} className="panel form" id="details" encType="multipart/form-data">
          <h2 style={{ fontSize: 32 }}>Your studio page</h2>
          <p className="muted small">These details go live as soon as you save.</p>
          <div className="field"><label htmlFor="d-desc">Description</label><textarea id="d-desc" name="description" defaultValue={p.description ?? ''} style={{ minHeight: 110 }} /></div>
          <div className="split" style={{ gap: 16 }}>
            <div className="field"><label htmlFor="d-hood">Neighbourhood</label><input id="d-hood" name="neighbourhood" defaultValue={p.neighbourhood ?? ''} /></div>
            <div className="field"><label htmlFor="d-addr">Address</label><input id="d-addr" name="address" defaultValue={p.address ?? ''} /></div>
          </div>
          <div className="split" style={{ gap: 16 }}>
            <div className="field"><label htmlFor="d-web">Website</label><input id="d-web" name="website" defaultValue={p.website ?? ''} /></div>
            <div className="field"><label htmlFor="d-email">Contact email (for monthly reports)</label><input id="d-email" name="contact_email" type="email" defaultValue={p.contact_email ?? ''} /></div>
          </div>
          <div className="field"><label htmlFor="d-hours">Hours (one line per day or range)</label><textarea id="d-hours" name="hours" defaultValue={p.hours ?? ''} placeholder={'Mon \u2013 Fri 6am \u2013 9pm\nSat \u2013 Sun 8am \u2013 6pm'} style={{ minHeight: 90 }} /></div>
          <div className="split" style={{ gap: 16, alignItems: 'start' }}>
            <div className="field">
              <label htmlFor="d-logo">Logo</label>
              {p.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.logo_url} alt="Current logo" style={{ height: 48, width: 'auto', maxWidth: 200, objectFit: 'contain', background: '#fff', padding: 6, border: '1px solid var(--line)', marginBottom: 8 }} />
              )}
              <input id="d-logo" name="logo_file" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" />
              <span className="hint">PNG or SVG on a white or transparent background works best. Max 5 MB.</span>
            </div>
            <div className="field">
              <label htmlFor="d-photos-up">Add photos</label>
              <input id="d-photos-up" name="photo_files" type="file" multiple accept="image/png,image/jpeg,image/webp" />
              <span className="hint">Landscape photos of your space look best. Up to 12 in total.</span>
            </div>
          </div>
          {photos.length > 0 && (
            <div className="field">
              <label htmlFor="d-photos">Current photos (delete a line to remove a photo)</label>
              <div className="gallery" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {photos.map((src, i) => <img key={i} src={src} alt={`Photo ${i + 1}`} />)}
              </div>
              <textarea id="d-photos" name="photos" defaultValue={photos.join('\n')} style={{ minHeight: 70, fontSize: 12 }} />
            </div>
          )}
          {photos.length === 0 && <input type="hidden" name="photos" value="" />}
          <div><button className="btn btn-primary" type="submit">Save studio page</button></div>
        </form>
      </div>
    </section>
  );
}
