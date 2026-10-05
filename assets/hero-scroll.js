/* Scrub a native Blender camera move only after the light reveal has finished. */
(() => {
  const wrapper = document.querySelector('.hero-scroll');
  const shell = wrapper?.querySelector('.hero-shell');
  const intro = shell?.querySelector('.hero-video');
  const camera = shell?.querySelector('.hero-camera');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!camera || reduced.matches) return;
  let disabled = false, frame = 0, targetTime = 0;
  wrapper.classList.add('has-scroll-camera');
  function disable() {
    if (disabled) return;
    disabled = true;
    cancelAnimationFrame(frame);
    camera.pause();
    shell.classList.remove('is-scroll-ready');
    wrapper.classList.remove('has-scroll-camera');
  }
  function seek() {
    if (disabled || !intro.ended || camera.readyState < 2 || camera.seeking) return;
    if (Math.abs(camera.currentTime - targetTime) > 1 / 48) camera.currentTime = targetTime;
  }
  function update() {
    frame = 0;
    if (disabled || !intro.ended || !Number.isFinite(camera.duration)) return;
    const header = parseFloat(getComputedStyle(wrapper).getPropertyValue('--header-height'));
    const distance = wrapper.offsetHeight - shell.offsetHeight;
    const progress = Math.max(0, Math.min(1, (header - wrapper.getBoundingClientRect().top) / Math.max(1, distance)));
    shell.dataset.cameraProgress = progress.toFixed(4);
    targetTime = progress * Math.max(0, camera.duration - 1 / 24);
    if (camera.readyState >= 2) shell.classList.add('is-scroll-ready');
    seek();
  }
  function requestUpdate() { if (!disabled && !frame) frame = requestAnimationFrame(update); }
  camera.addEventListener('seeked', seek);
  camera.addEventListener('loadeddata', requestUpdate);
  camera.addEventListener('canplay', requestUpdate);
  camera.addEventListener('error', disable, { once: true });
  intro.addEventListener('ended', requestUpdate);
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  new ResizeObserver(requestUpdate).observe(wrapper);
  reduced.addEventListener('change', event => { if (event.matches) disable(); });
  new MutationObserver(() => { if (shell.classList.contains('is-static')) disable(); }).observe(shell, { attributes: true, attributeFilter: ['class'] });
  function loadCamera() {
    if (disabled || shell.classList.contains('is-static')) return disable();
    camera.src = camera.dataset.src;
    camera.preload = 'auto';
    camera.load();
  }
  if (document.readyState === 'complete') loadCamera();
  else window.addEventListener('load', loadCamera, { once: true });
})();
