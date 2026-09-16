import { NextRequest, NextResponse } from 'next/server';
import { getPhotoById } from '@/lib/photos';
import { verifyTripSession } from '@/lib/session';
import { generateSignedOriginalUrl } from '@/lib/storage';
import { getTripBySlug } from '@/lib/trips';
import { verifyAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) return NextResponse.json({ error: 'Trip slug required' }, { status: 400 });

  try {
    const photo = await getPhotoById(id);
    if (!photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 });

    const trip = await getTripBySlug(slug);
    if (!trip || trip.id !== photo.trip_id) {
      return NextResponse.json({ error: 'Photo does not belong to this trip' }, { status: 403 });
    }

    // Check if requester is admin
    const adminCheck = await verifyAdmin();
    if (!adminCheck.isAdmin) {
      // Non-admin: verify journey session if trip is password protected
      if (trip.has_password) {
        const accessType = photo.is_guest ? 'guest' : 'private';
        const hasAccess = await verifyTripSession(slug, trip.id, accessType);
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Access denied: Journey authorization required' },
            { status: 403 }
          );
        }
      }
    }

    // Generate download URL for original asset
    const signedUrl = await generateSignedOriginalUrl(photo.original_path, photo.original_filename);
    return NextResponse.json({
      downloadUrl: signedUrl,
      filename: photo.original_filename || `photo_${id}.jpg`,
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
  }
}
