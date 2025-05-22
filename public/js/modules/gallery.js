/**
 * Setup gallery functionality for displaying and downloading screenshots
 * @param {Object} elements - DOM elements
 * @returns {Object} - Gallery handler methods
 */
export function setupGallery(elements) {
  const { 
    screenshotGallery, 
    domainInfo, 
    downloadAllBtn 
  } = elements;
  
  let clickCallback = null;
  let currentJobId = null;
  let currentScreenshots = [];
  
  /**
   * Legg til et enkelt screenshot i galleriet
   * @param {Object} screenshot - Screenshot data
   */
  function addScreenshot(screenshot) {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item slide-up';
    
    galleryItem.innerHTML = `
      <img src="${screenshot.thumbnailUrl}" alt="${screenshot.title || 'Screenshot'}">
      <div class="gallery-item-info">
        <div class="gallery-item-title">${screenshot.title || 'Untitled'}</div>
        <div class="gallery-item-url">${screenshot.url}</div>
      </div>
    `;
    
    galleryItem.addEventListener('click', () => {
      if (clickCallback) {
        clickCallback({
          ...screenshot,
          jobId: currentJobId
        });
      }
    });
    
    screenshotGallery.appendChild(galleryItem);
    currentScreenshots.push(screenshot);
  }
  
  /**
   * Fetch screenshots for a job
   * @param {string} jobId - The job ID
   * @returns {Promise<Object>} - Screenshots data
   */
  async function fetchScreenshots(jobId) {
    try {
      const response = await fetch(`/api/screenshots/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch screenshots');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching screenshots:', error);
      throw error;
    }
  }
  
  /**
   * Render screenshot gallery
   * @param {Object} data - Screenshots data from the server
   */
  function renderGallery(data) {
    // Clear previous gallery
    screenshotGallery.innerHTML = '';
    
    // Update domain info
    domainInfo.textContent = `Screenshots for: ${data.domain || data.url}`;
    
    // Store current job data
    currentJobId = data.jobId;
    currentScreenshots = data.screenshots || [];
    
    // Create gallery items
    if (currentScreenshots.length === 0) {
      screenshotGallery.innerHTML = `
        <div class="no-results">
          <p>No screenshots were captured. The website might be protected against crawling or no public pages were found.</p>
        </div>
      `;
      return;
    }
    
    currentScreenshots.forEach(screenshot => addScreenshot(screenshot));
  }
  
  /**
   * Download all screenshots as a ZIP file
   * @param {string} jobId - The job ID
   */
  function downloadAll(jobId) {
    if (!jobId) return;
    
    // Animate the button to show it's doing something
    downloadAllBtn.classList.add('loading');
    downloadAllBtn.disabled = true;
    
    // Create and trigger the download
    const downloadLink = document.createElement('a');
    downloadLink.href = `/api/download/${jobId}`;
    downloadLink.download = `screenshots-${jobId}.zip`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Reset button after a short delay
    setTimeout(() => {
      downloadAllBtn.classList.remove('loading');
      downloadAllBtn.disabled = false;
    }, 1000);
  }
  
  return {
    fetchScreenshots,
    renderGallery,
    downloadAll,
    
    /**
     * Register a callback for when a screenshot is clicked
     * @param {Function} callback - Function to call with screenshot data
     */
    onScreenshotClick(callback) {
      clickCallback = callback;
    },
    addScreenshot
  };
}