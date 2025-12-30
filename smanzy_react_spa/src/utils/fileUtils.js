/**
 * Formats file size in bytes into human readable format (KB, MB, GB, etc.)
 * @param {number} bytes 
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Returns the correct thumbnail URL for a media object.
 * Prepends the API base URL for relative paths.
 * @param {Object} media 
 * @returns {string}
 */
export const getThumbnailUrl = (media) => {
    if (!media?.url) return '';

    // If URL is already absolute (starts with http:// or https://), return as-is
    if (media.url.startsWith('http://') || media.url.startsWith('https://')) {
        return media.url;
    }

    // Otherwise, prepend the API base URL for relative paths
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const baseUrl = apiBaseUrl.replace('/api', '');
    return baseUrl + media.url;
};

/**
 * Helper to check if a MIME type refers to an image
 * @param {string} mimeType 
 * @returns {boolean}
 */
export const isImageFile = (mimeType) => {
    return mimeType?.startsWith('image/');
};

/**
 * Helper to check if a MIME type refers to a video
 * @param {string} mimeType 
 * @returns {boolean}
 */
export const isVideoFile = (mimeType) => {
    return mimeType?.startsWith('video/');
};
