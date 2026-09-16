'use client';

import { useCallback } from 'react';
import Image from 'next/image';
import styles from './SeamlessMasonry.module.css';
import type { PhotoWithUrls } from '@/types';

interface SeamlessMasonryProps {
  photos: PhotoWithUrls[];
  slug: string;
  onPhotoClick: (index: number) => void;
}

export function SeamlessMasonry({ photos, onPhotoClick }: SeamlessMasonryProps) {
  const handleClick = useCallback(
    (index: number) => {
      onPhotoClick(index);
    },
    [onPhotoClick]
  );

  return (
    <div className={styles.wallContainer} role="region" aria-label="Seamless photo gallery">
      <div className={styles.masonryGrid}>
        {photos.map((photo, index) => {
          const title = photo.title || photo.caption || `Memory ${index + 1}`;
          const metaText = [photo.location, photo.date_taken].filter(Boolean).join(' • ');

          return (
            <button
              key={photo.id}
              id={`photo-tile-${photo.id}`}
              type="button"
              className={styles.photoTile}
              onClick={() => handleClick(index)}
              aria-label={`View photo ${index + 1}: ${title}`}
            >
              <Image
                src={photo.preview_url}
                alt={photo.caption || photo.title || `Photo ${index + 1}`}
                width={900}
                height={650}
                sizes="(max-width: 640px) 50vw, (max-width: 900px) 33vw, (max-width: 1280px) 25vw, (max-width: 1600px) 20vw, 16vw"
                className={styles.photoImg}
                loading={index < 8 ? 'eager' : 'lazy'}
                priority={index < 4}
                quality={85}
              />

              {/* Hover overlay with title, metadata and expand icon */}
              <div className={styles.tileOverlay} aria-hidden="true">
                <div className={styles.expandIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                </div>
                {photo.title && <p className={styles.tileTitle}>{photo.title}</p>}
                {metaText && <span className={styles.tileMeta}>{metaText}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
