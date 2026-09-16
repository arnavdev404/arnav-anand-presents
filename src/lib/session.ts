import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { AccessType } from '@/types';

const SESSION_DURATION_HOURS = 2;

function getSigningSecret(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.JWT_SECRET ||
    process.env.ADMIN_PASSWORD ||
    'arnav-anand-presents-journey-session-secret-2026'
  );
}

export function getSessionCookieName(slug: string, accessType: AccessType) {
  return `trip_session_${slug}_${accessType}`;
}

function signSession(tripId: string, slug: string, accessType: AccessType, expiresAtMs: number, token: string): string {
  const secret = getSigningSecret();
  const payload = `${tripId}:${slug}:${accessType}:${expiresAtMs}:${token}`;
  const hmac = createHmac('sha256', secret).update(payload).digest('hex');
  return `${token}.${expiresAtMs}.${hmac}`;
}

function verifySessionSignature(
  tripId: string,
  slug: string,
  accessType: AccessType,
  cookieValue: string
): boolean {
  try {
    const parts = cookieValue.split('.');
    if (parts.length !== 3) return false;

    const [token, expiresAtMsStr, receivedHmac] = parts;
    const expiresAtMs = parseInt(expiresAtMsStr, 10);

    if (isNaN(expiresAtMs) || Date.now() > expiresAtMs) {
      return false;
    }

    const secret = getSigningSecret();
    const payload = `${tripId}:${slug}:${accessType}:${expiresAtMs}:${token}`;
    const expectedHmac = createHmac('sha256', secret).update(payload).digest('hex');

    const expectedBuffer = Buffer.from(expectedHmac, 'hex');
    const receivedBuffer = Buffer.from(receivedHmac, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length) return false;
    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}

export async function createTripSession(tripId: string, slug: string, accessType: AccessType): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAtMs = Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000;
  const expiresAt = new Date(expiresAtMs);

  // 1. Attempt to store in Supabase access_sessions table if configured
  try {
    const supabase = await createAdminClient();
    await supabase.from('access_sessions').insert({
      trip_id: tripId,
      session_token: token,
      access_type: accessType,
      expires_at: expiresAt.toISOString(),
    });
  } catch (err) {
    // Graceful fallback to signed cryptographic cookie if database is in local mode
  }

  // 2. Set cryptographically signed HTTP-only cookie
  const signedCookieValue = signSession(tripId, slug, accessType, expiresAtMs, token);
  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(slug, accessType), signedCookieValue, {
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
    const cookieValue = cookieStore.get(getSessionCookieName(slug, accessType))?.value;
    if (!cookieValue) return false;

    // 1. Check cryptographic signature and expiration on the cookie
    const isSignatureValid = verifySessionSignature(tripId, slug, accessType, cookieValue);
    if (isSignatureValid) {
      return true;
    }

    // 2. Check Supabase database access_sessions record (supports legacy raw tokens)
    const rawToken = cookieValue.split('.')[0] || cookieValue;
    const supabase = await createAdminClient();
    const { data, error } = await supabase
      .from('access_sessions')
      .select('id, expires_at, trip_id, access_type')
      .eq('session_token', rawToken)
      .eq('trip_id', tripId)
      .eq('access_type', accessType)
      .single();

    if (error || !data) return false;
    if (new Date(data.expires_at) < new Date()) {
      await supabase.from('access_sessions').delete().eq('session_token', rawToken);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function clearTripSession(slug: string, accessType: AccessType): Promise<void> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(getSessionCookieName(slug, accessType))?.value;
  if (cookieValue) {
    const rawToken = cookieValue.split('.')[0] || cookieValue;
    try {
      const supabase = await createAdminClient();
      await supabase.from('access_sessions').delete().eq('session_token', rawToken);
    } catch {}
    cookieStore.delete(getSessionCookieName(slug, accessType));
  }
}
