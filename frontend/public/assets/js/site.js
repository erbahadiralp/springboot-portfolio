function applyTheme(theme) {
  const body = document.body;
  const themeIcon = document.getElementById("theme-icon");

  if (theme === "dark") {
    body.classList.add("dark");
    themeIcon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
  } else {
    body.classList.remove("dark");
    themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
  }
}

function toggleTheme() {
  const isDark = document.body.classList.contains("dark");
  const newTheme = isDark ? "light" : "dark";
  applyTheme(newTheme);
  localStorage.setItem("theme", newTheme);
}

document.addEventListener("DOMContentLoaded", () => {
  // Check for saved theme in localStorage
  const savedTheme = localStorage.getItem("theme");
  
  // If there is a saved theme, use it. Otherwise, check OS preference.
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? "dark" : "light");
  }

  const themeToggleButton = document.getElementById('theme-toggle-button');
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', toggleTheme);
  }

  // ===== Mobile Navigation =====
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
  const mobileNavCloseBtn = document.getElementById('mobile-nav-close-btn');

  function openMobileNav() {
    if (mobileNav && mobileNavOverlay) {
      mobileNav.classList.add('active');
      mobileNavOverlay.classList.add('active');
      document.documentElement.style.overflow = 'hidden';
    }
  }

  function closeMobileNav() {
    if (mobileNav && mobileNavOverlay) {
      mobileNav.classList.remove('active');
      mobileNavOverlay.classList.remove('active');
      document.documentElement.style.overflow = '';
    }
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', openMobileNav);
  }
  if (mobileNavCloseBtn) {
    mobileNavCloseBtn.addEventListener('click', closeMobileNav);
  }
  if (mobileNavOverlay) {
    mobileNavOverlay.addEventListener('click', closeMobileNav);
  }

  // Close mobile nav when a link is clicked
  document.querySelectorAll('.mobile-nav-links a').forEach((link) => {
    link.addEventListener('click', function(e) {
      closeMobileNav();
    });
  });
  
  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute("href"))
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })
});

// Add scroll effect to navbar
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar")
  if (window.scrollY > 100) {
    navbar.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)"
  } else {
    navbar.style.boxShadow = "none"
  }
})
