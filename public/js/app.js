// Main application JavaScript
import { setupForm } from './modules/form.js';
import { setupProgressTracking } from './modules/progress.js';
import { setupGallery } from './modules/gallery.js';
import { setupModal } from './modules/modal.js';

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Get all necessary DOM elements
  const elements = {
    form: document.getElementById('screenshot-form'),
    urlInput: document.getElementById('url-input'),
    captureBtn: document.getElementById('capture-btn'),
    progressSection: document.getElementById('progress-section'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    progressDetails: document.getElementById('progress-details'),
    resultsSection: document.getElementById('results-section'),
    screenshotGallery: document.getElementById('screenshot-gallery'),
    domainInfo: document.getElementById('domain-info'),
    downloadAllBtn: document.getElementById('download-all-btn'),
    modalElements: {
      overlay: document.getElementById('overlay'),
      modal: document.getElementById('modal'),
      modalTitle: document.getElementById('modal-title'),
      modalContent: document.getElementById('modal-content'),
      modalClose: document.getElementById('modal-close'),
      modalDownload: document.getElementById('modal-download')
    }
  };
  
  // Set up each module with the necessary elements
  const formHandler = setupForm(elements);
  const progressTracker = setupProgressTracking(elements);
  const galleryHandler = setupGallery(elements);
  const modalHandler = setupModal(elements.modalElements);
  
  // Connect the modules together
  formHandler.onSubmit(async (url) => {
    try {
      // Reset UI and show progress section
      elements.progressSection.classList.remove('hidden');
      elements.resultsSection.classList.add('hidden');
      
      // Start the screenshot capture process
      const job = await formHandler.startCapture(url);
      
      if (!job || !job.jobId) {
        throw new Error('Failed to start capture process');
      }
      
      // Start tracking progress
      progressTracker.startTracking(job.jobId, async (completedJob) => {
        // When complete, get screenshots and render the gallery
        const screenshots = await galleryHandler.fetchScreenshots(job.jobId);
        
        if (screenshots && screenshots.screenshots) {
          // Show results and render gallery
          elements.progressSection.classList.add('hidden');
          elements.resultsSection.classList.remove('hidden');
          
          galleryHandler.renderGallery(screenshots);
          
          // Set up download all button
          elements.downloadAllBtn.onclick = () => {
            galleryHandler.downloadAll(job.jobId);
          };
        }
      });
    } catch (error) {
      console.error('Error during capture process:', error);
      progressTracker.showError(error.message || 'An unexpected error occurred');
    }
  });
  
  // Connect gallery click to modal
  galleryHandler.onScreenshotClick((screenshot) => {
    modalHandler.open({
      title: screenshot.title || 'Screenshot Preview',
      imageUrl: `/api/screenshots/${screenshot.jobId}/${screenshot.id}`,
      downloadUrl: `/api/download/${screenshot.jobId}/${screenshot.id}`
    });
  });
  
  // Add subtle animations for loaded elements
  document.querySelectorAll('.card').forEach(card => {
    card.classList.add('fade-in');
  });
}