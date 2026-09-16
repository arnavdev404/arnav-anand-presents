import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut().catch(() => {});

    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_COOKIE_NAME);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
