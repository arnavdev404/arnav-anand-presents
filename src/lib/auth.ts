import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

export const ADMIN_COOKIE_NAME = 'admin_session_token';
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Generate a secure signing secret for admin session fallback
 */
function getSigningSecret(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.JWT_SECRET ||
    process.env.ADMIN_PASSWORD ||
    'arnav-anand-presents-admin-fallback-secret-2026'
  );
}

/**
 * Sign payload using universal Web Crypto API (supported in Node.js and Edge Runtime)
 */
async function createHmacHex(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateAdminSessionToken(email: string): Promise<string> {
  const secret = getSigningSecret();
  const timestamp = Date.now();
  const payload = `${email}:${timestamp}`;
  const hmac = await createHmacHex(payload, secret);
  const encodedPayload = Buffer.from(payload).toString('base64url');
  return `${encodedPayload}.${hmac}`;
}

export async function verifyAdminSessionToken(token: string): Promise<{ valid: boolean; email?: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };

    const [encodedPayload, receivedHmac] = parts;
    const payload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const [email, timestampStr] = payload.split(':');
    const timestamp = parseInt(timestampStr, 10);

    // Check expiration (7 days)
    if (isNaN(timestamp) || Date.now() - timestamp > ADMIN_SESSION_MAX_AGE * 1000) {
      return { valid: false };
    }

    const secret = getSigningSecret();
    const expectedHmac = await createHmacHex(payload, secret);

    if (expectedHmac.length !== receivedHmac.length) return { valid: false };

    // Timing safe comparison
    let mismatch = 0;
    for (let i = 0; i < expectedHmac.length; i++) {
      mismatch |= expectedHmac.charCodeAt(i) ^ receivedHmac.charCodeAt(i);
    }

    return { valid: mismatch === 0, email };
  } catch {
    return { valid: false };
  }
}

/**
 * Helper to parse configured admin emails safely from process.env.ADMIN_EMAIL.
 * Handles comma/semicolon-separated lists, trims whitespace, and strips quotes.
 */
export function getConfiguredAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAIL;
  if (!raw) return [];

  return raw
    .split(/[,;]/)
    .map(e => e.trim().replace(/^["']|["']$/g, '').trim().toLowerCase())
    .filter(e => e.length > 0);
}

/**
 * Validates whether a given user is an authorized administrator.
 * Checks:
 * 1. Supabase Auth user metadata or app metadata (role === 'admin' or is_admin === true).
 * 2. Matches against ADMIN_EMAIL environment variable (clean, stripped of quotes, multi-email support).
 * 3. If ADMIN_EMAIL is not set or set to a placeholder (e.g. example.com), any authenticated Supabase user is allowed.
 */
export function isAuthorizedAdmin(
  userEmail?: string | null,
  appMetadata?: Record<string, any> | null,
  userMetadata?: Record<string, any> | null
): boolean {
  // 1. Check if user has explicit admin role in Supabase metadata
  if (
    appMetadata?.role === 'admin' ||
    appMetadata?.is_admin === true ||
    userMetadata?.role === 'admin' ||
    userMetadata?.is_admin === true
  ) {
    return true;
  }

  const allowedEmails = getConfiguredAdminEmails();

  // If no ADMIN_EMAIL is configured, any valid authenticated Supabase user is an admin
  if (allowedEmails.length === 0) {
    return true;
  }

  // Filter out any placeholder documentation emails
  const realEmails = allowedEmails.filter(
    e => !e.includes('example.com') && !e.includes('your-email') && !e.includes('your-project')
  );

  // If only placeholder emails were configured in Vercel, allow any authenticated Supabase user
  if (realEmails.length === 0) {
    return true;
  }

  if (!userEmail) return false;
  const normalized = userEmail.trim().toLowerCase();
  return realEmails.includes(normalized);
}

export interface AdminAuthResult {
  isAdmin: boolean;
  user?: User | { email?: string; id?: string };
  error?: string;
  statusCode: 200 | 401 | 403;
}

/**
 * Server-side verification of admin identity.
 * Evaluates Supabase Auth session first, then signed admin token cookie.
 */
export async function verifyAdmin(): Promise<AdminAuthResult> {
  // 1. Check Supabase Auth session via cookies
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (user && !error) {
      if (!isAuthorizedAdmin(user.email, user.app_metadata, user.user_metadata)) {
        return {
          isAdmin: false,
          user,
          error: 'Forbidden: You do not have administrator permissions.',
          statusCode: 403,
        };
      }
      return {
        isAdmin: true,
        user,
        statusCode: 200,
      };
    }
  } catch {
    // Continue to cookie check if Supabase throws or is unconfigured
  }

  // 2. Check signed admin session cookie
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    if (adminToken) {
      const verification = await verifyAdminSessionToken(adminToken);
      if (verification.valid) {
        if (!isAuthorizedAdmin(verification.email)) {
          return {
            isAdmin: false,
            error: 'Forbidden: Admin access restricted.',
            statusCode: 403,
          };
        }
        return {
          isAdmin: true,
          user: { email: verification.email, id: 'admin' },
          statusCode: 200,
        };
      }
    }
  } catch {
    // Cookie store read failed
  }

  return {
    isAdmin: false,
    error: 'Unauthorized: Admin authentication required.',
    statusCode: 401,
  };
}

/**
 * Reusable server-side authorization check for API routes.
 * Usage:
 *   const auth = await requireAdmin();
 *   if (!auth.authorized) return auth.response;
 */
export async function requireAdmin(): Promise<
  | { authorized: true; user?: User | { email?: string; id?: string } }
  | { authorized: false; response: NextResponse }
> {
  const result = await verifyAdmin();
  if (!result.isAdmin) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: result.error || 'Unauthorized' },
        { status: result.statusCode }
      ),
    };
  }
  return { authorized: true, user: result.user };
}
