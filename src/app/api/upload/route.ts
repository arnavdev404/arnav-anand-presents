import { NextRequest, NextResponse } from 'next/server';
import { uploadPhotoToCloudinary } from '@/lib/storage';
import { createAdminClient } from '@/lib/supabase/server';
import { getTripBySlug } from '@/lib/trips';
import { requireAdmin } from '@/lib/auth';

const ALLOWED_TYPES = ['image/heic', 'image/heif', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

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

    // 2. Upload to Cloudinary server-side
    const { publicId, secureUrl, bytes: assetBytes } = await uploadPhotoToCloudinary(
      slug,
      file.name,
      buffer,
      mimeType
    );

    const adminClient = await createAdminClient();
    const { data: maxOrder } = await adminClient
      .from('photos')
      .select('sort_order')
      .eq('trip_id', trip.id)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrder?.sort_order ?? -1) + 1;

    // 3. Save Cloudinary asset metadata into existing Supabase photos table
    // original_path: Cloudinary public_id
    // preview_path: Cloudinary secure_url
    const { data: photo, error } = await adminClient
      .from('photos')
      .insert({
        trip_id: trip.id,
        original_path: publicId,
        preview_path: secureUrl,
        original_filename: file.name,
        file_size: assetBytes || file.size,
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
