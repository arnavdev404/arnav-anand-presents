import { NextRequest, NextResponse } from 'next/server';
import { getTripWithSecrets } from '@/lib/trips';
import { verifyPassword } from '@/lib/password';
import { createTripSession } from '@/lib/session';
import type { AccessType } from '@/types';

// Rate limiting: 5 attempts per 15 min per IP per trip
const attemptMap = new Map<string, { count: number; reset: number }>();
function checkPasswordRateLimit(key: string): { allowed: boolean } {
  const now = Date.now();
  const WINDOW = 15 * 60 * 1000;
  const LIMIT = 5;
  const entry = attemptMap.get(key);
  if (!entry || now > entry.reset) { attemptMap.set(key, { count: 1, reset: now + WINDOW }); return { allowed: true }; }
  if (entry.count >= LIMIT) return { allowed: false };
  entry.count++;
  return { allowed: true };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = checkPasswordRateLimit(`${ip}:${slug}`);
    if (!allowed) return NextResponse.json({ error: 'Too many attempts. Please wait 15 minutes.' }, { status: 429 });

    const body = await request.json().catch(() => ({}));
    const password = (body.password as string) || '';
    const access_type: AccessType = body.access_type || 'private';

    const trip = await getTripWithSecrets(slug);
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

    const hashToVerify = access_type === 'guest' ? trip.guest_password_hash : trip.password_hash;
    const hasPassword = Boolean(hashToVerify && hashToVerify.trim() !== '' && hashToVerify !== 'NO_PASSWORD');

    // If trip has NO password, grant access directly
    if (!hasPassword) {
      await createTripSession(trip.id, slug, access_type);
      return NextResponse.json({ success: true, noPassword: true });
    }

    // Trip has password, verify it using bcrypt
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    let isValid = false;
    try {
      isValid = await verifyPassword(password.trim(), hashToVerify!);
    } catch {
      isValid = false;
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Incorrect password. Please try again.' },
        { status: 401 }
      );
    }

    await createTripSession(trip.id, slug, access_type);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify password error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
