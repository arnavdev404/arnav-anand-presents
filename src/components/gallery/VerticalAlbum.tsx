'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Image from 'next/image';
import styles from './VerticalAlbum.module.css';
import { DownloadButton } from './DownloadButton';
import { LongPressAction } from './LongPressAction';
import type { PhotoWithUrls } from '@/types';

interface VerticalAlbumProps {
  photos: PhotoWithUrls[];
  slug: string;
  onPhotoClick: (index: number) => void;
}

// Editorial layout pattern — creates varied sizes for a portfolio feel
const SIZE_PATTERN = [
  'full', 'portrait', 'landscape',
  'portrait', 'square', 'landscape',
  'full', 'square', 'portrait',
  'landscape', 'portrait', 'square',
];

export function VerticalAlbum({ photos, slug, onPhotoClick }: VerticalAlbumProps) {
  const albumRef = useRef<HTMLDivElement>(null);
  const [longPressPhoto, setLongPressPhoto] = useState<PhotoWithUrls | null>(null);

  // Intersection Observer for lazy reveal
  useEffect(() => {
    if (!albumRef.current) return;
    const cards = albumRef.current.querySelectorAll(`.${styles.photoCard}`);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add(styles.revealed);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    cards.forEach(c => observer.observe(c));
    return () => observer.disconnect();
  }, [photos]);

  const handleLongPress = useCallback((photo: PhotoWithUrls) => {
    setLongPressPhoto(photo);
  }, []);

  return (
    <div ref={albumRef} className={styles.album}>
      <div className={styles.grid}>
        {photos.map((photo, i) => {
          const sizeClass = SIZE_PATTERN[i % SIZE_PATTERN.length];
          return (
            <PhotoItem
              key={photo.id}
              photo={photo}
              index={i}
              sizeClass={sizeClass}
              slug={slug}
              onClick={() => onPhotoClick(i)}
              onLongPress={() => handleLongPress(photo)}
            />
          );
        })}
      </div>

      {longPressPhoto && (
        <LongPressAction
          photo={longPressPhoto}
          slug={slug}
          onClose={() => setLongPressPhoto(null)}
        />
      )}
    </div>
  );
}

interface PhotoItemProps {
  photo: PhotoWithUrls;
  index: number;
  sizeClass: string;
  slug: string;
  onClick: () => void;
  onLongPress: () => void;
}

function PhotoItem({ photo, index, sizeClass, slug, onClick, onLongPress }: PhotoItemProps) {
  const pressTimer = useRef<NodeJS.Timeout | number | null>(null);
  const isLongPress = useRef(false);

  const startPress = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, 600);
  }, [onLongPress]);

  const cancelPress = useCallback(() => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }, []);

  const handleClick = useCallback(() => {
    if (!isLongPress.current) onClick();
    isLongPress.current = false;
  }, [onClick]);

  return (
    <div
      className={`${styles.photoCard} ${styles[sizeClass]}`}
      style={{ animationDelay: `${(index % 6) * 60}ms` }}
    >
      <div
        className={styles.imgWrapper}
        role="button"
        tabIndex={0}
        aria-label={`Open ${photo.title || `photo ${index + 1}`} fullscreen`}
        onClick={handleClick}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onTouchCancel={cancelPress}
      >
        {/* Shimmer placeholder */}
        <div className={`${styles.placeholder} shimmer`} aria-hidden="true" />

        <Image
          src={photo.preview_url}
          alt={photo.caption || photo.title || `Photo ${index + 1}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
          className={styles.img}
          loading={index < 4 ? 'eager' : 'lazy'}
          quality={80}
          onLoad={e => {
            const el = (e.target as HTMLElement).closest(`.${styles.imgWrapper}`);
            el?.querySelector(`.${styles.placeholder}`)?.remove();
          }}
        />

        {/* Hover overlay */}
        <div className={styles.overlay} aria-hidden="true">
          <div className={styles.expandIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Photo metadata + download */}
      <div className={styles.photoMeta}>
        <div className={styles.metaText}>
          {photo.title && <p className={styles.metaTitle}>{photo.title}</p>}
          {photo.location && <p className={styles.metaLocation}>{photo.location}</p>}
        </div>
        <DownloadButton photoId={photo.id} slug={slug} filename={photo.original_filename} compact />
      </div>
    </div>
  );
}
