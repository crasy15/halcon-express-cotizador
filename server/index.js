import express from "express";
import cors from "cors";
import "dotenv/config";


const app = express();
app.use(cors());
app.use(express.json());

app.get("/geocode", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: "Missing q" });

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      q
    )}&limit=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "halcon-express-cotizador/1.0 (contacto@tudominio.com)",
      },
    });

    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "geocode_failed" });
  }
});

app.post("/route", async (req, res) => {
  try {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: "Missing origin/destination" });
    }

    const apiKey = process.env.ORS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "ORS_API_KEY not set in server/.env" });
    }

    // ORS espera [lon, lat]
    const body = {
      coordinates: [
        [origin[1], origin[0]],
        [destination[1], destination[0]],
      ],
    };

    const response = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      {
        method: "POST",
        headers: {
          "Authorization": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: "ORS error", details: data });
    }

    // GeoJSON trae geometry.coordinates => [[lon,lat],[lon,lat],...]
    // distancia en metros y duración en segundos:
    const summary = data.features?.[0]?.properties?.summary;

    const routeCoords = data.features?.[0]?.geometry?.coordinates?.map(
      ([lon, lat]) => [lat, lon] // convertimos a [lat,lon] para Leaflet
    );

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


app.listen(3001, () => console.log("✅ Backend listo en http://localhost:3001"));
