import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

// 1. GEOCODING (Dirección -> Coordenadas)
app.get("/geocode", async (req, res) => {
  try {
    let q = req.query.q;
    if (!q) return res.status(400).json({ error: "Falta la dirección" });

    // --- TRUCO IMPORTANTE ---
    // Si el usuario no escribió "Valledupar", nosotros lo agregamos automáticamente.
    // Así "Calle 12" se convierte en "Calle 12, Valledupar, Colombia"
    const textoBusqueda = q.toLowerCase();
    if (!textoBusqueda.includes("valledupar") && !textoBusqueda.includes("cesar")) {
        q = `${q}, Valledupar, Cesar, Colombia`;
    }
    // ------------------------

    // Agregamos 'countrycodes=co' para limitar la búsqueda a Colombia
    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=co&q=${encodeURIComponent(q)}&limit=1`;

    const response = await fetch(url, {
      headers: { "User-Agent": "halcon-express-cotizador/1.0" },
    });

    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error buscando dirección" });
  }
});

// 2. REVERSE GEOCODING (Coordenadas -> Dirección)
app.get("/reverse-geocode", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "Faltan coordenadas" });

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

    const response = await fetch(url, {
      headers: { "User-Agent": "halcon-express-cotizador/1.0" },
    });

    const data = await response.json();
    
    // Limpiamos la dirección para que no sea tan larga
    let direccion = data.display_name || "Ubicación en mapa";
    // Quitamos el país y códigos postales para que se vea mejor
    direccion = direccion.split(", Valledupar")[0]; 

    res.json({ address: direccion });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error obteniendo dirección" });
  }
});

// 3. RUTAS (Cálculo de Km y Tiempo)
app.post("/route", async (req, res) => {
  try {
    const { origin, destination } = req.body;
    
    // Tu API KEY de OpenRouteService debe estar en el archivo .env
    const apiKey = process.env.ORS_API_KEY; 
    
    if (!apiKey) {
        console.error("Falta la API KEY en el archivo .env");
        return res.status(500).json({ error: "Error de configuración del servidor" });
    }

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

    if (!response.ok) {
        return res.status(500).json({ error: "Error calculando ruta", details: data });
    }

    const summary = data.features?.[0]?.properties?.summary;
    const routeCoords = data.features?.[0]?.geometry?.coordinates?.map(([lon, lat]) => [lat, lon]);

    res.json({
      distance_m: summary?.distance ?? 0,
      duration_s: summary?.duration ?? 0,
      routeCoords: routeCoords ?? [],
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.listen(3001, () => console.log("✅ Servidor Halcón LISTO en puerto 3001"));