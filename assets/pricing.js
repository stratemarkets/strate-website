/* A simultaneous travelling light on each character's actual closed contours. */
(() => {
  const price = document.querySelector('.pricing-price');
  if (!price) return;
  const svg = price.querySelector('svg');
  const size = () => {
    const width = svg.getBoundingClientRect().width;
    if (width) price.style.setProperty('--stroke-scale', svg.viewBox.baseVal.width / width);
  };
  size();
  new ResizeObserver(size).observe(svg);
  const paths = [...price.querySelectorAll('defs path')];
  const perimeters = new Map();
  const starts = paths.map(path => {
    const character = path.dataset.character;
    const start = perimeters.get(character) || 0;
    perimeters.set(character, start + path.getTotalLength());
    return start;
  });
  if (![...perimeters.values()].every(length => length > 0)) return;
  // Randomise each character once per page load. Spaced phases keep identical
  // digits visibly distinct, while all pieces of a character remain in sync.
  const characters = [...perimeters.keys()];
  const rotation = Math.random();
  const phases = characters.map((_, i) => (rotation + (i + Math.random() * .4) / characters.length) % 1);
  for (let i = phases.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [phases[i], phases[j]] = [phases[j], phases[i]];
  }
  const delays = new Map(characters.map((character, i) => [character, `${-13 * phases[i]}s`]));
  // Match the button's comet: a pale violet tip and a progressively fading tail.
  // Sample its gradient along the glyph path, so the light follows each contour.
  const stops = [[0,179,24,255,0],[7/115,179,24,255,.48],
    [17/115,220,163,255,1],[31/115,179,24,255,1],
    [54/115,179,24,255,.6],[85/115,179,24,255,.07],[1,179,24,255,0]];
  price.querySelectorAll('.price-snake-tail use, .price-snake-body use').forEach(source => {
    // The sharp layer needs finer colour steps; the blurred halo stays lightweight.
    const segments = source.parentElement.classList.contains('price-snake-body') ? 96 : 24;
    const fragment = document.createDocumentFragment();
    for (let step = 0; step < segments; step++) {
      const t = (step + .5) / segments;
      const end = stops.findIndex(stop => stop[0] >= t);
      const a = stops[end - 1], b = stops[end];
      const progress = (t - a[0]) / (b[0] - a[0]);
      const mix = progress * progress * (3 - 2 * progress);
      const values = a.slice(1).map((value, i) => value + (b[i + 1] - value) * mix);
      const segment = source.cloneNode();
      segment.dataset.trailStep = step;
      segment.dataset.trailSegments = segments;
      const taper = Math.max(0, (step / (segments - 1) - 17 / 115) / (1 - 17 / 115));
      segment.style.setProperty('--segment-width', `calc(var(--snake-max-width) - var(--snake-taper-range) * ${taper})`);
      segment.style.stroke = `rgb(${values.slice(0, 3).join(' ')} / ${values[3]})`;
      fragment.append(segment);
    }
    source.replaceWith(fragment);
  });
  price.querySelectorAll('[data-contour]').forEach(path => {
    const index = Number(path.dataset.contour);
    const perimeter = perimeters.get(paths[index].dataset.character);
    path.style.animationDelay = delays.get(paths[index].dataset.character);
    path.style.setProperty('--perimeter', `${perimeter}px`);
    path.style.setProperty('--tail-length', `${perimeter * .22}px`);
    path.style.setProperty('--body-length', `${perimeter * .12}px`);
    path.style.setProperty('--head-length', `${perimeter * .03}px`);
    const step = path.dataset.trailStep;
    const segments = Number(path.dataset.trailSegments);
    const lag = step === undefined ? perimeter * .042 : perimeter * (115 / 360) * Number(step) / segments;
    path.style.setProperty('--trail', `${step === undefined ? perimeter * .012 : perimeter * (115 / 360) / segments}px`);
    path.style.setProperty('--start', `${starts[index] + lag}px`);
  });
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  const update = () => price.classList.toggle('is-playing', visible && !document.hidden && !motion.matches);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    update();
  }).observe(price);
  document.addEventListener('visibilitychange', update);
  motion.addEventListener('change', update);
  window.addEventListener('pagehide', () => price.classList.remove('is-playing'));
  window.addEventListener('pageshow', update);
  price.classList.add('is-ready');
})();
