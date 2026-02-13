import { useState } from "react";
import Mapa from "./components/Mapa";


export default function App() {
  // 1️⃣ Creamos estado
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [datos, setDatos] = useState(null);
  const [origenCoords, setOrigenCoords] = useState(null);
  const [destinoCoords, setDestinoCoords] = useState(null);
  const [distancia, setDistancia] = useState(null);
  const [precio, setPrecio] = useState(null);
  const [rutaCoords, setRutaCoords] = useState(null);
  const [tiempoMin, setTiempoMin] = useState(null);
  const [despues9pm, setDespues9pm] = useState(false);
  const [lloviendo, setLloviendo] = useState(false);
  const [barrioComplejo, setBarrioComplejo] = useState(false);
  const [precioBase, setPrecioBase] = useState(null);
  const [modoSeleccion, setModoSeleccion] = useState("origen"); // "origen" o "destino"
  


  


  

  // 2️⃣ Función cuando se presiona el botón
  const calcular = async () => {
  try {
    if (!origen.trim() || !destino.trim()) {
      alert("Escribe origen y destino.");
      return;
    }

    const buscarCoords = async (texto) => {
      const q = encodeURIComponent(texto);
      const res = await fetch(`http://localhost:3001/geocode?q=${q}`);
      const data = await res.json();

      if (!data.length) return null;
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    };

    const coordsOrigen = await buscarCoords(origen);
    if (!coordsOrigen) {
      alert("No encontré el ORIGEN. Prueba algo más específico (ej: 'Valledupar, Cesar').");
      return;
    }

    const coordsDestino = await buscarCoords(destino);
    if (!coordsDestino) {
      alert("No encontré el DESTINO. Prueba algo más específico.");
      return;
    }

    console.log("OK coords:", { coordsOrigen, coordsDestino });

    setOrigenCoords(coordsOrigen);
    setDestinoCoords(coordsDestino);

    // ✅ Pedir ruta real
    const resRuta = await fetch("http://localhost:3001/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: coordsOrigen,
        destination: coordsDestino,
      }),
    });

    const dataRuta = await resRuta.json();

    if (!resRuta.ok) {
      console.error("ORS error:", dataRuta);
      alert("Error calculando ruta real. Mira consola.");
      return;
    }

    // ✅ calcular km y minutos
    const kmReales = dataRuta.distance_m / 1000;
    const minutos = dataRuta.duration_s / 60;

    // ✅ guardar ruta y métricas
    setRutaCoords(dataRuta.routeCoords);
    setDistancia(kmReales.toFixed(2));
    setTiempoMin(minutos.toFixed(0));

    // ✅ precio por TABLA + extras
    const extras = { despues9pm, lloviendo, barrioComplejo };
    const { base, total } = calcularPrecio(kmReales, extras);

    setPrecioBase(base);
    setPrecio(total);
  } catch (error) {
    console.error("Error buscando direcciones:", error);
    alert("Error consultando direcciones. Revisa la consola (F12).");
  }
};




function calcularPrecio(km, extras) {
  // Si es menor a 1km, igual cobramos la mínima (ajústalo si quieres)
  const d = Math.max(km, 1);

  let base = 0;

  if (d >= 1 && d <= 4.9) base = 5000;
  else if (d >= 5 && d <= 5.9) base = 6000;
  else if (d >= 6 && d <= 8.5) base = 7000;
  else if (d > 8.5) base = 8000;

  let total = base;

  if (extras?.despues9pm) total += 1000;
  if (extras?.lloviendo) total += 2000;
  if (extras?.barrioComplejo) total += 3000;

  return { base, total };
}


const recalcularRutaConCoords = async (nuevoOrigen, nuevoDestino) => {
  const resRuta = await fetch("http://localhost:3001/route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      origin: nuevoOrigen,
      destination: nuevoDestino,
    }),
  });

  const dataRuta = await resRuta.json();

  if (!resRuta.ok) {
    console.error("ORS error:", dataRuta);
    alert("Error calculando ruta real. Mira consola.");
    return;
  }

  const kmReales = dataRuta.distance_m / 1000;
  const minutos = dataRuta.duration_s / 60;

  setRutaCoords(dataRuta.routeCoords);
  setDistancia(kmReales.toFixed(2));
  setTiempoMin(minutos.toFixed(0));

  const extras = { despues9pm, lloviendo, barrioComplejo };
  const { base, total } = calcularPrecio(kmReales, extras);

  setPrecioBase(base);
  setPrecio(total);
};


const onPick = async (modo, coords) => {
  if (modo === "origen") {
    setOrigenCoords(coords);
    if (destinoCoords) await recalcularRutaConCoords(coords, destinoCoords);
  } else {
    setDestinoCoords(coords);
    if (origenCoords) await recalcularRutaConCoords(origenCoords, coords);
  }
};

const onDrag = async (tipo, coords) => {
  if (tipo === "origen") {
    setOrigenCoords(coords);
    if (destinoCoords) await recalcularRutaConCoords(coords, destinoCoords);
  } else {
    setDestinoCoords(coords);
    if (origenCoords) await recalcularRutaConCoords(origenCoords, coords);
  }
};


const solicitarPorWhatsApp = () => {
  if (!origen || !destino || !distancia || !precio) {
    alert("Primero calcula la ruta para generar la cotización.");
    return;
  }

  const extrasActivos = [];
  if (despues9pm) extrasActivos.push("Después de 9PM (+$1.000)");
  if (lloviendo) extrasActivos.push("Lluvia (+$2.000)");
  if (barrioComplejo) extrasActivos.push("Barrio complejo (+$3.000)");

  const extrasTxt = extrasActivos.length ? extrasActivos.join(", ") : "Ninguno";

  const mensaje =
`🚀 *Halcón Express — Solicitud de domicilio*
📍 *Origen:* ${origen}
📍 *Destino:* ${destino}

🛣 *Distancia:* ${distancia} km
⏱ *Tiempo:* ${tiempoMin} min

🧾 *Tarifa base:* $${precioBase ?? "-"}
➕ *Extras:* ${extrasTxt}
💰 *Total:* $${precio}

¿Me confirmas para enviar el domiciliario?`;

  // 👇 Pon aquí el número de WhatsApp (con código país, sin +, sin espacios)
  const numero = "573156777316"; // ejemplo Colombia: 57 + número

  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
};





  return (
    <div style={{ padding: 20 }}>
      <h1>Halcón Express — Cotizador</h1>

      {/* FORMULARIO */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Dirección origen"
          value={origen}
          onChange={(e) => setOrigen(e.target.value)}
          style={{ marginRight: 10 }}
        />

        <input
          type="text"
          placeholder="Dirección destino"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          style={{ marginRight: 10 }}
        />

        <button onClick={calcular}>Calcular</button>
      </div>

      {/* Mostrar datos */}
      {datos && (
        <div style={{ marginBottom: 20 }}>
          <p><strong>Origen:</strong> {datos.origen}</p>
          <p><strong>Destino:</strong> {datos.destino}</p>
        </div>
      )}

      {distancia && (
        <div style={{ marginBottom: 20 }}>
          <p>📏 Distancia: {distancia} km</p>
          <p>💰 Precio estimado: ${precio}</p>
        </div>
      )}

      {tiempoMin && <p>⏱ Tiempo estimado: {tiempoMin} min</p>}


      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 6 }}>
          <input
            type="checkbox"
            checked={despues9pm}
            onChange={(e) => setDespues9pm(e.target.checked)}
          />{" "}
          Después de las 9:00 PM (+$1.000)
        </label>

        <label style={{ display: "block", marginBottom: 6 }}>
          <input
            type="checkbox"
            checked={lloviendo}
            onChange={(e) => setLloviendo(e.target.checked)}
          />{" "}
          Está lloviendo (+$2.000)
        </label>

        <label style={{ display: "block", marginBottom: 6 }}>
          <input
            type="checkbox"
            checked={barrioComplejo}
            onChange={(e) => setBarrioComplejo(e.target.checked)}
          />{" "}
          Barrio complejo (+$3.000)
        </label>
      </div>

      {precioBase != null && <p>🧾 Tarifa base: ${precioBase}</p>}
      {precio != null && <p>💰 Total: ${precio}</p>}


        <div style={{ marginBottom: 12 }}>
          <strong>🛠 Ajustar con clic:</strong>{" "}
          <button
            onClick={() => setModoSeleccion("origen")}
            style={{
              marginRight: 8,
              fontWeight: modoSeleccion === "origen" ? "bold" : "normal",
            }}
          >
            Origen
          </button>
          <button
            onClick={() => setModoSeleccion("destino")}
            style={{ fontWeight: modoSeleccion === "destino" ? "bold" : "normal" }}
          >
            Destino
          </button>

          <div style={{ marginTop: 6, opacity: 0.8 }}>
            📍 Haz clic en el mapa para ajustar: <b>{modoSeleccion}</b> <br />
            ✋ O arrastra cualquier marcador para ajuste fino.
          </div>
      </div>


      <button
        onClick={solicitarPorWhatsApp}
        style={{
          marginTop: 12,
          padding: "10px 14px",
          borderRadius: 8,
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
  📲 Solicitar servicio por WhatsApp
      </button>




      <Mapa
  origenCoords={origenCoords}
  destinoCoords={destinoCoords}
  rutaCoords={rutaCoords}
  modo={modoSeleccion}
  onPick={onPick}
  onDrag={onDrag}
/>
    </div>
  );
}
