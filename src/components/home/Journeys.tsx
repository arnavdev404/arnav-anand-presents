'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Journeys.module.css';
import { UploadModal } from '@/components/shared/UploadModal';
import type { Trip } from '@/types';

interface JourneysProps {
  trips: (Trip & { private_photo_count?: number; guest_photo_count?: number; total_photo_count?: number })[];
}

export function Journeys({ trips: initialTrips }: JourneysProps) {
  const [tripsList, setTripsList] = useState(initialTrips);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeUploadSlug, setActiveUploadSlug] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  // Track per-card image loaded state
  const [imgLoaded, setImgLoaded] = useState<Record<string, boolean>>({});

  // New trip form state
  const [tripName, setTripName] = useState('');
  const [tripPassword, setTripPassword] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [tripDesc, setTripDesc] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTripsList(initialTrips);
  }, [initialTrips]);

  useEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll(`.${styles.card}`);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add(styles.visible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, [tripsList]);

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/trip/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripName.trim() || submitting) return;

    setSubmitting(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('name', tripName.trim());
      if (tripPassword.trim()) {
        formData.append('password', tripPassword.trim());
      }
      if (tripDate.trim()) formData.append('trip_date', tripDate.trim());
      if (tripDesc.trim()) formData.append('description', tripDesc.trim());
      if (coverFile) formData.append('cover_image', coverFile);

      const res = await fetch('/api/trips', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create journey');
      }

      // Prepend to trips list
      const newTrip = {
        ...data.trip,
        private_photo_count: 0,
        guest_photo_count: 0,
        total_photo_count: 0,
      };
      setTripsList(prev => [newTrip, ...prev]);

      // Reset form
      setTripName('');
      setTripPassword('');
      setTripDate('');
      setTripDesc('');
      setCoverFile(null);
      setShowCreateModal(false);

      // Offer to upload photos to the newly created trip immediately
      setActiveUploadSlug(newTrip.slug);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create journey');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="journeys" className={styles.section} aria-labelledby="journeys-title">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.eyebrow}>Travel Albums</p>
          <h2 id="journeys-title" className={styles.title}>My Journeys</h2>
        </div>

        {/* Action to set up/add journey directly in this section */}
        <button
          className={styles.addJourneyBtn}
          onClick={() => setShowCreateModal(true)}
          aria-label="Add new travel journey"
        >
          <span className={styles.plusIcon}>+</span> Set New Journey
        </button>
      </div>

      {tripsList.length === 0 ? (
        <div className={styles.empty}>
          <p>No journeys yet. Create your first travel album!</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{ marginTop: '1rem' }}
          >
            + Create First Journey
          </button>
        </div>
      ) : (
        <div ref={gridRef} className={styles.grid}>
          {tripsList.map((trip, i) => (
            <article
              key={trip.id || trip.slug}
              className={styles.card}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Cover image */}
              <div className={styles.imgArea}>
                {trip.cover_image ? (
                  <>
                    {/* Pinwheel loader — visible until image finishes loading */}
                    {!imgLoaded[trip.id || trip.slug] && (
                      <div className={styles.pinwheelWrap} aria-hidden="true">
                        <div className={styles.pinwheelLoader}>
                          <div className={styles.pinStick} />
                          <div className={styles.pinContainer}>
                            <div className={styles.pinDot} />
                            <div className={`${styles.paperContainer} ${styles.pinRed}`}>
                              <div className={`${styles.paperLeaf1} ${styles.redLeaf1}`} />
                              <div className={`${styles.paperLeaf2} ${styles.redLeaf2}`} />
                            </div>
                            <div className={`${styles.paperContainer} ${styles.pinRotate90}`}>
                              <div className={`${styles.paperLeaf1} ${styles.yellowLeaf1}`} />
                              <div className={`${styles.paperLeaf2} ${styles.yellowLeaf2}`} />
                            </div>
                            <div className={`${styles.paperContainer} ${styles.pinRotate180}`}>
                              <div className={`${styles.paperLeaf1} ${styles.greenLeaf1}`} />
                              <div className={`${styles.paperLeaf2} ${styles.greenLeaf2}`} />
                            </div>
                            <div className={`${styles.paperContainer} ${styles.pinRotate270}`}>
                              <div className={`${styles.paperLeaf1} ${styles.blueLeaf1}`} />
                              <div className={`${styles.paperLeaf2} ${styles.blueLeaf2}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <Image
                      src={trip.cover_image}
                      alt={`${trip.name} cover`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className={`${styles.coverImg} ${imgLoaded[trip.id || trip.slug] ? styles.coverImgLoaded : styles.coverImgLoading}`}
                      loading="lazy"
                      onLoad={() =>
                        setImgLoaded(prev => ({ ...prev, [trip.id || trip.slug]: true }))
                      }
                    />
                  </>
                ) : (
                  <div className={styles.coverPlaceholder} aria-hidden="true">
                    <span>{trip.name.charAt(0)}</span>
                  </div>
                )}
                <div className={styles.imgOverlay} aria-hidden="true" />

                {/* Password / Open badge */}
                <div
                  className={`${styles.badge} ${trip.has_password ? styles.badgeProtected : styles.badgeOpen}`}
                  aria-label={trip.has_password ? 'Password protected' : 'Open album'}
                >
                  {trip.has_password ? (
                    <>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      Password
                    </>
                  ) : (
                    <>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="m9 12 2 2 4-4"/>
                      </svg>
                      Open
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className={styles.cardBody}>
                <p className={styles.tripDate}>{trip.trip_date || '2026'}</p>
                <h3 className={styles.tripName}>{trip.name}</h3>
                {trip.description && (
                  <p className={styles.tripDesc}>{trip.description}</p>
                )}

                <div className={styles.meta}>
                  <span className={styles.metaItem}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M3 9h18M9 21V9"/>
                    </svg>
                    {trip.total_photo_count ?? 0} {(trip.total_photo_count ?? 0) === 1 ? 'Photo' : 'Photos'}
                  </span>
                  {trip.guest_enabled && (
                    <span className={styles.metaGuest}>
                      Guest Album
                    </span>
                  )}
                </div>

                {/* Primary Card Actions */}
                <div className={styles.cardActions}>
                  <Link
                    href={`/trip/${trip.slug}`}
                    className={styles.viewBtn}
                    aria-label={`View ${trip.name} memories`}
                  >
                    View Memories
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>

                  <div className={styles.cardQuickBtns}>
                    <button
                      type="button"
                      className={styles.quickActionBtn}
                      onClick={() => setActiveUploadSlug(trip.slug)}
                      title="Upload photos to this trip"
                    >
                      + Photos
                    </button>
                    <button
                      type="button"
                      className={styles.quickActionBtn}
                      onClick={() => handleCopyLink(trip.slug)}
                      title="Copy trip share link"
                    >
                      {copiedSlug === trip.slug ? '✓ Copied' : 'Copy Link'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* CREATE JOURNEY MODAL */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Set New Journey</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setShowCreateModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className={styles.formError} role="alert">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTrip} className={styles.createForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Name the Trip *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jaipur"
                  value={tripName}
                  onChange={e => setTripName(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Password (or leave blank for no password)
                </label>
                <input
                  type="password"
                  placeholder="Pass or leave blank for open album"
                  value={tripPassword}
                  onChange={e => setTripPassword(e.target.value)}
                  className={styles.formInput}
                />
                <span className={styles.formHint}>
                  Leave blank if you want anyone to open and view the photos without entering a password.
                </span>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Date / Year (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. May 2026"
                    value={tripDate}
                    onChange={e => setTripDate(e.target.value)}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Cover Photo (optional)</label>
                  <input
                    type="file"
                    accept="image/*,.heic,.HEIC"
                    onChange={e => setCoverFile(e.target.files?.[0] || null)}
                    className={styles.fileInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description / Subtitle (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. The Pink City & Amer Fort"
                  value={tripDesc}
                  onChange={e => setTripDesc(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submitting || !tripName.trim()}
                >
                  {submitting ? 'Creating...' : 'Create Journey'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal for any trip */}
      {activeUploadSlug && (
        <UploadModal
          slug={activeUploadSlug}
          isOpen={Boolean(activeUploadSlug)}
          onClose={() => setActiveUploadSlug(null)}
          onUploadComplete={() => {
            // Update photo count locally
            setTripsList(prev =>
              prev.map(t =>
                t.slug === activeUploadSlug
                  ? { ...t, total_photo_count: (t.total_photo_count || 0) + 1 }
                  : t
              )
            );
          }}
        />
      )}
    </section>
  );
}
