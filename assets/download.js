/* Download page: highlights the installer for the visitor's system, and sends
   the beta key request (email address) to the Edge Function beta-key, which
   emails the key. The key itself never reaches the page. */
(() => {
  const platform = (navigator.userAgentData?.platform || navigator.platform || navigator.userAgent).toLowerCase();
  const os = platform.includes('mac') ? 'mac' : platform.includes('win') ? 'windows' : null;
  const match = os && document.querySelector(`.release-file[data-os="${os}"]`);
  if (match) {
    match.classList.add('is-suggested');
    match.parentElement.prepend(match);
  }

  const form = document.querySelector('.key-form');
  if (!form) return;
  const input = form.querySelector('input[type="email"]');
  const button = form.querySelector('.key-submit');
  const lang = document.documentElement.lang.toLowerCase();
  const locale = lang === 'en-gb' ? 'en-gb' : lang.startsWith('en') ? 'en' : 'fr';
  const show = name => {
    form.querySelectorAll('.key-message').forEach(message => { message.hidden = message.dataset.message !== name; });
    form.classList.toggle('is-sent', name === 'sent');
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const email = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { show('email'); input.focus(); return; }
    button.disabled = true;
    try {
      const response = await fetch(form.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale, news: form.elements.news.checked, website: form.elements.website.value }),
      });
      const result = await response.json().catch(() => ({}));
      show(response.ok ? 'sent' : result.error === 'email' ? 'email' : result.error === 'unavailable' ? 'unavailable' : 'error');
    } catch {
      show('error');
    } finally {
      button.disabled = false;
    }
  });
})();
