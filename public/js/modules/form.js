/**
 * Setup form handling for the screenshot capture form
 * @param {Object} elements - DOM elements
 * @returns {Object} - Form handler methods
 */
export function setupForm(elements) {
  const { form, urlInput, captureBtn, limitCheckbox, pageLimit } = elements;
  const MAX_UNCHECKED_PAGES = 300; // Maksimalt antall sider når unchecked
  
  let submitCallback = null;
  
  // Set up form submission handler
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const url = urlInput.value.trim();
    
    if (!url) {
      showError('Please enter a valid URL');
      return;
    }
    
    // Disable form during submission
    setFormState(false);
    
    // Call the callback if registered
    if (typeof submitCallback === 'function') {
      await submitCallback(url);
    }
    
    // Re-enable form
    setFormState(true);
  });
  
  /**
   * Set form enabled/disabled state
   * @param {boolean} enabled - Whether the form should be enabled
   */
  function setFormState(enabled) {
    urlInput.disabled = !enabled;
    captureBtn.disabled = !enabled;
    
    if (!enabled) {
      captureBtn.classList.add('loading');
    } else {
      captureBtn.classList.remove('loading');
    }
  }
  
  /**
   * Show error message for the form
   * @param {string} message - Error message to display
   */
  function showError(message) {
    // Create or update error message element
    let errorElement = form.querySelector('.form-error');
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'form-error';
      form.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.color = 'var(--color-error)';
    errorElement.style.marginTop = 'var(--spacing-sm)';
    errorElement.style.fontSize = 'var(--font-size-sm)';
    
    // Animate the error message
    errorElement.style.animation = 'none';
    errorElement.offsetHeight; // Trigger reflow
    errorElement.style.animation = 'fadeIn var(--transition-normal)';
    
    // Clear error after 5 seconds
    setTimeout(() => {
      errorElement.textContent = '';
    }, 5000);
  }
  
  // Set up checkbox handler
  limitCheckbox.addEventListener('change', (e) => {
    if (!e.target.checked) {
      pageLimit.value = '10'; // Reset to 10 when unchecking
    }
    pageLimit.disabled = !e.target.checked;
  });
  
  /**
   * Start the screenshot capture process
   * @param {string} url - The URL to capture
   * @returns {Promise<Object>} - Job object with jobId
   */
  async function startCapture(url) {
    try {
      const response = await fetch('/api/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          pageLimit: limitCheckbox.checked ? parseInt(pageLimit.value) : MAX_UNCHECKED_PAGES
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start capture process');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error starting capture:', error);
      throw error;
    }
  }
  
  return {
    /**
     * Register a callback for form submission
     * @param {Function} callback - Function to call with the URL
     */
    onSubmit(callback) {
      submitCallback = callback;
    },
    
    startCapture,
    showError
  };
}