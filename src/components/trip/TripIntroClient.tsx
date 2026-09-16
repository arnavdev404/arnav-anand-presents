'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Pinwheel } from '@/components/shared/Pinwheel';
import styles from './TripIntroClient.module.css';
import type { Trip } from '@/types';

interface TripIntroClientProps {
  trip: Trip;
}

type Phase = 'intro' | 'access_granted' | 'loading' | 'ready';

export function TripIntroClient({ trip }: TripIntroClientProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('intro');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase === 'intro') inputRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    if (phase !== 'loading') return;

    const startTime = Date.now();
    const duration = 1400; // Fast and snappy (1.4s)
    let rafId: number;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setLoadingProgress(pct);

      if (pct < 100) {
        rafId = requestAnimationFrame(tick);
      } else {
        setPhase('ready');
        router.push(`/trip/${trip.slug}/gallery`);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [phase, router, trip.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (trip.has_password && !password.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/trips/${trip.slug}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim(), access_type: 'private' }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPhase('access_granted');
        // Fast transition to loading (600ms)
        setTimeout(() => setPhase('loading'), 600);
      } else {
        setError(data.error || 'Incorrect password. Please try again.');
        setPassword('');
        inputRef.current?.focus();
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === 'access_granted') {
    return (
      <div className={styles.grantedScreen}>
        <div className={styles.grantedContent}>
          <div className={styles.grantedIcon}>✓</div>
          <h1 className={styles.grantedText}>Access Granted</h1>
          <p className={styles.grantedSub}>Preparing your memories…</p>
        </div>
      </div>
    );
  }

  if (phase === 'loading' || phase === 'ready') {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingContent}>
          <Pinwheel size="page" label="Loading memories…" />
          <p className={styles.loadingLabel}>Loading Memories</p>
          <h2 className={styles.loadingTripName}>{trip.name}</h2>
          <div className={styles.loadingSteps}>
            <span className={loadingProgress >= 20 ? styles.stepDone : styles.step}>Verifying access</span>
            <span className={loadingProgress >= 40 ? styles.stepDone : styles.step}>Fetching photos</span>
            <span className={loadingProgress >= 65 ? styles.stepDone : styles.step}>Generating secure links</span>
            <span className={loadingProgress >= 90 ? styles.stepDone : styles.step}>Preparing gallery</span>
          </div>
        </div>
      </div>
    );
  }

  // Phase: intro — show password form
  return (
    <div className={styles.page}>
      {/* Background cover image */}
      {trip.cover_image && (
        <div className={styles.bgWrapper} aria-hidden="true">
          <Image
            src={trip.cover_image}
            alt=""
            fill
            className={styles.bgImage}
            priority
          />
          <div className={styles.bgOverlay} />
        </div>
      )}
      {!trip.cover_image && (
        <div className={styles.bgGradient} aria-hidden="true" />
      )}

      <div className={styles.centerCard}>
        {/* Trip info */}
        <div className={styles.tripInfo}>
          <p className={styles.tripEyebrow}>Private Memories</p>
          <h1 className={styles.tripName}>{trip.name}</h1>
          {trip.description && (
            <p className={styles.tripDesc}>{trip.description}</p>
          )}
          {trip.trip_date && (
            <p className={styles.tripDate}>{trip.trip_date}</p>
          )}
        </div>

        {/* Divider */}
        <div className={styles.divider} aria-hidden="true" />

        {/* Lock icon + text */}
        <div className={styles.lockInfo}>
          <div className={styles.lockIcon} aria-hidden="true">
            {trip.has_password ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            )}
          </div>
          <p className={styles.lockText}>
            {trip.has_password
              ? 'This album is protected. Enter the password to continue.'
              : 'This album is open to explore. Click below to begin.'}
          </p>
        </div>

        {/* Password form */}
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {trip.has_password && (
            <div className={styles.inputWrapper}>
              <label htmlFor="trip-password" className="sr-only">Password</label>
              <input
                ref={inputRef}
                id="trip-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className={styles.input}
                autoComplete="current-password"
                disabled={submitting}
                aria-invalid={!!error}
                aria-describedby={error ? 'password-error' : undefined}
              />
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          )}

          {error && (
            <p id="password-error" className={styles.error} role="alert" aria-live="polite">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </p>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting || (trip.has_password && !password.trim())}
            aria-label="Unlock memories"
          >
            {submitting ? (
              <><span className={styles.btnSpinner} aria-hidden="true" /> Preparing…</>
            ) : trip.has_password ? (
              'Unlock Memories'
            ) : (
              'Explore Memories'
            )}
          </button>
        </form>

        {/* Guest album link */}
        {trip.guest_enabled && (
          <div className={styles.guestSection}>
            <p className={styles.guestText}>Looking for the guest album?</p>
            <a href={`/trip/${trip.slug}/guest`} className={styles.guestLink}>
              Access Guest Memories
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
