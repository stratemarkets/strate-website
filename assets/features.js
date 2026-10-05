/* Native disclosures remain usable without JS. Enhance with matching visuals,
   direct section links and motion that respects the reader's preference. */
(() => {
  const explorer = document.querySelector('.feature-explorer');
  if (!explorer) return;
  const featureScriptURL = document.currentScript.src;
  const choices = [...explorer.querySelectorAll('.feature-choice')];
  const views = [...explorer.querySelectorAll('[data-feature-view]')];
  const reset = explorer.querySelector('.feature-reset');
  const rail = explorer.querySelector('.feature-choices');
  const mobilePanel = explorer.querySelector('.feature-mobile-panel');
  const mobileCopy = explorer.querySelector('.feature-mobile-copy');
  const copies = new Map(choices.map(choice => [choice, choice.querySelector('.feature-choice-copy')]));
  const compact = matchMedia('(max-width: 800px)');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = null;
  let visualAnimation;
  const openingView = views.find(view => view.dataset.featureView === 'classic');
  const opening = openingView?.querySelector('.feature-opening');
  const openingPoster = openingView?.querySelector('.feature-opening-poster');
  let pageLoaded = false;
  let openingStarted = false;
  let openingUnavailable = false;
  const header = document.querySelector('.site-header');
  let openingCheck;
  let openingNeedsFit = false;

  function openingViewport() {
    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft || 0;
    const viewportTop = viewport?.offsetTop || 0;
    const right = left + (viewport?.width || document.documentElement.clientWidth);
    const bottom = viewportTop + (viewport?.height || innerHeight);
    const top = Math.max(viewportTop, header?.getBoundingClientRect().bottom || 0);
    const rect = explorer.getBoundingClientRect();
    return {
      availableHeight: Math.max(0, bottom - top),
      // Allow only subpixel rounding; the entire black panel must be visible.
      full: rect.width > 0 && rect.height > 0 && rect.top >= top - .5 &&
        rect.bottom <= bottom + .5 && rect.left >= left - .5 && rect.right <= right + .5,
      visible: rect.bottom > top && rect.top < bottom && rect.right > left && rect.left < right,
      near: rect.bottom > top - 400 && rect.top < bottom + 400
    };
  }
  function fitOpening() {
    explorer.classList.remove('opening-fit');
    // Desktop: every view shares one height, so the fit applies to all of them.
    if (!opening || (compact.matches && openingView.hidden)) return;
    const height = openingViewport().availableHeight - 24;
    if (height > 0 && explorer.getBoundingClientRect().height > height) {
      explorer.style.setProperty('--opening-fit-height', `${height}px`);
      explorer.classList.add('opening-fit');
    }
  }
  function scheduleOpeningCheck(fit = false) {
    openingNeedsFit ||= fit;
    if (openingCheck) return;
    openingCheck = requestAnimationFrame(() => {
      openingCheck = null;
      if (openingNeedsFit) {
        openingNeedsFit = false;
        fitOpening();
      }
      updateOpening();
    });
  }

  function updateOpening() {
    if (!opening) return;
    const fallback = motion.matches || openingUnavailable;
    opening.hidden = fallback;
    openingPoster.hidden = !fallback;
    const viewport = openingViewport();
    if (fallback || openingView.hidden || document.hidden || !viewport.visible) {
      opening.pause();
      return;
    }
    // Prepare the video as the section approaches, then start at full visibility.
    if (pageLoaded && viewport.near && !opening.getAttribute('src')) {
      opening.muted = true;
      opening.defaultPlaybackRate = opening.playbackRate = 1;
      opening.preload = 'auto';
      opening.src = opening.dataset.src;
      opening.load();
    }
    if (!pageLoaded || (!openingStarted && !viewport.full)) {
      opening.pause();
      return;
    }
    if (!opening.paused || opening.ended) return;
    opening.play().catch(error => {
      if (error.name === 'AbortError') return;
      openingUnavailable = true;
      updateOpening();
    });
  }
  if (opening) {
    opening.addEventListener('error', () => {
      openingUnavailable = true;
      updateOpening();
    });
    opening.addEventListener('playing', () => {
      // Loading may finish after the visitor has scrolled away.
      if (openingView.hidden || document.hidden || (!openingStarted && !openingViewport().full)) {
        opening.pause();
        return;
      }
      openingStarted = true;
    });
    function prepareOpening() {
      pageLoaded = true;
      scheduleOpeningCheck(true);
    }
    if (document.readyState === 'complete') prepareOpening();
    else window.addEventListener('load', prepareOpening, { once: true });
    window.addEventListener('scroll', () => scheduleOpeningCheck(), { passive: true });
    window.addEventListener('resize', () => scheduleOpeningCheck(true));
    window.visualViewport?.addEventListener('resize', () => scheduleOpeningCheck(true));
    window.visualViewport?.addEventListener('scroll', () => scheduleOpeningCheck());
    const openingResize = new ResizeObserver(() => scheduleOpeningCheck(true));
    openingResize.observe(explorer);
    if (header) openingResize.observe(header);
    window.addEventListener('pagehide', () => opening.pause());
    window.addEventListener('pageshow', () => scheduleOpeningCheck(true));
  }
  const choiceAnimations = new Set();
  function stopChoiceAnimations() {
    choiceAnimations.forEach(animation => animation.cancel());
    choiceAnimations.clear();
  }
  function animateChoice(element, frames, options) {
    const animation = element.animate(frames, options);
    choiceAnimations.add(animation);
    animation.onfinish = () => choiceAnimations.delete(animation);
  }

  const demos = [...explorer.querySelectorAll('.feature-demo')];
  const playback = new Map(demos.map(video => [video, { requested: false }]));
  const automaticPauses = new WeakSet();
  let activeDemo = null;
  let stageVisible = false;
  let demoSelection = 0;

  // Neither player libraries nor animation data are requested until selection.
  // Direct file previews use a generated script: browsers forbid file:// fetch.
  const lotties = [...explorer.querySelectorAll('.feature-lottie')];
  const lottieStates = new Map(lotties.map(node => [node, {
    renderer: null, loading: false, ready: false, failed: false, ended: false, staticShown: false
  }]));
  let lottieRuntime;
  let activeLottie = null;
  function loadFeatureScript(file) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL(file, featureScriptURL).href;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
  }
  async function loadLottieArchive(node) {
    if (location.protocol === 'file:') {
      const name = new URL(node.dataset.src, location.href).pathname.split('/').pop().replace(/\.lottie$/, '');
      if (!window.strateLottieArchives?.[name]) await loadFeatureScript(`${name}.js`);
      return Uint8Array.from(atob(window.strateLottieArchives[name]), character => character.charCodeAt(0));
    }
    const response = await fetch(node.dataset.src);
    if (!response.ok) throw new Error('Animation unavailable');
    return new Uint8Array(await response.arrayBuffer());
  }
  function updateLotties() {
    lotties.forEach(node => {
      const state = lottieStates.get(node);
      if (!state.ready) return;
      if (node !== activeLottie || !stageVisible || document.hidden || motion.matches || state.ended) {
        state.renderer.pause();
        if (node === activeLottie && motion.matches && !state.staticShown) {
          state.renderer.goToAndStop(state.renderer.totalFrames - 1, true);
          state.staticShown = true;
        }
      } else state.renderer.play();
    });
  }
  async function loadLottie(node) {
    const state = lottieStates.get(node);
    if (state.loading || state.failed || state.ready) return;
    state.loading = true;
    try {
      lottieRuntime ||= Promise.all([
        loadFeatureScript('vendor/lottie/lottie.min.js'), loadFeatureScript('vendor/lottie/fflate.min.js')
      ]);
      const [bytes] = await Promise.all([loadLottieArchive(node), lottieRuntime]);
      const archive = window.fflate.unzipSync(bytes);
      const manifest = JSON.parse(window.fflate.strFromU8(archive['manifest.json']));
      const config = manifest.animations[0];
      const animationData = JSON.parse(window.fflate.strFromU8(archive[`animations/${config.id}.json`]));
      const renderer = window.lottie.loadAnimation({
        container: node, renderer: 'svg', animationData, autoplay: false,
        loop: config.loop === true, rendererSettings: { preserveAspectRatio: 'xMidYMid meet' }
      });
      state.renderer = renderer;
      renderer.setSpeed(config.speed || 1);
      const ready = () => {
        if (state.ready || state.failed) return;
        state.ready = true;
        node.hidden = false;
        node.querySelector('svg')?.setAttribute('aria-hidden', 'true');
        node.parentElement.querySelector('.feature-lottie-fallback').hidden = true;
        updateLotties();
      };
      renderer.addEventListener('DOMLoaded', ready);
      renderer.addEventListener('complete', () => { state.ended = true; });
      renderer.addEventListener('data_failed', () => failLottie(node));
      renderer.addEventListener('error', () => failLottie(node));
      if (renderer.isLoaded) ready();
    } catch {
      failLottie(node);
    } finally { state.loading = false; }
  }
  function failLottie(node) {
    const state = lottieStates.get(node);
    state.failed = true;
    state.ready = false;
    state.renderer?.destroy();
    state.renderer = null;
    node.hidden = true;
    node.parentElement.querySelector('.feature-lottie-fallback').hidden = false;
  }
  function selectLottie(view) {
    lotties.forEach(node => lottieStates.get(node).renderer?.pause());
    activeLottie = view.querySelector('.feature-lottie');
    if (!activeLottie) return;
    const state = lottieStates.get(activeLottie);
    state.ended = false;
    state.staticShown = false;
    if (state.ready) state.renderer.goToAndStop(0, true);
    else loadLottie(activeLottie);
  }

  function pauseDemo(video) {
    if (!video.paused) {
      automaticPauses.add(video);
      video.pause();
    }
  }
  function updatePlayback() {
    demos.forEach(video => {
      const state = playback.get(video);
      if (video !== activeDemo || !stageVisible || document.hidden || !state.requested) {
        pauseDemo(video);
      } else if (video.paused && !video.ended && !video.error) {
        const selection = demoSelection;
        video.play().catch(error => {
          // Keep the poster visible if automatic playback is disallowed.
          if (error.name !== 'AbortError' && video === activeDemo && selection === demoSelection) state.requested = false;
        });
      }
    });
    updateLotties();
    updateOpening();
  }
  function selectDemo(view) {
    demoSelection += 1;
    const video = view.querySelector('.feature-demo');
    demos.forEach(pauseDemo);
    activeDemo = video;
    selectLottie(view);
    if (video) {
      video.muted = true;
      playback.get(video).requested = !motion.matches;
      if (!video.getAttribute('src')) {
        video.src = video.dataset.src;
        video.load();
      } else if (video.readyState >= 1) video.currentTime = 0;
    }
    updatePlayback();
  }
  demos.forEach(video => {
    const speed = Number(video.dataset.playbackRate) || 2;
    video.defaultPlaybackRate = speed;
    video.playbackRate = speed;
    video.addEventListener('play', () => {
      if (video !== activeDemo || !stageVisible || document.hidden) pauseDemo(video);
      else playback.get(video).requested = true;
    });
    video.addEventListener('pause', () => {
      if (automaticPauses.has(video)) automaticPauses.delete(video);
      else playback.get(video).requested = false;
    });
    video.addEventListener('ended', () => { playback.get(video).requested = false; });
    video.addEventListener('error', () => {
      playback.get(video).requested = false;
      video.closest('.feature-view').querySelector('.feature-video-error').hidden = false;
    });
  });
  new IntersectionObserver(entries => {
    stageVisible = entries[0].isIntersecting && entries[0].intersectionRatio >= .1;
    updatePlayback();
  }, { threshold: [0, .1] }).observe(explorer.querySelector('.feature-stage'));
  document.addEventListener('visibilitychange', updatePlayback);
  window.addEventListener('pagehide', () => {
    demos.forEach(pauseDemo);
    lotties.forEach(node => lottieStates.get(node).renderer?.pause());
  });
  window.addEventListener('pageshow', updatePlayback);
  motion.addEventListener('change', () => {
    if (motion.matches && activeDemo) playback.get(activeDemo).requested = false;
    if (activeLottie && !motion.matches) {
      const state = lottieStates.get(activeLottie);
      state.ended = false;
      state.staticShown = false;
      if (state.ready) state.renderer.goToAndStop(0, true);
    }
    updatePlayback();
  });

  explorer.classList.add('is-enhanced');
  function placeContent() {
    choices.forEach(choice => {
      const copy = copies.get(choice);
      const parent = compact.matches && choice === selected ? mobileCopy : choice;
      if (copy.parentElement !== parent) parent.append(copy);
    });
    explorer.classList.toggle('is-selected', Boolean(selected));
    mobilePanel.hidden = !compact.matches || !selected;
    rail.inert = compact.matches && Boolean(selected);
  }

  function select(choice, updateHash = true) {
    const before = !motion.matches && !compact.matches
      ? new Map(choices.map(item => [item, item.getBoundingClientRect()])) : null;
    stopChoiceAnimations();
    selected = choice;
    choices.forEach(item => { item.open = item === choice; });
    placeContent();
    if (before) {
      const after = new Map(choices.map(item => [item, item.getBoundingClientRect()]));
      choices.forEach(item => {
        const start = before.get(item), end = after.get(item);
        if (Math.abs(start.width - end.width) < .5 && Math.abs(start.height - end.height) < .5) return;
        animateChoice(item, [
          { width: `${start.width}px`, height: `${start.height}px`, overflow: 'clip' },
          { width: `${end.width}px`, height: `${end.height}px`, overflow: 'clip' }
        ], { duration: 460, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      });
    }
    const next = choice?.dataset.visual || 'classic';
    visualAnimation?.cancel();
    views.forEach(view => { view.hidden = view.dataset.featureView !== next; });
    fitOpening();
    const view = views.find(item => !item.hidden);
    selectDemo(view);
    if (!motion.matches) {
      visualAnimation = view.animate([
        { opacity: 0, transform: 'translateY(12px) scale(.985)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ], { duration: 550, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      if (choice) animateChoice(copies.get(choice), [
        { opacity: 0, transform: 'translateY(7px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 320, delay: 80, fill: 'backwards', easing: 'ease-out' });
    }
    reset.hidden = !choice;
    if (updateHash) history.replaceState(null, '', '#' + (choice?.id || 'fonctionnalites'));
  }

  choices.forEach(choice => {
    choice.querySelector('summary').addEventListener('click', event => {
      event.preventDefault();
      select(selected === choice ? null : choice);
      if (compact.matches && selected) {
        mobileCopy.focus({ preventScroll: true });
        explorer.scrollIntoView({ block: 'start', behavior: motion.matches ? 'instant' : 'smooth' });
      }
    });
    choice.querySelector('.feature-more').addEventListener('click', () => {
      document.querySelector('#detail-' + choice.id).open = true;
    });
  });
  reset.addEventListener('click', () => {
    const previous = selected;
    select(null);
    if (previous && compact.matches) rail.scrollTo({
      left: previous.offsetLeft - (rail.clientWidth - previous.offsetWidth) / 2,
      behavior: 'instant'
    });
    previous?.querySelector('summary').focus({ preventScroll: true });
  });
  function step(direction) {
    const index = choices.indexOf(selected);
    select(choices[(index + direction + choices.length) % choices.length]);
  }
  explorer.querySelector('.feature-previous').addEventListener('click', () => step(-1));
  explorer.querySelector('.feature-next').addEventListener('click', () => step(1));
  mobileCopy.addEventListener('keydown', event => {
    if (event.target !== mobileCopy || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    step(event.key === 'ArrowRight' ? 1 : -1);
  });
  explorer.addEventListener('keydown', event => {
    if (event.key === 'Escape' && selected && !document.querySelector('dialog[open]')) {
      event.preventDefault();
      reset.click();
    }
  });
  function followHash(scroll = false) {
    const id = location.hash.slice(1);
    const choice = choices.find(item => item.id === id);
    if (choice) {
      select(choice, false);
      if (scroll) (compact.matches ? explorer : choice).scrollIntoView({ block: 'start', behavior: motion.matches ? 'instant' : 'smooth' });
    } else if (id.startsWith('detail-')) {
      const detail = document.getElementById(id);
      if (detail?.matches('.feature-reference')) detail.open = true;
    } else if (id === 'fonctionnalites') select(null, false);
  }
  window.addEventListener('hashchange', () => followHash(true));
  compact.addEventListener('change', () => {
    stopChoiceAnimations();
    const focusInCopy = mobileCopy.contains(document.activeElement);
    const focusInRail = rail.contains(document.activeElement);
    placeContent();
    if (selected && (focusInCopy || focusInRail)) {
      (compact.matches ? mobileCopy : selected.querySelector('summary')).focus({ preventScroll: true });
    }
  });
  window.addEventListener('resize', stopChoiceAnimations);
  motion.addEventListener('change', () => {
    if (motion.matches) {
      stopChoiceAnimations();
      visualAnimation?.cancel();
    }
  });
  // Opening an already-selected topic still works after a same-page nav click.
  document.querySelectorAll('a[href]').forEach(link => link.addEventListener('click', event => {
    if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const destination = new URL(link.href, location.href);
    if (destination.pathname !== location.pathname) return;
    const choice = choices.find(item => '#' + item.id === destination.hash);
    if (choice) {
      event.preventDefault();
      select(choice, false);
      if (location.hash !== destination.hash) history.pushState(null, '', destination.hash);
      (compact.matches ? explorer : choice).scrollIntoView({ block: 'start', behavior: motion.matches ? 'instant' : 'smooth' });
    }
  }));
  placeContent();
  followHash();
  fitOpening();
  updateOpening();
  if (compact.matches && choices.some(choice => '#' + choice.id === location.hash)) {
    window.addEventListener('load', () => { if (selected) explorer.scrollIntoView({ block: 'start', behavior: 'instant' }); }, { once: true });
  }
})();
