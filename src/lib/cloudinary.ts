import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// Initialize server-side Cloudinary client with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Upload a photo buffer to Cloudinary server-side.
 * Never exposes API Secret to browser/client.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder: string;
    public_id?: string;
    resource_type?: 'image' | 'raw' | 'auto';
    tags?: string[];
  }
): Promise<UploadApiResponse> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in environment variables.'
    );
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.public_id,
        resource_type: options.resource_type || 'image',
        tags: options.tags,
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload failed'));
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Delete an asset from Cloudinary using public_id or secure_url.
 */
export async function deleteFromCloudinary(publicIdOrUrl: string): Promise<void> {
  if (!isCloudinaryConfigured() || !publicIdOrUrl) return;

  try {
    const publicId = extractCloudinaryPublicId(publicIdOrUrl);
    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (err) {
    console.warn('[Cloudinary] Failed to delete asset:', err);
  }
}

/**
 * Extract Cloudinary public_id from a URL or return the public_id as-is.
 */
export function extractCloudinaryPublicId(input: string): string | null {
  if (!input) return null;
  if (!input.startsWith('http://') && !input.startsWith('https://')) {
    // If it's not a full URL, check if it's legacy Supabase path
    if (input.startsWith('trips/')) {
      return null;
    }
    return input;
  }

  try {
    const url = new URL(input);
    if (!url.hostname.includes('cloudinary.com')) return null;

    const pathParts = url.pathname.split('/');
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1) return null;

    // Remaining segments after /upload/
    let parts = pathParts.slice(uploadIndex + 1);
    // Strip version prefix if present (v1234567...)
    if (parts[0] && /^v\d+$/.test(parts[0])) {
      parts = parts.slice(1);
    }
    // Join and strip file extension
    const fullPathWithExt = parts.join('/');
    const lastDot = fullPathWithExt.lastIndexOf('.');
    return lastDot > 0 ? fullPathWithExt.substring(0, lastDot) : fullPathWithExt;
  } catch {
    return null;
  }
}

/**
 * Generate a download URL for a Cloudinary asset with attachment flag.
 */
export function getCloudinaryDownloadUrl(publicIdOrUrl: string, filename?: string | null): string {
  if (!publicIdOrUrl) return '';

  if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://')) {
    if (publicIdOrUrl.includes('/upload/')) {
      return publicIdOrUrl.replace('/upload/', '/upload/fl_attachment/');
    }
    return publicIdOrUrl;
  }

  if (isCloudinaryConfigured()) {
    return cloudinary.url(publicIdOrUrl, {
      flags: 'attachment',
      secure: true,
      attachment: filename || undefined,
    });
  }

  return publicIdOrUrl;
}

export default cloudinary;
