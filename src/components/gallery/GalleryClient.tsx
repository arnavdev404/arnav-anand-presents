'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HorizontalSlider } from '@/components/gallery/HorizontalSlider';
import { VerticalAlbum } from '@/components/gallery/VerticalAlbum';
import { FullscreenViewer } from '@/components/gallery/FullscreenViewer';
import { Pinwheel } from '@/components/shared/Pinwheel';
import styles from './GalleryClient.module.css';
import type { PhotoWithUrls } from '@/types';

interface GalleryClientProps {
  slug: string;
  isGuest?: boolean;
}

type GalleryView = 'slider' | 'album';

export function GalleryClient({ slug, isGuest = false }: GalleryClientProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<PhotoWithUrls[]>([]);
  const [tripInfo, setTripInfo] = useState<{ name: string; trip_date?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<GalleryView>(() => {
    if (typeof window !== 'undefined') {
      return (sessionStorage.getItem('gallery-view') as GalleryView) || 'slider';
    }
    return 'slider';
  });
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const type = isGuest ? 'guest' : 'private';
        const res = await fetch(`/api/trips/${slug}/photos?type=${type}`, { credentials: 'include' });

        if (res.status === 403) {
          // Not authenticated — redirect to trip intro
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

  const handleViewChange = useCallback((v: GalleryView) => {
    setView(v);
    sessionStorage.setItem('gallery-view', v);
  }, []);

  const openFullscreen = useCallback((index: number) => {
    setFullscreenIndex(index);
  }, []);

  const closeFullscreen = useCallback(() => {
    setFullscreenIndex(null);
  }, []);

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
        <button onClick={() => window.location.reload()} className="btn btn-outline btn-sm">
          Try Again
        </button>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className={styles.emptyWrap}>
        <div className={styles.emptyIcon} aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
        </div>
        <h2 className={styles.emptyTitle}>No memories have been added yet.</h2>
        <p className={styles.emptySubtext}>This collection has not received any captures yet.</p>
        <a href={`/trip/${slug}`} className={styles.emptyBackBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Trip
        </a>
      </div>
    );
  }

  return (
    <div className={styles.gallery}>
      {/* Gallery header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <a href={`/trip/${slug}`} className={styles.backBtn} aria-label="Back to trip">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </a>
          <div>
            <h1 className={styles.tripName}>{tripInfo?.name || slug}</h1>
            <p className={styles.tripMeta}>
              {tripInfo?.trip_date && <span>{tripInfo.trip_date} &middot; </span>}
              <span>{photos.length} {photos.length === 1 ? 'Memory' : 'Memories'}</span>
              {isGuest && <span> &middot; Guest Album</span>}
            </p>
          </div>
        </div>

        {/* View toggle */}
        <div className={styles.viewToggle} role="group" aria-label="Gallery view">
          <button
            className={`${styles.viewBtn} ${view === 'slider' ? styles.viewActive : ''}`}
            onClick={() => handleViewChange('slider')}
            aria-label="Horizontal slider view"
            aria-pressed={view === 'slider'}
            title="Slider view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </button>
          <button
            className={`${styles.viewBtn} ${view === 'album' ? styles.viewActive : ''}`}
            onClick={() => handleViewChange('album')}
            aria-label="Vertical scroll album view"
            aria-pressed={view === 'album'}
            title="Album view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Gallery body */}
      <div className={styles.body}>
        {view === 'slider' ? (
          <HorizontalSlider
            photos={photos}
            slug={slug}
            onPhotoClick={openFullscreen}
          />
        ) : (
          <VerticalAlbum
            photos={photos}
            slug={slug}
            onPhotoClick={openFullscreen}
          />
        )}
      </div>

      {/* Fullscreen viewer */}
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
