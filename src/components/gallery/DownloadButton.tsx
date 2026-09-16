'use client';

import { useState, useCallback } from 'react';
import styles from './DownloadButton.module.css';

interface DownloadButtonProps {
  photoId: string;
  slug: string;
  filename?: string | null;
  compact?: boolean;
}

export function DownloadButton({ photoId, slug, filename, compact = false }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger fullscreen on click
    if (downloading) return;

    setDownloading(true);
    try {
      const res = await fetch(`/api/photos/${photoId}/download?slug=${slug}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Download failed');

      const { downloadUrl, filename: dlFilename } = await res.json();
      if (!downloadUrl) throw new Error('No download URL');

      // Trigger download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = dlFilename || filename || 'photo.jpg';
      a.rel = 'noopener noreferrer';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  }, [photoId, slug, filename, downloading]);

  if (compact) {
    return (
      <button
        className={`${styles.btn} ${styles.compact}`}
        onClick={handleDownload}
        disabled={downloading}
        aria-label={downloading ? 'Downloading…' : 'Download original photo'}
        title="Download original"
      >
        {downloading ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      className={styles.btn}
      onClick={handleDownload}
      disabled={downloading}
      aria-label={downloading ? 'Downloading…' : 'Download original photo'}
    >
      {downloading ? (
        <><span className={styles.spinner} aria-hidden="true" /> Downloading…</>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download
        </>
      )}
    </button>
  );
}
