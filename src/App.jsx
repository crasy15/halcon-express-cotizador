import { useState } from "react";
import Mapa from "./components/Mapa";
import "./App.css"; 


// 🟢 1. EL LOGO DE WHATSAPP (SVG OFICIAL)
const LogoWhatsApp = () => (
  <svg
    viewBox="0 0 30.667 30.667"
    width="24"
    height="24"
    fill="#25D366"
    style={{ marginRight: "8px" }}
  >
    <path d="M30.667,14.939c0,8.25-6.74,14.938-15.056,14.938c-2.639,0-5.118-0.675-7.276-1.857L0,30.667l2.717-8.017
      c-1.37-2.25-2.159-4.892-2.159-7.712C0.559,6.688,7.297,0,15.613,0C23.928,0.002,30.667,6.689,30.667,14.939z
      M15.61,2.382c-6.979,0-12.656,5.634-12.656,12.56c0,2.748,0.896,5.292,2.411,7.362l-1.58,4.663l4.862-1.545
      c2,1.312,4.393,2.076,6.963,2.076c6.979,0,12.658-5.633,12.658-12.559C28.27,8.016,22.59,2.382,15.61,2.382z
      M23.214,18.38c-0.094-0.151-0.34-0.243-0.708-0.427c-0.367-0.184-2.184-1.069-2.521-1.189
      c-0.34-0.123-0.586-0.185-0.832,0.182c-0.243,0.367-0.951,1.191-1.168,1.437
      c-0.215,0.245-0.43,0.276-0.799,0.095c-0.369-0.186-1.559-0.57-2.969-1.817
      c-1.097-0.972-1.838-2.169-2.052-2.536c-0.217-0.366-0.022-0.564,0.161-0.746
      c0.165-0.165,0.369-0.428,0.554-0.643c0.185-0.213,0.246-0.364,0.369-0.609
      c0.121-0.245,0.06-0.458-0.031-0.643c-0.092-0.184-0.829-1.984-1.138-2.717
      c-0.307-0.732-0.614-0.611-0.83-0.611c-0.215,0-0.461-0.03-0.707-0.03
      S9.897,8.215,9.56,8.582s-1.291,1.252-1.291,3.054
      c0,1.804,1.321,3.543,1.506,3.787c0.186,0.243,2.554,4.062,6.305,5.528
      c3.753,1.465,3.753,0.976,4.429,0.914c0.678-0.062,2.184-0.885,2.49-1.739
      C23.307,19.268,23.307,18.533,23.214,18.38z"/>
  </svg>
);




export default function App() {
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [origenCoords, setOrigenCoords] = useState(null);
  const [destinoCoords, setDestinoCoords] = useState(null);
  const [distancia, setDistancia] = useState(null);
  const [precio, setPrecio] = useState(null);
  const [rutaCoords, setRutaCoords] = useState(null);
  const [tiempoMin, setTiempoMin] = useState(null);
  
  const [extrasStates, setExtrasStates] = useState({
    despues9pm: false,
    lloviendo: false,
    barrioComplejo: false,
  });

  const [modoSeleccion, setModoSeleccion] = useState("origen");

  const formatoMoneda = (valor) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };

  const calcularPrecioTotal = (km, states) => {
    const kmNum = parseFloat(km);
    const d = Math.max(kmNum, 1);
    let base = 0;
    
    if (d >= 1 && d <= 4.9) base = 5000;
    else if (d >= 5 && d <= 5.9) base = 6000;
    else if (d >= 6 && d <= 8.5) base = 7000;
    else base = 8000;

    let total = base;
    if (states.despues9pm) total += 1000;
    if (states.lloviendo) total += 2000;
    if (states.barrioComplejo) total += 3000;
    
    return total;
  };

  const calcularRuta = async () => {
    try {
      if (!origen.trim() || !destino.trim()) return alert("⚠️ Escribe origen y destino.");

      const buscarCoords = async (texto) => {
        const res = await fetch(`http://localhost:3001/geocode?q=${encodeURIComponent(texto)}`);
        const data = await res.json();
        return data.length ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null;
      };

      const cOrigen = await buscarCoords(origen);
      const cDestino = await buscarCoords(destino);

      if (!cOrigen || !cDestino) return alert("❌ No se encontraron las direcciones.");

      setOrigenCoords(cOrigen);
      setDestinoCoords(cDestino);

      const resRuta = await fetch("http://localhost:3001/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: cOrigen, destination: cDestino }),
      });
      
      if (!resRuta.ok) throw new Error("Error en servidor de rutas");
      const dataRuta = await resRuta.json();

      const km = (dataRuta.distance_m / 1000).toFixed(2);
      const min = (dataRuta.duration_s / 60).toFixed(0);

      setRutaCoords(dataRuta.routeCoords);
      setDistancia(km);
      setTiempoMin(min);
      setPrecio(calcularPrecioTotal(km, extrasStates));
      
    } catch (error) {
      console.error(error);
      alert("Error calculando la ruta.");
    }
  };

  const handleExtraChange = (nombreExtra) => {
    const newStates = { ...extrasStates, [nombreExtra]: !extrasStates[nombreExtra] };
    setExtrasStates(newStates);
    if (distancia) {
        setPrecio(calcularPrecioTotal(distancia, newStates));
    }
  };

  // --- NUEVA LÓGICA: Obtener dirección al hacer clic ---
  const obtenerDireccionDeCoords = async (lat, lon) => {
    try {
        const res = await fetch(`http://localhost:3001/reverse-geocode?lat=${lat}&lon=${lon}`);
        const data = await res.json();
        // Limpiamos un poco la dirección para que no sea tan larga (opcional)
        // Tomamos solo los primeros componentes si es muy larga, o la dejamos completa.
        return data.address || "Ubicación en mapa";
    } catch (error) {
        console.error("Error reverse geocode", error);
        return "Ubicación marcada";
    }
  };

  const onMapInteract = async (modo, coords) => {
    const [lat, lon] = coords;
    
    // 1. Actualizar coordenadas visuales inmediatamente (para que el pin se mueva rápido)
    const nuevoOrigen = modo === "origen" ? coords : origenCoords;
    const nuevoDestino = modo === "destino" ? coords : destinoCoords;

    if (modo === "origen") {
        setOrigenCoords(coords);
        setOrigen("🔍 Buscando calle..."); // Feedback inmediato
        const direccion = await obtenerDireccionDeCoords(lat, lon);
        setOrigen(direccion); // Actualizar con nombre real
    } else {
        setDestinoCoords(coords);
        setDestino("🔍 Buscando calle..."); 
        const direccion = await obtenerDireccionDeCoords(lat, lon);
        setDestino(direccion);
    }

    // 2. Si ambos puntos existen, recalcular ruta automáticamente
    if (nuevoOrigen && nuevoDestino) {
        const res = await fetch("http://localhost:3001/route", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ origin: nuevoOrigen, destination: nuevoDestino }),
        });
        if(res.ok) {
            const data = await res.json();
            const km = (data.distance_m / 1000).toFixed(2);
            setRutaCoords(data.routeCoords);
            setDistancia(km);
            setTiempoMin((data.duration_s / 60).toFixed(0));
            setPrecio(calcularPrecioTotal(km, extrasStates));
        }
    }
  };

  const solicitarWhatsApp = () => {
    if (!distancia || !precio) return alert("Calcula la tarifa primero.");
    
    const extrasList = [];
    if(extrasStates.despues9pm) extrasList.push("🌙 Nocturno");
    if(extrasStates.lloviendo) extrasList.push("🌧 Lluvia");
    if(extrasStates.barrioComplejo) extrasList.push("🚧 Barrio Complejo");
    const extrasTxt = extrasList.length > 0 ? extrasList.join(", ") : "Ninguno";

    const msg = `🦅 *Halcón Express - Solicitud*\n\n📍 *Origen:* ${origen}\n🏁 *Destino:* ${destino}\n\n📏 Distancia: ${distancia} km\n⏱ Tiempo: ${tiempoMin} min\n➕ Extras: ${extrasTxt}\n\n💰 *VALOR TOTAL: ${formatoMoneda(precio)}*`;
    
    window.open(`https://wa.me/573156777316?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const ExtraCheckbox = ({ label, name, checked }) => (
    <label className={`extra-label ${checked ? 'checked' : ''}`}>
        <div className="checkbox-icon">{checked && "✓"}</div>
        <input type="checkbox" checked={checked} onChange={() => handleExtraChange(name)} />
        <span>{label}</span>
    </label>
  );

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="header">
          <h1>Halcón <span className="accent">Express</span></h1>
          <p className="subtitle">Cotizador de Servicios</p>
        </div>

        <div className="input-group">
          <div className="input-wrapper">
            <span className="input-icon">📍</span>
            <input className="styled-input" placeholder="Dirección de recogida" value={origen}
              onChange={(e)=>setOrigen(e.target.value)} onFocus={()=>setModoSeleccion("origen")} />
          </div>
          <div className="input-wrapper">
            <span className="input-icon">🏁</span>
            <input className="styled-input" placeholder="Dirección de entrega" value={destino}
              onChange={(e)=>setDestino(e.target.value)} onFocus={()=>setModoSeleccion("destino")} />
          </div>
          <button className="btn-primary" onClick={calcularRuta}>
             🔍 Calcular Tarifa
          </button>
        </div>

        {precio && (
          <div className="info-card">
            <p className="price-label">Tarifa Estimada</p>
            <div className="price-tag">{formatoMoneda(precio)}</div>
            <div className="metrics-container">
                <div className="metric-item"><span>📏</span> {distancia} km</div>
                <div className="metric-item"><span>⏱</span> {tiempoMin} min</div>
            </div>
          </div>
        )}

        <div className="extras-container">
            <ExtraCheckbox label="🌙 Recargo Nocturno (+$1k)" name="despues9pm" checked={extrasStates.despues9pm} />
            <ExtraCheckbox label="🌧 Con Lluvia (+$2k)" name="lloviendo" checked={extrasStates.lloviendo} />
            <ExtraCheckbox label="🚧 Barrio Complejo (+$3k)" name="barrioComplejo" checked={extrasStates.barrioComplejo} />
        </div>

        {precio && (
            // 🟢 2. AQUÍ ESTÁ EL BOTÓN CON EL LOGO
            <button className="btn-whatsapp" onClick={solicitarWhatsApp}>
                <LogoWhatsApp />
                <span>SOLICITAR HALCÓN</span>
            </button>
        )}
      </div>

      <div className="map-container">
        <div className="map-controls">
            <span>Modo Mapa:</span>
            <span className={`pill ${modoSeleccion==='origen' ? 'active':''}`} onClick={()=>setModoSeleccion("origen")}>📍 Origen</span>
            <span className={`pill ${modoSeleccion==='destino' ? 'active':''}`} onClick={()=>setModoSeleccion("destino")}>🏁 Destino</span>
        </div>

        <Mapa 
            origenCoords={origenCoords} destinoCoords={destinoCoords} rutaCoords={rutaCoords} 
            modo={modoSeleccion} onPick={onMapInteract} onDrag={onMapInteract} 
        />
      </div>
    </div>
  );
}