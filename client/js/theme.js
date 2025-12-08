/**
 * QuadraCare Theme Management
 * Handles dark/light mode persistence and toggling.
 */

const themeConfig = {
  storageKey: 'quadracare_theme',
  darkClass: 'dark-mode',
  darkIcon: 'fa-sun',
  lightIcon: 'fa-moon'
};

// Apply theme immediately on load to prevent FOUC
(function applyTheme() {
  const savedTheme = localStorage.getItem(themeConfig.storageKey);
  // Default to light if no preference, or respect OS preference could be added here
  if (savedTheme === 'dark') {
    document.body.classList.add(themeConfig.darkClass);
  }
})();

// Toggle theme function
function toggleTheme() {
  const isDark = document.body.classList.toggle(themeConfig.darkClass);
  localStorage.setItem(themeConfig.storageKey, isDark ? 'dark' : 'light');
  updateThemeIcons();
}

// Update icons on all theme toggle buttons
function updateThemeIcons() {
  const isDark = document.body.classList.contains(themeConfig.darkClass);
  const buttons = document.querySelectorAll('.theme-toggle i');

  buttons.forEach(icon => {
    if (isDark) {
      icon.classList.remove(themeConfig.lightIcon);
      icon.classList.add(themeConfig.darkIcon);
    } else {
      icon.classList.remove(themeConfig.darkIcon);
      icon.classList.add(themeConfig.lightIcon);
    }
  });
}

// Initialize icons when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  updateThemeIcons();

  // Attach click handlers to any button with class .theme-toggle that doesn't have an onclick attribute
  // (Note: We are removing inline onclicks in HTML, so this is the primary way)
  const toggles = document.querySelectorAll('.theme-toggle');
  toggles.forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
});

// Expose to window if needed for inline calls (though we are removing them)
window.toggleTheme = toggleTheme;
