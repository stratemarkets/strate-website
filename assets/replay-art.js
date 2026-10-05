/* Home replay illustration, driven by the scroll: the session bars rise as the
   section arrives, then a playhead runs from 09:30 to 16:00 with the scroll and
   rewinds when the visitor scrolls back up. The clock rolls like a counter and
   pauses on the decisive moment, 14:30:00. Static when motion is reduced. */
(() => {
  const art = document.querySelector('.time-art');
  if (!art || !document.documentElement.classList.contains('motion') || !window.gsap || !window.ScrollTrigger) return;
  const svg = art.querySelector('.time-wave svg');
  const digits = art.querySelector('.time-digits');
  if (!svg || !digits) return;

  const bars = [...svg.querySelectorAll('rect')];
  const head = svg.querySelector('line');
  const dot = svg.querySelector('circle');
  const start = 9 * 60 + 30, length = 6.5 * 60;           // 09:30 to 16:00, in minutes
  const decisive = (14 * 60 + 30 - start) / length;        // 14:30 on the timeline
  const hold = [.6, .72];                                   // scroll range spent paused on it
  const x = fraction => fraction * 300;

  // The decisive moment is the session's tallest bar.
  const peak = bars[Math.round(decisive * (bars.length - 1))];
  const tallest = Math.max(...bars.map(bar => +bar.getAttribute('height')));
  peak.setAttribute('y', 175 - (tallest + 18));
  peak.setAttribute('height', tallest + 18);
  peak.classList.add('is-peak');
  bars.forEach(bar => bar.removeAttribute('fill'));
  svg.classList.add('is-live');

  // Clock as rolling digit columns; the colons stay as they are.
  const columns = [];
  digits.innerHTML = '14:30:00'.split('').map(char => char === ':' ? '<span>:</span>'
    : `<i class="odo"><i class="odo-strip">${'0123456789'.split('').map(n => `<i>${n}</i>`).join('')}</i></i>`).join('');
  digits.querySelectorAll('.odo-strip').forEach(strip => columns.push(strip));
  // Seconds change too fast to roll legibly: they switch, hours and minutes roll.
  columns.slice(4).forEach(strip => strip.classList.add('is-instant'));
  let shown = '';
  const setClock = minutes => {
    const seconds = Math.round(minutes * 60);
    const text = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(n => String(n).padStart(2, '0')).join('');
    if (text === shown) return;
    shown = text;
    [...text].forEach((n, i) => { columns[i].style.transform = `translateY(${-Number(n)}em)`; });
  };

  const moment = art.querySelector('.time-scale .accent');
  const render = progress => {
    const fraction = progress < hold[0] ? progress / hold[0] * decisive
      : progress < hold[1] ? decisive
      : decisive + (progress - hold[1]) / (1 - hold[1]) * (1 - decisive);
    const played = fraction * (bars.length - 1);
    bars.forEach((bar, i) => bar.classList.toggle('is-played', i <= played));
    head.setAttribute('x1', x(fraction)); head.setAttribute('x2', x(fraction));
    dot.setAttribute('cx', x(fraction));
    const atMoment = progress >= hold[0] && progress < hold[1];
    peak.classList.toggle('is-now', atMoment);
    moment?.classList.toggle('is-now', atMoment);
    setClock(start + fraction * length);
  };
  render(0);

  // The bars rise once as the section arrives, then the scroll takes over.
  gsap.from(bars, { scaleY: 0, duration: .7, ease: 'power3.out', stagger: .006,
    scrollTrigger: { trigger: art, start: 'top 85%', once: true } });
  ScrollTrigger.create({
    trigger: art.closest('.replay-feature') || art, start: 'top 65%', end: 'bottom 35%', scrub: .4,
    onUpdate: self => render(self.progress),
  });
})();
