'use client';

import styles from './LongPressAction.module.css';
import { DownloadButton } from './DownloadButton';
import type { PhotoWithUrls } from '@/types';

interface LongPressActionProps {
  photo: PhotoWithUrls;
  slug: string;
  onClose: () => void;
}

export function LongPressAction({ photo, slug, onClose }: LongPressActionProps) {
  return (
    <>
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      {/* Action sheet */}
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="Photo actions"
      >
        {photo.title && <p className={styles.photoTitle}>{photo.title}</p>}
        <p className={styles.sheetLabel}>Save Photo</p>

        <div className={styles.actions}>
          <DownloadButton
            photoId={photo.id}
            slug={slug}
            filename={photo.original_filename}
          />
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
