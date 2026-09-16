import { NextRequest, NextResponse } from 'next/server';
import { getTripBySlug, updateTrip, deleteTrip } from '@/lib/trips';
import { getPhotosByTrip } from '@/lib/photos';
import { deleteOriginal, deletePreview } from '@/lib/storage';
import { requireAdmin } from '@/lib/auth';
import type { UpdateTripPayload } from '@/types';

// GET /api/trips/[slug] — get trip details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const trip = await getTripBySlug(slug);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }
    return NextResponse.json({ trip });
  } catch (error) {
    console.error('GET trip error:', error);
    return NextResponse.json({ error: 'Failed to fetch trip' }, { status: 500 });
  }
}

// PATCH /api/trips/[slug] — update trip (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const existingTrip = await getTripBySlug(slug);
    if (!existingTrip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const payload: UpdateTripPayload = {};

    if (body.name !== undefined) payload.name = String(body.name).trim();
    if (body.description !== undefined) payload.description = body.description ? String(body.description).trim() : undefined;
    if (body.trip_date !== undefined) payload.trip_date = body.trip_date ? String(body.trip_date).trim() : undefined;
    if (body.guest_enabled !== undefined) payload.guest_enabled = Boolean(body.guest_enabled);
    if (body.guest_access_type !== undefined) payload.guest_access_type = body.guest_access_type;
    // Only update password if a non-empty string is provided — blank = keep existing
    if (body.password !== undefined && String(body.password).trim().length > 0) {
      payload.password = String(body.password).trim();
    }
    // Only update guest_password if a non-empty string is provided — blank = keep existing
    if (body.guest_password !== undefined && String(body.guest_password).trim().length > 0) {
      payload.guest_password = String(body.guest_password).trim();
    }

    const trip = await updateTrip(existingTrip.id, payload);
    return NextResponse.json({ trip, success: true });
  } catch (error: unknown) {
    console.error('PATCH trip error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to update trip';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT /api/trips/[slug] — alias for PATCH (Admin only)
export async function PUT(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  return PATCH(request, context);
}

// DELETE /api/trips/[slug] — delete trip and photos (Admin only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    // Fetch existing trip to confirm it exists
    const trip = await getTripBySlug(slug);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Clean up all storage files associated with this trip
    try {
      const [privatePhotos, guestPhotos] = await Promise.all([
        getPhotosByTrip(trip.id, false).catch(() => []),
        getPhotosByTrip(trip.id, true).catch(() => []),
      ]);
      const allPhotos = [...privatePhotos, ...guestPhotos];
      await Promise.all([
        ...allPhotos.flatMap(p => [
          deleteOriginal(p.original_path).catch(() => {}),
          deletePreview(p.preview_path).catch(() => {}),
        ]),
        trip.cover_image ? deleteOriginal(trip.cover_image).catch(() => {}) : Promise.resolve(),
      ]);
    } catch (cleanupErr) {
      console.warn('Storage cleanup warning during trip delete:', cleanupErr);
    }

    // Delete trip from database (cascades photos & sessions via FK)
    await deleteTrip(trip.id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('DELETE trip error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to delete trip';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
