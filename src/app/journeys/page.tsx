import { getTripsWithPhotoCounts } from '@/lib/trips';
import { Journeys } from '@/components/home/Journeys';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Journeys',
  description: 'Explore all travel albums and memories by Arnav Anand.',
};

export const revalidate = 60;

export default async function JourneysPage() {
  const trips = await getTripsWithPhotoCounts().catch(() => []);

  return (
    <div style={{ paddingTop: '5rem', minHeight: '100dvh', background: 'var(--bg-primary)' }}>
      <div className="container" style={{ paddingBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
          fontWeight: 300,
          color: 'var(--text-primary)',
          textAlign: 'center',
          marginBottom: '0.5rem'
        }}>
          All Journeys
        </h1>
        <p style={{
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: '1.125rem',
          marginBottom: '3rem'
        }}>
          Every destination holds a private collection of timeless moments.
        </p>
      </div>

      <Journeys trips={trips} />
    </div>
  );
}
