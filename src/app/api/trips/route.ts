import { NextRequest, NextResponse } from 'next/server';
import { getAllTrips, createTrip } from '@/lib/trips';
import { uploadCoverImage } from '@/lib/storage';
import type { CreateTripPayload } from '@/types';

const rateLimitMap = new Map<string, { count: number; reset: number }>();
function checkRateLimit(ip: string, limit = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) { rateLimitMap.set(ip, { count: 1, reset: now + windowMs }); return true; }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// GET /api/trips — public trip listing (no secrets)
export async function GET() {
  try {
    const trips = await getAllTrips();
    return NextResponse.json({ trips });
  } catch (error) {
    console.error('GET /api/trips error:', error);
    return NextResponse.json({ error: 'Failed to load trips' }, { status: 500 });
  }
}

// POST /api/trips — create a new trip (supports directly from journey section or admin)
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const formData = await request.formData();
    const name = formData.get('name') as string;
    let slug = (formData.get('slug') as string) || '';
    const description = formData.get('description') as string | null;
    const trip_date = formData.get('trip_date') as string | null;
    const password = (formData.get('password') as string) || '';
    const guest_enabled = formData.get('guest_enabled') === 'true';
    const guest_access_type = (formData.get('guest_access_type') as string) || 'public';
    const guest_password = formData.get('guest_password') as string | null;
    const coverFile = formData.get('cover_image') as File | null;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Trip name is required' }, { status: 400 });
    }

    // Auto-generate slug if not specified
    if (!slug || slug.trim().length === 0) {
      slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (!slug) slug = `trip-${Date.now()}`;
    } else {
      slug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const payload: CreateTripPayload = {
      name: name.trim(),
      slug,
      description: description?.trim() || undefined,
      trip_date: trip_date?.trim() || undefined,
      password: password.trim().length > 0 ? password.trim() : undefined,
      guest_enabled,
      guest_access_type: guest_access_type as 'public' | 'password_protected',
      guest_password: guest_password?.trim() || undefined,
    };

    const trip = await createTrip(payload);

    if (coverFile && coverFile.size > 0) {
      try {
        const bytes = await coverFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `cover_${Date.now()}.jpg`;
        const coverPath = await uploadCoverImage(slug, buffer, coverFile.type || 'image/jpeg', filename);
        const { updateTripCover } = await import('@/lib/trips');
        await updateTripCover(trip.id, coverPath);
        trip.cover_image = coverPath;
      } catch (e) {
        console.warn('Cover upload failed:', e);
      }
    }

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create trip';
    console.error('POST /api/trips error:', error);
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return NextResponse.json({ error: 'A journey with this name or URL slug already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
