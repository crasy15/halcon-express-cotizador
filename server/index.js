import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();

// 1. Configuración de CORS (Seguridad)
// IMPORTANTE: Aquí autorizamos quién puede pedir datos al servidor.
app.use(
  cors({
    origin: [
      "http://localhost:5173",                     // Tu entorno local
      "https://halcon-express-cotizador.vercel.app", // Tu entorno de pruebas (si lo usas)
      "https://halconexpress.site",                // ✅ TU NUEVO DOMINIO
      "https://www.halconexpress.site"             // ✅ TU NUEVO DOMINIO (con www)
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// --- CONFIGURACIÓN ARCGIS ---
const ARCGIS_GEOCODE_URL = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates";
const ARCGIS_REVERSE_URL = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode";

// 1. BUSCAR DIRECCIÓN (Geocoding)
app.get("/geocode", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: "Falta dirección" });

    // Truco: Forzar Valledupar si no se especifica
    let direccionBusqueda = q;
    const texto = q.toLowerCase();
    if (!texto.includes("valledupar") && !texto.includes("cesar")) {
        direccionBusqueda = `${q}, Valledupar, Cesar`;
    }

    const url = new URL(ARCGIS_GEOCODE_URL);
    url.searchParams.append("f", "json");
    url.searchParams.append("singleLine", direccionBusqueda);
    url.searchParams.append("countryCode", "COL");
    url.searchParams.append("maxLocations", "1");

    const response = await fetch(url);
    const data = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      const mejorCandidato = data.candidates[0];
      res.json([{
        lat: mejorCandidato.location.y,
        lon: mejorCandidato.location.x,
        display_name: mejorCandidato.address
      }]);
    } else {
      res.json([]);
    }
  } catch (e) {
    console.error("Error ArcGIS Geocode:", e);
    res.status(500).json({ error: "Error buscando dirección" });
  }
});

// 2. OBTENER DIRECCIÓN DESDE COORDENADAS (Reverse Geocoding)
app.get("/reverse-geocode", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "Faltan coordenadas" });

    const url = new URL(ARCGIS_REVERSE_URL);
    url.searchParams.append("f", "json");
    url.searchParams.append("location", `${lon},${lat}`);
    url.searchParams.append("distance", "50");

    const response = await fetch(url);
    const data = await response.json();

    let direccion = "Ubicación en mapa";
    if (data.address) {
      direccion = data.address.LongLabel || data.address.Match_addr;
    }
    res.json({ address: direccion });

  } catch (e) {
    console.error("Error ArcGIS Reverse:", e);
    res.status(500).json({ error: "Error obteniendo dirección" });
  }
});

// 3. CALCULAR RUTA (OpenRouteService)
app.post("/route", async (req, res) => {
  try {
    const { origin, destination } = req.body;
    const apiKey = process.env.ORS_API_KEY;

    if (!apiKey) return res.status(500).json({ error: "Falta API KEY" });

    const response = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      {
        method: "POST",
        headers: {
          "Authorization": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates: [[origin[1], origin[0]], [destination[1], destination[0]]],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) return res.status(500).json({ error: "Error en rutas" });

    const summary = data.features?.[0]?.properties?.summary;
    const routeCoords = data.features?.[0]?.geometry?.coordinates?.map(([lon, lat]) => [lat, lon]);

    res.json({
      distance_m: summary?.distance ?? 0,
      duration_s: summary?.duration ?? 0,
      routeCoords: routeCoords ?? [],
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error interno" });
  }
});

app.listen(3001, () => console.log("✅ Servidor listo en puerto 3001"));