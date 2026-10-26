import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { submitOfferRequest } from '@/app/actions/partner';
import Alerts from '@/components/Alerts';

export const dynamic = 'force-dynamic';

export default async function OfferRequest({ searchParams }: { searchParams: { offer?: string; new?: string; error?: string } }) {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect('/login?next=/partner');
  if (profile?.role !== 'partner' || !profile.partner_id) redirect('/card');
  const { data: o } = searchParams.offer
    ? await supabase.from('offers').select('*').eq('id', searchParams.offer).eq('partner_id', profile.partner_id).maybeSingle()
    : { data: null };
  const isNew = !o;
  const v = (k: string) => (o ? (o as any)[k] ?? '' : '');

  return (
    <section className="section">
      <div className="wrap stack-lg" style={{ maxWidth: 820 }}>
        <Link href="/partner#offers" className="small">Back to partner portal</Link>
        <div className="stack">
          <span className="label">{isNew ? 'Suggest a new offer' : 'Suggest edits'}</span>
          <h1 style={{ fontSize: 'clamp(34px, 5vw, 52px)' }}>{isNew ? 'A new offer for members' : o!.title}</h1>
          <p className="muted">The Fortitude team reviews every offer change before it goes live and will email you when it&apos;s approved.</p>
        </div>
        <Alerts error={searchParams.error} />
        <form action={submitOfferRequest} className="panel form">
          <input type="hidden" name="action" value={isNew ? 'new' : 'edit'} />
          {!isNew && <input type="hidden" name="offer_id" value={o!.id} />}
          <div className="split" style={{ gap: 16 }}>
            <div className="field"><label htmlFor="r-title">Offer title</label><input id="r-title" name="title" defaultValue={v('title')} required placeholder="e.g. First class free" /></div>
            <div className="field">
              <label htmlFor="r-kind">Type</label>
              <select id="r-kind" name="kind" defaultValue={v('kind') || 'Intro offer'}>
                <option>Intro offer</option><option>Standard offer</option><option>Member offer</option>
              </select>
            </div>
          </div>
          <div className="field"><label htmlFor="r-desc">Short description</label><textarea id="r-desc" name="description" defaultValue={v('description')} /></div>
          <div className="field"><label htmlFor="r-steps">How members redeem it, step by step (one per line)</label><textarea id="r-steps" name="steps" defaultValue={v('steps')} style={{ minHeight: 120 }} /></div>
          <div className="split" style={{ gap: 16 }}>
            <div className="field">
              <label htmlFor="r-type">How members redeem</label>
              <select id="r-type" name="redeem_type" defaultValue={v('redeem_type') || 'code'}>
                <option value="code">Promo code</option><option value="show_card">Show membership card</option><option value="link">Booking link</option>
              </select>
            </div>
            <div className="field"><label htmlFor="r-code">Promo code</label><input id="r-code" name="promo_code" defaultValue={v('promo_code')} /></div>
            <div className="field"><label htmlFor="r-url">Booking link</label><input id="r-url" name="redeem_url" defaultValue={v('redeem_url')} placeholder="https://" /></div>
          </div>
          <div className="field"><label htmlFor="r-terms">Terms</label><textarea id="r-terms" name="terms" defaultValue={v('terms')} placeholder="e.g. First-time clients only. Valid until Dec 31." /></div>
          <div className="field"><label htmlFor="r-note">Anything we should know? (optional)</label><textarea id="r-note" name="note" placeholder="e.g. Running this for January only" /></div>
          <div><button className="btn btn-primary" type="submit">Send for approval</button></div>
        </form>
      </div>
    </section>
  );
}
