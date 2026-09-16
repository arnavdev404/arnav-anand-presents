'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Journeys.module.css';
import type { Trip } from '@/types';

interface JourneysProps {
  trips: (Trip & { private_photo_count?: number; guest_photo_count?: number; total_photo_count?: number })[];
}

export function Journeys({ trips: initialTrips }: JourneysProps) {
  const [tripsList, setTripsList] = useState(initialTrips);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  // Track per-card image loaded state
  const [imgLoaded, setImgLoaded] = useState<Record<string, boolean>>({});

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

  return (
    <section id="journeys" className={styles.section} aria-labelledby="journeys-title">
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.eyebrow}>Travel Albums</p>
          <h2 id="journeys-title" className={styles.title}>My Journeys</h2>
        </div>
      </div>

      {tripsList.length === 0 ? (
        <div className={styles.empty}>
          <p>No journeys published yet. Check back soon for new travel stories.</p>
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
    </section>
  );
}
