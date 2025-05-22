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
          Download All
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
  downloadAllBtn.addEventListener('click', () => {
    if (downloadAllCallback && currentJobId) {
      downloadAllCallback(currentJobId);
    }
  });
  
  /**
   * Add a new endpoint to the view
   * @param {Object} data - Data about the endpoint
   */
  function addEndpoint(data) {
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
    const endpointEl = endpointsGrid.querySelector(`[data-url="${data.url}"]`);
    if (!endpointEl) return;
    
    endpointEl.classList.remove('loading');
    endpointEl.classList.add('completed');
    
    // Add screenshot if available
    if (data.screenshot) {
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
            jobId: data.jobId,
            id: data.id
          });
        }
      });

      // Enable download button when we have at least one image
      downloadAllBtn.disabled = false;
      currentJobId = data.jobId;
      
      // Update screenshot count
      screenshotCount++;
      screenshotCountEl.textContent = `${screenshotCount} screenshot${screenshotCount !== 1 ? 's' : ''}`;
    }
  }
  
  /**
   * Reset the endpoint view
   */
  function reset() {
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