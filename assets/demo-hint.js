/* Runs inside the demo iframe (added by assets/hero-demo.js): a small bubble
   under the StrateDOM tab, shown a few seconds after the demo starts, so
   visitors know the tab can be opened. It stays until the visitor clicks the
   tab, and is then not shown again to them. The toolbar is drawn on the canvas,
   so the tab is found where the demo writes the word "StrateDOM"; without it,
   no bubble. While one of the demo's dialogs is open, the bubble steps aside. */
(() => {
  const canvas = document.getElementById('c');
  const KEY = 'strate-demo-hint-2';  // Set once the tab has been clicked.
  if (!canvas) return;
  try { if (localStorage.getItem(KEY)) return; } catch { /* storage blocked: show it */ }

  const proto = CanvasRenderingContext2D.prototype;
  const fillText = proto.fillText;
  let spot = null;   // centre of the word "StrateDOM" and its width, in CSS pixels
  proto.fillText = function (text, x, y, ...rest) {
    if (text === 'StrateDOM' && this.canvas === canvas) {
      const m = this.getTransform(), scale = canvas.width / canvas.clientWidth || 1;
      spot = {
        x: (m.a * x + m.c * y + m.e) / scale,
        y: (m.b * x + m.d * y + m.f) / scale,
        w: this.measureText(text).width * m.a / scale,
      };
    }
    return fillText.call(this, text, x, y, ...rest);
  };

  const dialogs = [...document.querySelectorAll('.voile')];
  let bubble = null, frame = 0, done = false;
  const place = () => {
    if (!bubble || !spot) return;
    const box = canvas.getBoundingClientRect();
    bubble.style.left = `${box.left + spot.x}px`;
    bubble.style.top = `${box.top + spot.y + 16}px`;
    bubble.classList.toggle('is-shown', !dialogs.some(dialog => !dialog.hidden));
    frame = requestAnimationFrame(place);
  };
  const finish = () => {
    done = true;
    cancelAnimationFrame(frame);
    proto.fillText = fillText;
    removeEventListener('pointerdown', onPress, true);
    try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    if (!bubble) return;
    bubble.classList.remove('is-shown');
    setTimeout(() => bubble.remove(), 400);
  };
  // Only a press on the tab itself (the word plus the tab's padding) ends it.
  function onPress(event) {
    if (!spot) return;
    const box = canvas.getBoundingClientRect();
    const dx = Math.abs(event.clientX - box.left - spot.x), dy = Math.abs(event.clientY - box.top - spot.y);
    if (dx <= spot.w / 2 + 14 && dy <= 16) finish();
  }
  addEventListener('pointerdown', onPress, true);

  setTimeout(() => {
    if (done || !spot) return;
    bubble = document.createElement('div');
    bubble.className = 'demo-hint';
    bubble.setAttribute('role', 'status');
    bubble.textContent = document.documentElement.lang === 'fr' ? 'Essayez le StrateDOM' : 'Try StrateDOM';
    document.body.append(bubble);
    requestAnimationFrame(place);
  }, 4000);
})();
