'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Keyboard, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import styles from './FeaturedCarousel.module.css';
import type { PhotoWithUrls } from '@/types';

interface FeaturedItem {
  photo: PhotoWithUrls;
  index: number;
}

interface FeaturedCarouselProps {
  items: FeaturedItem[];
  onPhotoClick: (index: number) => void;
}

export function FeaturedCarousel({ items, onPhotoClick }: FeaturedCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!items || items.length === 0) return null;

  return (
    <section className={styles.carouselWrapper} aria-label="Featured highlights">
      <Swiper
        modules={[Navigation, Autoplay, Keyboard, A11y]}
        navigation={{
          prevEl: '.feat-prev',
          nextEl: '.feat-next',
        }}
        keyboard={{ enabled: true }}
        a11y={{ enabled: true }}
        autoplay={items.length > 1 ? { delay: 6000, disableOnInteraction: true } : false}
        spaceBetween={0}
        slidesPerView={1}
        loop={items.length > 1}
        onSlideChange={(s) => setActiveIndex(s.realIndex)}
        className={styles.swiper}
      >
        {items.map((item, idx) => (
          <SwiperSlide key={item.photo.id} className={styles.slide}>
            <div
              className={styles.slideInner}
              role="button"
              tabIndex={0}
              aria-label={`Open ${item.photo.title || 'photo'} fullscreen`}
              onClick={() => onPhotoClick(item.index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onPhotoClick(item.index);
                }
              }}
            >
              <span className={styles.featuredBadge}>Featured Highlight</span>

              <Image
                src={item.photo.preview_url}
                alt={item.photo.caption || item.photo.title || `Featured photo ${idx + 1}`}
                fill
                priority={idx === 0}
                quality={85}
                sizes="100vw"
                className={styles.slideImg}
              />

              <div className={styles.caption}>
                <div className={styles.captionContent}>
                  {item.photo.title && <h3 className={styles.title}>{item.photo.title}</h3>}
                  <div className={styles.meta}>
                    {item.photo.location && <span>{item.photo.location}</span>}
                    {item.photo.date_taken && <span>{item.photo.date_taken}</span>}
                  </div>
                </div>
                <span className={styles.counter}>
                  {idx + 1} / {items.length}
                </span>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {items.length > 1 && (
        <>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.prevBtn} feat-prev`}
            aria-label="Previous featured photo"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.nextBtn} feat-next`}
            aria-label="Next featured photo"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}
    </section>
  );
}
