/**
 * Setup modal functionality
 * @param {Object} elements - Modal DOM elements
 * @returns {Object} - Modal handler methods
 */
export function setupModal(elements) {
  const { 
    overlay, 
    modal, 
    modalTitle, 
    modalContent, 
    modalClose, 
    modalDownload 
  } = elements;
  
  let currentDownloadUrl = null;
  
  // Set up event listeners
  modalClose.addEventListener('click', close);
  
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      close();
    }
  });
  
  modalDownload.addEventListener('click', () => {
    if (currentDownloadUrl) {
      const downloadLink = document.createElement('a');
      downloadLink.href = currentDownloadUrl;
      downloadLink.download = '';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  });
  
  // Handle keyboard events
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('active')) {
      close();
    }
  });
  
  /**
   * Open the modal with content
   * @param {Object} options - Modal content options
   * @param {string} options.title - Modal title
   * @param {string} options.imageUrl - URL of the image to display
   * @param {string} options.downloadUrl - URL for downloading the image
   */
  function open({ title, imageUrl, downloadUrl }) {
    // Set modal content
    modalTitle.textContent = title || 'Screenshot Preview';
    modalContent.innerHTML = `<img src="${imageUrl}" alt="${title || 'Screenshot'}" />`;
    currentDownloadUrl = downloadUrl;
    
    // Show the modal
    overlay.classList.remove('hidden');
    setTimeout(() => {
      overlay.classList.add('active');
    }, 10);
    
    // Disable body scrolling
    document.body.style.overflow = 'hidden';
  }
  
  /**
   * Close the modal
   */
  function close() {
    overlay.classList.remove('active');
    
    // Re-enable body scrolling
    document.body.style.overflow = '';
    
    // Hide the overlay after transition
    setTimeout(() => {
      overlay.classList.add('hidden');
      modalContent.innerHTML = '';
      currentDownloadUrl = null;
    }, 300);
  }
  
  return {
    open,
    close
  };
}