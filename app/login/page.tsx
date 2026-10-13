import Link from 'next/link';
import { redirect } from 'next/navigation';
import { signIn } from '@/app/actions/auth';
import { getSession, safeNext } from '@/lib/auth';
import Alerts from '@/components/Alerts';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign in | Fortitude Club' };

export default async function LoginPage({ searchParams }: { searchParams: { error?: string; next?: string; notice?: string } }) {
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
          <p className="small">New here? <Link href="/signup">Join with your work email</Link></p>
        </div>
      </div>
    </section>
  );
}
