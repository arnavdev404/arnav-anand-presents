import {
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryDownloadUrl,
  isCloudinaryConfigured,
} from '@/lib/cloudinary';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Upload a photo directly to Cloudinary server-side.
 * Stores original high-resolution asset and returns public_id & secure_url.
 */
export async function uploadPhotoToCloudinary(
  slug: string,
  filename: string,
  buffer: Buffer,
  _mimeType?: string
): Promise<{ publicId: string; secureUrl: string; bytes: number }> {
  const cleanBase = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const publicId = `${Date.now()}_${cleanBase}`;

  const result = await uploadToCloudinary(buffer, {
    folder: `arnav-anand-presents/trips/${slug}`,
    public_id: publicId,
    resource_type: 'image',
    tags: ['photo', slug],
  });

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    bytes: result.bytes,
  };
}

/**
 * Upload cover image to Cloudinary server-side.
 */
export async function uploadCoverImage(
  slug: string,
  buffer: Buffer,
  _mimeType: string,
  filename: string
): Promise<string> {
  const cleanBase = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const publicId = `cover_${Date.now()}_${cleanBase}`;

  const result = await uploadToCloudinary(buffer, {
    folder: `arnav-anand-presents/trips/${slug}/cover`,
    public_id: publicId,
    resource_type: 'image',
    tags: ['cover', slug],
  });

  return result.secure_url;
}

/**
 * Generate preview URL.
 * If path is a Cloudinary secure_url or external URL, returns it immediately.
 * If legacy Supabase path exists, falls back gracefully.
 */
export async function generateSignedPreviewUrl(path: string): Promise<string> {
  if (!path) return '/placeholder-photo.jpg';

  // 1. Direct HTTPS URL (Cloudinary secure_url or external CDN)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // 2. Cloudinary public_id (not starting with legacy trips/)
  if (!path.startsWith('trips/') && isCloudinaryConfigured()) {
    return getCloudinaryDownloadUrl(path);
  }

  // 3. Fallback for legacy Supabase storage paths (if any)
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase.storage
      .from('trip-previews')
      .createSignedUrl(path, 3600);
    if (!error && data?.signedUrl) return data.signedUrl;
  } catch {
    // Ignore legacy Supabase bucket error
  }

  return '/placeholder-photo.jpg';
}

/**
 * Generate original download URL with attachment flag.
 */
export async function generateSignedOriginalUrl(
  path: string,
  filename?: string | null
): Promise<string> {
  if (!path) throw new Error('Invalid photo path');

  // 1. Cloudinary public_id or Cloudinary URL
  if (path.startsWith('http://') || path.startsWith('https://') || isCloudinaryConfigured()) {
    const downloadUrl = getCloudinaryDownloadUrl(path, filename);
    if (downloadUrl) return downloadUrl;
  }

  // 2. Fallback for legacy Supabase storage
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase.storage
      .from('trip-originals')
      .createSignedUrl(path, 60);
    if (!error && data?.signedUrl) return data.signedUrl;
  } catch {
    // Ignore legacy Supabase bucket error
  }

  throw new Error('Failed to generate download URL');
}

/**
 * Delete photo asset from Cloudinary.
 */
export async function deleteOriginal(path: string): Promise<void> {
  if (!path) return;
  await deleteFromCloudinary(path);

  // Clean legacy Supabase path if applicable
  if (path.startsWith('trips/')) {
    try {
      const supabase = await createAdminClient();
      await supabase.storage.from('trip-originals').remove([path]);
    } catch {}
  }
}

/**
 * Delete preview asset from Cloudinary.
 */
export async function deletePreview(path: string): Promise<void> {
  if (!path) return;
  await deleteFromCloudinary(path);

  // Clean legacy Supabase path if applicable
  if (path.startsWith('trips/')) {
    try {
      const supabase = await createAdminClient();
      await supabase.storage.from('trip-previews').remove([path]);
    } catch {}
  }
}

/**
 * Backward compatibility wrappers
 */
export async function uploadOriginal(
  slug: string,
  filename: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const { publicId } = await uploadPhotoToCloudinary(slug, filename, buffer, mimeType);
  return publicId;
}

export async function uploadPreview(
  _slug: string,
  _filename: string,
  _buffer: Buffer
): Promise<string> {
  return '';
}
