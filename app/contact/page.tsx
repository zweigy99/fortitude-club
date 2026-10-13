export const metadata = { title: 'Contact | Fortitude Club' };

export default function ContactPage() {
  return (
    <section className="section">
      <div className="wrap stack-lg" style={{ maxWidth: 760 }}>
        <h1>Get in touch</h1>
        <p className="lede">Questions about membership, bringing Fortitude to your workplace, or partnering with us? Email us and we'll reply.</p>
        <div className="panel stack">
          <h3>Email</h3>
          <a href="mailto:info@fortitudeclub.ca" style={{ fontSize: 22, fontWeight: 600 }}>info@fortitudeclub.ca</a>
          <p className="muted small">Members: include your work email so we can find your account.</p>
        </div>
      </div>
    </section>
  );
}
