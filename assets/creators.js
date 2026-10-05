/* Creator program: a commission estimate in the visitor's currency, and an
   application form preview that never sends or stores what is typed. */
(() => {
  const en = document.documentElement.lang.startsWith('en');

  const simulator = document.querySelector('.commission-simulator');
  if (simulator) {
    const range = simulator.querySelector('input[type=range]');
    const count = simulator.querySelector('.simulator-count');
    const results = Object.fromEntries([...simulator.querySelectorAll('[data-result]')].map(item => [item.dataset.result, item]));
    // Monthly subscription excluding tax: euro and sterling prices include 20 % VAT.
    const net = { EUR: 49.90 / 1.2, GBP: 49.90 / 1.2, USD: 49.90 };
    const update = () => {
      // Each edition has its currency: euros in French, pounds in British English, dollars in American English.
      const locale = { fr: 'fr-FR', 'en-GB': 'en-GB' }[document.documentElement.lang] || 'en-US';
      const currency = { 'fr-FR': 'EUR', 'en-GB': 'GBP' }[locale] || 'USD';
      const money = value => {
        const digits = value >= 1000 ? 0 : 2;
        return new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
      };
      const subscribers = Number(range.value);
      const first = subscribers * net[currency] * .5;
      const monthly = subscribers * net[currency] * .3;
      count.textContent = new Intl.NumberFormat(locale).format(subscribers);
      results.first.textContent = money(first);
      results.monthly.textContent = money(monthly);
      results.year.textContent = money(first + monthly * 11);
      range.style.setProperty('--fill', `${(subscribers - range.min) / (range.max - range.min) * 100}%`);
      range.setAttribute('aria-valuetext', en ? `${subscribers} subscribers` : `${subscribers} abonnés`);
    };
    range.addEventListener('input', update);
    update();
  }

  const form = document.querySelector('.creator-form');
  if (form) {
    const status = form.querySelector('.creator-status');
    const code = form.querySelector('#creator-code');
    code.addEventListener('input', () => { code.value = code.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
    form.addEventListener('input', () => { status.hidden = true; });
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      status.textContent = en
        ? 'This is a preview. Applications will open soon. No information has been sent or saved.'
        : 'Ceci est un aperçu. Les candidatures ouvriront prochainement. Aucune information n’a été envoyée ou enregistrée.';
      status.hidden = false;
      status.focus({ preventScroll: true });
    });
    // Disabled HTML prevents a native submission when JavaScript is unavailable.
    form.querySelector('fieldset').disabled = false;
  }
})();
