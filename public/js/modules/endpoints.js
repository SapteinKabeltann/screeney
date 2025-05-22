/**
 * Setup endpoint tracking and display
 * @param {Object} elements - DOM elements
 * @returns {Object} - Endpoint tracking methods
 */
export function setupEndpoints(elements) {
  const { progressSection } = elements;
  let onScreenshotClickCallback = null;
  let downloadAllCallback = null;
  let currentJobId = null;
  let screenshotCount = 0;
  
  // Create container for endpoints
  const endpointsContainer = document.createElement('div');
  endpointsContainer.className = 'endpoints-container';
  endpointsContainer.innerHTML = `
    <div class="endpoints-header">
      <h3>Screenshots</h3>
      <div class="endpoints-actions">
        <span class="screenshot-count">0 screenshots</span>
        <button id="download-all-btn" class="btn btn-primary" disabled>
          <span class="btn-icon">↓</span>
          <span class="btn-text">Download All</span>
        </button>
      </div>
    </div>
    <div class="endpoints-grid"></div>
  `;
  progressSection.appendChild(endpointsContainer);
  
  const endpointsGrid = endpointsContainer.querySelector('.endpoints-grid');
  const downloadAllBtn = endpointsContainer.querySelector('#download-all-btn');
  const screenshotCountEl = endpointsContainer.querySelector('.screenshot-count');
  
  // Add click handler for download button
  downloadAllBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    console.log('Download button clicked');
    console.log('Current job ID:', currentJobId);
    console.log('Download callback exists:', !!downloadAllCallback);
    
    if (downloadAllCallback && currentJobId) {
      console.log('Starting download process...');
      // Disable button and show loading state
      downloadAllBtn.disabled = true;
      const originalText = downloadAllBtn.innerHTML;
      downloadAllBtn.innerHTML = `
        <div class="loading-spinner"></div>
        <span>Downloading...</span>
      `;
      
      try {
        console.log('Calling download callback with jobId:', currentJobId);
        await downloadAllCallback(currentJobId);
        console.log('Download callback completed successfully');
      } catch (error) {
        console.error('Error in download process:', error);
      } finally {
        console.log('Resetting button state');
        // Reset button state
        downloadAllBtn.disabled = false;
        downloadAllBtn.innerHTML = originalText;
      }
    } else {
      console.warn('Download button clicked but either callback or jobId is missing:', {
        hasCallback: !!downloadAllCallback,
        jobId: currentJobId
      });
    }
  });
  
  /**
   * Add a new endpoint to the view
   * @param {Object} data - Data about the endpoint
   */
  function addEndpoint(data) {
    console.log('Adding new endpoint:', data);
    const endpointEl = document.createElement('div');
    endpointEl.className = 'endpoint-item loading';
    endpointEl.setAttribute('data-url', data.url);
    
    endpointEl.innerHTML = `
      <div class="endpoint-content">
        <div class="endpoint-url">${data.url}</div>
        <div class="endpoint-status">
          <div class="loading-spinner"></div>
          <span>Processing...</span>
        </div>
      </div>
    `;
    
    endpointsGrid.appendChild(endpointEl);
  }
  
  /**
   * Update status for an endpoint and add screenshot
   * @param {Object} data - Data about the endpoint
   */
  function updateEndpoint(data) {
    console.log('Updating endpoint:', data);
    const endpointEl = endpointsGrid.querySelector(`[data-url="${data.url}"]`);
    if (!endpointEl) {
      console.warn('Could not find endpoint element for URL:', data.url);
      return;
    }
    
    endpointEl.classList.remove('loading');
    endpointEl.classList.add('completed');
    
    // Add screenshot if available
    if (data.screenshot) {
      // Extract jobId from the screenshot URL
      const urlParts = data.screenshot.thumbnailUrl.split('/');
      const jobId = urlParts[2]; // /screenshots/[jobId]/thumbnails/...
      
      console.log('Adding screenshot to endpoint:', {
        url: data.url,
        thumbnailUrl: data.screenshot.thumbnailUrl,
        fullImageUrl: data.screenshot.fullImageUrl,
        jobId: jobId
      });
      
      const thumbnailUrl = data.screenshot.thumbnailUrl;
      const fullImageUrl = data.screenshot.fullImageUrl;
      
      endpointEl.innerHTML = `
        <div class="endpoint-content">
          <div class="endpoint-url">${data.url}</div>
          <div class="endpoint-status">
            <span class="status-completed">✓ Completed</span>
          </div>
          <div class="endpoint-screenshot">
            <img src="${thumbnailUrl}" alt="Screenshot of ${data.url}" />
          </div>
        </div>
      `;
      
      // Add click handler for opening image in modal
      const screenshotImg = endpointEl.querySelector('.endpoint-screenshot img');
      screenshotImg.addEventListener('click', () => {
        if (onScreenshotClickCallback) {
          onScreenshotClickCallback({
            title: data.title || data.url,
            fullImageUrl: fullImageUrl,
            jobId: jobId,
            id: data.id
          });
        }
      });

      // Enable download button when we have at least one image
      console.log('Enabling download button and setting jobId:', jobId);
      downloadAllBtn.disabled = false;
      currentJobId = jobId;
      
      // Update screenshot count
      screenshotCount++;
      screenshotCountEl.textContent = `${screenshotCount} screenshot${screenshotCount !== 1 ? 's' : ''}`;
    } else {
      console.warn('No screenshot data available for endpoint:', data.url);
    }
  }
  
  /**
   * Reset the endpoint view
   */
  function reset() {
    console.log('Resetting endpoints view');
    endpointsGrid.innerHTML = '';
    downloadAllBtn.disabled = true;
    currentJobId = null;
    screenshotCount = 0;
    screenshotCountEl.textContent = '0 screenshots';
  }

  /**
   * Register callback for when a screenshot is clicked
   * @param {Function} callback 
   */
  function onScreenshotClick(callback) {
    onScreenshotClickCallback = callback;
  }

  /**
   * Register callback for downloading all images
   * @param {Function} callback 
   */
  function onDownloadAll(callback) {
    console.log('Registering download callback');
    downloadAllCallback = callback;
  }
  
  return {
    addEndpoint,
    updateEndpoint,
    reset,
    onScreenshotClick,
    onDownloadAll
  };
} 