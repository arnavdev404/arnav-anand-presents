import { redirect } from 'next/navigation';
import { verifyAdmin } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import styles from './AdminLayout.module.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s — Admin' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await verifyAdmin();

  if (!auth.isAdmin) redirect('/admin');

  return (
    <div className={styles.adminShell}>
      <AdminSidebar />
      <main className={styles.adminMain}>
        {children}
      </main>
    </div>
  );
}
