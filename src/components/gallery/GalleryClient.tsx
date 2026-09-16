'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/hooks/useTheme';
import { FeaturedCarousel } from '@/components/gallery/FeaturedCarousel';
import { SeamlessMasonry } from '@/components/gallery/SeamlessMasonry';
import { HorizontalSlider } from '@/components/gallery/HorizontalSlider';
import { FullscreenViewer } from '@/components/gallery/FullscreenViewer';
import { Pinwheel } from '@/components/shared/Pinwheel';
import styles from './GalleryClient.module.css';
import type { PhotoWithUrls } from '@/types';

interface GalleryClientProps {
  slug: string;
  isGuest?: boolean;
}

type GalleryView = 'wall' | 'slider';

export function GalleryClient({ slug, isGuest = false }: GalleryClientProps) {
  const router = useRouter();
  const { theme, toggle, mounted } = useTheme();
  const [photos, setPhotos] = useState<PhotoWithUrls[]>([]);
  const [tripInfo, setTripInfo] = useState<{ name: string; trip_date?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<GalleryView>('wall');
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  useEffect(() => {
    // Read saved view preference from sessionStorage if available
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('gallery-view');
      if (saved === 'slider' || saved === 'wall') {
        setView(saved);
      }
    }
  }, []);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const type = isGuest ? 'guest' : 'private';
        const res = await fetch(`/api/trips/${slug}/photos?type=${type}`, { credentials: 'include' });

        if (res.status === 403) {
          router.replace(`/trip/${slug}`);
          return;
        }

        if (!res.ok) throw new Error('Failed to load photos');

        const data = await res.json();
        setPhotos(data.photos || []);
        setTripInfo(data.trip);
      } catch {
        setError('Unable to load memories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [slug, isGuest, router]);

  const handleViewChange = useCallback((newView: GalleryView) => {
    setView(newView);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gallery-view', newView);
    }
  }, []);

  const openFullscreen = useCallback((index: number) => {
    setFullscreenIndex(index);
  }, []);

  const closeFullscreen = useCallback(() => {
    setFullscreenIndex(null);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Compute featured highlights (either explicitly marked featured, or top 4 photos if 6+ photos exist)
  const featuredItems = useMemo(() => {
    const explicitlyFeatured = photos
      .map((photo, index) => ({ photo, index }))
      .filter((item) => item.photo.is_featured);

    if (explicitlyFeatured.length > 0) {
      return explicitlyFeatured;
    }

    if (photos.length >= 6) {
      return photos.slice(0, 4).map((photo, index) => ({ photo, index }));
    }

    return [];
  }, [photos]);

  const isDark = mounted ? theme === 'dark' : false;

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <Pinwheel size="page" label="Opening gallery…" />
        <p className={styles.loadingText}>Opening gallery…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorWrap}>
        <p className={styles.errorText}>{error}</p>
        <button type="button" onClick={() => window.location.reload()} className="btn btn-outline btn-sm">
          Try Again
        </button>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className={styles.emptyWrap}>
        <h2 className={styles.emptyTitle}>No memories have been added yet.</h2>
        <p className={styles.emptySubtext}>This collection has not received any captures yet.</p>
        <Link href={`/trip/${slug}`} className={styles.emptyBackBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Trip
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.gallery} data-theme={isDark ? 'dark' : 'light'}>
      {/* Top Gallery Header Bar (Never collides with site navbar) */}
      <header className={styles.header} role="banner">
        <div className={styles.headerLeft}>
          <Link href={`/trip/${slug}`} className={styles.backBtn} aria-label="Back to trip overview" title="Back to trip">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className={styles.tripDetails}>
            <h1 className={styles.tripName}>{tripInfo?.name || slug}</h1>
            <p className={styles.tripMeta}>
              {tripInfo?.trip_date && <span>{tripInfo.trip_date} &middot; </span>}
              <span>{photos.length} {photos.length === 1 ? 'Memory' : 'Memories'}</span>
              {isGuest && <span> &middot; Guest Album</span>}
            </p>
          </div>
        </div>

        {/* View Mode & Theme Controls */}
        <div className={styles.headerRight}>
          <div className={styles.viewToggle} role="group" aria-label="Gallery view layout">
            <button
              type="button"
              className={`${styles.viewBtn} ${view === 'wall' ? styles.viewActive : ''}`}
              onClick={() => handleViewChange('wall')}
              aria-pressed={view === 'wall'}
              title="Seamless Photo Wall"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Wall</span>
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${view === 'slider' ? styles.viewActive : ''}`}
              onClick={() => handleViewChange('slider')}
              aria-pressed={view === 'slider'}
              title="Full Slideshow Reel"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
              <span>Cinema</span>
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggle}
            className={styles.themeToggle}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className={styles.body}>
        {view === 'wall' ? (
          <>
            {/* Optional Featured Highlight Carousel at Top */}
            {featuredItems.length > 1 && (
              <FeaturedCarousel items={featuredItems} onPhotoClick={openFullscreen} />
            )}

            {/* Seamless Masonry Photo Wall */}
            <SeamlessMasonry photos={photos} slug={slug} onPhotoClick={openFullscreen} />

            {/* Tailored Gallery End Footer */}
            <footer className={styles.galleryFooter}>
              <div className={styles.footerBrand}>Arnav Anand Presents</div>
              <p className={styles.footerText}>
                End of Collection &middot; {photos.length} {photos.length === 1 ? 'Memory' : 'Memories'}
              </p>
              <div className={styles.footerActions}>
                <button type="button" onClick={scrollToTop} className={styles.scrollTopBtn}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                  Back to Top
                </button>
                <Link href={`/trip/${slug}`} className={styles.footerLink}>
                  Trip Details
                </Link>
                <Link href="/journeys" className={styles.footerLink}>
                  All Journeys
                </Link>
              </div>
            </footer>
          </>
        ) : (
          <HorizontalSlider photos={photos} slug={slug} onPhotoClick={openFullscreen} />
        )}
      </main>

      {/* Expanded Cinematic Lightbox Modal */}
      {fullscreenIndex !== null && (
        <FullscreenViewer
          photos={photos}
          initialIndex={fullscreenIndex}
          slug={slug}
          onClose={closeFullscreen}
        />
      )}
    </div>
  );
}
