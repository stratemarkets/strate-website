/* Home page, loaded in the head without defer: marks html.has-demo before the
   first paint when the demo can run (served over http), so on wide screens the
   film is never shown before the demo replaces it (see hero.css, hero-demo.js). */
if (location.protocol !== 'file:') document.documentElement.classList.add('has-demo');
