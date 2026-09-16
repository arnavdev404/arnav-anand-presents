'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './TripForm.module.css';
import { UploadModal } from '@/components/shared/UploadModal';

export function TripForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [tripDate, setTripDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [guestEnabled, setGuestEnabled] = useState(false);
  const [guestAccessType, setGuestAccessType] = useState<'public' | 'password_protected'>('public');
  const [guestPassword, setGuestPassword] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Private password must be at least 6 characters.');
      return;
    }

    if (guestEnabled && guestAccessType === 'password_protected' && !guestPassword) {
      setError('Guest password is required when guest access is password protected.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('slug', slug);
      if (description) formData.append('description', description);
      if (tripDate) formData.append('trip_date', tripDate);
      formData.append('password', password);
      formData.append('guest_enabled', String(guestEnabled));
      formData.append('guest_access_type', guestAccessType);
      if (guestPassword) formData.append('guest_password', guestPassword);
      if (coverFile) formData.append('cover_image', coverFile);

      const res = await fetch('/api/trips', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create trip');
      }

      setCreatedSlug(slug);
      setShowUploadModal(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Create New Trip</h1>
      <p className={styles.subtitle}>Set up a new protected travel album</p>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Trip Name *</label>
            <input
              type="text"
              required
              className={styles.input}
              placeholder="Jaipur Trip"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>URL Slug *</label>
            <input
              type="text"
              required
              pattern="^[a-z0-9-]+$"
              className={styles.input}
              placeholder="jaipur"
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase())}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Trip Date / Year</label>
            <input
              type="text"
              className={styles.input}
              placeholder="May 2026"
              value={tripDate}
              onChange={e => setTripDate(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Cover Image</label>
            <input
              type="file"
              accept="image/*,.heic"
              className={styles.fileInput}
              onChange={e => setCoverFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            rows={3}
            className={styles.textarea}
            placeholder="A short memory note or subtitle..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className={styles.divider} />
        <h2 className={styles.sectionTitle}>Security & Passwords</h2>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Private Password *</label>
            <input
              type="password"
              required
              className={styles.input}
              placeholder="••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Confirm Private Password *</label>
            <input
              type="password"
              required
              className={styles.input}
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.divider} />
        <h2 className={styles.sectionTitle}>Guest Album Settings</h2>

        <div className={styles.checkboxField}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={guestEnabled}
              onChange={e => setGuestEnabled(e.target.checked)}
            />
            Enable Guest Memories for this trip
          </label>
        </div>

        {guestEnabled && (
          <div className={styles.guestSettings}>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="guestAccessType"
                  value="public"
                  checked={guestAccessType === 'public'}
                  onChange={() => setGuestAccessType('public')}
                />
                Public (No password needed for guest photos)
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="guestAccessType"
                  value="password_protected"
                  checked={guestAccessType === 'password_protected'}
                  onChange={() => setGuestAccessType('password_protected')}
                />
                Password Protected (Dedicated guest password)
              </label>
            </div>

            {guestAccessType === 'password_protected' && (
              <div className={styles.field} style={{ marginTop: '1rem' }}>
                <label className={styles.label}>Guest Password *</label>
                <input
                  type="password"
                  required
                  className={styles.input}
                  placeholder="Enter separate guest password"
                  value={guestPassword}
                  onChange={e => setGuestPassword(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => router.push('/admin/dashboard')}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating Trip...' : 'Create Trip & Add Photos'}
          </button>
        </div>
      </form>

      {showUploadModal && createdSlug && (
        <UploadModal
          slug={createdSlug}
          isOpen={showUploadModal}
          onClose={() => router.push(`/admin/trips/${createdSlug}`)}
          onUploadComplete={() => router.push(`/admin/trips/${createdSlug}`)}
        />
      )}
    </div>
  );
}
