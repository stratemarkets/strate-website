/* Run in the head: no initial text flash; without JS the still and copy remain visible. */
(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches) return;
  document.documentElement.classList.add('hero-intro');

  const init = () => {
    const shell = document.querySelector('.hero-shell');
    const video = shell?.querySelector('.hero-video');
    const copy = shell?.querySelector('.hero');
    if (!video || !copy) {
      document.documentElement.classList.remove('hero-intro');
      return;
    }

    let revealed = false;
    let staticMode = false;
    let frameRequest;
    copy.inert = true;

    const reveal = () => {
      if (revealed) return;
      revealed = true;
      copy.inert = false;
      shell.classList.add('is-revealed');
      video.removeEventListener('timeupdate', checkTime);
      if (frameRequest !== undefined) video.cancelVideoFrameCallback(frameRequest);
    };
    const checkTime = () => {
      if (video.currentTime >= 3) reveal();
    };
    const checkFrame = (_, { mediaTime }) => {
      if (mediaTime >= 3 && video.currentTime >= 3) reveal();
      else if (!revealed) frameRequest = video.requestVideoFrameCallback(checkFrame);
    };
    const fallback = () => {
      staticMode = true;
      video.pause();
      shell.classList.add('is-static');
      reveal();
    };
    const start = async () => {
      if (staticMode) return;
      if (motion.matches || video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) return fallback();
      video.muted = true;
      try {
        await video.play();
        if (staticMode) video.pause();
      } catch {
        fallback();
      }
    };

    video.addEventListener('timeupdate', checkTime);
    video.addEventListener('ended', reveal, { once: true });
    video.addEventListener('error', fallback, { once: true });
    video.querySelector('source')?.addEventListener('error', fallback, { once: true });
    motion.addEventListener('change', event => { if (event.matches) fallback(); });
    if ('requestVideoFrameCallback' in video) {
      frameRequest = video.requestVideoFrameCallback(checkFrame);
    }
    // No autoplay attribute: playback starts only after the page's load event.
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else init();
})();
