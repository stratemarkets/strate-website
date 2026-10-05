/* Creator dashboard preview: copy the code or the sharing message, and explain that
   account actions are not available yet. Nothing is sent or stored. */
(() => {
  const en = document.documentElement.lang.startsWith('en');
  const status = document.querySelector('.dash-status-message');
  let timer;
  const announce = message => {
    status.textContent = message;
    status.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => { status.hidden = true; }, 4000);
  };

  document.querySelectorAll('[data-copy], [data-copy-from]').forEach(button => button.addEventListener('click', async () => {
    const source = button.dataset.copyFrom ? document.getElementById(button.dataset.copyFrom).textContent : button.dataset.copy;
    const label = button.textContent;
    try {
      await navigator.clipboard.writeText(source.trim());
      button.textContent = en ? 'Copied' : 'Copié';
      button.classList.add('is-done');
      setTimeout(() => { button.textContent = label; button.classList.remove('is-done'); }, 1800);
    } catch {
      announce(en ? 'Copying is unavailable in this browser. Select the text to copy it.' : 'La copie est indisponible dans ce navigateur. Sélectionnez le texte pour le copier.');
    }
  }));

  document.querySelectorAll('[data-preview]').forEach(button => button.addEventListener('click', () => announce(en
    ? 'This is a preview. This action will be available when the Creator Program opens.'
    : 'Ceci est un aperçu. Cette action sera disponible à l’ouverture du programme créateurs.')));

  // Touch screens have no hover: a tap shows a column's tooltip through focus.
  document.querySelectorAll('.dash-bar').forEach(bar => bar.addEventListener('click', () => bar.focus()));
})();
