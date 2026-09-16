import { randomBytes } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { AccessType } from '@/types';

const SESSION_DURATION_HOURS = 2;

export function getSessionCookieName(slug: string, accessType: AccessType) {
  return `trip_session_${slug}_${accessType}`;
}

export async function createTripSession(tripId: string, slug: string, accessType: AccessType) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  const supabase = await createAdminClient();
  const { error } = await supabase.from('access_sessions').insert({
    trip_id: tripId,
    session_token: token,
    access_type: accessType,
    expires_at: expiresAt.toISOString(),
  });

  if (error) throw new Error('Failed to create session');

  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(slug, accessType), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return token;
}

export async function verifyTripSession(
  slug: string,
  tripId: string,
  accessType: AccessType
): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(getSessionCookieName(slug, accessType))?.value;
    if (!token) return false;

    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('access_sessions')
      .select('id, expires_at, trip_id, access_type')
      .eq('session_token', token)
      .eq('trip_id', tripId)
      .eq('access_type', accessType)
      .single();

    if (error || !data) return false;
    if (new Date(data.expires_at) < new Date()) {
      await supabase.from('access_sessions').delete().eq('session_token', token);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function clearTripSession(slug: string, accessType: AccessType) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName(slug, accessType))?.value;
  if (token) {
    const supabase = await createAdminClient();
    await supabase.from('access_sessions').delete().eq('session_token', token);
    cookieStore.delete(getSessionCookieName(slug, accessType));
  }
}
