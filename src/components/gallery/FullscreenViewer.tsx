'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import Image from 'next/image';
import styles from './FullscreenViewer.module.css';
import { DownloadButton } from './DownloadButton';
import type { PhotoWithUrls } from '@/types';

interface FullscreenViewerProps {
  photos: PhotoWithUrls[];
  initialIndex: number;
  slug: string;
  onClose: () => void;
}

export function FullscreenViewer({ photos, initialIndex, slug, onClose }: FullscreenViewerProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const initialScrollY = useRef<number>(0);

  const currentPhoto = photos[activeIndex];

  // Save scroll position on mount and restore on unmount
  useEffect(() => {
    initialScrollY.current = window.scrollY;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      // Exact scroll restoration: anchor to the active photo tile
      const targetId = photos[activeIndex]?.id;
      if (targetId) {
        const tile = document.getElementById(`photo-tile-${targetId}`);
        if (tile) {
          tile.scrollIntoView({ block: 'nearest', behavior: 'instant' });
        } else {
          window.scrollTo({ top: initialScrollY.current, behavior: 'instant' });
        }
      } else {
        window.scrollTo({ top: initialScrollY.current, behavior: 'instant' });
      }
    };
  }, [photos, activeIndex]);

  // Navigate functions
  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;

    // Only trigger if horizontal swipe is dominant
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Close on stage click
  const handleStageClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!currentPhoto) return null;

  const title = currentPhoto.title || currentPhoto.caption || 'Untitled Memory';
  const subtitle = [currentPhoto.location, currentPhoto.date_taken].filter(Boolean).join(', ');

  return (
    <div
      className={styles.viewerOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Expanded photo viewer"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Action Bar */}
      <div className={styles.topBar}>
        <DownloadButton
          photoId={currentPhoto.id}
          slug={slug}
          filename={currentPhoto.original_filename}
        />

        <button
          type="button"
          className={styles.actionBtn}
          onClick={onClose}
          aria-label="Close expanded viewer (Esc)"
          title="Close (Esc)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Main Image Stage */}
      <div className={styles.stage} onClick={handleStageClick}>
        <div className={styles.imageWrapper} onClick={(e) => e.stopPropagation()}>
          <Image
            key={currentPhoto.id}
            src={currentPhoto.preview_url}
            alt={currentPhoto.caption || currentPhoto.title || `Photo ${activeIndex + 1}`}
            fill
            sizes="92vw"
            quality={90}
            priority
            className={styles.mainImage}
            draggable={false}
          />
        </div>
      </div>

      {/* Navigation Arrows */}
      {photos.length > 1 && (
        <>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.prevBtn}`}
            onClick={handlePrev}
            aria-label="Previous photo (Left Arrow)"
            title="Previous"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.nextBtn}`}
            onClick={handleNext}
            aria-label="Next photo (Right Arrow)"
            title="Next"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* Bottom Information Bar */}
      <div className={styles.bottomBar}>
        <div className={styles.captionSection}>
          <h2 className={styles.photoTitle}>{title}</h2>
          {subtitle && <p className={styles.photoSubtitle}>{subtitle}</p>}
          {currentPhoto.caption && currentPhoto.title && (
            <p className={styles.photoDesc}>{currentPhoto.caption}</p>
          )}
        </div>

        <div className={styles.counterSection} aria-live="polite">
          {activeIndex + 1} / {photos.length}
        </div>
      </div>
    </div>
  );
}
