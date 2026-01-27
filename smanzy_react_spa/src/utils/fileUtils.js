/**
 * Formats file size in bytes into human readable format (KB, MB, GB, etc.)
 * @param {number} bytes
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

//
// const mediaSizes = {
//   small:  "160x100",
//   medium: "320x200",
//   large:  "640x400",
//   xl:     "800x600",
//   xxl:    "1200x800"
// }

export const getThumbnailUrl = (media, size = "medium") => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const baseUrl = apiBaseUrl.replace("/api", "/api/media/files/");
  return baseUrl + media.stored_name;
};

export const getMediaUrl = (media) => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const baseUrl = apiBaseUrl.replace("/api", "/api/media/files/");
  return baseUrl + media.stored_name;
};

/**
 * Helper to check if a MIME type refers to an image
 * @param {string} mimeType
 * @returns {boolean}
 */
export const isImageFile = (mimeType) => {
  return mimeType?.startsWith("image/");
};

/**
 * Helper to check if a MIME type refers to a video
 * @param {string} mimeType
 * @returns {boolean}
 */
export const isVideoFile = (mimeType) => {
  return mimeType?.startsWith("video/");
};

/**
 * Get thumbnail URL with specific size preference
 * Currently returns the same as getThumbnailUrl, but provides
 * a hook for future backend support of multiple thumbnail sizes
 * @param {Object} media - Media object
 * @param {string} size - 'small' (150px), 'medium' (300px), 'large' (600px)
 * @returns {string}
 */
export const getThumbnailUrlWithSize = (media) => {
  // Future enhancement: if backend supports size parameters
  // const sizeMap = { small: 150, medium: 300, large: 600 };
  // return getThumbnailUrl(media) + `?size=${sizeMap[size]}`;

  // For now, return standard thumbnail
  return getThumbnailUrl(media);
};
