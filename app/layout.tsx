import './globals.css';
import './extra.css';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getSession } from '@/lib/auth';
import mark from '@/components/fc-mark.png';
import markWhite from '@/components/fc-mark-white.png';
import InstallPrompt from '@/components/InstallPrompt';
import { signOut } from '@/app/actions/auth';

export const metadata: Metadata = {
  title: 'Fortitude Club | Better benefits. Healthier teams.',
  description:
    'Fortitude connects employers with premium local wellness providers, so every employee benefit actually gets used.',
  appleWebApp: { capable: true, title: 'Fortitude', statusBarStyle: 'default' },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://fortitudeclub.ca'),
  openGraph: {
    type: 'website',
    siteName: 'Fortitude Club',
    title: 'Fortitude Club | Better benefits. Healthier teams.',
    description: 'Premium local wellness for your team. Fortitude connects employers with the best studios, gyms and recovery clinics.',
    url: '/',
  },
  twitter: { card: 'summary_large_image', title: 'Fortitude Club | Better benefits. Healthier teams.', description: 'Premium local wellness for your team.' },
};

export const viewport: Viewport = {
  themeColor: '#f8f6f1',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getSession();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600&display=swap"
        />
      </head>
      <body>
        <header className="site-header">
          <nav className="wrap nav" aria-label="Main">
            <Link href="/" className="brand" aria-label="Fortitude Club home">
              <Image src={mark} alt="" height={40} priority style={{ width: 'auto', height: 40 }} />
              <span className="brand-word">Fortitude Club</span>
            </Link>
            <div className="nav-links">
              <Link href="/offers">Offers</Link>
              <Link href="/partners">Partners</Link>
              <Link href="/employers">For employers</Link>
              <Link href="/contact">Contact</Link>
              {profile?.role === 'admin' && <Link href="/admin">Admin</Link>}
              {profile?.role === 'employer' && <Link href="/employer">Team dashboard</Link>}
              {user ? (
                <>
                  <form action={signOut} style={{ display: 'inline' }}>
                    <button type="submit" style={{ background: 'none', border: 0, padding: 0, font: 'inherit', fontSize: 15, color: 'var(--ink)', cursor: 'pointer' }}>Sign out</button>
                  </form>
                  <Link href="/card" className="btn btn-primary btn-small">My card</Link>
                </>
              ) : (
                <>
                  <Link href="/login">Sign in</Link>
                  <Link href="/signup" className="btn btn-primary btn-small">Join</Link>
                </>
              )}
            </div>
            <details className="mobile-menu">
              <summary aria-label="Menu"><span className="plus" aria-hidden="true">+</span></summary>
              <div className="mobile-panel">
                <Link href="/offers">Offers</Link>
                <Link href="/partners">Partners</Link>
                <Link href="/employers">For employers</Link>
                <Link href="/contact">Contact</Link>
                {profile?.role === 'admin' && <Link href="/admin">Admin</Link>}
                {profile?.role === 'employer' && <Link href="/employer">Team dashboard</Link>}
                {user ? (
                  <>
                    <form action={signOut}>
                      <button type="submit" style={{ background: 'none', border: 0, borderBottom: '1px solid var(--line)', padding: '15px 0', width: '100%', textAlign: 'left', font: 'inherit', fontSize: 18, color: 'var(--ink)', cursor: 'pointer' }}>Sign out</button>
                    </form>
                    <Link href="/card" className="btn btn-primary">My card</Link>
                  </>
                ) : (
                  <>
                    <Link href="/login">Employee login</Link>
                    <Link href="/signup" className="btn btn-primary">Join with your work email</Link>
                  </>
                )}
              </div>
            </details>
          </nav>
        </header>
        <main>{children}</main>
        {user && <InstallPrompt />}
        <footer className="site-footer">
          <div className="wrap footer-inner">
            <div className="brand" style={{ color: 'var(--paper)' }}>
              <Image src={markWhite} alt="" height={56} style={{ width: 'auto', height: 56 }} />
              <span className="brand-word">Fortitude Club</span>
            </div>
            <p style={{ maxWidth: 360 }}>
              Connecting employers with premium local wellness providers, so every employee benefit actually gets used.
            </p>
            <div className="stack" style={{ gap: 6 }}>
              <div className="row" style={{ gap: 20 }}>
                <Link href="/offers">Offers</Link>
                <Link href="/partners">Partners</Link>
                <Link href="/employers">For employers</Link>
                <Link href="/contact">Contact</Link>
              </div>
              <a href="mailto:info@fortitudeclub.ca">info@fortitudeclub.ca</a>
              <span>© {new Date().getFullYear()} Fortitude Club. All rights reserved.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
