/* Strate Developer: search across the docs (header and sidebar boxes), copy
   buttons on code blocks, the sidebar menu on phones, and the on-page table of
   contents following the reading position. */
(() => {
  // Copy buttons.
  document.querySelectorAll('.dev-copy').forEach(button => {
    button.addEventListener('click', async () => {
      const code = button.closest('.dev-code').querySelector('code').innerText;
      try { await navigator.clipboard.writeText(code); button.textContent = 'Copied'; }
      catch { button.textContent = 'Press Ctrl+C'; }
      setTimeout(() => { button.textContent = 'Copy'; }, 1600);
    });
  });

  // Search (index built by developers.py into developers/search.js). Index URLs
  // are relative to the docs root; pages may sit one folder down.
  const escapeHtml = text => text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const root = document.body.dataset.docsRoot || '';
  const boxes = [...document.querySelectorAll('.dev-search')];
  boxes.forEach(box => {
    const input = box.querySelector('input'), results = box.querySelector('.dev-results');
    if (!input || !results) return;
    const run = () => {
      const query = input.value.trim().toLowerCase();
      const docs = window.STRATE_DOCS || [];
      if (!query) { results.hidden = true; results.innerHTML = ''; return; }
      const words = query.split(/\s+/);
      const found = docs
        .map(doc => {
          const title = doc.t.toLowerCase(), body = doc.x.toLowerCase();
          if (!words.every(w => title.includes(w) || body.includes(w))) return null;
          // Exact names (a function, an error code) come first, then titles, then text.
          const exact = title === query || title.startsWith(query + ' ') ? 50 : 0;
          return { doc, score: exact + words.reduce((s, w) => s + (title.includes(w) ? 8 : 0) + Math.min(5, body.split(w).length - 1), 0) };
        })
        .filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 10);
      results.innerHTML = found.length
        ? found.map(({ doc }) => `<li><a href="${root}${doc.u}">${escapeHtml(doc.t)}<small>${escapeHtml(doc.s)}</small></a></li>`).join('')
        : '<li class="is-empty">No results</li>';
      results.hidden = false;
    };
    input.addEventListener('input', run);
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') { input.value = ''; run(); input.blur(); }
      if (event.key === 'Enter') results.querySelector('a')?.click();
    });
    document.addEventListener('click', event => { if (!box.contains(event.target)) results.hidden = true; });
  });
  // "/" focuses the first visible search box.
  addEventListener('keydown', event => {
    if (event.key !== '/' || ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
    const visible = boxes.map(box => box.querySelector('input')).find(input => input && input.offsetParent);
    if (visible) { event.preventDefault(); visible.focus(); }
  });

  // Sidebar menu: always open on wide screens, folded behind a button on phones.
  const menu = document.querySelector('.dev-menu');
  if (menu) {
    const wide = matchMedia('(min-width: 801px)');
    const sync = () => { menu.open = wide.matches; };
    sync();
    wide.addEventListener('change', sync);
  }

  // On-page table of contents: highlight the section being read.
  const links = [...document.querySelectorAll('.dev-toc a')];
  if (links.length) {
    const targets = links.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => link.classList.toggle('is-active', link.hash === `#${entry.target.id}`));
      });
    }, { rootMargin: '-90px 0px -70% 0px' });
    targets.forEach(target => observer.observe(target));
  }
})();
