'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Hero.module.css';
import type { PhotoWithUrls } from '@/types';

interface HeroProps {
  featuredPhotos: PhotoWithUrls[];
}

export function Hero({ featuredPhotos }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | number | null>(null);

  const hasPhotos = featuredPhotos && featuredPhotos.length > 0;

  useEffect(() => {
    setLoaded(true);
  }, []);

  // Only cycle slides if real photos are provided
  useEffect(() => {
    if (!hasPhotos || featuredPhotos.length < 2) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % featuredPhotos.length);
    }, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current as NodeJS.Timeout);
    };
  }, [hasPhotos, featuredPhotos?.length]);

  const scrollToGlimpses = () => {
    document.getElementById('glimpses')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className={styles.hero} aria-label="Hero">
      {/* Photo slideshow (only active when actual photos exist) */}
      {hasPhotos && (
        <div className={styles.slideshow} aria-hidden="true">
          {featuredPhotos.map((photo, i) => (
            <div
              key={photo.id}
              className={`${styles.slide} ${i === currentIndex ? styles.active : ''}`}
            >
              <Image
                src={photo.preview_url}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                className={styles.slideImg}
                quality={85}
              />
            </div>
          ))}
          <div className={styles.photoOverlay} />
        </div>
      )}

      {/* Content */}
      <div className={`${styles.content} ${loaded ? styles.loaded : ''}`}>
        <div className={styles.eyebrow}>A personal collection</div>

        <h1 className={styles.title}>
          <span className={styles.titleName}>Arnav Anand</span>
          <span className={styles.titlePresents}>Presents</span>
        </h1>

        <p className={styles.subtitle}>
          A collection of moments, places & memories.
        </p>

        <div className={styles.actions}>
          <button
            onClick={scrollToGlimpses}
            className={styles.ctaBtn}
            aria-label="Explore memories — scroll to glimpses"
          >
            Explore Memories
          </button>
          <Link href="/journeys" className={styles.journeysLink}>
            View All Journeys
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

        {/* Slide indicator dots (only if multiple photos exist) */}
        {hasPhotos && featuredPhotos.length > 1 && (
          <div className={styles.dots} role="tablist" aria-label="Hero slides">
            {featuredPhotos.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === currentIndex}
                aria-label={`Slide ${i + 1}`}
                className={`${styles.dot} ${i === currentIndex ? styles.dotActive : ''}`}
                onClick={() => setCurrentIndex(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div className={styles.scrollIndicator} aria-hidden="true">
        <div className={styles.scrollLine} />
        <span className={styles.scrollText}>Scroll</span>
      </div>
    </section>
  );
}
