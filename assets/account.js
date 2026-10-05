/* Customer account: the download panel opens on the visitor's own system.
   Copy and preview actions come from dashboard.js. */
(() => {
  const buttons = [...document.querySelectorAll('.acct-os button')];
  if (!buttons.length) return;
  const show = os => {
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.os === os)));
    document.querySelectorAll('[data-os-panel]').forEach(panel => { panel.hidden = panel.dataset.osPanel !== os; });
  };
  buttons.forEach(button => button.addEventListener('click', () => show(button.dataset.os)));
  const platform = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent;
  if (/win/i.test(platform)) show('windows');
})();
