/* One clock drives the blue fill and the five-second slide advance. */
(() => {
  const root = document.querySelector('.highlights');
  if (!root) return;
  const track = root.querySelector('.highlights-track');
  const cards = [...root.querySelectorAll('.highlight-card')];
  const dots = [...root.querySelectorAll('[data-slide]')];
  const play = root.querySelector('.highlights-play');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 5000;
  let active = 0, elapsed = 0, last = null, frame = 0, settleTimer = 0;
  let playing = !reduced.matches, visible = false, moving = false;
  const target = i => cards[i].offsetLeft - cards[0].offsetLeft;
  const paint = () => root.style.setProperty('--slide-progress', String(elapsed / duration));
  const canRun = () => playing && visible && !document.hidden && !document.querySelector('dialog[open]');

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = null;
    if (canRun()) frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    frame = 0;
    if (!canRun()) { last = null; return; }
    if (moving) last = null;
    else {
      if (last !== null) elapsed = Math.min(duration, elapsed + now - last);
      last = now;
      paint();
      if (elapsed >= duration) go((active + 1) % cards.length);
    }
    frame = requestAnimationFrame(tick);
  }
  function updateActive() {
    const next = cards.reduce((best, _, i) => Math.abs(target(i) - track.scrollLeft) < Math.abs(target(best) - track.scrollLeft) ? i : best, 0);
    if (next !== active) { active = next; elapsed = 0; last = null; paint(); }
    dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === active)));
  }
  function settled() {
    clearTimeout(settleTimer);
    updateActive();
    moving = false;
    last = null;
  }
  function go(i, instant = false) {
    moving = true;
    last = null;
    track.scrollTo({ left: target(i), behavior: instant || reduced.matches ? 'instant' : 'smooth' });
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settled, 180);
  }
  function setPlaying(value) {
    playing = value;
    play.setAttribute('aria-pressed', String(playing));
    play.setAttribute('aria-label', document.documentElement.lang.startsWith('en')
      ? (playing ? 'Pause slideshow' : 'Start automatic slideshow')
      : (playing ? 'Mettre le défilement en pause' : 'Lancer le défilement automatique'));
    sync();
  }
  const stop = () => setPlaying(false);
  dots.forEach((dot, i) => dot.addEventListener('click', () => { stop(); go(i); }));
  root.querySelector('.highlights-dots').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = dots.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : cards.length - 1)) % cards.length;
    dots[next].focus(); dots[next].click();
  });
  track.addEventListener('scroll', () => {
    moving = true;
    last = null;
    updateActive();
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settled, 120);
  }, { passive: true });
  track.addEventListener('scrollend', settled);
  track.addEventListener('pointerdown', stop, { passive: true });
  track.addEventListener('wheel', stop, { passive: true });
  root.addEventListener('focusin', event => { if (event.target !== play) stop(); });
  play.addEventListener('click', () => setPlaying(!playing));
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', stop);
  document.querySelectorAll('dialog').forEach(dialog => new MutationObserver(sync).observe(dialog, { attributes: true, attributeFilter: ['open'] }));
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .2 }).observe(root);
  new ResizeObserver(() => go(active, true)).observe(track);
  paint();
  setPlaying(playing);
})();
