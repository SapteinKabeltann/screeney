const { isValidUrl, normalizeUrl } = require('../utils/urlUtils');

/**
 * Validate the URL in the request body
 */
function validateUrl(req, res, next) {
  let { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  // Normalize the URL
  url = normalizeUrl(url);
  
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }
  
  // Update the request with the normalized URL
  req.body.url = url;
  
  next();
}

module.exports = {
  validateUrl
};