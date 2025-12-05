/**
 * QuadraCare Utility Functions
 */

// Toast Notification System
function showToast(message, type = 'info') {
  // Create container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // Icon based on type
  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-check-circle';
  if (type === 'error') icon = 'fa-exclamation-circle';
  if (type === 'warning') icon = 'fa-exclamation-triangle';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;

  // Add to container
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
      if (container.children.length === 0) {
        container.remove();
      }
    }, 300); // Wait for fade out animation
  }, 3000);
}

// Expose to window
window.showToast = showToast;

/**
 * Get API Base URL based on environment
 * - If running on Live Server (Port 5500/5501), point to localhost:8000
 * - If running in Docker (Port 80), use relative path /api
 */
function getApiBaseUrl() {
  const port = window.location.port;
  if (port === '5500' || port === '5501') {
    return 'http://localhost:8000/api';
  }
  return '/api';
}

window.getApiBaseUrl = getApiBaseUrl;
