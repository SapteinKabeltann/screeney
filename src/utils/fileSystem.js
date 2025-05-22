const fs = require('fs');
const path = require('path');

/**
 * Ensure a directory exists, creating it if necessary
 * @param {string} dirPath - The directory path to check/create
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Create all necessary folders for the application
 */
function createFolders() {
  const folders = [
    'public',
    'public/css',
    'public/js',
    'public/screenshots',
    'public/images'
  ];
  
  folders.forEach(folder => {
    ensureDirectoryExists(path.join(__dirname, '../../', folder));
  });
}

/**
 * Get the size of a file in a human-readable format
 * @param {string} filePath - Path to the file
 * @returns {string} - The file size in a human-readable format
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;
    
    if (fileSizeInBytes < 1024) {
      return `${fileSizeInBytes} B`;
    } else if (fileSizeInBytes < 1024 * 1024) {
      return `${(fileSizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(fileSizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  } catch (error) {
    return 'Unknown size';
  }
}

module.exports = {
  ensureDirectoryExists,
  createFolders,
  getFileSize
};