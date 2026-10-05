/* Runs in the head: page titles wait hidden for motion.js, unless motion is reduced.
   A CSS fail-safe shows them anyway if the animation scripts never run. */
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('motion');
