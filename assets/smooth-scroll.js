/* Smooth wheel scrolling (Lenis), driven by the GSAP ticker so ScrollTrigger
   animations stay in step. Touch keeps native scrolling, reduced motion keeps
   the browser default, and nested scroll areas (lists, tables, dialogs) scroll
   on their own. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!window.Lenis || reduced.matches) return;

  const lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, allowNestedScroll: true, prevent: node => !!node.closest?.('dialog') });
  window.strateLenis = lenis;

  if (window.gsap && window.ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const frame = time => { lenis.raf(time); requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
  }

  // Pause while a modal window or the enlarged screenshot holds the page.
  const sync = () => {
    const locked = document.body.classList.contains('body-locked') || !!document.querySelector('dialog[open]');
    locked ? lenis.stop() : lenis.start();
  };
  new MutationObserver(sync).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open', 'class'] });

  // Same-page anchors glide too.
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href*="#"]');
    // The help centre routes through the hash itself; leave its links alone.
    if (!link || link.target || link.origin !== location.origin || link.pathname !== location.pathname || document.body.dataset.page === 'help') return;
    const id = decodeURIComponent(link.hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    event.preventDefault();
    lenis.scrollTo(target); // Lenis applies the CSS scroll margin and padding itself.
    const before = location.href;
    history.pushState(null, '', link.hash);
    if (location.href !== before) dispatchEvent(new HashChangeEvent('hashchange', { oldURL: before, newURL: location.href }));
  });

  reduced.addEventListener('change', event => { if (event.matches) lenis.destroy(); });
})();
