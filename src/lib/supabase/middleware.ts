import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME, isAuthorizedAdmin } from '@/lib/auth';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  let isAuthenticatedAdmin = false;

  // 1. Try Supabase Auth user via SSR
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
      const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
          cookies: {
            getAll() { return request.cookies.getAll(); },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
              supabaseResponse = NextResponse.next({ request });
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (isAuthorizedAdmin(user.email, user.app_metadata, user.user_metadata)) {
          isAuthenticatedAdmin = true;
        }
      }
    }
  } catch {
    // Supabase auth check failed
  }

  // 2. Check signed admin session token cookie
  if (!isAuthenticatedAdmin) {
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (adminToken) {
      const verification = await verifyAdminSessionToken(adminToken);
      if (verification.valid) {
        if (isAuthorizedAdmin(verification.email)) {
          isAuthenticatedAdmin = true;
        }
      }
    }
  }

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdminLoginPage = pathname === '/admin';

  // Protect admin dashboard and subroutes from unauthenticated visitors
  if (isAdminRoute && !isAdminLoginPage && !isAuthenticatedAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated admin from /admin login page to /admin/dashboard
  if (isAdminLoginPage && isAuthenticatedAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
