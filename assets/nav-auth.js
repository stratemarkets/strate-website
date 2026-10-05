(() => {
  const config = window.STRATE_AUTH_CONFIG;
  if (!config || !window.supabase || location.protocol === 'file:') return;
  const client = window.supabase.createClient(config.url,config.publishableKey);
  const en = document.documentElement.lang.startsWith('en');
  function render(user) {
    document.querySelectorAll('.header-login').forEach(link => {
      link.textContent = user ? (en ? 'My account' : 'Mon compte') : (en ? 'Login' : 'Connexion');
      link.href = user ? 'account.html' : 'login.html';
    });
  }
  client.auth.getUser().then(({data:{user}}) => render(user)).catch(() => render(null));
  client.auth.onAuthStateChange((event,session) => render(session?.user));
})();
