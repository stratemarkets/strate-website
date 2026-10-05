/* Interface preview only: never send or store form values. */
(() => {
  const en = document.documentElement.lang.startsWith('en');
  const form = document.querySelector('.auth-form');
  const status = document.querySelector('.auth-status');
  const password = document.querySelector('#account-password');
  const confirm = document.querySelector('#account-confirm');
  function announce(message) {
    status.textContent = message;
    status.hidden = false;
    status.focus({ preventScroll: true });
  }
  function validateConfirmation() {
    confirm?.setCustomValidity(confirm.value && confirm.value !== password.value
      ? (en ? 'The passwords do not match.' : 'Les mots de passe ne correspondent pas.') : '');
  }
  form.addEventListener('input', () => {
    validateConfirmation();
    status.hidden = true;
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    validateConfirmation();
    if (!form.reportValidity()) return;
    announce(en
      ? 'This is a preview. Sign-in and account creation are not available yet. No information has been sent or saved.'
      : 'Ceci est un aperçu. La connexion et la création de compte ne sont pas encore disponibles. Aucune information n’a été envoyée ou enregistrée.');
  });
  document.querySelectorAll('.password-toggle').forEach(button => button.addEventListener('click', () => {
    const input = document.getElementById(button.getAttribute('aria-controls'));
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(show));
    button.textContent = show ? (en ? 'Hide' : 'Masquer') : (en ? 'Show' : 'Afficher');
  }));
  document.querySelector('.auth-recovery')?.addEventListener('click', () => announce(en
    ? 'Password recovery will be available when Strate accounts launch.'
    : 'La récupération du mot de passe sera disponible à l’ouverture des comptes Strate.'));
  // Disabled HTML prevents any accidental submission when JavaScript is unavailable.
  form.querySelector('fieldset').disabled = false;
})();
