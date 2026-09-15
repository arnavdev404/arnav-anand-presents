// =============================================================
// ARNAV ANAND PRESENTS — Type Definitions
// =============================================================

export type GuestAccessType = 'public' | 'password_protected';
export type AccessType = 'private' | 'guest';

export interface Trip {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  trip_date: string | null;
  cover_image: string | null;
  guest_enabled: boolean;
  guest_access_type: GuestAccessType;
  created_at: string;
  updated_at: string;
  // computed
  private_photo_count?: number;
  guest_photo_count?: number;
  total_photo_count?: number;
}

// Full trip including password hashes — NEVER sent to browser
export interface TripWithSecrets extends Trip {
  password_hash: string;
  guest_password_hash: string | null;
}

export interface Photo {
  id: string;
  trip_id: string;
  title: string | null;
  caption: string | null;
  location: string | null;
  original_path: string;
  preview_path: string;
  original_filename: string | null;
  file_size: number | null;
  is_guest: boolean;
  is_featured: boolean;
  is_cover: boolean;
  sort_order: number;
  date_taken: string | null;
  created_at: string;
  updated_at: string;
}

// Photo as served to the browser — signed URLs, no storage paths
export interface PhotoWithUrls {
  id: string;
  trip_id: string;
  title: string | null;
  caption: string | null;
  location: string | null;
  original_filename: string | null;
  file_size: number | null;
  is_guest: boolean;
  is_featured: boolean;
  is_cover: boolean;
  sort_order: number;
  date_taken: string | null;
  preview_url: string;     // signed preview URL (1hr)
  // no original_url exposed — fetched on-demand at download
}

export interface AccessSession {
  id: string;
  trip_id: string;
  session_token: string;
  access_type: AccessType;
  expires_at: string;
  created_at: string;
}

export interface CreateTripPayload {
  name: string;
  slug: string;
  description?: string;
  trip_date?: string;
  password: string;
  guest_enabled?: boolean;
  guest_access_type?: GuestAccessType;
  guest_password?: string;
}

export interface UpdateTripPayload {
  name?: string;
  description?: string;
  trip_date?: string;
  password?: string;
  guest_enabled?: boolean;
  guest_access_type?: GuestAccessType;
  guest_password?: string;
}

export interface UpdatePhotoPayload {
  title?: string;
  caption?: string;
  location?: string;
  date_taken?: string;
  is_guest?: boolean;
  is_featured?: boolean;
  is_cover?: boolean;
  sort_order?: number;
}

export interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
}

export interface VerifyPasswordPayload {
  password: string;
  access_type?: AccessType;
}

export interface VerifyPasswordResponse {
  success: boolean;
  message?: string;
  session_token?: string;
}

export interface ApiError {
  error: string;
  code?: string;
}

export type Theme = 'light' | 'dark';
