import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="section">
      <div className="wrap stack-lg" style={{ maxWidth: 720 }}>
        <span className="label">Page not found</span>
        <h1>We couldn&apos;t find that page.</h1>
        <p className="lede">The link may be old, or the page may have moved. Try one of these instead.</p>
        <div className="row">
          <Link href="/" className="btn btn-primary">Home</Link>
          <Link href="/offers" className="btn btn-ghost">Member offers</Link>
          <Link href="/card" className="btn btn-ghost">My card</Link>
        </div>
      </div>
    </section>
  );
}
