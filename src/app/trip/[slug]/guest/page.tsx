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
    title: trip ? `${trip.name} — Guest Album` : 'Guest Album',
    robots: { index: false, follow: false },
  };
}

export default async function GuestGalleryPage({ params }: PageProps) {
  const { slug } = await params;

  const trip = await getTripBySlug(slug).catch(() => null);
  if (!trip || !trip.guest_enabled) redirect(`/trip/${slug}`);

  // If guest access is public, no session needed
  if (trip.guest_access_type === 'password_protected') {
    const hasAccess = await verifyTripSession(slug, trip.id, 'guest');
    if (!hasAccess) redirect(`/trip/${slug}`);
  }

  return <GalleryClient slug={slug} isGuest={true} />;
}
