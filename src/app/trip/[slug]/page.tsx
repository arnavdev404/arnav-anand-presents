import { notFound } from 'next/navigation';
import { getTripBySlug } from '@/lib/trips';
import { TripIntroClient } from '@/components/trip/TripIntroClient';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTripBySlug(slug).catch(() => null);
  if (!trip) return { title: 'Trip Not Found' };
  return {
    title: trip.name,
    description: trip.description || `Private memories from ${trip.name}`,
  };
}

export default async function TripPage({ params }: PageProps) {
  const { slug } = await params;
  const trip = await getTripBySlug(slug).catch(() => null);

  if (!trip) {
    notFound();
  }

  return <TripIntroClient trip={trip} />;
}
