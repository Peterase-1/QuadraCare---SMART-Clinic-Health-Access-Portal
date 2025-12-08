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

/**
 * Check Authentication
 * @param {string} requiredRole - Role required to access the page
 */
function checkAuth(requiredRole) {
  try {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || !user.token) {
      alert('CRITICAL DEBUG: Session Lost! No User/Token in localStorage. Redirecting to Login.');
      console.warn('Debug: No User or Token found in localStorage! Redirecting to login.');
      if (window.location.pathname !== '/pages/login.html' && !window.location.pathname.includes('login.html')) {
        window.location.href = '../pages/login.html';
      }
      return;
    }

    const userRole = user.role ? user.role.toLowerCase() : '';
    const reqRole = requiredRole ? requiredRole.toLowerCase() : '';

    if (reqRole && userRole !== reqRole) {
      alert(`CRITICAL Role Mismatch! User='${userRole}' | Required='${reqRole}'. Redirecting...`);
      console.warn(`Role mismatch: User='${userRole}' | Required='${reqRole}'. Redirecting...`);

      switch (userRole) {
        case 'admin': window.location.href = '../admin/dashboard.html'; break;
        case 'doctor': window.location.href = '../doctor/dashboard.html'; break;
        case 'nurse': window.location.href = '../nurse/dashboard.html'; break;
        case 'lab_tech': window.location.href = '../labtech/dashboard.html'; break;
        case 'patient': window.location.href = '../patient/dashboard.html'; break;
        case 'emergency': window.location.href = '../emergency/dashboard.html'; break;
        default:
          console.error('Unknown role, redirecting to login');
          window.location.href = '../pages/login.html';
      }
    }
  } catch (error) {
    console.error('Auth Check Failed', error);
    if (window.location.pathname !== '/pages/login.html') {
      window.location.href = '../pages/login.html';
    }
  }
}
window.checkAuth = checkAuth;
