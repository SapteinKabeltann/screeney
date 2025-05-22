/**
 * Setup progress tracking for the screenshot capture process
 * @returns {Object} - Progress tracking methods
 */
export function setupProgressTracking() {
  let startTime = null;
  let progressInterval = null;
  let totalEndpoints = 0;
  let completedEndpoints = 0;
  
  const progressBar = document.querySelector('.progress-bar');
  const progressSection = document.querySelector('.progress-section');
  const progressDetails = document.querySelector('.progress-details');
  const progressFill = document.querySelector('.progress-fill');
  const progressText = document.querySelector('.progress-text');

  /**
   * Format seconds to mm:ss
   * @param {number} seconds 
   * @returns {string}
   */
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Update elapsed time display
   */
  function updateElapsedTime() {
    if (!startTime) return;
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    progressText.textContent = `Tid brukt: ${formatTime(elapsedSeconds)}`;
  }
  
  /**
   * Start tracking progress for a job
   */
  function startTracking() {
    startTime = Date.now();
    totalEndpoints = 0;
    completedEndpoints = 0;
    
    // Reset progress UI
    progressFill.style.width = '0%';
    progressFill.style.backgroundColor = 'var(--color-primary)';
    progressText.textContent = 'Tid brukt: 0:00';
    progressDetails.textContent = 'Initialiserer...';
    
    // Show progress section
    progressSection.classList.remove('hidden');
    progressSection.classList.add('slide-up');

    if (progressInterval) {
      clearInterval(progressInterval);
    }
    progressInterval = setInterval(updateElapsedTime, 1000);
  }

  /**
   * Add a new endpoint to track
   */
  function addEndpoint() {
    totalEndpoints++;
    updateProgressBar();
  }
  
  /**
   * Update progress when a new screenshot is taken
   */
  function updateProgress() {
    completedEndpoints++;
    updateProgressBar();
  }
  
  /**
   * Complete the tracking process
   */
  function complete() {
    if (progressInterval) {
      clearInterval(progressInterval);
    }

    // Vent litt før vi viser 100% for å gi en smooth overgang
    setTimeout(() => {
      const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
      progressFill.style.width = '100%';
      progressFill.style.backgroundColor = 'var(--color-success)';
      progressDetails.innerHTML = `<span style="color: var(--color-success)">Completed! Found ${totalEndpoints} pages.</span>`;
      progressText.innerHTML = `<span style="color: var(--color-success)">✓ Used time ${formatTime(totalSeconds)}</span>`;
    }, 500);
  }
  
  /**
   * Show error in the progress section
   * @param {string} message - Error message to display
   */
  function showError(message) {
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    
    progressText.textContent = 'Failed';
    progressDetails.textContent = message;
    progressFill.style.backgroundColor = 'var(--color-error)';
    progressFill.style.width = '100%';
  }
  
  function updateProgressBar() {
    if (totalEndpoints === 0) return;
    const progress = (completedEndpoints / totalEndpoints) * 90;
    progressFill.style.width = `${Math.min(90, progress)}%`;
  }

  return {
    startTracking,
    addEndpoint,
    updateProgress,
    complete,
    showError
  };
}