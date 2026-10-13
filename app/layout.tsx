import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Fortitude Club',
  description:
    'Fortitude connects employers with premium local wellness providers, so every employee benefit actually gets used.',
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
          href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=Public+Sans:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <header className="site-header">
          <nav className="wrap nav" aria-label="Main">
            <Link href="/" className="brand">FORTITUDE CLUB</Link>
            <div className="nav-links">
              <Link href="/offers">Offers</Link>
              <Link href="/partners">Partners</Link>
              <Link href="/employers">For employers</Link>
              <Link href="/contact">Contact</Link>
              {profile?.role === 'admin' && <Link href="/admin">Admin</Link>}
              {user ? (
                <Link href="/card" className="btn btn-primary btn-small">My card</Link>
              ) : (
                <>
                  <Link href="/login">Sign in</Link>
                  <Link href="/signup" className="btn btn-primary btn-small">Join with your work email</Link>
                </>
              )}
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="wrap footer-inner">
            <span className="brand" style={{ color: '#eef1ee' }}>FORTITUDE CLUB</span>
            <div className="row" style={{ gap: 22 }}>
              <Link href="/offers">Offers</Link>
              <Link href="/partners">Partners</Link>
              <Link href="/employers">For employers</Link>
              <a href="mailto:info@fortitudeclub.ca">info@fortitudeclub.ca</a>
            </div>
            <span>© {new Date().getFullYear()} Fortitude Club. All rights reserved.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
