/**
 * Get the domain from a URL
 * @param {string} url - The URL to extract domain from
 * @returns {string} - The domain name
 */
function getUrlDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    return '';
  }
}

/**
 * Normalize a URL by ensuring it has a protocol
 * @param {string} url - The URL to normalize
 * @returns {string} - The normalized URL
 */
function normalizeUrl(url) {
  if (!url) return '';
  
  // Add protocol if missing
  if (!url.match(/^[a-zA-Z]+:\/\//)) {
    return `https://${url}`;
  }
  
  return url;
}

/**
 * Check if a URL is valid
 * @param {string} url - The URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Extract path from URL for display purposes
 * @param {string} url - The URL to extract path from
 * @returns {string} - The path for display
 */
function getDisplayPath(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname || '/';
  } catch (error) {
    return '/';
  }
}

module.exports = {
  getUrlDomain,
  normalizeUrl,
  isValidUrl,
  getDisplayPath
};