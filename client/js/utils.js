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
  // For Docker/Production (Port 80/443), use relative path
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

/**
 * Monitor Authentication State (BFCache Support)
 * Listen for 'pageshow' to re-verify auth when user clicks 'Back' button
 */
window.addEventListener('pageshow', (event) => {
  // event.persisted is true if page was restored from cache
  // But we always want to check auth on pageshow for protected pages
  const path = window.location.pathname;
  if (path.includes('login.html') || path.includes('register.html') || path.includes('index.html') || path === '/' || path.includes('services.html') || path.includes('about.html') || path.includes('contact.html')) {
    return; // Public pages, skip check
  }

  // Identify required role based on path
  let role = null;
  if (path.includes('/admin/')) role = 'admin';
  else if (path.includes('/doctor/')) role = 'doctor';
  else if (path.includes('/nurse/')) role = 'nurse';
  else if (path.includes('/patient/')) role = 'patient';
  else if (path.includes('/labtech/')) role = 'lab_tech';
  else if (path.includes('/emergency/')) role = 'emergency';

  if (role) {
    console.log('Page Show (Back/Forward detected) - Re-checking Auth for role:', role);
    checkAuth(role);
  }
});

/**
 * Initialize Profile Dropdown & Modal
 */
function initializeProfileDropdown() {
  const profileTrigger = document.querySelector('.user-profile');
  if (!profileTrigger) return;

  // Get User Data
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) return;

  // Create Dropdown HTML
  const dropdownHtml = `
      <div class="profile-dropdown-menu" id="profileDropdown">
          <div class="profile-header">
              <div class="avatar-circle">
                  ${user.name.charAt(0).toUpperCase()}
              </div>
              <div class="profile-info">
                  <h4>${user.name}</h4>
                  <span>${user.role}</span>
              </div>
          </div>
          <a href="#" class="dropdown-item" id="updateProfileBtn">
              <i class="fa-solid fa-user-pen"></i> Update Profile
          </a>
          <a href="#" class="dropdown-item danger" id="logoutBtn">
              <i class="fa-solid fa-sign-out-alt"></i> Logout
          </a>
      </div>
  `;

  // Append Dropdown
  if (!document.getElementById('profileDropdown')) {
    const fragment = document.createRange().createContextualFragment(dropdownHtml);
    profileTrigger.appendChild(fragment);
  }

  const dropdown = document.getElementById('profileDropdown');

  // Toggle Dropdown
  profileTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('active');
  });

  // Close on Outside Click
  document.addEventListener('click', (e) => {
    if (!profileTrigger.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });

  // Logout Logic
  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '../pages/login.html';
  });

  // Update Profile Logic
  document.getElementById('updateProfileBtn').addEventListener('click', (e) => {
    e.preventDefault();
    openProfileModal(user);
  });
}

function openProfileModal(user) {
  // Create Modal HTML
  const modalHtml = `
      <div class="modal-overlay" id="profileModal">
          <div class="modal-content">
              <div class="modal-header">
                  <h3>Update Profile</h3>
                  <button class="close-modal">&times;</button>
              </div>
              <form id="profileForm">
                  <div class="form-group">
                      <label>Full Name</label>
                      <input type="text" class="form-control" name="name" value="${user.name}" required>
                  </div>
                  <div class="form-group">
                      <label>Email Address</label>
                      <input type="email" class="form-control" name="email" value="${user.email}" required>
                  </div>
                   <div class="form-group">
                      <label>New Password (Optional)</label>
                      <input type="password" class="form-control" name="password" placeholder="Leave blank to keep current">
                  </div>
                  <button type="submit" class="btn-primary">Save Changes</button>
              </form>
          </div>
      </div>
  `;

  // Append Modal
  if (!document.getElementById('profileModal')) {
    document.body.appendChild(document.createRange().createContextualFragment(modalHtml));
  }

  const modal = document.getElementById('profileModal');
  modal.style.display = 'flex';

  // Close Modal Logic
  const closeBtn = modal.querySelector('.close-modal');
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    modal.remove(); // Clean up
  });

  // Form Submission
  const form = document.getElementById('profileForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const updates = Object.fromEntries(formData.entries());

    if (!updates.password) delete updates.password;

    try {
      // Re-fetch token just in case
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const storedToken = storedUser ? storedUser.token : null;

      const response = await fetch(`${getApiBaseUrl()}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (response.ok) {
        // Update Local Storage - Keep existing token if not returned, though it usually isn't unless refreshed
        const newToken = data.token || storedToken;
        localStorage.setItem('user', JSON.stringify({ ...data, token: newToken }));

        if (window.showToast) {
          window.showToast('Profile Updated Successfully!', 'success');
        } else {
          alert('Profile Updated Successfully!');
        }

        setTimeout(() => location.reload(), 1000);
      } else {
        if (window.showToast) {
          window.showToast(data.message || 'Update Failed', 'error');
        } else {
          alert(data.message || 'Update Failed');
        }
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred');
    }
  });
}

// Auto-initialize on DOM Load
document.addEventListener('DOMContentLoaded', initializeProfileDropdown);

window.initializeProfileDropdown = initializeProfileDropdown;
