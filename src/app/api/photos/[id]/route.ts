import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPhotoById, updatePhoto, deletePhoto } from '@/lib/photos';
import { deleteOriginal, deletePreview } from '@/lib/storage';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const photo = await getPhotoById(id);
    if (!photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 });

    await deletePhoto(id);
    // Delete storage files (non-blocking)
    Promise.all([deleteOriginal(photo.original_path), deletePreview(photo.preview_path)]).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE photo error:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
