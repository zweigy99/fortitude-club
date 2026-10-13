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
        <Link href="/admin/redemptions" className="chip">Redemptions</Link>
        <Link href="/admin/offers" className="chip">Offers and partners</Link>
        <Link href="/admin/employers" className="chip">Employers</Link>
      </nav>
      {children}
    </div>
  );
}
