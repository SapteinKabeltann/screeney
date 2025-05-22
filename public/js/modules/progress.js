/**
 * Setup progress tracking for the screenshot capture process
 * @param {Object} elements - DOM elements
 * @returns {Object} - Progress tracking methods
 */
export function setupProgressTracking(elements) {
  const { 
    progressSection, 
    progressFill, 
    progressText, 
    progressDetails,
    resultsSection
  } = elements;
  
  let trackingInterval = null;
  let jobId = null;
  let completionCallback = null;
  
  /**
   * Start tracking progress for a job
   * @param {string} id - The job ID to track
   * @param {Function} onComplete - Callback when job completes
   */
  function startTracking(id, onComplete) {
    jobId = id;
    completionCallback = onComplete;
    
    // Reset progress UI
    progressFill.style.width = '0%';
    progressText.textContent = 'Initializing...';
    progressDetails.textContent = 'Setting up screenshot capture process';
    
    // Show progress section
    progressSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    
    // Add animation
    progressSection.classList.add('slide-up');
    
    // Start polling for job status
    if (trackingInterval) {
      clearInterval(trackingInterval);
    }
    
    updateProgress();
    trackingInterval = setInterval(updateProgress, 2000);
  }
  
  /**
   * Stop tracking progress
   */
  function stopTracking() {
    if (trackingInterval) {
      clearInterval(trackingInterval);
      trackingInterval = null;
    }
  }
  
  /**
   * Update progress from the server
   */
  async function updateProgress() {
    if (!jobId) return;
    
    try {
      const response = await fetch(`/api/status/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get job status');
      }
      
      const data = await response.json();
      updateProgressUI(data);
      
      // Check if job is complete or failed
      if (data.status === 'completed' || data.status === 'failed') {
        stopTracking();
        
        if (data.status === 'completed' && typeof completionCallback === 'function') {
          completionCallback(data);
        } else if (data.status === 'failed') {
          showError(data.error || 'The screenshot capture process failed');
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }
  
  /**
   * Update the progress UI based on job status
   * @param {Object} data - Job status data
   */
  function updateProgressUI(data) {
    // Set progress percentage (use a placeholder if no count available)
    const progressPercent = data.screenshotsCount 
      ? Math.min(Math.max((data.screenshotsCount / 10) * 100, 10), 100)
      : 10;
    
    progressFill.style.width = `${progressPercent}%`;
    
    // Update status text
    if (data.status === 'processing') {
      progressText.textContent = `Processing: ${data.screenshotsCount || 0} screenshots captured`;
      progressDetails.textContent = `Capturing screenshots for ${data.domain || 'website'}`;
    } else if (data.status === 'completed') {
      progressText.textContent = `Complete: ${data.screenshotsCount} screenshots captured`;
      progressFill.style.width = '100%';
    } else if (data.status === 'failed') {
      progressText.textContent = 'Failed to capture screenshots';
      progressDetails.textContent = data.error || 'An error occurred during the capture process';
      progressFill.style.backgroundColor = 'var(--color-error)';
    }
  }
  
  /**
   * Show error in the progress section
   * @param {string} message - Error message to display
   */
  function showError(message) {
    progressText.textContent = 'Error';
    progressDetails.textContent = message;
    progressFill.style.backgroundColor = 'var(--color-error)';
    progressFill.style.width = '100%';
  }
  
  return {
    startTracking,
    stopTracking,
    showError
  };
}