/* Cookie consent, following the CNIL rules: refusing is as easy as accepting,
   nothing optional is stored before a choice, and the choice can be changed at any
   time ("Manage cookies" in the footer). The choice is kept 6 months in a
   first-party cookie. Future tools wait for consent:
     window.strateConsent.allows('analytics') / .allows('marketing')
     document.addEventListener('strate:consent', event => event.detail) */
(() => {
  const NAME = 'strate_consent';
  const MAX_AGE = 60 * 60 * 24 * 182;
  const en = document.documentElement.lang.startsWith('en');
  const policy = en ? 'privacy.html#cookies' : 'confidentialite.html#cookies';
  const text = en ? {
    title: 'This site uses cookies.',
    body: `We use cookies that the site needs to work and, with your consent, cookies to understand how it is used and to measure our marketing. Choose <button type="button" class="consent-link" data-consent="manage">Manage cookies</button> to set your preferences at any time. See our <a href="${policy}">privacy policy</a> for more information.`,
    manage: 'Manage cookies', refuse: 'Reject non-essential cookies', accept: 'Accept all',
    panel: 'Cookie preferences', save: 'Save my choices', close: 'Close',
    categories: [
      ['essential', 'Essential', 'Needed for the site to work, such as keeping you signed in and remembering this choice. Always on.'],
      ['analytics', 'Audience measurement', 'Anonymous statistics on visits, to improve the site.'],
      ['marketing', 'Marketing', 'Measuring the performance of our advertising campaigns.'],
    ],
  } : {
    title: 'Ce site utilise des cookies.',
    body: `Nous utilisons des cookies nécessaires au fonctionnement du site et, avec votre accord, des cookies pour comprendre son utilisation et mesurer nos actions marketing. Choisissez <button type="button" class="consent-link" data-consent="manage">Gérer les cookies</button> pour modifier vos préférences à tout moment. Consultez notre <a href="${policy}">politique de confidentialité</a> pour plus d’informations.`,
    manage: 'Gérer les cookies', refuse: 'Refuser les cookies non essentiels', accept: 'Tout accepter',
    panel: 'Préférences en matière de cookies', save: 'Enregistrer mes choix', close: 'Fermer',
    categories: [
      ['essential', 'Essentiels', 'Nécessaires au fonctionnement du site, comme le maintien de votre connexion et la mémorisation de ce choix. Toujours actifs.'],
      ['analytics', 'Mesure d’audience', 'Statistiques anonymes de fréquentation, pour améliorer le site.'],
      ['marketing', 'Marketing', 'Mesure de l’efficacité de nos campagnes publicitaires.'],
    ],
  };

  const read = () => {
    const raw = document.cookie.split('; ').find(item => item.startsWith(`${NAME}=`));
    if (!raw) return null;
    try { return JSON.parse(decodeURIComponent(raw.slice(NAME.length + 1))); } catch { return null; }
  };
  let consent = read();
  const save = choices => {
    consent = { analytics: !!choices.analytics, marketing: !!choices.marketing, date: new Date().toISOString(), version: 1 };
    document.cookie = `${NAME}=${encodeURIComponent(JSON.stringify(consent))}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    document.dispatchEvent(new CustomEvent('strate:consent', { detail: consent }));
    hideBanner();
  };
  window.strateConsent = { allows: category => category === 'essential' || !!consent?.[category], get: () => consent, open: () => openPanel() };

  // Banner.
  const banner = document.createElement('section');
  banner.className = 'consent-banner';
  banner.setAttribute('aria-label', text.panel);
  banner.innerHTML = `<div class="consent-copy"><h2>${text.title}</h2><p>${text.body}</p></div>
    <div class="consent-actions"><button type="button" data-consent="manage">${text.manage}</button><button type="button" data-consent="refuse">${text.refuse}</button><button type="button" data-consent="accept">${text.accept}</button></div>`;
  const hideBanner = () => {
    if (!banner.isConnected) return;
    banner.classList.add('is-leaving');
    setTimeout(() => banner.remove(), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 260);
  };

  // Preferences panel.
  const panel = document.createElement('dialog');
  panel.className = 'consent-panel';
  panel.setAttribute('aria-labelledby', 'consent-panel-title');
  panel.innerHTML = `<div class="consent-panel-head"><h2 id="consent-panel-title">${text.panel}</h2><button type="button" class="consent-close" aria-label="${text.close}"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div>
    <ul class="consent-categories">${text.categories.map(([key, name, description]) => `<li><div><h3 id="consent-${key}-name">${name}</h3><p>${description}</p></div><label class="consent-switch"><input type="checkbox" data-category="${key}" aria-labelledby="consent-${key}-name" ${key === 'essential' ? 'checked disabled' : ''}><span aria-hidden="true"></span></label></li>`).join('')}</ul>
    <div class="consent-actions"><button type="button" data-consent="refuse">${text.refuse}</button><button type="button" data-consent="accept">${text.accept}</button><button type="button" data-consent="save" class="is-primary">${text.save}</button></div>`;
  const openPanel = () => {
    panel.querySelectorAll('[data-category]:not(:disabled)').forEach(box => { box.checked = !!consent?.[box.dataset.category]; });
    if (!panel.open) panel.showModal();
  };

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-consent], [data-cookie-settings]');
    if (!trigger) return;
    const action = trigger.dataset.consent || 'manage';
    if (trigger.hasAttribute('data-cookie-settings')) event.preventDefault();
    if (action === 'manage') openPanel();
    if (action === 'refuse') { save({}); panel.close(); }
    if (action === 'accept') { save({ analytics: true, marketing: true }); panel.close(); }
    if (action === 'save') {
      const choices = Object.fromEntries([...panel.querySelectorAll('[data-category]:not(:disabled)')].map(box => [box.dataset.category, box.checked]));
      save(choices); panel.close();
    }
  });
  panel.querySelector('.consent-close').addEventListener('click', () => panel.close());
  panel.addEventListener('click', event => { if (event.target === panel) panel.close(); });

  const mount = () => {
    document.body.append(panel);
    if (!consent) document.body.append(banner);
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', mount) : mount();
})();
