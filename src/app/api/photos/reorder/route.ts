import { NextRequest, NextResponse } from 'next/server';
import { reorderPhotos } from '@/lib/photos';
import { requireAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const body = await request.json().catch(() => ({}));
    const photos = body.photos;
    if (!Array.isArray(photos)) return NextResponse.json({ error: 'Invalid payload: photos array required' }, { status: 400 });

    const ids = photos.map((p: unknown) => (typeof p === 'string' ? p : (p as { id: string }).id));
    await reorderPhotos(ids);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reorder error:', error);
    return NextResponse.json({ error: 'Failed to reorder photos' }, { status: 500 });
  }
}
