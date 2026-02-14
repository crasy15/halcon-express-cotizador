import { CONFIG } from '../config';

// Buscar coordenadas a partir de texto (Geocoding)
export const geocode = async (texto) => {
  try {
    const res = await fetch(`${CONFIG.API.URL_BASE}/geocode?q=${encodeURIComponent(texto)}`);
    return await res.json();
  } catch (error) {
    console.error("Error en geocode:", error);
    return [];
  }
};

// Buscar dirección a partir de coordenadas (Reverse Geocoding)
export const reverseGeocode = async (lat, lon) => {
  try {
    const res = await fetch(`${CONFIG.API.URL_BASE}/reverse-geocode?lat=${lat}&lon=${lon}`);
    return await res.json();
  } catch (error) {
    console.error("Error en reverse-geocode:", error);
    // Retornamos un objeto vacío o nulo controlado para no romper la app
    return { address: null };
  }
};

// Obtener la ruta y cálculos entre dos puntos
export const getRoute = async (origin, destination) => {
  try {
    const res = await fetch(`${CONFIG.API.URL_BASE}/route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination }),
    });
    
    if (res.ok) {
      return await res.json();
    }
    return null;
  } catch (error) {
    console.error("Error calculando ruta:", error);
    return null;
  }
};