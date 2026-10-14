import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getSession } from '@/lib/auth';
import mark from '@/components/fc-mark.png';
import lockupWhite from '@/components/fc-lockup-white.png';

export const metadata: Metadata = {
  title: 'Fortitude Club | Better benefits. Healthier teams.',
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
              {user ? (
                <Link href="/card" className="btn btn-primary btn-small">My card</Link>
              ) : (
                <>
                  <Link href="/login">Sign in</Link>
                  <Link href="/signup" className="btn btn-primary btn-small">Join</Link>
                </>
              )}
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="wrap footer-inner">
            <Image src={lockupWhite} alt="Fortitude Club" height={72} style={{ width: 'auto', height: 72 }} />
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
