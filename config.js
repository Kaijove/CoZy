/*
  SkyMood — configuración de claves de API personales.

  Este archivo se carga antes que script.js y expone window.SKYMOOD_CONFIG.
  Si no existe o no tiene una clave, la app usa automáticamente 'DEMO_KEY'
  (funciona, pero con muy pocas peticiones por hora).

  ⚠️ Si vas a subir este proyecto a un repositorio PÚBLICO de GitHub,
  añade "config.js" a tu .gitignore antes de hacer commit, y sube en su
  lugar config.example.js (con un valor de ejemplo) para que quien clone
  el repo sepa cómo configurar su propia clave.
*/
window.SKYMOOD_CONFIG = {
  // Clave gratuita de https://api.nasa.gov — usada por el widget "Descubrimiento del día"
  nasaApiKey: 'YPhspEVNpEB8vHuOPDdRkdy1rv473YTe69CKNZA0'
};
