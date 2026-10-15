/* Home film: plays muted on a loop while it is on screen, with a pause button.
   With reduced motion it starts paused on its last frame (the poster). */
(() => {
  const video = document.querySelector('.hero-film-video');
  const button = document.querySelector('.hero-film-play');
  if (!video || !button) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let wanted = !reduced.matches;
  let visible = false;

  const render = () => {
    const playing = wanted;
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? button.dataset.labelPause : button.dataset.labelPlay);
  };
  const sync = () => {
    if (wanted && visible) video.play().catch(() => { wanted = false; render(); });
    else video.pause();
  };

  button.addEventListener('click', () => { wanted = !wanted; render(); sync(); });
  reduced.addEventListener('change', event => { if (event.matches) { wanted = false; render(); sync(); } });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .3 }).observe(video);
  render();
})();
