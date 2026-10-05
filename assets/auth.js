/* Supabase owns credentials and sessions. User metadata never grants a licence. */
(() => {
  const en = document.documentElement.lang.startsWith('en');
  const t = (fr, english) => en ? english : fr;
  const form = document.querySelector('.auth-form'), status = document.querySelector('.auth-status');
  const fieldset = form.querySelector('fieldset'), submit = form.querySelector('.auth-submit');
  const input = id => document.getElementById('account-' + id);
  let mode = form.dataset.mode, busy = false, client;
  const announce = message => { status.textContent = message; status.hidden = false; status.focus({preventScroll:true}); };
  const go = page => location.replace(new URL(page, location.href).href);
  function redirect(reset = false) {
    const folder = document.documentElement.lang.toLowerCase() === 'en-gb' ? '/en-gb/' : en ? '/en/' : '/';
    return `https://strate.markets${folder}login.html${reset ? '?mode=reset' : ''}`;
  }
  function errorText(error) {
    if (error?.code === 'invalid_credentials') return t('Adresse e-mail ou mot de passe incorrect.', 'Incorrect email address or password.');
    if (error?.code === 'email_not_confirmed') return t('Confirmez votre adresse e-mail avant de vous connecter.', 'Confirm your email address before signing in.');
    if (error?.code === 'weak_password') return t('Choisissez un mot de passe plus robuste, avec au moins 8 caractères.', 'Choose a stronger password with at least 8 characters.');
    if (error?.status === 429 || error?.code?.includes('rate_limit')) return t('Trop de tentatives. Patientez avant de réessayer.', 'Too many attempts. Please wait before trying again.');
    return t('Impossible de terminer cette demande. Vérifiez votre connexion et réessayez.', 'Unable to complete this request. Check your connection and try again.');
  }
  function setMode(next) {
    mode = next;
    const reset = next === 'reset';
    document.querySelector('#auth-title').textContent = reset ? t('Nouveau mot de passe', 'New password') : t('Mot de passe oublié', 'Forgot password');
    document.querySelector('.auth-intro').textContent = reset ? t('Choisissez votre nouveau mot de passe.', 'Choose your new password.') : t('Recevez un lien de récupération par e-mail.', 'Receive a recovery link by email.');
    input('email').closest('.auth-field').hidden = reset;
    input('email').required = !reset;
    input('password').closest('.auth-field').hidden = !reset;
    input('password').required = reset;
    input('password').minLength = 8;
    input('password').autocomplete = 'new-password';
    submit.textContent = reset ? t('Enregistrer le mot de passe', 'Save password') : t('Envoyer le lien', 'Send recovery link');
    document.querySelector('.auth-recovery').hidden = true;
  }
  form.addEventListener('input', () => { input('confirm')?.setCustomValidity(''); status.hidden = true; });
  document.querySelectorAll('.password-toggle').forEach(button => button.addEventListener('click', () => {
    const field = document.getElementById(button.getAttribute('aria-controls')), show = field.type === 'password';
    field.type = show ? 'text' : 'password'; button.setAttribute('aria-pressed', String(show));
    button.textContent = show ? t('Masquer', 'Hide') : t('Afficher', 'Show');
  }));
  document.querySelector('.auth-recovery')?.addEventListener('click', () => setMode('recover'));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    input('confirm')?.setCustomValidity(input('confirm').value !== input('password').value ? t('Les mots de passe ne correspondent pas.', 'The passwords do not match.') : '');
    if (!client || busy || !form.reportValidity()) return;
    busy = true; fieldset.disabled = true; form.setAttribute('aria-busy','true');
    try {
      const email = input('email')?.value.trim(), password = input('password')?.value;
      let result;
      if (mode === 'signup') {
        result = await client.auth.signUp({email, password, options:{emailRedirectTo:redirect(), data:{
          full_name:input('name').value.trim(), locale:document.documentElement.lang, creator_code:input('creator').value.trim()
        }}});
        if (result.error) throw result.error;
        form.reset();
        if (result.data.session) go('account.html');
        else announce(t('Consultez votre messagerie pour confirmer votre inscription. Si vous avez déjà un compte, connectez-vous ou réinitialisez votre mot de passe.', 'Check your inbox to confirm your registration. If you already have an account, sign in or reset your password.'));
      } else if (mode === 'login') {
        result = await client.auth.signInWithPassword({email,password});
        if (result.error) throw result.error;
        go('account.html');
      } else if (mode === 'recover') {
        result = await client.auth.resetPasswordForEmail(email,{redirectTo:redirect(true)});
        if (result.error) throw result.error;
        announce(t('Si un compte correspond à cette adresse, vous recevrez un lien de récupération.', 'If an account matches this address, you will receive a recovery link.'));
      } else if (mode === 'reset') {
        result = await client.auth.updateUser({password});
        if (result.error) throw result.error;
        form.reset(); go('account.html');
      } else if (mode === 'account') {
        result = await client.auth.signOut({scope:'local'});
        if (result.error) throw result.error;
        go('login.html');
      }
    } catch(error) { announce(errorText(error)); }
    finally { busy = false; fieldset.disabled = false; form.removeAttribute('aria-busy'); }
  });
  async function init() {
    if (location.protocol === 'file:') throw new Error('http_required');
    const config = window.STRATE_AUTH_CONFIG, hash = new URLSearchParams(location.hash.slice(1));
    const reset = hash.get('type') === 'recovery' || new URLSearchParams(location.search).get('mode') === 'reset';
    const invalid = hash.has('error') || new URLSearchParams(location.search).has('error');
    client = window.supabase.createClient(config.url,config.publishableKey);
    client.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT' && mode === 'account' && !busy) go('login.html');
      if (event === 'PASSWORD_RECOVERY' && mode === 'login') setMode('reset');
    });
    const {error:sessionError} = await client.auth.getSession();
    if (location.hash || invalid) history.replaceState(null,'',location.pathname + (reset ? '?mode=reset' : ''));
    if (invalid || sessionError) throw new Error('invalid_link');
    if (reset && mode === 'login') setMode('reset');
    const {data:{user},error} = await client.auth.getUser();
    if (mode === 'account') {
      if (!user || error) { go('login.html'); return; }
      document.querySelector('.auth-intro').textContent = user.email;
    } else if (mode === 'reset') {
      if (!user || error) throw new Error('invalid_link');
    } else if (user && !error) { go('account.html'); return; }
    fieldset.disabled = false;
  }
  init().catch(error => {
    announce(error.message === 'http_required' ? t('Ouvrez cette page sur strate.markets pour accéder à votre compte.', 'Open this page on strate.markets to access your account.')
      : error.message === 'invalid_link' ? t('Ce lien est invalide ou expiré. Revenez à la connexion pour demander un nouveau lien.', 'This link is invalid or expired. Return to sign-in to request a new link.') : errorText(error));
    const back = document.createElement('a'); back.href = 'login.html'; back.className = 'line-link';
    back.textContent = t('Retour à la connexion', 'Back to sign-in'); status.append(document.createElement('br'),back);
  });
})();
