import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadOriginal, uploadPreview } from '@/lib/storage';
import { createAdminClient } from '@/lib/supabase/server';
import { getTripBySlug } from '@/lib/trips';
import { requireAdmin } from '@/lib/auth';

const ALLOWED_TYPES = ['image/heic', 'image/heif', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

async function generatePreview(buffer: Buffer): Promise<Buffer> {
  const sharp = (await import('sharp')).default;
  return sharp(buffer, { failOn: 'none' })
    .rotate()
    .resize({ width: 2000, withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true })
    .toBuffer();
}

export async function POST(request: NextRequest) {
  try {
    // 1. Enforce admin authorization server-side
    const auth = await requireAdmin();
    if (!auth.authorized) return auth.response;

    const formData = await request.formData();
    const slug = formData.get('slug') as string;
    const isGuest = formData.get('is_guest') === 'true';
    const file = formData.get('file') as File;
    const title = formData.get('title') as string | null;
    const caption = formData.get('caption') as string | null;
    const location = formData.get('location') as string | null;
    const date_taken = formData.get('date_taken') as string | null;

    if (!slug || !file) return NextResponse.json({ error: 'Slug and file are required' }, { status: 400 });

    const mimeType = file.type.toLowerCase() || 'application/octet-stream';
    const isAllowed = ALLOWED_TYPES.some(t => mimeType.includes(t.split('/')[1]) || mimeType === t);
    if (!isAllowed) return NextResponse.json({ error: 'Unsupported file type. Use HEIC, JPG, PNG, or WebP.' }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large (max 100 MB)' }, { status: 400 });

    const trip = await getTripBySlug(slug);
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ts = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = safeName.split('.').pop() || 'jpg';
    const baseName = safeName.replace(`.${ext}`, '');
    const originalFilename = `${ts}_${safeName}`;
    const previewFilename = `${ts}_${baseName}.jpg`;

    const originalPath = await uploadOriginal(slug, originalFilename, buffer, mimeType);

    let previewBuffer: Buffer;
    try {
      previewBuffer = await generatePreview(buffer);
    } catch (err) {
      console.warn('Preview generation failed, using original:', err);
      previewBuffer = buffer;
    }

    const previewPath = await uploadPreview(slug, previewFilename, previewBuffer);

    const adminClient = await createAdminClient();
    const { data: maxOrder } = await adminClient
      .from('photos')
      .select('sort_order')
      .eq('trip_id', trip.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrder?.sort_order ?? -1) + 1;

    const { data: photo, error } = await adminClient
      .from('photos')
      .insert({
        trip_id: trip.id,
        original_path: originalPath,
        preview_path: previewPath,
        original_filename: file.name,
        file_size: file.size,
        is_guest: isGuest,
        sort_order: nextOrder,
        title: title || null,
        caption: caption || null,
        location: location || null,
        date_taken: date_taken || null,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ photo, success: true }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    const msg = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
