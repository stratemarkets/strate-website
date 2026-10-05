/* Help center views from the URL hash: home, #c-category or #a-article, plus a
   search across every article. Without JavaScript all articles stay readable. */
(() => {
  const root = document.querySelector('.help-library');
  if (!root) return;
  const home = document.querySelector('.help-home');
  const crumbs = document.querySelector('.help-crumbs');
  const pager = document.querySelector('.help-pager');
  const sections = [...root.querySelectorAll('.help-category')];
  const articles = [...root.querySelectorAll('.help-article')];
  const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const homeLabel = crumbs.querySelector('a').textContent;
  document.body.classList.add('help-js');

  const crumb = (href, label) => {
    const separator = Object.assign(document.createElement('span'), { textContent: '›' });
    separator.setAttribute('aria-hidden', 'true');
    const item = href ? Object.assign(document.createElement('a'), { href, textContent: label }) : Object.assign(document.createElement('span'), { textContent: label });
    if (!href) item.setAttribute('aria-current', 'page');
    return [separator, item];
  };

  const show = () => {
    const hash = decodeURIComponent(location.hash.slice(1));
    const article = hash.startsWith('a-') ? document.getElementById(hash) : null;
    const section = article ? article.closest('.help-category') : hash.startsWith('c-') ? document.getElementById(hash) : null;
    const view = article ? 'article' : section ? 'category' : 'home';
    document.body.dataset.helpView = view;
    home.hidden = view !== 'home';
    root.hidden = view === 'home';
    crumbs.hidden = view === 'home';
    pager.hidden = view !== 'article';
    sections.forEach(item => {
      item.hidden = item !== section;
      item.classList.toggle('is-list', view === 'category');
      item.classList.toggle('is-reading', view === 'article');
      item.querySelector('.help-docs').hidden = view !== 'article';
    });
    articles.forEach(item => { item.hidden = item !== article; });
    root.querySelectorAll('.help-links a').forEach(link => {
      if (article && link.getAttribute('href') === `#${article.id}`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    crumbs.replaceChildren(Object.assign(document.createElement('a'), { href: '#', textContent: homeLabel }));
    if (section) {
      const name = section.dataset.name;
      crumbs.append(...crumb(article ? `#${section.id}` : null, name));
      if (article) crumbs.append(...crumb(null, article.querySelector('h3').textContent));
    }
    if (article) {
      const siblings = [...section.querySelectorAll('.help-article')];
      const index = siblings.indexOf(article);
      [['.help-prev', siblings[index - 1]], ['.help-next', siblings[index + 1]]].forEach(([selector, target]) => {
        const link = pager.querySelector(selector);
        link.hidden = !target;
        if (target) { link.href = `#${target.id}`; link.querySelector('span').textContent = target.querySelector('h3').textContent; }
      });
      document.title = `Strate — ${article.querySelector('h3').textContent}`;
    } else {
      document.title = `Strate — ${section ? section.dataset.name : homeLabel}`;
    }
    if (view !== 'home' || show.started) window.scrollTo({ top: 0 });
    if (article && show.started) article.focus({ preventScroll: true });
    show.started = true;
  };
  addEventListener('hashchange', show);
  show();

  // Search every article's title, category and text.
  const input = document.getElementById('help-query');
  const results = document.getElementById('help-results');
  const empty = document.querySelector('.help-empty').textContent;
  const index = articles.map(article => ({
    id: article.id,
    title: article.querySelector('h3').textContent,
    category: article.closest('.help-category').dataset.name,
    text: normalize(`${article.querySelector('h3').textContent} ${article.closest('.help-category').dataset.name} ${article.textContent}`),
  }));
  const close = () => { results.hidden = true; input.setAttribute('aria-expanded', 'false'); };
  const search = () => {
    const words = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
    if (!words.length || input.value.trim().length < 2) return close();
    const found = index
      .map(item => ({ item, score: words.every(word => item.text.includes(word)) ? (words.some(word => normalize(item.title).includes(word)) ? 2 : 1) : 0 }))
      .filter(entry => entry.score).sort((a, b) => b.score - a.score).slice(0, 8);
    results.replaceChildren(...(found.length ? found.map(({ item }) => {
      const link = Object.assign(document.createElement('a'), { href: `#${item.id}` });
      link.setAttribute('role', 'option');
      link.append(Object.assign(document.createElement('span'), { textContent: item.title }), Object.assign(document.createElement('small'), { textContent: item.category }));
      return link;
    }) : [Object.assign(document.createElement('p'), { textContent: empty })]));
    results.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  };
  input.addEventListener('input', search);
  input.addEventListener('focus', search);
  input.addEventListener('keydown', event => {
    const first = results.querySelector('a');
    if (event.key === 'Enter' && first) { event.preventDefault(); location.hash = first.getAttribute('href'); close(); input.value = ''; input.blur(); }
    if (event.key === 'ArrowDown' && first) { event.preventDefault(); first.focus(); }
    if (event.key === 'Escape') close();
  });
  results.addEventListener('keydown', event => {
    const links = [...results.querySelectorAll('a')];
    const index = links.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') { event.preventDefault(); links[Math.min(index + 1, links.length - 1)]?.focus(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); index <= 0 ? input.focus() : links[index - 1].focus(); }
    if (event.key === 'Escape') { close(); input.focus(); }
  });
  results.addEventListener('click', event => { if (event.target.closest('a')) { close(); input.value = ''; } });
  document.addEventListener('click', event => { if (!event.target.closest('.help-search')) close(); });
})();
