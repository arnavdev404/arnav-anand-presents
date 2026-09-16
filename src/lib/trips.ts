import { createAdminClient } from '@/lib/supabase/server';
import type { Trip, TripWithSecrets, CreateTripPayload, UpdateTripPayload } from '@/types';
import { hashPassword } from './password';
import localTripsData from '@/data/trips.json';

const TRIP_QUERY_FIELDS = 'id, name, slug, description, trip_date, cover_image, guest_enabled, guest_access_type, password_hash, created_at, updated_at';

function isConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes('placeholder') && url.startsWith('https://'));
}

export function getLocalTrips(): Trip[] {
  return (localTripsData as any[]).map(t => ({
    id: t.id || t.slug,
    name: t.name,
    slug: t.slug,
    description: t.description || null,
    trip_date: t.trip_date || null,
    cover_image: t.cover_image || null,
    guest_enabled: Boolean(t.guest_enabled),
    guest_access_type: t.guest_access_type || 'public',
    has_password: Boolean(t.password && t.password.trim().length > 0),
    created_at: t.created_at || new Date().toISOString(),
    updated_at: t.updated_at || new Date().toISOString(),
    private_photo_count: (t.photos || []).filter((p: any) => !p.is_guest).length,
    guest_photo_count: (t.photos || []).filter((p: any) => p.is_guest).length,
    total_photo_count: (t.photos || []).length,
  }));
}

function formatPublicTrip(trip: Record<string, any>): Trip {
  const { password_hash, ...rest } = trip;
  return {
    ...(rest as Trip),
    has_password: Boolean(password_hash && typeof password_hash === 'string' && password_hash.trim() !== '' && password_hash !== 'NO_PASSWORD'),
  };
}

export async function getAllTrips(): Promise<Trip[]> {
  if (!isConfigured()) return getLocalTrips();
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('trips')
      .select(TRIP_QUERY_FIELDS)
      .order('created_at', { ascending: false });
    if (error || !data || data.length === 0) return getLocalTrips();
    return data.map(formatPublicTrip);
  } catch {
    return getLocalTrips();
  }
}

export async function getTripBySlug(slug: string): Promise<Trip | null> {
  const localList = getLocalTrips();
  const localFound = localList.find(t => t.slug === slug || t.id === slug);

  if (!isConfigured()) return localFound || null;
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('trips')
      .select(TRIP_QUERY_FIELDS)
      .eq('slug', slug)
      .single();
    if (error || !data) return localFound || null;
    return formatPublicTrip(data);
  } catch {
    return localFound || null;
  }
}

export async function getTripWithSecrets(slug: string): Promise<TripWithSecrets | null> {
  const localList = (localTripsData as any[]);
  const localFound = localList.find(t => t.slug === slug || t.id === slug);

  if (!isConfigured()) {
    if (!localFound) return null;
    return {
      ...localFound,
      id: localFound.id || localFound.slug,
      password_hash: localFound.password && localFound.password.trim().length > 0 ? localFound.password : 'NO_PASSWORD',
      guest_password_hash: null,
      has_password: Boolean(localFound.password && localFound.password.trim().length > 0),
    } as TripWithSecrets;
  }
  try {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('trips').select('*').eq('slug', slug).single();
    if (error || !data) {
      if (localFound) {
        return {
          ...localFound,
          id: localFound.id || localFound.slug,
          password_hash: localFound.password && localFound.password.trim().length > 0 ? localFound.password : 'NO_PASSWORD',
          guest_password_hash: null,
          has_password: Boolean(localFound.password && localFound.password.trim().length > 0),
        } as TripWithSecrets;
      }
      return null;
    }
    return {
      ...data,
      has_password: Boolean(data.password_hash && typeof data.password_hash === 'string' && data.password_hash.trim() !== '' && data.password_hash !== 'NO_PASSWORD'),
    } as TripWithSecrets;
  } catch {
    return null;
  }
}

export async function createTrip(payload: CreateTripPayload): Promise<Trip> {
  const supabase = await createAdminClient();
  let passwordHash = 'NO_PASSWORD';
  if (payload.password && payload.password.trim().length > 0) {
    passwordHash = await hashPassword(payload.password.trim());
  }

  let guestPasswordHash: string | null = null;
  if (payload.guest_enabled && payload.guest_access_type === 'password_protected' && payload.guest_password) {
    guestPasswordHash = await hashPassword(payload.guest_password.trim());
  }

  const { data, error } = await supabase
    .from('trips')
    .insert({
      name: payload.name,
      slug: payload.slug,
      description: payload.description || null,
      trip_date: payload.trip_date || null,
      password_hash: passwordHash,
      guest_enabled: payload.guest_enabled ?? false,
      guest_access_type: payload.guest_access_type ?? 'public',
      guest_password_hash: guestPasswordHash,
    })
    .select(TRIP_QUERY_FIELDS)
    .single();

  if (error) throw error;
  return formatPublicTrip(data);
}

export async function updateTrip(id: string, payload: UpdateTripPayload): Promise<Trip> {
  const supabase = await createAdminClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.description !== undefined) updates.description = payload.description;
  if (payload.trip_date !== undefined) updates.trip_date = payload.trip_date;
  if (payload.guest_enabled !== undefined) updates.guest_enabled = payload.guest_enabled;
  if (payload.guest_access_type !== undefined) updates.guest_access_type = payload.guest_access_type;
  if (payload.password !== undefined) {
    updates.password_hash = payload.password && payload.password.trim().length > 0
      ? await hashPassword(payload.password.trim())
      : 'NO_PASSWORD';
  }
  if (payload.guest_password !== undefined) {
    updates.guest_password_hash = payload.guest_password && payload.guest_password.trim().length > 0
      ? await hashPassword(payload.guest_password.trim())
      : null;
  }

  const { data, error } = await supabase
    .from('trips').update(updates).eq('id', id)
    .select(TRIP_QUERY_FIELDS).single();

  if (error) throw error;
  return formatPublicTrip(data);
}

export async function deleteTrip(id: string): Promise<void> {
  const supabase = await createAdminClient();
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
}

export async function updateTripCover(id: string, coverImagePath: string): Promise<void> {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('trips')
    .update({ cover_image: coverImagePath, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function getTripsWithPhotoCounts() {
  if (!isConfigured()) return getLocalTrips();
  try {
    const supabase = await createAdminClient();
    const { data: trips, error } = await supabase
      .from('trips').select(TRIP_QUERY_FIELDS)
      .order('created_at', { ascending: false });
    if (error || !trips || trips.length === 0) return getLocalTrips();

    const { data: counts } = await supabase
      .from('photos').select('trip_id, is_guest');

    return trips.map(formatPublicTrip).map(trip => {
      const tp = counts?.filter(p => p.trip_id === trip.id) || [];
      return {
        ...trip,
        private_photo_count: tp.filter(p => !p.is_guest).length,
        guest_photo_count: tp.filter(p => p.is_guest).length,
        total_photo_count: tp.length,
      };
    });
  } catch {
    return getLocalTrips();
  }
}
