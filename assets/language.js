/* Language picker: every option opens the equivalent page and keeps the current anchor. */
(() => {
  const trigger = document.querySelector('.language-trigger');
  const panel = document.querySelector('.language-panel');
  if (!trigger || !panel || typeof panel.showModal !== 'function') return;
  const options = [...panel.querySelectorAll('.language-option')];
  const search = panel.querySelector('.language-search input');
  const empty = panel.querySelector('.language-empty');
  const phone = window.matchMedia('(max-width: 600px)');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

  // Wide screens: the panel covers the pill, aligned on its right and bottom edges.
  const place = () => {
    const rect = trigger.getBoundingClientRect();
    const bottom = Math.max(16, innerHeight - rect.bottom);
    panel.style.setProperty('--language-right', `${Math.max(16, innerWidth - rect.right)}px`);
    panel.style.setProperty('--language-bottom', `${bottom}px`);
    panel.style.maxHeight = phone.matches ? '' : `${Math.max(260, innerHeight - bottom - 16)}px`;
  };

  const filter = () => {
    const query = normalize(search.value.trim());
    let shown = 0;
    options.forEach(option => {
      const match = !query || normalize(option.dataset.search).includes(query);
      option.parentElement.hidden = !match;
      shown += match;
    });
    empty.hidden = shown > 0;
  };

  const open = () => {
    options.forEach(option => {
      const destination = new URL(option.getAttribute('href'), location.href);
      destination.hash = location.hash;
      option.href = destination.href;
    });
    search.value = '';
    filter();
    place();
    panel.classList.remove('closing');
    panel.showModal();
    document.documentElement.classList.add('language-open');
    trigger.setAttribute('aria-expanded', 'true');
    // Avoid raising the keyboard on phones: focus the current language instead.
    (panel.querySelector('[aria-current="true"]') || options[0]).focus();
  };

  const finish = () => {
    panel.classList.remove('closing');
    if (panel.open) panel.close();
  };
  const close = () => {
    if (!panel.open || panel.classList.contains('closing')) return;
    if (motion.matches) return finish();
    panel.classList.add('closing');
    panel.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, 260);
  };

  trigger.addEventListener('click', open);
  panel.querySelector('.language-close').addEventListener('click', close);
  panel.addEventListener('close', () => {
    document.documentElement.classList.remove('language-open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus({ preventScroll: true });
  });
  panel.addEventListener('cancel', event => { event.preventDefault(); close(); });
  // A click on the blurred backdrop lands on the dialog itself, outside its two blocks.
  panel.addEventListener('click', event => { if (event.target === panel) close(); });
  search.addEventListener('input', filter);
  search.addEventListener('keydown', event => {
    // A search field would otherwise spend Escape on clearing itself.
    if (event.key === 'Escape') { event.preventDefault(); return close(); }
    if (event.key !== 'Enter') return;
    const first = options.find(option => !option.parentElement.hidden);
    if (first) location.assign(first.href);
  });

  // Arrow keys move between the visible languages.
  panel.querySelector('.language-list').addEventListener('keydown', event => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const visible = options.filter(option => !option.parentElement.hidden);
    const index = visible.indexOf(document.activeElement);
    const next = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: visible.length - 1 }[event.key];
    visible[(next + visible.length) % visible.length]?.focus();
    event.preventDefault();
  });

  addEventListener('resize', () => { if (panel.open && !phone.matches) place(); });
})();
