import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, generateAdminSessionToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json().catch(() => ({}));
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);
    const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const configuredAdminPassword = process.env.ADMIN_PASSWORD;

    let authenticated = false;
    let authUserEmail = trimmedEmail;

    // 1. Attempt Supabase Auth
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: cleanPassword,
      });

      if (!error && data?.user) {
        // Enforce ADMIN_EMAIL restriction if configured
        if (configuredAdminEmail && data.user.email?.toLowerCase() !== configuredAdminEmail) {
          await supabase.auth.signOut();
          return NextResponse.json(
            { error: 'Forbidden: You do not have administrator permissions.' },
            { status: 403 }
          );
        }
        authenticated = true;
        authUserEmail = data.user.email || trimmedEmail;
      }
    } catch {
      // Supabase connection error / offline fallback
    }

    // 2. Fallback: Check ADMIN_PASSWORD environment variable
    if (!authenticated && configuredAdminPassword && cleanPassword === configuredAdminPassword) {
      if (configuredAdminEmail && trimmedEmail !== configuredAdminEmail) {
        return NextResponse.json(
          { error: 'Forbidden: Admin access restricted.' },
          { status: 403 }
        );
      }
      authenticated = true;
    }

    if (!authenticated) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Set secure HTTP-only admin session token cookie
    const token = await generateAdminSessionToken(authUserEmail);
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
