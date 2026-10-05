/* Strate website — real product captures and separate illustrative diagrams. */
(() => {
  'use strict';
  const en = document.documentElement.lang.startsWith('en');
  const words = {
    'Ouvrir le menu': 'Open menu', 'Fermer le menu': 'Close menu',
    'Taille réelle': 'Actual size', 'Ajuster à la fenêtre': 'Fit to window',
    'Capture réelle de la plateforme.': 'Actual platform screenshot.',
    'OBJECTIF': 'TARGET', 'ENTRÉE': 'ENTRY'
  };
  const t = value => en ? (words[value] || value) : value;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  // Keep native disclosures (FAQ and the feature details), animating their height in both directions.
  const faqMotion = matchMedia('(prefers-reduced-motion: reduce)');
  $$('.faq-list details, .feature-reference').forEach(detail => {
    const summary = $(':scope > summary', detail);
    const answer = $(':scope > :not(summary)', detail);
    let expanded = detail.open;
    let animation;
    let textAnimation;
    function settle() {
      if (animation) {
        animation.onfinish = null;
        animation.cancel();
        animation = null;
      }
      textAnimation?.cancel();
      detail.open = expanded;
      summary.setAttribute('aria-expanded', String(expanded));
    }
    summary.addEventListener('click', event => {
      event.preventDefault();
      const startHeight = detail.getBoundingClientRect().height;
      // Links such as #detail-outils may have opened it without a click.
      if (!animation) expanded = detail.open;
      expanded = !expanded;
      settle();
      if (faqMotion.matches) return;
      const endHeight = detail.getBoundingClientRect().height;
      // Leave the answer rendered throughout a closing animation.
      detail.open = true;
      animation = detail.animate([
        { height: `${startHeight}px`, overflow: 'clip' },
        { height: `${endHeight}px`, overflow: 'clip' }
      ], { duration: 420, easing: 'cubic-bezier(.22, 1, .36, 1)' });
      animation.onfinish = settle;
      if (answer && expanded) textAnimation = answer.animate([
        { opacity: 0, transform: 'translateY(6px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 280, delay: 60, fill: 'backwards', easing: 'ease-out' });
    });
    window.addEventListener('resize', settle);
    faqMotion.addEventListener('change', settle);
  });
  const C = { bg: '#101316', grid: '#22292b', muted: '#89958e', green: '#79b5a1', red: '#c77977', accent: '#007acd' };
  const seedRandom = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const svg = (content, w = 1200, h = 400) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" aria-hidden="true">${content}</svg>`;
  const rect = (x, y, w, h, fill, opacity = 1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" opacity="${opacity}"/>`;
  const line = (x1, y1, x2, y2, color, opacity = 1, dash = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" opacity="${opacity}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
  const text = (x, y, value, color = C.muted, size = 9, anchor = 'start') => `<text x="${x}" y="${y}" fill="${color}" font-family="Google Sans, Arial, sans-serif" font-size="${size}" text-anchor="${anchor}">${value}</text>`;
  const circle = (x, y, r, color, opacity = 1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" fill-opacity="${opacity}" stroke="${color}" stroke-opacity=".8" stroke-width=".6"/>`;
  function renderChart(terminal, mode) {
    const selected = $(`[data-capture="${mode}"]`, terminal);
    if (!selected) return;
    terminal.dataset.chart = mode;
    selected.loading = 'eager';
    $$('[data-capture]', terminal).forEach(img => { img.hidden = img !== selected; });
    $('.chart-legend', terminal).textContent = selected.alt;
    $('.capture-open', terminal).setAttribute('aria-label', en ? `Open ${selected.dataset.title} full size` : `Ouvrir ${selected.dataset.title} en grand`);
    $$('[data-mode]', terminal).forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  }
  $$('[data-chart]').forEach(terminal => {
    renderChart(terminal, terminal.dataset.chart);
    $$('[data-mode]', terminal).forEach(button => button.addEventListener('click', () => renderChart(terminal, button.dataset.mode)));
    $('.view-tabs', terminal).addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const buttons = $$('[data-mode]', terminal), current = buttons.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : buttons.length - 1)) % buttons.length;
      buttons[next].focus(); buttons[next].click();
    });
  });

  function miniArt(kind) {
    const rnd = seedRandom(63); let out = '';
    if (kind === 'liquidity') {
      for (let row = 0; row < 26; row++) for (let col = 0; col < 10; col++) {
        const bright = row % 7 === 2;
        out += rect(col * 30, row * 5 + 23, 20 + rnd() * 17, 2.5, bright ? C.accent : '#355a77', bright ? .45 + rnd() * .25 : rnd() * .25);
      }
      for (let i = 0; i < 65; i++) {
        const x = 10 + rnd() * 275, y = 106 - x * .12 + Math.sin(x / 28) * 14;
        out += circle(x, y + rnd() * 7, 1 + rnd() * 5, rnd() > .45 ? C.green : C.red, .7);
      }
    } else if (kind === 'footprint') {
      for (let col = 0; col < 4; col++) for (let row = 0; row < 6; row++) {
        const x = 13 + col * 73, y = 28 + row * 19 + Math.sin(col * 2) * 16, buy = rnd() > .4;
        out += rect(x, y, 59, 17, buy ? '#315c4a' : '#5b3d37', .36) + text(x + 24, y + 12, Math.floor(rnd() * 250), buy ? '#acc2aa' : '#b89f94', 9, 'end') + text(x + 53, y + 12, Math.floor(rnd() * 350), buy ? '#acc2aa' : '#b89f94', 9, 'end');
        if (row === 3) out += line(x, y + 17, x + 59, y + 17, C.accent, .7);
      }
    } else if (kind === 'profile' || kind === 'terrain') {
      const count = kind === 'terrain' ? 25 : 15;
      for (let layer = count; layer >= 0; layer--) {
        let d = '', fill = '';
        for (let j = 0; j <= 50; j++) {
          const x = 15 + j * 4.1 + layer * 2.5, baseline = 151 - layer * 2.7 + j * .28;
          const peak = Math.exp(-Math.pow((j - 19 - Math.sin(layer * .22) * 7) / 9, 2)) * (46 + Math.sin(layer * .28) * 12) + Math.exp(-Math.pow((j - 37) / 6, 2)) * 26;
          const y = baseline - peak;
          d += `${j ? 'L' : 'M'}${x},${y} `;
          if (j === 0) fill = `M${x},${baseline} L${x},${y} `; else fill += `L${x},${y} `;
          if (j === 50) fill += `L${x},${baseline} Z`;
        }
        out += `<path d="${fill}" fill="#10161d"/><path d="${d}" stroke="${layer % 5 === 0 ? '#459dd0' : '#587c9b'}" stroke-width=".8" opacity="${.45 + (count - layer) / count * .4}"/>`;
      }
      out += line(15, 162, 275, 178, '#405e76', .6) + line(15, 162, 74, 94, '#405e76', .6);
    } else if (kind === 'wave') {
      for (let i = 0; i < 95; i++) {
        const height = 5 + rnd() * 110 * (i > 40 && i < 70 ? 1 : .5);
        out += rect(i * 3.16, 175 - height, 1.3, height, i > 49 ? '#536779' : '#007acd', .5 + rnd() * .4);
      }
      out += line(150, 10, 150, 179, '#007acd') + circle(150, 12, 3, C.accent);
    } else if (kind === 'candles' || kind === 'risk') {
      for (let y = 30; y < 175; y += 35) out += line(0, y, 300, y, C.grid);
      for (let x = 0; x < 300; x += 50) out += line(x, 15, x, 180, C.grid);
      for (let i = 0; i < 30; i++) {
        const x = i * 9 + 10, y = 110 - i * 1.6 + Math.sin(i * .6) * 17, up = rnd() > .4, height = 5 + rnd() * 14;
        out += line(x + 2.5, y - 7, x + 2.5, y + height + 6, up ? C.green : C.red, .85) + rect(x, y, 5, height, up ? C.green : C.red, .75);
      }
      if (kind === 'risk') {
        out += rect(157, 35, 128, 63, '#538577', .15) + rect(157, 98, 128, 33, '#ad6664', .12);
        out += line(120, 35, 295, 35, C.green, .7, '3 3') + line(120, 98, 295, 98, '#c7ccd5', .8, '3 3') + line(120, 131, 295, 131, C.red, .7, '3 3');
        out += text(290, 29, t('OBJECTIF'), C.green, 7, 'end') + text(290, 92, t('ENTRÉE'), '#c7ccd5', 7, 'end') + text(290, 144, 'STOP', C.red, 7, 'end');
      }
    }
    const result = svg(out, 300, 190);
    return kind === 'wave' ? result.replace('<svg ', '<svg preserveAspectRatio="none" ') : result;
  }
  $$('[data-art]').forEach(element => { element.innerHTML = miniArt(element.dataset.art); });

  const menuToggle = $('.menu-toggle'), mobileNav = $('#mobile-nav');
  const menuMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let menuAnimation;
  mobileNav.inert = true;
  function setMenu(open, immediate = false) {
    const height = mobileNav.hidden ? 0 : mobileNav.getBoundingClientRect().height;
    const opacity = mobileNav.hidden ? 0 : Number(getComputedStyle(mobileNav).opacity);
    menuAnimation?.cancel();
    menuAnimation = null;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', t(open ? 'Fermer le menu' : 'Ouvrir le menu'));
    mobileNav.inert = !open;
    if (open) mobileNav.hidden = false;
    // Measure before changing the class so the links transition from their resting state.
    const targetHeight = mobileNav.getBoundingClientRect().height;
    mobileNav.classList.toggle('is-open', open);
    if (immediate || menuMotion.matches || !mobileNav.animate) {
      mobileNav.hidden = !open;
      return;
    }
    // Padding is animated with the height so the panel folds all the way, then vanishes.
    const style = getComputedStyle(mobileNav);
    const padding = { paddingTop: style.paddingTop, paddingBottom: style.paddingBottom };
    const folded = { height: '0px', paddingTop: '0px', paddingBottom: '0px' };
    const animation = mobileNav.animate(open ? [
      { ...(height ? { height: `${height}px` } : folded), opacity },
      { height: `${targetHeight}px`, ...padding, opacity: 1 }
    ] : [
      { height: `${height}px`, ...padding, opacity },
      { opacity, offset: .6 },
      { ...folded, opacity: 0 }
    ], open
      ? { duration: 420, easing: 'cubic-bezier(.22, 1, .36, 1)' }
      // Closing mirrors opening: the links leave first, then the panel folds up.
      : { duration: 440, delay: 70, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'backwards' });
    menuAnimation = animation;
    animation.onfinish = () => {
      if (menuAnimation !== animation) return;
      mobileNav.hidden = !open;
      menuAnimation = null;
    };
  }
  function closeMenu(immediate = false) { setMenu(false, immediate); }
  menuToggle.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuToggle.focus(); } });
  document.addEventListener('click', event => { if (!mobileNav.hidden && !event.target.closest('.site-header')) closeMenu(); });
  mobileNav.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  matchMedia('(min-width: 1001px)').addEventListener('change', event => {
    if (!event.matches) return;
    if (mobileNav.contains(document.activeElement)) $('.site-header .brand').focus();
    closeMenu(true);
  });
  menuMotion.addEventListener('change', () => setMenu(menuToggle.getAttribute('aria-expanded') === 'true', true));

  const dialog = $('.chart-dialog');
  const dialogChart = $('.dialog-chart', dialog);
  const zoomButton = $('.capture-zoom', dialog);
  let dialogTrigger;
  function resetZoom() {
    dialogChart.classList.remove('is-zoomed');
    zoomButton.setAttribute('aria-pressed', 'false');
    zoomButton.textContent = t('Taille réelle');
    dialogChart.scrollTo(0, 0);
  }
  $$('.expand-button, .capture-open, .highlight-open, .feature-zoom').forEach(button => button.addEventListener('click', () => {
    const source = button.matches('.highlight-open, .feature-zoom') ? $('img', button) : $('[data-capture]:not([hidden])', button.closest('.terminal'));
    dialogTrigger = button;
    const fullImage = source.cloneNode();
    fullImage.addEventListener('load', () => {
      fullImage.width = fullImage.naturalWidth;
      fullImage.height = fullImage.naturalHeight;
    }, { once: true });
    if (source.dataset.fullSrc) {
      fullImage.src = source.dataset.fullSrc;
      fullImage.alt = source.dataset.fullAlt;
      fullImage.width = 2880;
      fullImage.height = 1800;
    }
    fullImage.loading = 'eager';
    dialogChart.replaceChildren(fullImage);
    $('.dialog-title', dialog).textContent = `STRATE / ${source.dataset.title.toUpperCase()}`;
    $('.dialog-note', dialog).textContent = `${fullImage.alt}. ${t('Capture réelle de la plateforme.')}`;
    resetZoom();
    dialog.showModal(); document.body.classList.add('body-locked');
    $('.dialog-close', dialog).focus();
  }));
  zoomButton.addEventListener('click', () => {
    const zoomed = dialogChart.classList.toggle('is-zoomed');
    zoomButton.setAttribute('aria-pressed', String(zoomed));
    zoomButton.textContent = t(zoomed ? 'Ajuster à la fenêtre' : 'Taille réelle');
    dialogChart.scrollTo(0, 0);
  });
  $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { document.body.classList.remove('body-locked'); resetZoom(); dialogTrigger?.focus(); });

  $$('.layout-picker button').forEach(button => button.addEventListener('click', () => {
    $('.workspace-panes').dataset.layout = button.dataset.layout;
    $$('.layout-picker button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  }));
  $$('.tool-filters button').forEach(button => button.addEventListener('click', () => {
    $$('.tool-filters button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    $$('.tool-row').forEach(row => { row.hidden = button.dataset.filter !== 'all' && button.dataset.filter !== row.dataset.family; });
  }));
  const osCopy = en ? {
    mac: '<h3>macOS · Apple Silicon</h3><p>Beta for Macs with Apple Silicon. Built-in engine and locally stored data.</p><span class="mono muted">INTEL MACS NOT SUPPORTED</span>',
    windows: '<h3>Windows · x64</h3><p>Beta for Windows x64. Databento replay has been tested; validation of live data and trading is ongoing.</p><span class="mono muted">BETA · VALIDATION ONGOING</span>'
  } : {
    mac: '<h3>macOS · Apple Silicon</h3><p>Bêta pour les Mac équipés d’une puce Apple Silicon. Moteur embarqué et données conservées localement.</p><span class="mono muted">MAC INTEL NON PRIS EN CHARGE</span>',
    windows: '<h3>Windows · x64</h3><p>Bêta pour Windows x64. Le replay Databento a été testé ; la validation du flux et du trading est en cours.</p><span class="mono muted">BÊTA · VALIDATION EN COURS</span>'
  };
  const showSystem = os => {
    $$('.os-picker button').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.os === os)));
    $('.os-detail').innerHTML = osCopy[os];
  };
  $$('.os-picker button').forEach(button => button.addEventListener('click', () => showSystem(button.dataset.os)));
  // Open on the visitor's own system; other platforms keep the macOS default.
  if ($('.os-picker')) {
    const platform = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent;
    if (/win/i.test(platform)) showSystem('windows');
  }


})();
