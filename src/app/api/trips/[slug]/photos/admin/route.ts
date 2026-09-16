import { NextRequest, NextResponse } from 'next/server';
import { getTripBySlug } from '@/lib/trips';
import { getPhotosByTrip } from '@/lib/photos';
import { generateSignedPreviewUrl } from '@/lib/storage';
import { requireAdmin } from '@/lib/auth';
import type { PhotoWithUrls } from '@/types';

// GET /api/trips/[slug]/photos/admin — fetch all photos for admin management
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const trip = await getTripBySlug(slug);
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

    const [privatePhotos, guestPhotos] = await Promise.all([
      getPhotosByTrip(trip.id, false),
      getPhotosByTrip(trip.id, true),
    ]);

    const allPhotos = [...privatePhotos, ...guestPhotos].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );

    const photosWithUrls: PhotoWithUrls[] = await Promise.all(
      allPhotos.map(async (photo) => {
        const previewUrl = await generateSignedPreviewUrl(photo.preview_path);
        const { original_path: _op, preview_path: _pp, ...rest } = photo;
        return { ...rest, preview_url: previewUrl } as PhotoWithUrls;
      })
    );

    return NextResponse.json({ photos: photosWithUrls, trip });
  } catch (error) {
    console.error('GET /api/trips/[slug]/photos/admin error:', error);
    return NextResponse.json({ error: 'Failed to load trip photos' }, { status: 500 });
  }
}
