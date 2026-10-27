import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin | Fortitude Club' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="wrap" style={{ paddingBottom: 80 }}>
      <nav className="admin-nav" aria-label="Admin">
        <Link href="/admin" className="chip">Members</Link>
        <Link href="/admin/leads" className="chip">Partner leads</Link>
        <Link href="/admin/redemptions" className="chip">Redemptions</Link>
        <Link href="/admin/offers" className="chip">Offers and partners</Link>
        <Link href="/admin/requests" className="chip">Partner requests</Link>
        <Link href="/admin/employers" className="chip">Employers</Link>
        <Link href="/employer" className="chip">Employer dashboards</Link>
        <Link href="/admin/announcements" className="chip">Member emails</Link>
        <Link href="/admin/linkedin" className="chip">LinkedIn posts</Link>
        <Link href="/admin/helpbot" className="chip">Help bot</Link>
        <Link href="/admin/reports" className="chip">Partner reports</Link>
        <Link href="/admin/site" className="chip">Site content</Link>
      </nav>
      {children}
    </div>
  );
}
