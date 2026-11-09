/* Home hero: the dots of the background light up around the mouse. Only the
   pointer position is passed to CSS (--glow-x, --glow-y, --glow); the lit dots
   are drawn by .hero-shell::after in hero.css. Mouse only. The candles drawn
   by the mouse (hero-candles.js) are switched off for now. */
(() => {
  const shell = document.querySelector('.hero-shell');
  if (!shell || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let frame = 0, x = 0, y = 0;
  const paint = () => {
    frame = 0;
    shell.style.setProperty('--glow-x', `${x}px`);
    shell.style.setProperty('--glow-y', `${y}px`);
  };
  shell.addEventListener('pointermove', event => {
    const box = shell.getBoundingClientRect();
    x = event.clientX - box.left;
    y = event.clientY - box.top;
    shell.style.setProperty('--glow', '1');
    if (!frame) frame = requestAnimationFrame(paint);
  });
  shell.addEventListener('pointerleave', () => shell.style.setProperty('--glow', '0'));
})();
