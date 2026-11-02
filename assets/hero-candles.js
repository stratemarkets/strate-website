/* Home hero: the mouse draws a live chart. Candles sit on a time axis with one
   fixed spacing, chained like a real chart (each opens where the previous one
   closed): green when the close is above the open, violet when below. The candle
   under the pointer forms live: moving up or down in a small space stretches it
   into one tall candle, and its wicks keep the highest and lowest points reached.
   A new candle opens each time the pointer moves one spacing further. Candles
   drift left like a live chart and fade out; a last-price tag follows on the
   right with a dotted line. Drawn on a canvas behind the title and the film;
   mouse only, never with reduced motion. */
(() => {
  const shell = document.querySelector('.hero-shell');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!shell) return;

  const COLOURS = {
    up: { body: '#35CE00', line: '#5FC651' },
    down: { body: '#54188D', line: '#8664A7' },
  };
  const WIDTH = 14;         // body width
  const GAP = 6;            // minimum space between two candles
  const SPACING = WIDTH + GAP;
  const VANISH = 160;       // ms for a candle covered by a newer one to disappear
  const LIFE = 900;         // ms before a candle has faded out
  const GROW = 140;         // ms for a new candle to reach its full size
  const DRIFT = .03;        // px per ms the candles slide left, like a live chart
  const TICK = .25;         // price increment of the tag

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-candles';
  canvas.setAttribute('aria-hidden', 'true');
  shell.prepend(canvas);
  const ctx = canvas.getContext('2d');
  let ratio = 1, width = 0, height = 0, candles = [], frame = 0;
  let last = null;          // last pointer sample { x, y, t }
  let previous = null;      // the candle forming under the pointer

  const resize = () => {
    ratio = Math.min(devicePixelRatio || 1, 2);
    ({ width, height } = shell.getBoundingClientRect());
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  };
  new ResizeObserver(resize).observe(shell);
  resize();

  // The tag reads the pointer's height as a futures price, to the quarter point.
  const price = y => (6100 - (y / Math.max(1, height)) * 120);
  const label = y => (Math.round(price(y) / TICK) * TICK).toFixed(2);

  const roundRect = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

  const direction = c => c.close < c.open ? 'up' : c.close > c.open ? 'down' : c.lean;

  const draw = now => {
    frame = 0;
    candles = candles.filter(c => now - c.touched < LIFE && !(c.covered && now - c.covered > VANISH));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    for (const c of candles) {
      const eased = 1 - (1 - Math.min(1, (now - c.born) / GROW)) ** 3;
      const fade = Math.max(0, 1 - (now - c.touched) / LIFE) ** 1.4;
      ctx.globalAlpha = c.covered ? fade * Math.max(0, 1 - (now - c.covered) / VANISH) : fade;
      const colours = COLOURS[direction(c)];
      const x = at(c, now);
      // The body runs from the open to the close (growing in when the candle is new);
      // the wicks reach the highest and lowest points seen while it formed.
      const close = c.open + (c.close - c.open) * eased;
      const top = Math.min(c.open, close), bottom = Math.max(c.open, close);
      const body = Math.max(1.5, bottom - top);
      const high = Math.min(top, c.open + (c.high - c.open) * eased) - c.extraTop * eased;
      const low = Math.max(top + body, c.open + (c.low - c.open) * eased) + c.extraBottom * eased;
      // Wick above and below the body only, never through it.
      ctx.strokeStyle = colours.line;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, high);
      ctx.lineTo(x, top);
      ctx.moveTo(x, top + body);
      ctx.lineTo(x, low);
      ctx.stroke();
      ctx.fillStyle = colours.body;
      ctx.fillRect(x - WIDTH / 2, top, WIDTH, body);
      ctx.strokeRect(x - WIDTH / 2 + .75, top + .75, WIDTH - 1.5, Math.max(0, body - 1.5));
    }
    // Last-price tag on the right, with a dotted line from the newest candle.
    const newest = candles[candles.length - 1];
    if (newest) {
      ctx.globalAlpha = Math.max(0, 1 - (now - newest.touched) / LIFE) ** 1.2;
      const colours = COLOURS[direction(newest)];
      const y = newest.close, text = label(y);
      ctx.font = '600 12px "Alliance No1", Arial, sans-serif';
      const tagWidth = ctx.measureText(text).width + 14, tagX = width - tagWidth - Math.max(16, width * .02);
      ctx.strokeStyle = colours.line;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(at(newest, now) + WIDTH, y);
      ctx.lineTo(tagX, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colours.body;
      roundRect(tagX, y - 10, tagWidth, 20, 5);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, tagX + 7, y + .5);
    }
    ctx.globalAlpha = 1;
    if (candles.length) frame = requestAnimationFrame(draw);
  };

  let heading = 1;           // horizontal direction of the chart: 1 right, -1 left
  const at = (candle, now) => candle.x - (now - candle.born) * DRIFT;
  const MAX_BODY = 260;      // tallest body a vertical gesture can draw

  // The forming candle follows the pointer: its close tracks it, and its high and
  // low keep the extremes, so a vertical gesture in a small space draws one tall candle.
  const move = y => {
    const c = previous;
    c.close = Math.max(c.open - MAX_BODY, Math.min(c.open + MAX_BODY, y));
    c.high = Math.min(c.high, c.close);
    c.low = Math.max(c.low, c.close);
    c.touched = performance.now();
    if (!frame) frame = requestAnimationFrame(draw);
  };

  // A new candle opens where the previous one closed.
  const open = (x, y, speed) => {
    const now = performance.now();
    // A newer candle never sits on an older one: those underneath step aside fast.
    for (const c of candles) {
      if (!c.covered && Math.abs(at(c, now) - x) < SPACING) c.covered = now;
    }
    const start = previous ? previous.close : y + (Math.random() - .5) * 6;
    const reach = 2 + Math.min(3, speed) * 5;
    const candle = {
      x, open: start, close: start, high: start, low: start, born: now, touched: now,
      lean: previous ? direction(previous) : 'up',
      extraTop: reach * Math.random(), extraBottom: reach * Math.random(),
    };
    candles.push(candle);
    previous = candle;
    move(y);
  };

  shell.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !fine.matches || reduced.matches) return;
    const box = shell.getBoundingClientRect();
    const x = event.clientX - box.left, y = event.clientY - box.top, now = event.timeStamp;
    if (!last) { last = { x, y, t: now }; return; }
    const dx = x - last.x, dy = y - last.y, distance = Math.hypot(dx, dy);
    if (distance < 1) return;
    const speed = distance / Math.max(8, now - last.t); // px per ms
    // Candles sit on a time axis with one fixed spacing. Walking along the pointer's
    // path, a new candle opens each time the pointer gets SPACING ahead of the last
    // one; in between, the current candle forms under the pointer.
    const samples = Math.ceil(distance / 4);
    let opened = 0;
    for (let k = 1; k <= samples; k++) {
      const px = last.x + dx * k / samples, py = last.y + dy * k / samples;
      if (!previous) { open(px, py, speed); continue; }
      const from = at(previous, performance.now());
      const ahead = (px - from) * heading;
      if (ahead <= -SPACING && opened < 40) {
        // The pointer turned back past the chart: a new run starts under it.
        heading = -heading;
        open(px, py, speed); opened++;
      } else if (ahead >= SPACING && opened < 40) {
        open(from + heading * SPACING, py, speed); opened++;
      } else {
        move(py);
      }
    }
    last = { x, y, t: now };
  });
  shell.addEventListener('pointerleave', () => { last = null; previous = null; heading = 1; });
})();
