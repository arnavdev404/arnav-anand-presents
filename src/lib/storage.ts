import { createAdminClient } from '@/lib/supabase/server';

const ORIGINALS_BUCKET = 'trip-originals';
const PREVIEWS_BUCKET = 'trip-previews';

export async function generateSignedPreviewUrl(path: string): Promise<string> {
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase.storage
      .from(PREVIEWS_BUCKET).createSignedUrl(path, 3600);
    if (error || !data) return '/placeholder-photo.jpg';
    return data.signedUrl;
  } catch { return '/placeholder-photo.jpg'; }
}

export async function generateSignedOriginalUrl(path: string): Promise<string> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.storage
    .from(ORIGINALS_BUCKET).createSignedUrl(path, 60);
  if (error || !data) throw new Error('Failed to generate download URL');
  return data.signedUrl;
}

export async function uploadOriginal(slug: string, filename: string, buffer: Buffer, mimeType: string): Promise<string> {
  const supabase = await createAdminClient();
  const path = `trips/${slug}/originals/${filename}`;
  const { error } = await supabase.storage
    .from(ORIGINALS_BUCKET).upload(path, buffer, { contentType: mimeType, upsert: false });
  if (error) throw new Error(`Failed to upload original: ${error.message}`);
  return path;
}

export async function uploadPreview(slug: string, filename: string, buffer: Buffer): Promise<string> {
  const supabase = await createAdminClient();
  const path = `trips/${slug}/previews/${filename}`;
  const { error } = await supabase.storage
    .from(PREVIEWS_BUCKET).upload(path, buffer, { contentType: 'image/jpeg', upsert: true });
  if (error) throw new Error(`Failed to upload preview: ${error.message}`);
  return path;
}

export async function uploadCoverImage(slug: string, buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const supabase = await createAdminClient();
  const path = `trips/${slug}/cover/${filename}`;
  const { error } = await supabase.storage
    .from(PREVIEWS_BUCKET).upload(path, buffer, { contentType: mimeType, upsert: true });
  if (error) throw new Error(`Failed to upload cover: ${error.message}`);
  return path;
}

export async function deleteOriginal(path: string): Promise<void> {
  const supabase = await createAdminClient();
  await supabase.storage.from(ORIGINALS_BUCKET).remove([path]);
}

export async function deletePreview(path: string): Promise<void> {
  const supabase = await createAdminClient();
  await supabase.storage.from(PREVIEWS_BUCKET).remove([path]);
}

export { ORIGINALS_BUCKET, PREVIEWS_BUCKET };
