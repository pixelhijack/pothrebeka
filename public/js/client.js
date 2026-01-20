// Mobile Menu Toggle
const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
const closeMobileNav = document.getElementById('close-mobile-nav');

if (hamburgerBtn) {
  hamburgerBtn.addEventListener('click', () => {
    mobileNavOverlay.classList.remove('hidden');
    mobileNavOverlay.style.display = 'block';
    hamburgerBtn.setAttribute('aria-expanded', 'true');
  });
}

if (closeMobileNav) {
  closeMobileNav.addEventListener('click', () => {
    mobileNavOverlay.classList.add('hidden');
    mobileNavOverlay.style.display = 'none';
    hamburgerBtn.setAttribute('aria-expanded', 'false');
  });
}

// Close on link click (for mobile)
const mobileLinks = document.querySelectorAll('#mobile-nav-list a');
mobileLinks.forEach(link => {
  link.addEventListener('click', () => {
    mobileNavOverlay.classList.add('hidden');
    mobileNavOverlay.style.display = 'none';
    hamburgerBtn.setAttribute('aria-expanded', 'false');
  });
});
