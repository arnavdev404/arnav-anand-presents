'use client';

import { useState, useRef, DragEvent } from 'react';
import styles from './UploadModal.module.css';

interface UploadModalProps {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}

interface QueuedFile {
  file: File;
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'waiting' | 'uploading' | 'done' | 'error';
  error?: string;
}

export function UploadModal({ slug, isOpen, onClose, onUploadComplete }: UploadModalProps) {
  const [destination, setDestination] = useState<'private' | 'guest'>('private');
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;
    const newItems: QueuedFile[] = Array.from(incomingFiles).map(f => ({
      file: f,
      id: Math.random().toString(36).substring(2, 9),
      name: f.name,
      size: f.size,
      progress: 0,
      status: 'waiting',
    }));
    setFiles(prev => [...prev, ...newItems]);
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const startUpload = async () => {
    if (files.length === 0 || isUploading) return;
    setIsUploading(true);

    let completedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      if (item.status === 'done') {
        completedCount++;
        continue;
      }

      // Update status to uploading
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'uploading', progress: 20 } : f));

      try {
        const formData = new FormData();
        formData.append('slug', slug);
        formData.append('is_guest', String(destination === 'guest'));
        formData.append('file', item.file);

        // Upload
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Upload failed');
        }

        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'done', progress: 100 } : f));
        completedCount++;
      } catch (err: unknown) {
        setFiles(prev => prev.map(f => f.id === item.id ? {
          ...f,
          status: 'error',
          error: err instanceof Error ? err.message : 'Upload failed'
        } : f));
      }
    }

    setIsUploading(false);
    if (completedCount > 0 && onUploadComplete) {
      onUploadComplete();
    }
  };

  const allCompleted = files.length > 0 && files.every(f => f.status === 'done');

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Add More Photos</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Drop Area */}
        <div
          className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.heic,.HEIC"
            style={{ display: 'none' }}
            onChange={e => handleFiles(e.target.files)}
          />
          <div className={styles.cloudIcon}>☁</div>
          <p className={styles.dropTitle}>Browse Files to Upload</p>
          <p className={styles.dropSubtitle}>Drag & Drop your photos here</p>
          <span className={styles.supportedBadge}>HEIC • JPG • JPEG • PNG • WEBP</span>
        </div>

        {/* Destination Radio */}
        <div className={styles.destinationSection}>
          <span className={styles.destLabel}>Upload Destination:</span>
          <div className={styles.destRadios}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="destination"
                value="private"
                checked={destination === 'private'}
                onChange={() => setDestination('private')}
                disabled={isUploading}
              />
              ● Private Memories
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="destination"
                value="guest"
                checked={destination === 'guest'}
                onChange={() => setDestination('guest')}
                disabled={isUploading}
              />
              ○ Guest Memories
            </label>
          </div>
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className={styles.fileListSection}>
            <div className={styles.fileListHeader}>
              <span>Selected Files — {files.length}</span>
              <button
                type="button"
                className={styles.addMoreBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                + Add More
              </button>
            </div>

            <div className={styles.fileList}>
              {files.map(f => (
                <div key={f.id} className={styles.fileItem}>
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{f.name}</span>
                    <span className={styles.fileSize}>{formatBytes(f.size)}</span>
                  </div>

                  <div className={styles.fileStatus}>
                    {f.status === 'done' && <span className={styles.statusDone}>✓</span>}
                    {f.status === 'uploading' && <span className={styles.statusUploading}>Uploading...</span>}
                    {f.status === 'waiting' && <span className={styles.statusWaiting}>Waiting</span>}
                    {f.status === 'error' && <span className={styles.statusError}>{f.error || 'Failed'}</span>}

                    {!isUploading && f.status !== 'done' && (
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => removeFile(f.id)}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className={styles.footer}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={isUploading}
          >
            {allCompleted ? 'Close' : 'Cancel'}
          </button>

          {!allCompleted && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={startUpload}
              disabled={files.length === 0 || isUploading}
            >
              {isUploading ? 'Uploading...' : `Upload ${files.length} Photos`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
