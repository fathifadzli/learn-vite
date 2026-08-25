import './style.css';
import Alpine from 'alpinejs';

window.Alpine = Alpine;

// Optional: Register Alpine components, stores or directives here
Alpine.store('app', {
  version: '1.0.0',
  theme: 'dark',
  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
  }
});

Alpine.start();

// Simple, smooth client-side page transition (prevents full reload and logo flash)
const pageCache = new Map();

async function fetchHtml(url) {
  if (pageCache.has(url)) return pageCache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  pageCache.set(url, html);
  return html;
}

let isTransitioning = false;

async function navigate(url, pushState = true) {
  if (isTransitioning) return;
  isTransitioning = true;

  const main = document.querySelector('main');
  const currentNav = document.querySelector('nav');

  try {
    if (main) {
      main.style.transition = 'opacity 120ms ease-out';
      main.style.opacity = '0';
      await new Promise((r) => setTimeout(r, 120));
    }

    const html = await fetchHtml(url);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const newTitle = doc.querySelector('title');
    if (newTitle) {
      document.title = newTitle.innerText;
    }

    const newNav = doc.querySelector('nav');
    if (newNav && currentNav) {
      currentNav.innerHTML = newNav.innerHTML;
    }

    const newMain = doc.querySelector('main');
    if (newMain && main) {
      main.innerHTML = newMain.innerHTML;
      
      // Sync classes / attributes
      if (newMain.className) {
        main.className = newMain.className;
      }

      window.scrollTo({ top: 0, behavior: 'instant' });

      // Initialize Alpine on new content
      if (window.Alpine) {
        window.Alpine.initTree(main);
      }

      // Smooth fade in
      main.style.opacity = '0';
      void main.offsetHeight; // Force reflow
      main.style.transition = 'opacity 150ms ease-in';
      main.style.opacity = '1';
    }

    if (pushState) {
      history.pushState({}, '', url);
    }
  } catch (err) {
    console.warn('Navigation fallback:', err);
    window.location.href = url;
  } finally {
    isTransitioning = false;
  }
}

// Intercept internal navigation clicks
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;

  const href = link.getAttribute('href');
  if (!href) return;

  // Ignore external links, mailto, tel, hash anchors, new tabs
  if (
    href.startsWith('#') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    link.target === '_blank' ||
    e.ctrlKey ||
    e.metaKey ||
    e.shiftKey
  ) {
    return;
  }

  const targetUrl = new URL(link.href, window.location.href);
  if (targetUrl.origin !== window.location.origin) return;

  // If already on the same page
  if (
    targetUrl.pathname === window.location.pathname &&
    targetUrl.search === window.location.search &&
    !targetUrl.hash
  ) {
    e.preventDefault();
    return;
  }

  e.preventDefault();
  navigate(link.href);
});

// Handle browser back and forward buttons
window.addEventListener('popstate', () => {
  navigate(window.location.href, false);
});
