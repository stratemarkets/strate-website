/* Home hero, above phone width: the interactive Strate demo (strate-demo/) in a
   rounded window, in place of the film. The demo is only requested on those
   screens; phones keep the film. Opened from a file (file://), the demo cannot
   read its data, so the film stays: the head script then leaves out html.has-demo,
   which swaps the film for the demo in hero.css. */
(() => {
  const frame = document.querySelector('.hero-demo iframe');
  const shell = document.querySelector('.hero-shell');
  if (!frame || !shell || location.protocol === 'file:') return;
  // The site's style for the demo's dialogs and the StrateDOM hint, next to this
  // script in assets/.
  const theme = new URL('demo-theme.css', document.currentScript.src).href;
  const hint = new URL('demo-hint.js?v=2', document.currentScript.src).href;
  frame.addEventListener('load', () => {
    const doc = frame.contentDocument;
    if (!doc || doc.querySelector('link[data-site-theme]')) return;
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = theme;
    link.dataset.siteTheme = '';
    const script = doc.createElement('script');
    script.src = hint;
    doc.head.append(link, script);
  });
  const wide = matchMedia('(min-width: 601px)');
  const load = () => {
    if (!wide.matches || frame.src) return;
    frame.title = frame.getAttribute('aria-label');
    frame.src = frame.dataset.src;
  };
  load();
  wide.addEventListener('change', load);
})();
