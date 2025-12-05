document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const sidebarContainer = document.getElementById('sidebar-container');

  if (sidebarContainer && user) {
    let linksHtml = '';

    // Common Links
    linksHtml += `
            <a href="../index.html" class="nav-link"><i class="fas fa-home"></i> <span>Home</span></a>
        `;

    if (user.role === 'admin') {
      linksHtml += `
                <a href="../admin/dashboard.html" class="nav-link"><i class="fas fa-chart-line"></i> <span>Dashboard</span></a>
                <a href="../admin/users.html" class="nav-link"><i class="fas fa-users"></i> <span>Users</span></a>
                <a href="../admin/wards.html" class="nav-link"><i class="fas fa-hospital-alt"></i> <span>Wards & Rooms</span></a>
            `;
    } else if (user.role === 'doctor') {
      linksHtml += `
                <a href="../doctor/index.html" class="nav-link"><i class="fas fa-user-md"></i> <span>Dashboard</span></a>
                <a href="../doctor/patients.html" class="nav-link"><i class="fas fa-procedures"></i> <span>Patients</span></a>
            `;
    } else if (user.role === 'nurse') {
      linksHtml += `
                <a href="../nurse/index.html" class="nav-link"><i class="fas fa-user-nurse"></i> <span>Dashboard</span></a>
            `;
    } else if (user.role === 'patient') {
      linksHtml += `
                <a href="../patient/dashboard.html" class="nav-link"><i class="fas fa-user"></i> <span>Dashboard</span></a>
            `;
    } else if (user.role === 'lab_tech') {
      linksHtml += `
                  <a href="../labtech/dashboard.html" class="nav-link"><i class="fas fa-flask"></i> <span>Dashboard</span></a>
              `;
    }

    // Logout Link
    linksHtml += `
            <a href="#" id="sidebarLogout" class="nav-link" style="margin-top: auto;">
                <i class="fas fa-sign-out-alt"></i> <span>Logout</span>
            </a>
        `;

    sidebarContainer.innerHTML = `
            <aside class="sidebar">
                <div class="sidebar-header">
                    <i class="fa-solid fa-heart-pulse"></i> QuadraCare
                    <span class="close-sidebar"><i class="fas fa-times"></i></span>
                </div>
                <nav class="sidebar-nav">
                    ${linksHtml}
                </nav>
            </aside>
        `;

    // Highlight Active Link
    const currentPath = window.location.pathname;
    const links = sidebarContainer.querySelectorAll('.nav-link');
    links.forEach(link => {
      if (link.getAttribute('href') !== '#' && currentPath.includes(link.getAttribute('href').replace('../', ''))) {
        link.classList.add('active');
      }
    });

    // Logout Logic
    const logoutBtn = document.getElementById('sidebarLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '../login.html';
      });
    }
  }

  // Event Listeners for Toggle
  const hamburger = document.querySelector('.hamburger-menu');
  const sidebar = document.querySelector('.sidebar');
  const closeBtn = document.querySelector('.close-sidebar');

  if (hamburger && sidebar) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.add('active');
    });
  }

  if (closeBtn && sidebar) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.remove('active');
    });
  }

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (sidebar && sidebar.classList.contains('active') && !sidebar.contains(e.target) && !hamburger.contains(e.target)) {
      sidebar.classList.remove('active');
    }
  });
});
