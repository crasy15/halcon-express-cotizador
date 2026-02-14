export const CONFIG = {


  // Información de contacto
  WHATSAPP: {
    NUMERO: "573156777316", // Se cambia aquí y se actualiza en todo lado
    MENSAJE_SALUDO: "🦅 *Halcón Express - Solicitud*",
  },

  // Configuración de Precios Base (Tarifas)
  PRECIOS: {
    MINIMA: 5000,           // 1km - 4.9km
    INTERMEDIA: 6000,       // 5km - 5.9km
    LARGA: 7000,            // 6km - 8.5km
    EXTRA_LARGA: 8000,      // > 8.5km
  },

  // Valores de los Adicionales (Extras)
  EXTRAS: {
    NOCTURNO: 1000,
    LLUVIA: 2000,
    BARRIO_COMPLEJO: 3000,
  },

  // Configuración de Velocidad para estimar tiempos (en km/h)
  VELOCIDAD: {
    URBANA_MIN: 30,  //Velocidad con tráfico (Tiempo Máximo)
    URBANA_MAX: 50,  //Velocidad sin tráfico (Tiempo Mínimo)
    FACTOR_TRAFICO: 1.30, //factor multiplicador para ajustar tiempos por tráfico 
  },


  // Configuración de la API (Backend)
  API: {
    URL_BASE: "https://halcon-express-cotizador.onrender.com", // Fácil de cambiar si mudas el servidor
  }
};