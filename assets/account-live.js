(() => {
  const en = document.documentElement.lang.startsWith('en');
  const t = (fr, english) => en ? english : fr;
  const config = window.STRATE_AUTH_CONFIG;
  const client = window.supabase.createClient(config.url, config.publishableKey);
  const login = () => location.replace('login.html');
  const message = text => { const el = document.querySelector('#account-status'); el.textContent = text; el.hidden = false; };
  client.auth.onAuthStateChange(event => { if (event === 'SIGNED_OUT') login(); });
  client.auth.getUser().then(({data:{user},error}) => {
    if (error || !user) { login(); return; }
    document.querySelector('#account-email').textContent = user.email;
    const rawName = user.user_metadata?.full_name;
    const name = typeof rawName === 'string' ? rawName.trim() : '';
    if (name) document.querySelector('#account-greeting').textContent = t('Bonjour, ', 'Hello, ') + name;
    document.querySelector('#account-loading').hidden = true;
    document.querySelector('#account-content').hidden = false;
    document.querySelector('#account-signout').onclick = async event => {
      event.target.disabled = true;
      const {error} = await client.auth.signOut({scope:'local'});
      if (error) { event.target.disabled = false; message(t('Déconnexion impossible. Réessayez.', 'Unable to sign out. Please try again.')); }
    };
    document.querySelector('#account-password-reset').onclick = async event => {
      const button = event.target; button.disabled = true;
      try {
        const prefix = document.documentElement.lang.toLowerCase() === 'en-gb' ? '/en-gb/' : en ? '/en/' : '/';
        const {error} = await client.auth.resetPasswordForEmail(user.email, {redirectTo:`https://strate.markets${prefix}login.html?mode=reset`});
        if (error) throw error;
        message(t('Consultez votre messagerie pour modifier votre mot de passe.', 'Check your inbox to change your password.'));
      } catch { message(t('Envoi impossible. Patientez puis réessayez.', 'Unable to send. Please wait and try again.')); }
      finally { button.disabled = false; }
    };
  }).catch(() => message(t('Connexion impossible. Actualisez la page.', 'Unable to connect. Refresh the page.')));
})();
