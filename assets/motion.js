/* Title and figure animations with GSAP (hosted in assets/vendor/gsap):
   - page titles rise line by line out of a mask;
   - a few key section titles ([data-fill]) light up word by word with the scroll;
   - key figures count up once when they come into view.
   Nothing moves when motion is reduced, and without JavaScript nothing is hidden. */
(() => {
  const root = document.documentElement;
  if (!root.classList.contains('motion') || !window.gsap || !window.ScrollTrigger || !window.SplitText) {
    root.classList.remove('motion');
    return;
  }
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Figures: 50+, 50 %, 30 %, 199… count from zero, keeping their own decimal separator.
  document.querySelectorAll('.fact-value, .price-number').forEach(figure => {
    const node = [...figure.childNodes].find(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
    const match = node?.textContent.trim().match(/^(\d+)(?:([.,])(\d+))?$/);
    if (!match) return;
    const [, whole, separator = '.', fraction = ''] = match;
    const target = Number(`${whole}.${fraction || 0}`);
    if (!target) return;
    const counter = { value: 0 };
    const render = () => { node.textContent = counter.value.toFixed(fraction.length).replace('.', separator); };
    render();
    gsap.to(counter, {
      value: target, duration: 1.6, ease: 'power2.out', onUpdate: render,
      scrollTrigger: { trigger: figure, start: 'top 92%', once: true },
    });
  });

  // Titles are split once the web font is ready, so the lines match what is displayed.
  document.fonts.ready.then(() => {
    document.querySelectorAll('.page-hero h1, .help-hero h1').forEach(title => {
      SplitText.create(title, {
        type: 'lines', mask: 'lines', autoSplit: true,
        onSplit: split => {
          // Room under each mask for descenders (g, p, y), without changing the line spacing.
          gsap.set(split.masks, { paddingBottom: '.14em', marginBottom: '-.14em' });
          // A short pause after the page appears, so the title does not arrive too abruptly.
          return gsap.from(split.lines, { yPercent: 115, duration: 1.1, ease: 'expo.out', stagger: .12, delay: .45 });
        },
      });
      gsap.set(title, { visibility: 'visible' });
    });

    document.querySelectorAll('[data-fill]').forEach(title => {
      SplitText.create(title, {
        type: 'words', autoSplit: true,
        onSplit: split => gsap.fromTo(split.words, { opacity: .16 }, {
          opacity: 1, ease: 'none', stagger: .12,
          scrollTrigger: { trigger: title, start: 'top 85%', end: 'bottom 50%', scrub: .6 },
        }),
      });
    });
  });
})();
