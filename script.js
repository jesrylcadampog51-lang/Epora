const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('.primary-nav');
const pageCache = new Map();

function getPage(url) {
  const pageUrl = new URL(url, window.location.href);
  if (!pageCache.has(pageUrl.href)) {
    pageCache.set(pageUrl.href, fetch(pageUrl).then((response) => {
      if (!response.ok) throw new Error(`Unable to load ${pageUrl.pathname}`);
      return response.text();
    }));
  }
  return pageCache.get(pageUrl.href);
}

async function showPage(url, addHistory = true) {
  try {
    const pageUrl = new URL(url, window.location.href);
    const html = await getPage(pageUrl);
    const nextDocument = new DOMParser().parseFromString(html, 'text/html');
    const nextMain = nextDocument.querySelector('main');
    const currentMain = document.querySelector('main');
    if (!nextMain || !currentMain) throw new Error('The requested page is incomplete.');

    currentMain.replaceWith(nextMain);
    document.title = nextDocument.title;
    primaryNav.querySelectorAll('a').forEach((link) => {
      const isCurrentPage = new URL(link.href).pathname === pageUrl.pathname;
      if (isCurrentPage) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    if (addHistory) history.pushState({}, '', `${pageUrl.pathname}${pageUrl.search}${pageUrl.hash}`);
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    primaryNav.classList.remove('is-open');

    if (pageUrl.hash) {
      requestAnimationFrame(() => document.querySelector(pageUrl.hash)?.scrollIntoView());
    } else {
      window.scrollTo(0, 0);
    }
  } catch {
    window.location.assign(url);
  }
}

primaryNav.querySelectorAll('a[href$=".html"]').forEach((link) => {
  const pageUrl = new URL(link.href);
  if (pageUrl.origin === window.location.origin) getPage(pageUrl).catch(() => {});
});

menuToggle.addEventListener('click', () => {
  const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isExpanded));
  menuToggle.setAttribute('aria-label', isExpanded ? 'Open navigation' : 'Close navigation');
  primaryNav.classList.toggle('is-open', !isExpanded);
});

primaryNav.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    primaryNav.classList.remove('is-open');
  }
});

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;

  const pageUrl = new URL(link.href, window.location.href);
  if (pageUrl.origin !== window.location.origin || !pageUrl.pathname.endsWith('.html')) return;
  if (pageUrl.pathname === window.location.pathname && !pageUrl.hash) return;

  event.preventDefault();
  showPage(pageUrl);
});

window.addEventListener('popstate', () => showPage(window.location.href, false));

document.addEventListener('submit', (event) => {
  if (!event.target.matches('#inquiry-form')) return;
  event.preventDefault();
  const status = document.querySelector('#form-status');
  status.dataset.state = 'success';
  status.textContent = 'Thanks for getting in touch. This demo form is ready to connect to your email or enquiry system.';
});
