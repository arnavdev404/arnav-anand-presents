import Link from 'next/link';
import { getTripsWithPhotoCounts } from '@/lib/trips';
import styles from './page.module.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function AdminDashboardPage() {
  const trips = await getTripsWithPhotoCounts().catch(() => []);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.pageTitle}>Admin Dashboard</h1>
          <p className={styles.pageSubtitle}>Manage your travel albums</p>
        </div>
        <Link href="/admin/trips/new" className={styles.createBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create New Trip
        </Link>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{trips.length}</span>
          <span className={styles.statLabel}>Albums</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{trips.reduce((a, t) => a + (t.total_photo_count ?? 0), 0)}</span>
          <span className={styles.statLabel}>Photos</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{trips.filter(t => t.guest_enabled).length}</span>
          <span className={styles.statLabel}>With Guest Albums</span>
        </div>
      </div>

      {/* Trip list */}
      {trips.length === 0 ? (
        <div className={styles.empty}>
          <p>No trips yet. Create your first album!</p>
          <Link href="/admin/trips/new" className="btn btn-primary">
            Create First Trip
          </Link>
        </div>
      ) : (
        <div className={styles.tripList}>
          {trips.map(trip => (
            <div key={trip.id} className={styles.tripRow}>
              <div className={styles.tripInfo}>
                <h2 className={styles.tripName}>{trip.name}</h2>
                <p className={styles.tripMeta}>
                  <span>{trip.trip_date || 'No date'}</span>
                  <span>&middot; <strong>{trip.total_photo_count ?? 0}</strong> photos</span>
                  {(trip.total_photo_count ?? 0) > 0 && (
                    <span>({trip.private_photo_count ?? 0} private · {trip.guest_photo_count ?? 0} guest)</span>
                  )}
                  {trip.guest_enabled && <span className={styles.guestBadge}>Guest Album</span>}
                </p>
              </div>
              <div className={styles.tripActions}>
                <Link href={`/admin/trips/${trip.slug}`} className="btn btn-sm btn-primary">
                  Manage
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
