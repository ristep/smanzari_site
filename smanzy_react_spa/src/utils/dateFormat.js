/**
 * Format a date string or Date object to dd.mm.yyyy format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string in dd.mm.yyyy format
 */
export const formatDate = (date) => {
    if (!date) return '';

    const d = new Date(date);

    // Check if date is valid
    if (isNaN(d.getTime())) return '';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}.${month}.${year}`;
};

/**
 * Format a date string or Date object to dd.mm.yyyy HH:MM format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string with time
 */
export const formatDateTime = (date) => {
    if (!date) return '';

    const d = new Date(date);

    // Check if date is valid
    if (isNaN(d.getTime())) return '';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}`;
};
