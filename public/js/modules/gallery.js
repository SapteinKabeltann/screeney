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
    
    // Add each screenshot to the gallery
    currentScreenshots.forEach((screenshot, index) => {
      const galleryItem = document.createElement('div');
      galleryItem.className = 'gallery-item';
      galleryItem.dataset.id = screenshot.id;
      galleryItem.dataset.index = index;
      
      // Create thumbnail
      const img = document.createElement('img');
      img.src = screenshot.thumbnailUrl;
      img.alt = screenshot.title || 'Website screenshot';
      img.loading = 'lazy';
      
      // Create info section
      const info = document.createElement('div');
      info.className = 'gallery-item-info';
      
      const title = document.createElement('div');
      title.className = 'gallery-item-title';
      title.textContent = screenshot.title || 'Untitled Page';
      
      const url = document.createElement('div');
      url.className = 'gallery-item-url';
      url.textContent = screenshot.url;
      
      // Assemble the gallery item
      info.appendChild(title);
      info.appendChild(url);
      galleryItem.appendChild(img);
      galleryItem.appendChild(info);
      
      // Add click handler
      galleryItem.addEventListener('click', () => {
        if (typeof clickCallback === 'function') {
          clickCallback({
            ...screenshot,
            jobId: currentJobId
          });
        }
      });
      
      // Add to gallery with a staggered animation
      galleryItem.style.opacity = '0';
      galleryItem.style.transform = 'translateY(20px)';
      
      screenshotGallery.appendChild(galleryItem);
      
      // Trigger animation with a staggered delay
      setTimeout(() => {
        galleryItem.style.transition = 'opacity 250ms ease, transform 250ms ease';
        galleryItem.style.opacity = '1';
        galleryItem.style.transform = 'translateY(0)';
      }, index * 50);
    });
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
    }
  };
}