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
    // If thumbnail_url is available, return it
    if (media?.thumbnail_url) {
        if (media.thumbnail_url.startsWith('http://') || media.thumbnail_url.startsWith('https://')) {
            return media.thumbnail_url;
        }
        // Otherwise, prepend the API base URL for relative paths
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const baseUrl = apiBaseUrl.replace('/api', '');
        return baseUrl + media.thumbnail_url;
    }
    // If thumbnail_url is not available, return the URL
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

export const getMediaUrl = (media) => {
    if (!media?.url) return '';
    if (media.url.startsWith('http://') || media.url.startsWith('https://')) {
        return media.url;
    }
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

/**
 * Get thumbnail URL with specific size preference
 * Currently returns the same as getThumbnailUrl, but provides
 * a hook for future backend support of multiple thumbnail sizes
 * @param {Object} media - Media object
 * @param {string} size - 'small' (150px), 'medium' (300px), 'large' (600px)
 * @returns {string}
 */
export const getThumbnailUrlWithSize = (media, size = 'medium') => {
    // Future enhancement: if backend supports size parameters
    // const sizeMap = { small: 150, medium: 300, large: 600 };
    // return getThumbnailUrl(media) + `?size=${sizeMap[size]}`;

    // For now, return standard thumbnail
    return getThumbnailUrl(media);
};
