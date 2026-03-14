import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();

// 1. Configuración de CORS (Seguridad)
app.use(
  cors({
    origin: [
      "http://localhost:5173",                     
      "https://halcon-express-cotizador.vercel.app", 
      "https://halconexpress.site",                
      "https://www.halconexpress.site"             
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// --- RUTA PING PARA MANTENER EL SERVIDOR DESPIERTO ---
app.get("/ping", (req, res) => {
  res.status(200).send("Servidor Halcon Express activo");
});

// --- CONFIGURACIÓN ARCGIS ---
const ARCGIS_GEOCODE_URL = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates";
const ARCGIS_REVERSE_URL = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode";

// 1. BUSCAR DIRECCIÓN (Geocoding)
app.get("/geocode", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: "Falta dirección" });

    // MEJORA 1: Limpiar caracteres comunes como # y - que confunden a los mapas
    let direccionBusqueda = q.replace(/#/g, 'No').replace(/-/g, ' ');
    
    const texto = q.toLowerCase();
    // Asegurar que busque en Valledupar, Colombia
    if (!texto.includes("valledupar")) {
        direccionBusqueda = `${direccionBusqueda}, Valledupar, Cesar, Colombia`;
    }

    // MEJORA 2: Intentaremos usar Nominatim (OpenStreetMap) primero, es mejor para nomenclaturas en LATAM
    const nomUrl = new URL("https://nominatim.openstreetmap.org/search");
    nomUrl.searchParams.append("q", direccionBusqueda);
    nomUrl.searchParams.append("format", "json");
    nomUrl.searchParams.append("limit", "1");
    nomUrl.searchParams.append("countrycodes", "co");
    // Caja delimitadora aproximada para Valledupar para priorizar esa zona
    nomUrl.searchParams.append("viewbox", "-73.30,10.50,-73.20,10.40");
    nomUrl.searchParams.append("bounded", "1");

    let resultados = [];
    
    // TIEMPO LÍMITE: Si Nominatim tarda más de 1.5 segundos, lo cancelamos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    try {
        const nomRes = await fetch(nomUrl, { 
            headers: { 'User-Agent': 'HalconExpressCotizador/1.0' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const nomData = await nomRes.json();
        if (nomData && nomData.length > 0) {
            resultados = [{
                lat: parseFloat(nomData[0].lat),
                lon: parseFloat(nomData[0].lon),
                display_name: nomData[0].display_name
            }];
        }
    } catch(err) {
        clearTimeout(timeoutId);
        console.warn("Fallo o tardó Nominatim Geocode, usando ArcGIS rápido...");
    }

    // Fallback a ArcGIS si Nominatim no encuentra nada o tardó demasiado
    if (resultados.length === 0) {
        const url = new URL(ARCGIS_GEOCODE_URL);
        url.searchParams.append("f", "json");
        url.searchParams.append("singleLine", direccionBusqueda);
        url.searchParams.append("countryCode", "COL");
        url.searchParams.append("maxLocations", "1");

        const response = await fetch(url);
        const data = await response.json();

        if (data.candidates && data.candidates.length > 0) {
          const mejorCandidato = data.candidates[0];
          resultados = [{
            lat: mejorCandidato.location.y,
            lon: mejorCandidato.location.x,
            display_name: mejorCandidato.address
          }];
        }
    }

    res.json(resultados);
  } catch (e) {
    console.error("Error Geocode:", e);
    res.status(500).json({ error: "Error buscando dirección" });
  }
});

// 2. OBTENER DIRECCIÓN DESDE COORDENADAS (Reverse Geocoding)
app.get("/reverse-geocode", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "Faltan coordenadas" });

    // MEJORA 3: Usar Nominatim para reverse geocoding da direcciones más legibles
    const nomUrl = new URL("https://nominatim.openstreetmap.org/reverse");
    nomUrl.searchParams.append("lat", lat);
    nomUrl.searchParams.append("lon", lon);
    nomUrl.searchParams.append("format", "json");
    
    // TIEMPO LÍMITE: Si Nominatim tarda más de 1.5 segundos en iniciar, lo cancelamos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    try {
        const nomRes = await fetch(nomUrl, { 
            headers: { 'User-Agent': 'HalconExpressCotizador/1.0' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const nomData = await nomRes.json();
        if (nomData && nomData.display_name) {
            // Limpiar la dirección para no mostrar la ciudad o país repetidamente en el input
            const parts = nomData.display_name.split(',');
            return res.json({ address: parts.slice(0, 2).join(',').trim() });
        }
    } catch(err) {
        clearTimeout(timeoutId);
        console.warn("Fallo o tardó Nominatim Reverse, usando ArcGIS rápido...");
    }

    // Fallback ArcGIS: Es mucho más rápido, se usa si Nominatim se cuelga
    const url = new URL(ARCGIS_REVERSE_URL);
    url.searchParams.append("f", "json");
    url.searchParams.append("location", `${lon},${lat}`);
    url.searchParams.append("distance", "50");

    const response = await fetch(url);
    const data = await response.json();

    let direccion = "Ubicación en mapa";
    if (data.address) {
      direccion = data.address.LongLabel || data.address.Match_addr;
      // Limpiar un poco la respuesta de ArcGIS si es muy larga
      direccion = direccion.replace(", Valledupar, Cesar", "").replace(", COL", "");
    }
    res.json({ address: direccion });

  } catch (e) {
    console.error("Error Reverse:", e);
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
          preference: "shortest" // <--- MEJORA 4: Forzar a buscar la ruta más corta (distancia) en vez de la más rápida
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