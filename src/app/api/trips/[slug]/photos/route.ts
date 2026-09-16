import { NextRequest, NextResponse } from 'next/server';
import { getTripBySlug } from '@/lib/trips';
import { getAuthorizedPhotos } from '@/lib/photos';
import { verifyTripSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const isGuest = searchParams.get('type') === 'guest';
  const accessType = isGuest ? 'guest' : 'private';

  try {
    const trip = await getTripBySlug(slug);
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

    // If trip requires password, verify session
    if (trip.has_password) {
      const hasAccess = await verifyTripSession(slug, trip.id, accessType);
      if (!hasAccess) return NextResponse.json({ error: 'Access denied. Please authenticate.' }, { status: 403 });
    }

    const photos = await getAuthorizedPhotos(trip.id, isGuest);
    return NextResponse.json({
      photos,
      trip: {
        id: trip.id,
        name: trip.name,
        slug: trip.slug,
        trip_date: trip.trip_date,
        has_password: trip.has_password,
      },
    });
  } catch (error) {
    console.error('GET photos error:', error);
    return NextResponse.json({ error: 'Failed to load photos' }, { status: 500 });
  }
}
