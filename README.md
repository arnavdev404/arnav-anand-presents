# ARNAV ANAND PRESENTS

A luxury, private travel photography platform built with Next.js 14, TypeScript, Supabase, and Swiper.js.

---

## Features

- **Per-Trip Password Protection**: Real server-side authorization (bcrypt + HTTP-only session cookies).
- **Exact 5-Second Loading Experience**: Elegant "ACCESS GRANTED" cinematic transition with prefetching.
- **Dual Gallery View**:
  - **Horizontal Slider**: Desktop arrow keys, smooth mouse drag, touch gestures, and photo counter.
  - **Vertical Scroll Album**: Varied editorial aspect ratios, lazy loading with `IntersectionObserver`, and individual download buttons.
- **Fullscreen Lightbox**: Keyboard navigation, caption overlay, and direct download.
- **HEIC Original Preservation**: Original iPhone/camera HEIC files are stored untouched and served on download, while Sharp automatically generates optimized WebP/JPEG previews for high-speed browsing.
- **Guest Memories**: Separate guest collections with optional dedicated passwords.
- **Admin Dashboard**:
  - Full trip management: create, edit, delete.
  - **Prominent `+ ADD PHOTOS` Button**: Upload more photos directly to existing trips at any time.
  - Photo classification: Move between Private and Guest, mark Featured or Cover.
  - Single-click **"COPY TRIP LINK"**.
- **Exact Color System**:
  - **Light Mode**: Warm palette (`#FFE7E3`, `#FBDCD7`, `#FFDBD8`, `#F6E2C2`, `#E9D2B1`, `#F3BFBF`).
  - **Dark Mode**: Cinematic palette (`#000000`, `#1F150C`, `#412D15`, `#E1DCC9`).
  - Persistent theme toggle with zero-flicker `<head>` hydration script.

---

## Setup Guide

### 1. Supabase Database & Storage Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and execute the entire script in:
   ```
   supabase/schema.sql
   ```
3. In **Storage**, create two **Private** buckets:
   - `trip-originals`
   - `trip-previews`
4. In **Authentication** -> **Users**, add your admin email and password.

### 2. Configure Environment Variables

Create `.env.local` based on `.env.example`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run Locally

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

- Public Home: `http://localhost:3000/`
- Journeys: `http://localhost:3000/journeys`
- Admin Login: `http://localhost:3000/admin`
