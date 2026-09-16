import { NextRequest, NextResponse } from 'next/server';
import { getPhotoById, updatePhoto, deletePhoto } from '@/lib/photos';
import { deleteOriginal, deletePreview, generateSignedPreviewUrl } from '@/lib/storage';
import { getTripBySlug } from '@/lib/trips';
import { verifyTripSession } from '@/lib/session';
import { requireAdmin, verifyAdmin } from '@/lib/auth';

// GET /api/photos/[id] — fetch single photo metadata & signed preview URL securely
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const photo = await getPhotoById(id);
    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // 1. Check if user is an authenticated admin
    const adminCheck = await verifyAdmin();
    if (!adminCheck.isAdmin) {
      // 2. If not admin, check journey password authorization
      const trip = await getTripBySlug(photo.trip_id);
      if (!trip) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      }

      if (trip.has_password) {
        const accessType = photo.is_guest ? 'guest' : 'private';
        const hasAccess = await verifyTripSession(trip.slug, trip.id, accessType);
        if (!hasAccess) {
          return NextResponse.json(
            { error: 'Access denied: Journey password required' },
            { status: 403 }
          );
        }
      }
    }

    // 3. Generate secure signed preview URL (1 hour expiry)
    const previewUrl = await generateSignedPreviewUrl(photo.preview_path);
    const { original_path: _op, preview_path: _pp, ...safePhoto } = photo;

    return NextResponse.json({
      photo: {
        ...safePhoto,
        preview_url: previewUrl,
      },
    });
  } catch (error) {
    console.error('GET photo error:', error);
    return NextResponse.json({ error: 'Failed to retrieve photo' }, { status: 500 });
  }
}

// PATCH /api/photos/[id] — update photo metadata (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const body = await request.json().catch(() => ({}));
    const allowedFields = ['title', 'caption', 'location', 'date_taken', 'is_guest', 'is_featured', 'is_cover', 'sort_order'];
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    const photo = await updatePhoto(id, updateData);
    return NextResponse.json({ photo });
  } catch (error) {
    console.error('PATCH photo error:', error);
    return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 });
  }
}

// DELETE /api/photos/[id] — delete photo & storage assets (Admin only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const photo = await getPhotoById(id);
    if (!photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 });

    await deletePhoto(id);
    // Delete storage files (non-blocking)
    Promise.all([
      deleteOriginal(photo.original_path).catch(() => {}),
      deletePreview(photo.preview_path).catch(() => {}),
    ]).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE photo error:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
