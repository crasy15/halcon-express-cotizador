import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

// 1. Convertir Dirección -> Coordenadas (GEOCODING INTELIGENTE)
app.get("/geocode", async (req, res) => {
  try {
    let q = req.query.q;
    if (!q) return res.status(400).json({ error: "Missing q" });

    // --- TRUCO: Forzar búsqueda en Valledupar ---
    // Si el usuario no escribió "Valledupar", nosotros lo agregamos.
    const texto = q.toLowerCase();
    if (!texto.includes("valledupar") && !texto.includes("cesar")) {
        q = `${q}, Valledupar, Cesar, Colombia`;
    }
    // -------------------------------------------

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      q
    )}&limit=1`;

    const response = await fetch(url, {
      headers: { "User-Agent": "halcon-express/1.0" },
    });

    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "geocode_failed" });
  }
});

// 2. Convertir Coordenadas -> Dirección (Para cuando tocas el mapa)
app.get("/reverse-geocode", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "Faltan coordenadas" });

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

    const response = await fetch(url, {
      headers: { "User-Agent": "halcon-express/1.0" },
    });

    const data = await response.json();
    
    // Limpieza de dirección para que se vea bonita (opcional)
    let direccion = data.display_name || "Dirección desconocida";
    // Intentar acortarla quitando ", Colombia" para que quepa mejor
    direccion = direccion.replace(", Colombia", ""); 

    res.json({ address: direccion });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "reverse_geocode_failed" });
  }
});

// 3. Calcular Ruta
app.post("/route", async (req, res) => {
  try {
    const { origin, destination } = req.body;
    if (!origin || !destination) return res.status(400).json({ error: "Missing info" });

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
    if (!response.ok) return res.status(response.status).json({ error: "ORS error", details: data });

    const summary = data.features?.[0]?.properties?.summary;
    const routeCoords = data.features?.[0]?.geometry?.coordinates?.map(([lon, lat]) => [lat, lon]);

    res.json({
      distance_m: summary?.distance ?? null,
      duration_s: summary?.duration ?? null,
      routeCoords: routeCoords ?? [],
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "route_failed" });
  }
});

app.listen(3001, () => console.log("✅ Servidor Halcón mejorado en puerto 3001"));