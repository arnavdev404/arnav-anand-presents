import { redirect } from 'next/navigation';
import { getTripBySlug } from '@/lib/trips';
import { verifyTripSession } from '@/lib/session';
import { GalleryClient } from '@/components/gallery/GalleryClient';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTripBySlug(slug).catch(() => null);
  return {
    title: trip ? `${trip.name} Gallery` : 'Gallery',
    robots: { index: false, follow: false },
  };
}

export default async function GalleryPage({ params }: PageProps) {
  const { slug } = await params;

  const trip = await getTripBySlug(slug).catch(() => null);
  if (!trip) redirect(`/trip/${slug}`);

  // Server-side auth check — if trip has password and no session, redirect to password page
  if (trip.has_password) {
    const hasAccess = await verifyTripSession(slug, trip.id, 'private');
    if (!hasAccess) {
      redirect(`/trip/${slug}`);
    }
  }

  return <GalleryClient slug={slug} isGuest={false} />;
}
