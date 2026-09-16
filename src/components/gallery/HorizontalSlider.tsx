'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './HorizontalSlider.module.css';
import { DownloadButton } from './DownloadButton';
import type { PhotoWithUrls } from '@/types';

// Dynamically import Swiper to avoid SSR issues
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Keyboard, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

interface HorizontalSliderProps {
  photos: PhotoWithUrls[];
  slug: string;
  onPhotoClick: (index: number) => void;
}

export function HorizontalSlider({ photos, slug, onPhotoClick }: HorizontalSliderProps) {
  return (
    <div className={styles.sliderWrapper}>
      <Swiper
        modules={[Navigation, Keyboard, A11y]}
        navigation={{
          prevEl: '.swiper-btn-prev',
          nextEl: '.swiper-btn-next',
        }}
        keyboard={{ enabled: true }}
        a11y={{ enabled: true }}
        spaceBetween={0}
        slidesPerView={1}
        loop={photos.length > 1}
        className={styles.swiper}
        aria-label="Photo gallery slider"
      >
        {photos.map((photo, i) => (
          <SwiperSlide key={photo.id} className={styles.slide}>
            <div
              className={styles.slideInner}
              role="button"
              tabIndex={0}
              aria-label={`Open ${photo.title || `photo ${i + 1}`} fullscreen`}
              onClick={() => onPhotoClick(i)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPhotoClick(i); } }}
            >
              <Image
                src={photo.preview_url}
                alt={photo.caption || photo.title || `Photo ${i + 1}`}
                fill
                sizes="100vw"
                className={styles.slideImg}
                priority={i === 0}
                quality={85}
                draggable={false}
              />
              {/* Caption overlay */}
              {(photo.caption || photo.location || photo.date_taken) && (
                <div className={styles.caption}>
                  {photo.title && <p className={styles.captionTitle}>{photo.title}</p>}
                  {photo.caption && <p className={styles.captionText}>{photo.caption}</p>}
                  <div className={styles.captionMeta}>
                    {photo.location && <span>{photo.location}</span>}
                    {photo.date_taken && <span>{photo.date_taken}</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Download button */}
            <div className={styles.slideDownload}>
              <DownloadButton photoId={photo.id} slug={slug} filename={photo.original_filename} />
            </div>
          </SwiperSlide>
        ))}

        {/* Counter */}
        <div className={styles.counter} aria-live="polite" aria-atomic="true">
          <CounterDisplay photos={photos} />
        </div>
      </Swiper>

      {/* Custom nav buttons */}
      <button className={`${styles.navBtn} ${styles.prevBtn} swiper-btn-prev`} aria-label="Previous photo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <button className={`${styles.navBtn} ${styles.nextBtn} swiper-btn-next`} aria-label="Next photo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  );
}

function CounterDisplay({ photos }: { photos: PhotoWithUrls[] }) {
  // This is a placeholder — in real usage Swiper's activeIndex is used
  return (
    <span className={styles.counterText}>
      {photos.length} {photos.length === 1 ? 'Memory' : 'Memories'}
    </span>
  );
}
