/* Progressive UI enhancements only; auth, queries and business rules stay in their controllers. */
(() => {
  'use strict';
  const icons = {
    'dashboard.html': '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    'profile.html': '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    'skill-analysis.html': '<path d="M4 20h17M5 16l5-5 4 3 6-10M15 4h5v5"/>',
    'search.html': '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>'
  };
  document.querySelectorAll('.nav-link').forEach(link => {
    const path = icons[link.getAttribute('href')];
    const oldIcon = link.querySelector('span');
    if (path && oldIcon) oldIcon.outerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
    if (link.classList.contains('active')) link.setAttribute('aria-current', 'page');
  });
  document.querySelectorAll('.alert-toast').forEach(alert => {
    alert.setAttribute('role', 'status');
    alert.setAttribute('aria-live', 'polite');
  });
  document.querySelectorAll('.auth-card input[type="password"]').forEach(input => {
    const wrapper = document.createElement('div');
    wrapper.className = 'password-field';
    input.before(wrapper);
    wrapper.append(input);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'password-toggle';
    button.textContent = 'Show';
    button.setAttribute('aria-label', `Show ${input.id === 'confirmPassword' ? 'confirmation password' : 'password'}`);
    button.setAttribute('aria-controls', input.id);
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      button.textContent = visible ? 'Hide' : 'Show';
      button.setAttribute('aria-pressed', String(visible));
      button.setAttribute('aria-label', `${visible ? 'Hide' : 'Show'} ${input.id === 'confirmPassword' ? 'confirmation password' : 'password'}`);
    });
    wrapper.append(button);
  });
  // Preserve authored layouts at larger sizes, but allow compact form rows to stack.
  document.querySelectorAll('div[style*="display: flex"]').forEach(row => {
    if (row.querySelector(':scope > input.form-control')) row.classList.add('responsive-actions');
  });
  ['search-input', 'job-search-input', 'user-search-input'].forEach(id => {
    const input = document.getElementById(id);
    if (input && !input.labels?.length) input.setAttribute('aria-label', input.placeholder || 'Search');
  });
  // Reveal only when supported; content remains visible without JavaScript.
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('[data-reveal]').forEach(el => {
      el.classList.add('reveal-ready');
      observer.observe(el);
    });
  }
  // Layer keyboard access onto the existing modal open/close handlers.
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    const box = modal.querySelector('.modal-box');
    if (!box) return;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.tabIndex = -1;
    const title = box.querySelector('h3[id]');
    if (title) box.setAttribute('aria-labelledby', title.id);
    let previousFocus = null;
    const closeButton = box.querySelector('button[id^="close-"]');
    const sync = () => {
      const open = modal.classList.contains('is-open');
      modal.inert = !open;
      modal.setAttribute('aria-hidden', String(!open));
      if (open) {
        previousFocus = document.activeElement;
        (closeButton || box).focus();
      } else if (previousFocus?.isConnected) {
        previousFocus.focus();
        previousFocus = null;
      }
    };
    sync();
    new MutationObserver(sync).observe(modal, { attributes: true, attributeFilter: ['class'] });
    modal.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeButton?.click();
      if (event.key !== 'Tab') return;
      const items = [...box.querySelectorAll('a[href],button,input,select,textarea,[tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
      if (!items.length) { event.preventDefault(); box.focus(); return; }
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === box)) {event.preventDefault();last.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
    });
  });
})();
