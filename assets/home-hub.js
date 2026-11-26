/* Home page hub ("Tout se connecte à Strate."): draws a wire from the Strate
   core to each tool, sends a violet pulse along each wire in turn (faster on
   the hovered tool) and animates the core's order-book bars. The tools are
   plain links in the HTML; below 960px they become a list and nothing is drawn. */
(() => {
  const hub = document.querySelector('.hub');
  if (!hub) return;
  const wires = hub.querySelector('.hub-wires');
  const core = hub.querySelector('.hub-core');
  const nodes = [...hub.querySelectorAll('.hub-node')];
  const list = matchMedia('(max-width: 960px)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVG = 'http://www.w3.org/2000/svg';
  let flows = [];

  // Wires go from the core to the tool, so the pulse leaves Strate.
  function layout() {
    hub.querySelectorAll('.hub-port').forEach((port) => port.remove());
    wires.replaceChildren();
    flows = [];
    if (list.matches) return;
    const H = hub.getBoundingClientRect();
    const C = core.getBoundingClientRect();
    const cx = C.left - H.left, cy = C.top - H.top;
    wires.setAttribute('viewBox', `0 0 ${H.width} ${H.height}`);
    const sides = { l: [], r: [], b: [] };
    nodes.forEach((node, i) => sides[node.dataset.side].push(i));
    nodes.forEach((node, i) => {
      const R = node.getBoundingClientRect();
      const side = node.dataset.side;
      const group = sides[side];
      const off = group.indexOf(i) - (group.length - 1) / 2;
      let a, b, d;
      if (side === 'l') {
        a = [cx, cy + C.height / 2 + off * 15];
        b = [R.right - H.left, R.top - H.top + R.height / 2];
        const dx = (a[0] - b[0]) * 0.55;
        d = `M${a[0]} ${a[1]}C${a[0] - dx} ${a[1]} ${b[0] + dx} ${b[1]} ${b[0]} ${b[1]}`;
      } else if (side === 'r') {
        a = [cx + C.width, cy + C.height / 2 + off * 15];
        b = [R.left - H.left, R.top - H.top + R.height / 2];
        const dx = (b[0] - a[0]) * 0.55;
        d = `M${a[0]} ${a[1]}C${a[0] + dx} ${a[1]} ${b[0] - dx} ${b[1]} ${b[0]} ${b[1]}`;
      } else {
        a = [cx + C.width / 2 + off * 26, cy + C.height];
        b = [R.left - H.left + R.width / 2, R.top - H.top];
        const dy = (b[1] - a[1]) * 0.55;
        d = `M${a[0]} ${a[1]}C${a[0]} ${a[1] + dy} ${b[0]} ${b[1] - dy} ${b[0]} ${b[1]}`;
      }
      [a, b].forEach(([x, y]) => {
        const port = document.createElement('span');
        port.className = 'hub-port';
        port.dataset.i = i;
        port.style.left = `${x}px`;
        port.style.top = `${y}px`;
        hub.append(port);
      });
      const wire = document.createElementNS(SVG, 'path');
      wire.setAttribute('class', 'hub-wire');
      wire.setAttribute('d', d);
      wire.dataset.i = i;
      const flow = document.createElementNS(SVG, 'path');
      flow.setAttribute('class', 'hub-flow');
      flow.setAttribute('d', d);
      wires.append(wire, flow);
      flow.len = flow.getTotalLength();
      flow.style.strokeDasharray = `26 ${flow.len + 40}`;
      flows.push(flow);
    });
  }

  function setHot(i) {
    hot = i;
    wires.querySelectorAll('.hub-wire').forEach((wire) => wire.classList.toggle('on', +wire.dataset.i === i));
    hub.querySelectorAll('.hub-port').forEach((port) => port.classList.toggle('on', +port.dataset.i === i));
  }
  let hot = -1;
  nodes.forEach((node, i) => {
    node.addEventListener('mouseenter', () => setHot(i));
    node.addEventListener('mouseleave', () => setHot(-1));
    node.addEventListener('focus', () => setHot(i));
    node.addEventListener('blur', () => setHot(-1));
  });

  // Pulses: one after another around the hub, faster on the hovered tool.
  const CYCLE = 3.2;
  const phase = nodes.map((_, i) => -((i * 0.37) % 1) * CYCLE);
  let last = performance.now();
  let visible = false;
  function frame(now) {
    const dt = Math.min(60, now - last) / 1000;
    last = now;
    flows.forEach((flow, i) => {
      phase[i] += dt * (i === hot ? 1.1 : 0.42);
      const t = ((phase[i] % CYCLE) + CYCLE) % CYCLE;
      if (t > 1) { flow.style.opacity = 0; return; }
      flow.style.opacity = 0.95;
      flow.style.strokeDashoffset = 26 - t * (flow.len + 26);
    });
    if (visible) requestAnimationFrame(frame);
  }

  // The core: the Strate mark's four bars breathe like an order book.
  const rects = [...core.querySelectorAll('rect')];
  const widths = [[76, 48, 48, 76], [44, 45, 36, 47], [92, 42, 49, 74], [74, 34, 30, 90], [53, 40, 54, 92], [68, 21, 30, 91], [82, 51, 47, 59], [64, 67, 18, 56], [76, 48, 48, 76]];
  const right = [true, true, false, false];
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const start = performance.now();
  function breathe(now) {
    const t = ((now - start) % 5000) / 5000, p = t * 8, k = Math.min(7, Math.floor(p));
    const u = ease(Math.max(0, Math.min(1, (p - k) / 0.45)));
    rects.forEach((rect, i) => {
      const w = widths[k][i] + (widths[k + 1][i] - widths[k][i]) * u;
      rect.setAttribute('width', w.toFixed(2));
      rect.setAttribute('x', (right[i] ? 92 - w : 0).toFixed(2));
    });
    if (visible) requestAnimationFrame(breathe);
  }

  // Animate only while the hub is on screen.
  new IntersectionObserver(([entry]) => {
    const was = visible;
    visible = entry.isIntersecting && !reduce;
    if (visible && !was) {
      last = performance.now();
      requestAnimationFrame(frame);
      requestAnimationFrame(breathe);
    }
  }).observe(hub);

  layout();
  document.fonts.ready.then(layout);
  addEventListener('resize', layout);
  list.addEventListener('change', layout);
})();
