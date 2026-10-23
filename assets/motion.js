/* Title and figure animations with GSAP (hosted in assets/vendor/gsap):
   - big page titles build word by word: each word grows in, violet, then turns to its
     own colour as the next word pushes the re-centring line left;
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

  const TITLES = '.hero h1, .page-hero h1, .help-hero h1, .pricing-hero h1';
  // Titles are split once the web font is ready, so the lines match what is displayed.
  document.fonts.ready.then(() => {
    // Big titles build word by word: each word grows in from nothing while the
    // words already shown slide left, so the centred line re-centres smoothly.
    // Lines are fixed first, so no word ever jumps to another line mid-animation.
    document.querySelectorAll(TITLES).forEach(title => {
      const split = SplitText.create(title, { type: 'lines,words' });
      const words = split.words;
      words.forEach(word => {
        // The space before a word becomes a margin that grows with it.
        const gap = word.previousSibling;
        if (gap?.nodeType === Node.TEXT_NODE && !gap.textContent.trim()) {
          const range = document.createRange();
          range.selectNodeContents(gap);
          word.dataset.gap = range.getBoundingClientRect().width;
          gap.remove();
        }
        word.style.whiteSpace = 'nowrap';
        word.style.verticalAlign = 'top';
      });
      gsap.set(title, { visibility: 'visible' });
      const timeline = gsap.timeline({ delay: .45, onComplete: () => split.revert() });
      // Each word is born in the signature violet and takes back its own colour
      // (white, or grey on muted lines) while the next word pushes it left.
      const violet = getComputedStyle(root).getPropertyValue('--accent').trim() || '#b318ff';
      words.forEach((word, index) => {
        const width = word.getBoundingClientRect().width;
        const gap = Number(word.dataset.gap) || 0;
        const colour = getComputedStyle(word).color;
        const start = index * .25;
        timeline.fromTo(word,
          { width: 0, marginLeft: 0, opacity: 0, scale: .6, color: violet },
          { width, marginLeft: gap, opacity: 1, scale: 1, duration: .7, ease: 'power3.out' },
          start);
        const last = index === words.length - 1;
        timeline.to(word, { color: colour, duration: .3, ease: 'power1.out' }, last ? start + .5 : start + .25);
      });
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
