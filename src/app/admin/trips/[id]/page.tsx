import { notFound } from 'next/navigation';
import { getTripBySlug } from '@/lib/trips';
import { TripManageClient } from '@/components/admin/TripManageClient';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const trip = await getTripBySlug(id).catch(() => null);
  return {
    title: trip ? `Manage ${trip.name}` : 'Manage Trip',
  };
}

export default async function AdminTripManagePage({ params }: PageProps) {
  const { id } = await params;
  const trip = await getTripBySlug(id).catch(() => null);

  if (!trip) {
    notFound();
  }

  return <TripManageClient trip={trip} />;
}
