// Download buttons open the site's download page in the visitor's language
// (the demo sits in an iframe on the home page, so the referrer is that page).
window.STRATE_DEMO_CONFIG = {
  lienTelechargement: document.documentElement.lang === 'fr' ? 'https://strate.markets/telecharger.html'
    : /\/en-gb\//.test(document.referrer) ? 'https://strate.markets/en-gb/download.html'
    : 'https://strate.markets/en/download.html',
  ouvrirLien: "_top",
  lecture: "visible",
  carnetEnArrierePlan: true,
  langue: "en"
};
