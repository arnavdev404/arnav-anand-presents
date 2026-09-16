'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './TripManageClient.module.css';
import { UploadModal } from '@/components/shared/UploadModal';
import { Pinwheel } from '@/components/shared/Pinwheel';
import type { Trip, PhotoWithUrls } from '@/types';

interface TripManageClientProps {
  trip: Trip;
}

export function TripManageClient({ trip }: TripManageClientProps) {
  const [photos, setPhotos] = useState<PhotoWithUrls[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchPhotos = async () => {
    try {
      const res = await fetch(`/api/trips/${trip.slug}/photos/admin`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch (err) {
      console.error('Error loading photos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [trip.slug]);

  const copyTripLink = () => {
    const url = `${window.location.origin}/trip/${trip.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const privatePhotos = photos.filter(p => !p.is_guest);
  const guestPhotos = photos.filter(p => p.is_guest);

  const handleAction = async (photoId: string, action: string, value?: unknown) => {
    try {
      if (action === 'delete') {
        if (!confirm('Are you sure you want to delete this memory? This cannot be undone.')) return;
        const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });
        if (res.ok) {
          setPhotos(prev => prev.filter(p => p.id !== photoId));
        }
      } else if (action === 'toggle_guest') {
        const res = await fetch(`/api/photos/${photoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_guest: value }),
        });
        if (res.ok) {
          setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, is_guest: Boolean(value) } : p));
        }
      } else if (action === 'toggle_featured') {
        const res = await fetch(`/api/photos/${photoId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_featured: value }),
        });
        if (res.ok) {
          setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, is_featured: Boolean(value) } : p));
        }
      }
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
    }
  };

  return (
    <div className={styles.container}>
      {/* Breadcrumb / Back */}
      <div className={styles.topNav}>
        <Link href="/admin/dashboard" className={styles.backLink}>
          ← Dashboard
        </Link>
      </div>

      {/* Header section */}
      <div className={styles.header}>
        <div className={styles.headerDetails}>
          <h1 className={styles.title}>{trip.name.toUpperCase()}</h1>
          <p className={styles.subtitle}>
            {trip.description ? `${trip.description} • ` : ''}{trip.trip_date || '2026'}
          </p>
          <p className={styles.stats}>
            <strong>{photos.length} Total Photos</strong> ({privatePhotos.length} Private • {guestPhotos.length} Guest)
          </p>
        </div>

        {/* Prominent Action Controls */}
        <div className={styles.actions}>
          <button
            className={styles.addPhotosBtn}
            onClick={() => setShowUploadModal(true)}
          >
            <span className={styles.plusIcon}>+</span> ADD PHOTOS
          </button>

          <button className="btn btn-outline" onClick={copyTripLink}>
            {copied ? '✓ COPIED' : 'COPY LINK'}
          </button>

          <Link href={`/trip/${trip.slug}`} target="_blank" className="btn btn-outline">
            VIEW LIVE
          </Link>
        </div>
      </div>

      <div className={styles.tripUrlBar}>
        <span className={styles.urlLabel}>Trip URL:</span>
        <code className={styles.urlText}>
          {typeof window !== 'undefined' ? `${window.location.origin}/trip/${trip.slug}` : `/trip/${trip.slug}`}
        </code>
      </div>

      {/* Photo Management Section */}
      <div className={styles.photosSection}>
        {loading ? (
          <div className={styles.loading}>
            <Pinwheel size="card" label="Loading memories…" />
            <span>Loading memories…</span>
          </div>
        ) : (
          <>
            {/* Private Section */}
            <div className={styles.albumSection}>
              <h2 className={styles.albumTitle}>
                PRIVATE MEMORIES — {privatePhotos.length}
              </h2>
              {privatePhotos.length === 0 ? (
                <p className={styles.emptyText}>No private photos yet. Click "+ ADD PHOTOS" above.</p>
              ) : (
                <div className={styles.photoGrid}>
                  {privatePhotos.map(photo => (
                    <div key={photo.id} className={styles.photoCard}>
                      <div className={styles.imgWrapper}>
                        <Image
                          src={photo.preview_url}
                          alt={photo.title || 'Memory'}
                          fill
                          sizes="200px"
                          className={styles.img}
                        />
                        {photo.is_featured && (
                          <span className={styles.featuredBadge}>FEATURED</span>
                        )}
                      </div>
                      <div className={styles.cardControls}>
                        <button
                          className={styles.cardBtn}
                          onClick={() => handleAction(photo.id, 'toggle_guest', true)}
                          title="Move to Guest"
                        >
                          Move to Guest
                        </button>
                        <button
                          className={styles.cardBtn}
                          onClick={() => handleAction(photo.id, 'toggle_featured', !photo.is_featured)}
                        >
                          {photo.is_featured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button
                          className={`${styles.cardBtn} ${styles.dangerBtn}`}
                          onClick={() => handleAction(photo.id, 'delete')}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Guest Section */}
            {trip.guest_enabled && (
              <div className={styles.albumSection} style={{ marginTop: '3rem' }}>
                <h2 className={styles.albumTitle}>
                  GUEST MEMORIES — {guestPhotos.length}
                </h2>
                {guestPhotos.length === 0 ? (
                  <p className={styles.emptyText}>No guest photos yet.</p>
                ) : (
                  <div className={styles.photoGrid}>
                    {guestPhotos.map(photo => (
                      <div key={photo.id} className={styles.photoCard}>
                        <div className={styles.imgWrapper}>
                          <Image
                            src={photo.preview_url}
                            alt={photo.title || 'Memory'}
                            fill
                            sizes="200px"
                            className={styles.img}
                          />
                          {photo.is_featured && (
                            <span className={styles.featuredBadge}>FEATURED</span>
                          )}
                        </div>
                        <div className={styles.cardControls}>
                          <button
                            className={styles.cardBtn}
                            onClick={() => handleAction(photo.id, 'toggle_guest', false)}
                            title="Move to Private"
                          >
                            Move to Private
                          </button>
                          <button
                            className={styles.cardBtn}
                            onClick={() => handleAction(photo.id, 'toggle_featured', !photo.is_featured)}
                          >
                            {photo.is_featured ? 'Unfeature' : 'Feature'}
                          </button>
                          <button
                            className={`${styles.cardBtn} ${styles.dangerBtn}`}
                            onClick={() => handleAction(photo.id, 'delete')}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          slug={trip.slug}
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={() => {
            fetchPhotos();
            setShowUploadModal(false);
          }}
        />
      )}
    </div>
  );
}
