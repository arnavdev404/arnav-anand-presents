'use client';

import { useEffect, useCallback, useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Keyboard, A11y } from 'swiper/modules';
import 'swiper/css';
import type { Swiper as SwiperType } from 'swiper';
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
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const currentPhoto = photos[activeIndex];

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    // Lock scroll
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Initialize swiper to correct index
  useEffect(() => {
    if (swiper && !swiper.destroyed) {
      swiper.slideTo(initialIndex, 0);
    }
  }, [swiper, initialIndex]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div
      className={styles.viewer}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={handleBackdropClick}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.counter}>
            {activeIndex + 1} / {photos.length}
          </span>
        </div>
        <div className={styles.headerRight}>
          {currentPhoto && (
            <DownloadButton photoId={currentPhoto.id} slug={slug} filename={currentPhoto.original_filename} />
          )}
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close viewer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Swiper */}
      <Swiper
        modules={[Navigation, Keyboard, A11y]}
        navigation={{
          prevEl: '.fs-prev',
          nextEl: '.fs-next',
        }}
        keyboard={{ enabled: true }}
        a11y={{ enabled: true }}
        initialSlide={initialIndex}
        spaceBetween={0}
        slidesPerView={1}
        loop={photos.length > 1}
        onSwiper={setSwiper}
        onSlideChange={(s) => setActiveIndex(s.realIndex)}
        className={styles.swiper}
      >
        {photos.map((photo, i) => (
          <SwiperSlide key={photo.id} className={styles.slide}>
            <div className={styles.slideInner}>
              <Image
                src={photo.preview_url}
                alt={photo.caption || photo.title || `Photo ${i + 1}`}
                fill
                sizes="100vw"
                className={styles.img}
                priority={Math.abs(i - initialIndex) <= 1}
                quality={90}
                draggable={false}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Nav buttons */}
      {photos.length > 1 && (
        <>
          <button className={`${styles.navBtn} ${styles.prev} fs-prev`} aria-label="Previous photo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <button className={`${styles.navBtn} ${styles.next} fs-next`} aria-label="Next photo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </>
      )}

      {/* Caption/metadata footer */}
      {currentPhoto && (currentPhoto.title || currentPhoto.caption || currentPhoto.location || currentPhoto.date_taken) && (
        <div className={styles.footer}>
          {currentPhoto.title && <p className={styles.footerTitle}>{currentPhoto.title}</p>}
          {currentPhoto.caption && <p className={styles.footerCaption}>{currentPhoto.caption}</p>}
          <div className={styles.footerMeta}>
            {currentPhoto.location && <span>{currentPhoto.location}</span>}
            {currentPhoto.date_taken && <span>{currentPhoto.date_taken}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
