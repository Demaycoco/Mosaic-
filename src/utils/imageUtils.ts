/**
 * Image processing utilities for client-side compression and resizing.
 * Prevents localStorage quota exceeded errors (5MB limit) and Firestore document
 * size limits (1MB limit) when users upload camera or high-res photos for their
 * profile picture and header banner.
 */

export async function compressImageFile(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file.'));

    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image file.'));

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio downscaling
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original data URL if 2D context fails
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to lightweight JPEG or WebP data URL
        try {
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch {
          resolve(readerEvent.target?.result as string);
        }
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validates that an image URL is well-formed and safe to render.
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('data:image/')) return true;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return true;
  if (trimmed.startsWith('ipfs://') || trimmed.startsWith('ar://')) return true;
  return false;
}

export const FIXED_PROFILE_STORAGE_PREFIX = 'mosaic_fixed_profile_';

export interface FixedProfileOverride {
  photoURL?: string;
  bannerURL?: string;
  displayName?: string;
  username?: string;
  bio?: string;
  updatedAt?: string;
}

export function getFixedProfileOverride(userId: string): FixedProfileOverride | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${FIXED_PROFILE_STORAGE_PREFIX}${userId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function setFixedProfileOverride(userId: string, updates: FixedProfileOverride) {
  if (!userId) return;
  try {
    const current = getFixedProfileOverride(userId) || {};
    const merged: FixedProfileOverride = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${FIXED_PROFILE_STORAGE_PREFIX}${userId}`, JSON.stringify(merged));
  } catch (e) {
    console.warn('Could not store fixed profile override:', e);
  }
}

