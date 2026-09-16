import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reorderPhotos } from '@/lib/photos';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const photos = body.photos;
    if (!Array.isArray(photos)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const ids = photos.map((p: unknown) => (typeof p === 'string' ? p : (p as { id: string }).id));
    await reorderPhotos(ids);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reorder error:', error);
    return NextResponse.json({ error: 'Failed to reorder' }, { status: 500 });
  }
}
