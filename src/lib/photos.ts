import { createAdminClient } from '@/lib/supabase/server';
import type { Photo, PhotoWithUrls, UpdatePhotoPayload } from '@/types';
import { generateSignedPreviewUrl } from './storage';
import localTripsData from '@/data/trips.json';

function isConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes('placeholder') && url.startsWith('https://'));
}

function getLocalPhotos(tripSlugOrId: string, isGuest = false): PhotoWithUrls[] {
  const trip = (localTripsData as any[]).find(t => t.id === tripSlugOrId || t.slug === tripSlugOrId);
  if (!trip || !trip.photos) return [];
  return (trip.photos as any[])
    .filter(p => Boolean(p.is_guest) === isGuest)
    .map(p => ({
      id: p.id,
      trip_id: trip.id || trip.slug,
      title: p.title || null,
      caption: p.caption || null,
      location: p.location || null,
      preview_url: p.url,
      original_filename: p.original_filename || `${p.id}.jpg`,
      file_size: p.file_size || null,
      is_guest: Boolean(p.is_guest),
      is_featured: Boolean(p.is_featured),
      is_cover: false,
      sort_order: 0,
      date_taken: p.date_taken || null,
    }));
}

function getLocalFeaturedPhotos(): PhotoWithUrls[] {
  const allPhotos: PhotoWithUrls[] = [];
  (localTripsData as any[]).forEach(trip => {
    (trip.photos || []).forEach((p: any) => {
      if (p.is_featured) {
        allPhotos.push({
          id: p.id,
          trip_id: trip.id || trip.slug,
          title: p.title || null,
          caption: p.caption || null,
          location: p.location || null,
          preview_url: p.url,
          original_filename: `${p.id}.jpg`,
          file_size: p.file_size || null,
          is_guest: Boolean(p.is_guest),
          is_featured: true,
          is_cover: false,
          sort_order: 0,
          date_taken: p.date_taken || null,
        });
      }
    });
  });
  return allPhotos;
}

export async function getPhotosByTrip(tripId: string, isGuest = false): Promise<Photo[]> {
  if (!isConfigured()) return [];
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('photos').select('*')
      .eq('trip_id', tripId).eq('is_guest', isGuest)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as Photo[];
  } catch {
    return [];
  }
}

export async function getAuthorizedPhotos(tripId: string, isGuest = false): Promise<PhotoWithUrls[]> {
  const localPhotos = getLocalPhotos(tripId, isGuest);
  if (!isConfigured()) return localPhotos;

  try {
    const photos = await getPhotosByTrip(tripId, isGuest);
    if (!photos || photos.length === 0) return localPhotos;

    return Promise.all(photos.map(async (photo) => {
      const previewUrl = await generateSignedPreviewUrl(photo.preview_path);
      const { original_path: _op, preview_path: _pp, ...rest } = photo;
      return { ...rest, preview_url: previewUrl } as PhotoWithUrls;
    }));
  } catch {
    return localPhotos;
  }
}

export async function getFeaturedPhotos(): Promise<PhotoWithUrls[]> {
  const localFeatured = getLocalFeaturedPhotos();
  if (!isConfigured()) return localFeatured;

  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('photos').select('*').eq('is_featured', true)
      .order('created_at', { ascending: false }).limit(12);
    if (error || !data || data.length === 0) return localFeatured;

    return Promise.all((data as Photo[]).map(async (photo) => {
      const previewUrl = await generateSignedPreviewUrl(photo.preview_path);
      const { original_path: _op, preview_path: _pp, ...rest } = photo;
      return { ...rest, preview_url: previewUrl } as PhotoWithUrls;
    }));
  } catch {
    return localFeatured;
  }
}

export async function getPhotoById(id: string): Promise<Photo | null> {
  if (!isConfigured()) {
    for (const trip of (localTripsData as any[])) {
      const found = (trip.photos || []).find((p: any) => p.id === id);
      if (found) {
        return {
          id: found.id,
          trip_id: trip.id || trip.slug,
          title: found.title || null,
          caption: found.caption || null,
          location: found.location || null,
          original_path: found.url,
          preview_path: found.url,
          original_filename: `${found.id}.jpg`,
          file_size: 1024000,
          is_guest: Boolean(found.is_guest),
          is_featured: Boolean(found.is_featured),
          is_cover: false,
          sort_order: 0,
          date_taken: found.date_taken || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    }
    return null;
  }
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase.from('photos').select('*').eq('id', id).single();
    if (error || !data) return null;
    return data as Photo;
  } catch {
    return null;
  }
}

export async function updatePhoto(id: string, payload: UpdatePhotoPayload): Promise<Photo> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('photos').update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) throw error;
  return data as Photo;
}

export async function deletePhoto(id: string): Promise<Photo> {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('photos').delete().eq('id', id).select().single();
  if (error) throw error;
  return data as Photo;
}

export async function reorderPhotos(orderedIds: string[]): Promise<void> {
  const supabase = await createAdminClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('photos').update({ sort_order: index }).eq('id', id)
    )
  );
}

export async function setPhotoAsCover(photoId: string, tripId: string): Promise<void> {
  const supabase = await createAdminClient();
  await supabase.from('photos').update({ is_cover: false }).eq('trip_id', tripId);
  await supabase.from('photos').update({ is_cover: true }).eq('id', photoId);
}
