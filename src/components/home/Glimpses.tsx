'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Keyboard, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';
import styles from './Glimpses.module.css';
import type { PhotoWithUrls } from '@/types';

interface GlimpsesProps {
  photos: PhotoWithUrls[];
}

// Curated default travel photography glimpses (shown when no photos are uploaded yet)
const DEFAULT_GLIMPSES = [
  {
    id: 'glimpse-1',
    preview_url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=1200&auto=format&fit=crop',
    title: 'Hawa Mahal Dawn',
    location: 'Jaipur, Rajasthan',
    date_taken: 'March 2026',
    caption: 'Intricate sandstone lattices catching the earliest morning rays.',
  },
  {
    id: 'glimpse-2',
    preview_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
    title: 'Solang Mist & Pines',
    location: 'Manali, Himachal',
    date_taken: 'January 2026',
    caption: 'Snowcapped peaks emerging above the alpine pine forests.',
  },
  {
    id: 'glimpse-3',
    preview_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop',
    title: 'Golden Sunset Shore',
    location: 'Goa Coast',
    date_taken: 'November 2025',
    caption: 'Gentle Arabian Sea waves reflecting amber dusk.',
  },
  {
    id: 'glimpse-4',
    preview_url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1200&auto=format&fit=crop',
    title: 'Red Fort Heritage',
    location: 'Old Delhi',
    date_taken: 'October 2025',
    caption: 'Grand Mughal arches bathed in warm late afternoon glow.',
  },
  {
    id: 'glimpse-5',
    preview_url: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
    title: 'High Altitude Silence',
    location: 'Ladakh Valley',
    date_taken: 'September 2025',
    caption: 'Pristine turquoise waters nestled beneath stark Himalayan ridges.',
  },
  {
    id: 'glimpse-6',
    preview_url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=1200&auto=format&fit=crop',
    title: 'Amer Palace Courtyard',
    location: 'Jaipur, Rajasthan',
    date_taken: 'February 2026',
    caption: 'Reflections and symmetry inside the royal courtyards.',
  },
];

export function Glimpses({ photos }: GlimpsesProps) {
  const displayPhotos = photos && photos.length > 0 ? photos : DEFAULT_GLIMPSES;
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title?: string; location?: string } | null>(null);

  return (
    <section id="glimpses" className={styles.section} aria-labelledby="glimpses-title">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.eyebrow}>Sliding Memories</p>
          <h2 id="glimpses-title" className={styles.title}>Glimpses</h2>
          <p className={styles.subtitle}>Selected sliding moments from different journeys.</p>
        </div>

        {/* Custom Navigation Arrows */}
        <div className={styles.navButtons}>
          <button
            className={`${styles.navArrow} glimpses-prev`}
            aria-label="Previous glimpses"
            title="Previous"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <button
            className={`${styles.navArrow} glimpses-next`}
            aria-label="Next glimpses"
            title="Next"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Sliding Photos Carousel */}
      <div className={styles.sliderContainer}>
        <Swiper
          modules={[Navigation, Autoplay, Keyboard, FreeMode]}
          navigation={{
            prevEl: '.glimpses-prev',
            nextEl: '.glimpses-next',
          }}
          autoplay={{
            delay: 4500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          keyboard={{ enabled: true }}
          freeMode={{ enabled: true, momentumRatio: 0.8 }}
          spaceBetween={16}
          slidesPerView={1.2}
          breakpoints={{
            480: { slidesPerView: 1.6, spaceBetween: 16 },
            640: { slidesPerView: 2.2, spaceBetween: 20 },
            1024: { slidesPerView: 3.2, spaceBetween: 24 },
            1400: { slidesPerView: 4.2, spaceBetween: 28 },
          }}
          loop={displayPhotos.length > 2}
          className={styles.swiper}
        >
          {displayPhotos.map((photo, i) => (
            <SwiperSlide key={photo.id || i} className={styles.slide}>
              <div
                className={styles.card}
                onClick={() => setSelectedPhoto({ url: photo.preview_url, title: photo.title || undefined, location: photo.location || undefined })}
                role="button"
                tabIndex={0}
                aria-label={`View ${photo.title || 'photo'} glimpse`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedPhoto({ url: photo.preview_url, title: photo.title || undefined, location: photo.location || undefined });
                  }
                }}
              >
                <div className={styles.imgWrapper}>
                  <Image
                    src={photo.preview_url}
                    alt={photo.caption || photo.title || 'Travel glimpse'}
                    fill
                    sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 25vw"
                    className={styles.img}
                    loading={i < 3 ? 'eager' : 'lazy'}
                  />
                  <div className={styles.imgOverlay} />
                  <span className={styles.zoomBadge}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      <line x1="11" y1="8" x2="11" y2="14"/>
                      <line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                  </span>
                </div>

                {/* Card Content */}
                <div className={styles.cardInfo}>
                  <div className={styles.infoTop}>
                    {photo.location && <span className={styles.locationTag}>{photo.location}</span>}
                    {photo.date_taken && <span className={styles.dateTag}>{photo.date_taken}</span>}
                  </div>
                  <h3 className={styles.cardTitle}>{photo.title || 'Moments in Time'}</h3>
                  {photo.caption && <p className={styles.cardCaption}>{photo.caption}</p>}
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className={styles.viewAll}>
        <Link href="/journeys" className="btn btn-outline">
          Explore All Journeys
        </Link>
      </div>

      {/* Quick Lightbox for clicked glimpse */}
      {selectedPhoto && (
        <div className={styles.lightbox} onClick={() => setSelectedPhoto(null)} role="dialog" aria-modal="true">
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={() => setSelectedPhoto(null)} aria-label="Close">
              ✕
            </button>
            <div className={styles.lightboxImgWrapper}>
              <Image
                src={selectedPhoto.url}
                alt={selectedPhoto.title || 'Glimpse'}
                fill
                sizes="90vw"
                className={styles.lightboxImg}
                priority
              />
            </div>
            {(selectedPhoto.title || selectedPhoto.location) && (
              <div className={styles.lightboxMeta}>
                {selectedPhoto.title && <h4 className={styles.lightboxTitle}>{selectedPhoto.title}</h4>}
                {selectedPhoto.location && <p className={styles.lightboxLoc}>{selectedPhoto.location}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
