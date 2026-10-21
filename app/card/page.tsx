import Link from 'next/link';
import { redirect } from 'next/navigation';
import MemberCard from '@/components/MemberCard';
import Alerts from '@/components/Alerts';
import { getSession, memberId } from '@/lib/auth';
import { signOut } from '@/app/actions/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My membership card | Fortitude Club' };

export default async function CardPage({ searchParams }: { searchParams: { notice?: string } }) {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect('/login?next=/card');
  if (!profile) {
    return (
      <section className="section">
        <div className="wrap narrow stack">
          <h1 style={{ fontSize: 56 }}>Account not set up</h1>
          <p>We couldn't find your membership profile. Email <a href="mailto:info@fortitudeclub.ca">info@fortitudeclub.ca</a> from your work email.</p>
          <form action={signOut}>
            <button type="submit" className="btn btn-ghost">Sign out</button>
          </form>
        </div>
      </section>
    );
  }

  const since = new Date(profile.reviewed_at || profile.created_at).toLocaleDateString('en-CA', { month: 'short', year: 'numeric' });
  const { data: history } = await supabase
    .from('redemptions')
    .select('id, created_at, offers(id, title, partners(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <section className="section">
      <div className="wrap stack-lg" style={{ maxWidth: 760 }}>
        <Alerts notice={searchParams.notice} />
        {profile.status === 'approved' ? (
          <>
            <div className="stack">
              <h1 style={{ fontSize: 56 }}>Your membership card</h1>
              <p className="muted">Show this screen at the front desk. The live clock shows staff it isn't a screenshot.</p>
            </div>
            <MemberCard
              name={profile.full_name || profile.work_email}
              employer={profile.employers?.name ?? ''}
              memberId={memberId(profile.member_number)}
              since={since}
              live
            />
            <div className="row">
              <Link href="/offers" className="btn btn-primary">Browse offers</Link>
            </div>
            <div className="stack">
              <h2 style={{ fontSize: 36 }}>Recently redeemed</h2>
              {history && history.length > 0 ? (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Offer</th><th>Partner</th><th>Date</th></tr></thead>
                    <tbody>
                      {history.map((h: any) => (
                        <tr key={h.id}>
                          <td><Link href={`/offers/${h.offers?.id}`}>{h.offers?.title}</Link></td>
                          <td>{h.offers?.partners?.name}</td>
                          <td>{new Date(h.created_at).toLocaleDateString('en-CA')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted">Nothing yet. Pick an offer and tap Redeem to use your membership.</p>
              )}
            </div>
          </>
        ) : profile.status === 'pending' ? (
          <div className="panel stack">
            <span className="badge badge-warn" style={{ alignSelf: 'flex-start' }}>Verification in progress</span>
            <h1 style={{ fontSize: 52 }}>We're verifying your membership</h1>
            <p>Our team is confirming <strong>{profile.work_email}</strong> with {profile.employers?.name ?? 'your employer'}. Your card appears here as soon as you are approved.</p>
            <div><Link href="/offers" className="btn btn-ghost">Browse offers while you wait</Link></div>
          </div>
        ) : (
          <div className="panel stack">
            <span className="badge badge-bad" style={{ alignSelf: 'flex-start' }}>Not verified</span>
            <h1 style={{ fontSize: 52 }}>We couldn't verify your membership</h1>
            <p>Email <a href="mailto:info@fortitudeclub.ca">info@fortitudeclub.ca</a> from {profile.work_email} and we'll look into it.</p>
          </div>
        )}
        <form action={signOut}>
          <button type="submit" className="linkbtn">Sign out</button>
        </form>
      </div>
    </section>
  );
}
