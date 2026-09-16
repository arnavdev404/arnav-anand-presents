-- =============================================================
-- ARNAV ANAND PRESENTS — Hardened Supabase Schema & Security
-- =============================================================

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TRIPS TABLE
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  trip_date TEXT,
  cover_image TEXT,
  password_hash TEXT,
  guest_enabled BOOLEAN DEFAULT false,
  guest_access_type TEXT DEFAULT 'public' CHECK (guest_access_type IN ('public', 'password_protected')),
  guest_password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PHOTOS TABLE
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  title TEXT,
  caption TEXT,
  location TEXT,
  original_path TEXT NOT NULL,
  preview_path TEXT NOT NULL,
  original_filename TEXT,
  file_size BIGINT,
  is_guest BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_cover BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  date_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ACCESS_SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.access_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  access_type TEXT DEFAULT 'private' CHECK (access_type IN ('private', 'guest')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_trips_slug ON public.trips(slug);
CREATE INDEX IF NOT EXISTS idx_photos_trip_id ON public.photos(trip_id);
CREATE INDEX IF NOT EXISTS idx_photos_is_guest ON public.photos(is_guest);
CREATE INDEX IF NOT EXISTS idx_photos_is_featured ON public.photos(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_access_sessions_token ON public.access_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_access_sessions_expires ON public.access_sessions(expires_at);

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_sessions ENABLE ROW LEVEL SECURITY;

-- TRIPS POLICIES:
-- Direct anon client SELECT is disabled to prevent leaking password_hash or trip secrets.
-- Public visitor data is safely sanitized and served exclusively via server-side Next.js APIs.
-- Authenticated admin users have full CRUD access:
DROP POLICY IF EXISTS "Public trips view" ON public.trips;
DROP POLICY IF EXISTS "Admin trips full access" ON public.trips;

CREATE POLICY "Admin trips full access" 
  ON public.trips FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- PHOTOS POLICIES:
-- Direct anon client SELECT/INSERT/UPDATE/DELETE is disabled.
-- Protected photos are accessible ONLY through server-side authorization checks that issue signed URLs.
-- Authenticated admin users have full CRUD access:
DROP POLICY IF EXISTS "Admin photos full access" ON public.photos;

CREATE POLICY "Admin photos full access" 
  ON public.photos FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- ACCESS SESSIONS POLICIES:
-- Managed strictly server-side by Next.js using the service role client.
-- No anon client may insert, update, or read access sessions directly.
DROP POLICY IF EXISTS "Admin access_sessions full access" ON public.access_sessions;

CREATE POLICY "Admin access_sessions full access" 
  ON public.access_sessions FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- =============================================================
-- STORAGE BUCKETS (PRIVATE ONLY):
-- In your Supabase Dashboard -> Storage, ensure two PRIVATE buckets exist:
-- 1. 'trip-originals'  (Public bucket: OFF / PRIVATE)
-- 2. 'trip-previews'   (Public bucket: OFF / PRIVATE)
--
-- All access is generated on-demand via short-lived signed URLs:
-- - Previews: 3600s (1 hour)
-- - Originals / Downloads: 60s
-- =============================================================
