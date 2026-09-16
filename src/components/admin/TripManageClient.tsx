'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './TripManageClient.module.css';
import { UploadModal } from '@/components/shared/UploadModal';
import { Pinwheel } from '@/components/shared/Pinwheel';
import type { Trip, PhotoWithUrls } from '@/types';

interface TripManageClientProps {
  trip: Trip;
}

export function TripManageClient({ trip: initialTrip }: TripManageClientProps) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip>(initialTrip);
  const [photos, setPhotos] = useState<PhotoWithUrls[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit trip modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(initialTrip.name);
  const [editDesc, setEditDesc] = useState(initialTrip.description || '');
  const [editDate, setEditDate] = useState(initialTrip.trip_date || '');
  const [editPassword, setEditPassword] = useState('');
  const [editGuestEnabled, setEditGuestEnabled] = useState(initialTrip.guest_enabled);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${trip.slug}/photos/admin`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
        if (data.trip) setTrip(data.trip);
      }
    } catch (err) {
      console.error('Error loading photos:', err);
    } finally {
      setLoading(false);
    }
  }, [trip.slug]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

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

  // Move photo in sort order
  const handleReorder = async (photoId: string, direction: 'up' | 'down', isGuestSection: boolean) => {
    const currentList = isGuestSection ? [...guestPhotos] : [...privatePhotos];
    const index = currentList.findIndex(p => p.id === photoId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentList.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = currentList[index];
    currentList[index] = currentList[targetIndex];
    currentList[targetIndex] = temp;

    // Combine with the other section
    const updatedAll = isGuestSection
      ? [...privatePhotos, ...currentList]
      : [...currentList, ...guestPhotos];

    setPhotos(updatedAll);

    try {
      await fetch('/api/photos/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: updatedAll.map(p => p.id) }),
      });
    } catch (err) {
      console.error('Reorder save failed:', err);
    }
  };

  // Delete trip
  const handleDeleteTrip = async () => {
    if (!confirm(`Are you sure you want to permanently delete "${trip.name}" and all its photos? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/trips/${trip.slug}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete trip');
      }
    } catch {
      alert('Failed to delete trip. Please try again.');
    }
  };

  // Save edited trip metadata & password
  const handleSaveTripEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editSaving) return;
    setEditSaving(true);
    setEditError('');

    try {
      const payload: Record<string, unknown> = {
        name: editName.trim(),
        description: editDesc.trim(),
        trip_date: editDate.trim(),
        guest_enabled: editGuestEnabled,
      };

      // Only update password if changed/provided
      if (editPassword.trim().length > 0) {
        payload.password = editPassword.trim();
      }

      const res = await fetch(`/api/trips/${trip.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update trip');
      }

      setTrip(data.trip);
      setShowEditModal(false);
      setEditPassword('');
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setEditSaving(false);
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
            {trip.has_password && ' • 🔒 Password Protected'}
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

          <button
            className="btn btn-outline"
            onClick={() => setShowEditModal(true)}
          >
            EDIT TRIP / PASSWORD
          </button>

          <button className="btn btn-outline" onClick={copyTripLink}>
            {copied ? '✓ COPIED' : 'COPY LINK'}
          </button>

          <Link href={`/trip/${trip.slug}`} target="_blank" className="btn btn-outline">
            VIEW LIVE
          </Link>

          <button
            className={`${styles.cardBtn} ${styles.dangerBtn}`}
            onClick={handleDeleteTrip}
            style={{ padding: '0.6rem 1rem' }}
          >
            DELETE TRIP
          </button>
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
                  {privatePhotos.map((photo, idx) => (
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
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className={styles.cardBtn}
                            style={{ flex: 1 }}
                            disabled={idx === 0}
                            onClick={() => handleReorder(photo.id, 'up', false)}
                            title="Move Earlier"
                          >
                            ▲ Up
                          </button>
                          <button
                            className={styles.cardBtn}
                            style={{ flex: 1 }}
                            disabled={idx === privatePhotos.length - 1}
                            onClick={() => handleReorder(photo.id, 'down', false)}
                            title="Move Later"
                          >
                            ▼ Down
                          </button>
                        </div>
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
                    {guestPhotos.map((photo, idx) => (
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
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              className={styles.cardBtn}
                              style={{ flex: 1 }}
                              disabled={idx === 0}
                              onClick={() => handleReorder(photo.id, 'up', true)}
                              title="Move Earlier"
                            >
                              ▲ Up
                            </button>
                            <button
                              className={styles.cardBtn}
                              style={{ flex: 1 }}
                              disabled={idx === guestPhotos.length - 1}
                              onClick={() => handleReorder(photo.id, 'down', true)}
                              title="Move Later"
                            >
                              ▼ Down
                            </button>
                          </div>
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

      {/* Edit Trip / Password Modal */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              background: 'var(--card-bg, #1f150c)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                Edit Trip Settings
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {editError && (
              <p style={{ color: '#dc2626', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                {editError}
              </p>
            )}

            <form onSubmit={handleSaveTripEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Trip Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Journey Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password to change, or leave blank to keep current"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                  }}
                />
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                  Leave blank to retain existing password protection setting.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Date / Year
                </label>
                <input
                  type="text"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  placeholder="e.g. March 2026"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Description
                </label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="e.g. The Pink City & Amer Fort"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="editGuestEnabled"
                  checked={editGuestEnabled}
                  onChange={e => setEditGuestEnabled(e.target.checked)}
                />
                <label htmlFor="editGuestEnabled" style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Enable Guest Upload Album
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowEditModal(false)}
                  disabled={editSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={editSaving || !editName.trim()}
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
