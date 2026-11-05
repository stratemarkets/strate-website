/* Download page: highlights the installer for the visitor's system and copies
   the temporary access key. */
(() => {
  const platform = (navigator.userAgentData?.platform || navigator.platform || navigator.userAgent).toLowerCase();
  const os = platform.includes('mac') ? 'mac' : platform.includes('win') ? 'windows' : null;
  const match = os && document.querySelector(`.release-file[data-os="${os}"]`);
  if (match) {
    match.classList.add('is-suggested');
    match.parentElement.prepend(match);
  }

  const button = document.querySelector('.key-copy');
  if (button) {
    const label = button.textContent, en = document.documentElement.lang.startsWith('en');
    button.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(document.querySelector('.key-value').textContent.trim()); button.textContent = en ? 'Copied' : 'Copiée'; }
      catch { button.textContent = en ? 'Press Ctrl+C' : 'Faites Ctrl+C'; }
      setTimeout(() => { button.textContent = label; }, 1600);
    });
  }
})();
