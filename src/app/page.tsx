import { Suspense } from 'react';
import { Hero } from '@/components/home/Hero';
import { Glimpses } from '@/components/home/Glimpses';
import { Journeys } from '@/components/home/Journeys';
import { getFeaturedPhotos } from '@/lib/photos';
import { getTripsWithPhotoCounts } from '@/lib/trips';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Arnav Anand Presents — a collection of moments, places & memories.',
};

export const revalidate = 300; // Revalidate every 5 minutes

async function HomeContent() {
  const [featuredPhotos, trips] = await Promise.all([
    getFeaturedPhotos().catch(() => []),
    getTripsWithPhotoCounts().catch(() => []),
  ]);

  return (
    <>
      <Hero featuredPhotos={featuredPhotos} />
      <Glimpses photos={featuredPhotos} />
      <Journeys trips={trips} />
      <AboutSection />
    </>
  );
}

function AboutSection() {
  return (
    <section id="about" style={{
      padding: 'var(--section-padding) 0',
      background: 'var(--bg-primary)',
      textAlign: 'center',
    }}>
      <div className="container">
        <p style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--text-secondary)',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: 1.8,
        }}>
          &ldquo;Collecting memories one frame at a time. These are private windows into journeys that shaped who I am.&rdquo;
        </p>
        <div style={{
          width: '40px', height: '1px',
          background: 'var(--accent-primary)',
          margin: '2rem auto 1.5rem',
        }} />
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.75rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}>
          Arnav Anand
        </p>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
