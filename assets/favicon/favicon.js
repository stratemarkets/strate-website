/* Animated favicon. Firefox plays the SVG's own animation; Chromium browsers
   show SVG favicons frozen, so there the same animation (read from the SVG's
   <animate> elements) is drawn on a canvas and swapped in about 12 times a
   second, only while the tab is visible. Reduced motion keeps it still. */
(() => {
  const link = document.getElementById('favicon');
  // Chrome may pick the 32 px PNG declared for Safari over the SVG: every icon
  // link carries the animated frame.
  const icons = [...document.querySelectorAll('link[rel~="icon"]')];
  const originals = icons.map(icon => icon.href);
  if (!link || /firefox/i.test(navigator.userAgent) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  if (!canvas.getContext || !canvas.toDataURL) return;
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const source = link.href;

  // Cubic-bezier easing for SMIL keySplines.
  const bezier = (x1, y1, x2, y2) => t => {
    const at = (a, b, s) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
    let lo = 0, hi = 1, s = t;
    for (let i = 0; i < 20; i++) { s = (lo + hi) / 2; at(x1, x2, s) < t ? (lo = s) : (hi = s); }
    return at(y1, y2, s);
  };
  const track = node => {
    const values = node.getAttribute('values').split(';').map(Number);
    const times = node.getAttribute('keyTimes').split(';').map(Number);
    const splines = (node.getAttribute('keySplines') || '').split(';').map(s => bezier(...s.trim().split(/\s+/).map(Number)));
    return p => {
      let i = times.findIndex((time, index) => p <= times[index + 1]);
      if (i < 0) i = times.length - 2;
      const span = times[i + 1] - times[i] || 1;
      const eased = splines[i] ? splines[i]((p - times[i]) / span) : (p - times[i]) / span;
      return values[i] + (values[i + 1] - values[i]) * eased;
    };
  };

  fetch(source).then(response => response.text()).then(text => {
    const svg = new DOMParser().parseFromString(text, 'image/svg+xml');
    const [background, ...bars] = svg.querySelectorAll('rect');
    const group = svg.querySelector('g');
    const [, tx, ty, scale] = /translate\(([\d.]+)\s+([\d.]+)\)\s*scale\(([\d.]+)\)/.exec(group.getAttribute('transform')).map(Number);
    let duration = 5000;
    const shapes = [...bars].map(rect => {
      const shape = { x: +rect.getAttribute('x'), y: +rect.getAttribute('y'), w: +rect.getAttribute('width'), h: +rect.getAttribute('height'), r: +rect.getAttribute('rx'), tracks: {} };
      rect.querySelectorAll('animate').forEach(node => {
        duration = parseFloat(node.getAttribute('dur')) * 1000;
        shape.tracks[node.getAttribute('attributeName')] = track(node);
      });
      return shape;
    });
    const k = canvas.width / 32;
    const draw = now => {
      const p = (now % duration) / duration;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = background.getAttribute('fill');
      ctx.beginPath(); ctx.roundRect(0, 0, 32 * k, 32 * k, +background.getAttribute('rx') * k); ctx.fill();
      ctx.fillStyle = group.getAttribute('fill');
      for (const s of shapes) {
        const x = s.tracks.x ? s.tracks.x(p) : s.x, w = s.tracks.width ? s.tracks.width(p) : s.w;
        ctx.beginPath(); ctx.roundRect((tx + x * scale) * k, (ty + s.y * scale) * k, w * scale * k, s.h * scale * k, s.r * scale * k); ctx.fill();
      }
      const image = canvas.toDataURL('image/png');
      icons.forEach(icon => { icon.href = image; });
    };
    let last = 0, frame = 0;
    const loop = now => {
      if (now - last > 80) { draw(now); last = now; }
      frame = requestAnimationFrame(loop);
    };
    const toggle = () => {
      cancelAnimationFrame(frame);
      if (document.hidden) icons.forEach((icon, i) => { icon.href = originals[i]; }); else frame = requestAnimationFrame(loop);
    };
    document.addEventListener('visibilitychange', toggle);
    toggle();
  }).catch(() => {});
})();
