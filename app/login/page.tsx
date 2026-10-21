import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signIn, resendConfirmation } from '@/app/actions/auth';
import { getSession, safeNext } from '@/lib/auth';
import Alerts from '@/components/Alerts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign in | Fortitude Club' };

export default async function LoginPage({ searchParams }: { searchParams: { error?: string; next?: string; notice?: string; resend?: string; email?: string; resent?: string } }) {
  const next = safeNext(searchParams.next);
  const { user } = await getSession();
  if (user) redirect(next);

  return (
    <section className="section">
      <div className="wrap narrow stack-lg">
        <h1 style={{ fontSize: 56 }}>Sign in</h1>
        <Alerts error={searchParams.error} notice={searchParams.notice} />
        <form action={signIn} className="form">
          <input type="hidden" name="next" value={next} />
          <div className="field">
            <label htmlFor="email">Work email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <button type="submit" className="btn btn-primary">Sign in</button>
        </form>
        <div className="stack" style={{ gap: 6 }}>
          <Link href="/forgot-password" className="small">Forgot your password?</Link>
          {!searchParams.resend && (
            <Link href="/login?resend=1" className="small">Didn't get your confirmation email?</Link>
          )}
          <p className="small">New here? <Link href="/signup">Join with your work email</Link></p>
        </div>
        {searchParams.resend && (
          <div className="panel stack" style={{ gap: 14 }}>
            <h3>Resend confirmation email</h3>
            <p className="muted small">Enter the email you signed up with and we'll send a fresh link. It stays valid for 24 hours.</p>
            {searchParams.resent && (
              <div className="alert alert-ok" role="status">If that account still needs confirming, a new link is on its way. Check your inbox and junk folder.</div>
            )}
            <form action={resendConfirmation} className="form">
              <input type="hidden" name="from" value="login" />
              <div className="field">
                <label htmlFor="resend-email">Work email</label>
                <input id="resend-email" name="email" type="email" autoComplete="email" defaultValue={searchParams.email ?? ''} required />
              </div>
              <div><button type="submit" className="btn btn-ghost">Send a new link</button></div>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
