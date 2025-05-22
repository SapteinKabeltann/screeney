// Main application JavaScript
import { setupForm } from './modules/form.js';
import { setupProgressTracking } from './modules/progress.js';
import { setupModal } from './modules/modal.js';
import { setupEndpoints } from './modules/endpoints.js';

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
  const modalHandler = setupModal(elements.modalElements);
  const endpointsHandler = setupEndpoints(elements);
  
  // Connect the modules together
  formHandler.onSubmit(async (url) => {
    try {
      // Reset UI and show progress section
      elements.progressSection.classList.remove('hidden');
      endpointsHandler.reset();
      
      // Initialize WebSocket connection
      const socket = new WebSocket('ws://localhost:3000');

      socket.addEventListener('open', (event) => {
        console.log('WebSocket connection opened.');
      });

      socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        console.log('Message from server:', data);
        
        if (data.type === 'newEndpoint') {
          endpointsHandler.addEndpoint(data);
          progressTracker.addEndpoint();
          elements.progressDetails.textContent = `Prosesserer: ${data.url}`;
        } else if (data.type === 'screenshotTaken') {
          endpointsHandler.updateEndpoint(data);
          elements.progressDetails.textContent = `Fullført: ${data.url}`;
          progressTracker.updateProgress();
        } else if (data.type === 'complete') {
          progressTracker.complete();
          socket.close();
        }
      });

      socket.addEventListener('error', (event) => {
        console.error('WebSocket error:', event);
      });

      socket.addEventListener('close', (event) => {
        console.log('WebSocket connection closed.');
      });
      
      // Start the screenshot capture process
      const job = await formHandler.startCapture(url);
      
      if (!job || !job.jobId) {
        throw new Error('Failed to start capture process');
      }
      
      // Start tracking progress
      progressTracker.startTracking();
    } catch (error) {
      console.error('Error during capture process:', error);
      progressTracker.showError(error.message || 'An unexpected error occurred');
    }
  });
  
  // Connect endpoint click to modal
  endpointsHandler.onScreenshotClick((screenshot) => {
    modalHandler.open({
      title: screenshot.title || 'Screenshot Preview',
      imageUrl: screenshot.fullImageUrl,
      downloadUrl: `/api/download/${screenshot.jobId}/${screenshot.id}`
    });
  });

  // Connect download button to action
  endpointsHandler.onDownloadAll((jobId) => {
    window.location.href = `/api/download/${jobId}`;
  });
  
  // Add subtle animations for loaded elements
  document.querySelectorAll('.card').forEach(card => {
    card.classList.add('fade-in');
  });
}