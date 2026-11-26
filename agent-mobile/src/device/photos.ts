export const MAX_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Validate files picked on the device before uploading (the server re-checks type by file content and size). */
export const validatePhotos = (files: File[], existing = 0): string | null => {
  if (existing + files.length > MAX_PHOTOS) return `You can attach at most ${MAX_PHOTOS} photos per visit.`;
  for (const f of files) {
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return `${f.name || 'This file'} is not a JPEG, PNG or WebP image.`;
    if (f.size > MAX_PHOTO_BYTES) return `${f.name || 'This photo'} is larger than 5 MB.`;
  }
  return null;
};
// Native camera capture (Capacitor Camera) is added in Phase 7. Until then photos come from the device's
// camera/gallery through a standard file input (`accept="image/*" capture="environment"`), which works in
// the browser and in the Android WebView.
