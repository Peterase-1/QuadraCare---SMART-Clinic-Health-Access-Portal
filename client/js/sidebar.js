document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger-menu');
  const sidebar = document.querySelector('.sidebar');
  const closeBtn = document.querySelector('.close-sidebar');

  if (hamburger && sidebar) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent bubbling
      sidebar.classList.add('active');
    });
  }

  if (closeBtn && sidebar) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.remove('active');
    });
  }

  // Close sidebar when clicking outside
  document.addEventListener('click', (e) => {
    if (sidebar && sidebar.classList.contains('active') &&
      !sidebar.contains(e.target) &&
      !hamburger.contains(e.target)) {
      sidebar.classList.remove('active');
    }
  });
});
