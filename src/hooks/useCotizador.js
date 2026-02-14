import { useState } from 'react';
import { CONFIG } from '../config';
import { geocode, reverseGeocode, getRoute } from '../services/apiService';

export const useCotizador = () => {
  // --- ESTADOS ---
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

  // --- UTILIDADES ---
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

    // Precios base según config
    if (d >= 1 && d <= 4.9) base = CONFIG.PRECIOS.MINIMA;
    else if (d >= 5 && d <= 5.9) base = CONFIG.PRECIOS.INTERMEDIA;
    else if (d >= 6 && d <= 8.5) base = CONFIG.PRECIOS.LARGA;
    else base = CONFIG.PRECIOS.EXTRA_LARGA;

    let total = base;
    // Extras según config
    if (states.despues9pm) total += CONFIG.EXTRAS.NOCTURNO;
    if (states.lloviendo) total += CONFIG.EXTRAS.LLUVIA;
    if (states.barrioComplejo) total += CONFIG.EXTRAS.BARRIO_COMPLEJO;
    
    return total;
  };

  // --- LÓGICA DE NEGOCIO ---

  const recalcularRuta = async (p1, p2) => {
    const data = await getRoute(p1, p2);
    if(data) {
        const km = (data.distance_m / 1000).toFixed(2);
        setRutaCoords(data.routeCoords);
        setDistancia(km);
        setTiempoMin((data.duration_s / 60).toFixed(0));
        setPrecio(calcularPrecioTotal(km, extrasStates));
    }
  };

  const usarGPS = (tipo) => {
    if (!("geolocation" in navigator)) return alert("Tu dispositivo no soporta GPS.");
    if(tipo === 'origen') setOrigen("📍 Localizando...");
    else setDestino("📍 Localizando...");

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        let direccionTexto = "Ubicación GPS";
        
        // Usamos el servicio reverseGeocode
        const data = await reverseGeocode(coords[0], coords[1]);
        if(data.address) direccionTexto = data.address;

        if (tipo === 'origen') {
            setOrigenCoords(coords);
            setOrigen(direccionTexto);
            if(destinoCoords) recalcularRuta(coords, destinoCoords);
        } else {
            setDestinoCoords(coords);
            setDestino(direccionTexto);
            if(origenCoords) recalcularRuta(origenCoords, coords);
        }
    }, (err) => {
        console.error(err);
        alert("⚠️ Activa la ubicación en tu navegador.");
        if(tipo === 'origen') setOrigen("");
        else setDestino("");
    }, { enableHighAccuracy: true });
  };

  const calcularPorInput = async () => {
      if (!origen.trim() || !destino.trim()) return alert("⚠️ Escribe origen y destino.");

      const buscarCoords = async (texto) => {
        const data = await geocode(texto);
        return data.length ? [parseFloat(data[0].lat), parseFloat(data[0].lon)] : null;
      };

      const cOrigen = await buscarCoords(origen);
      const cDestino = await buscarCoords(destino);

      if (!cOrigen || !cDestino) return alert("❌ No se encontraron las direcciones.");

      setOrigenCoords(cOrigen);
      setDestinoCoords(cDestino);
      recalcularRuta(cOrigen, cDestino);
  };

  const handleExtraChange = (nombreExtra) => {
    const newStates = { ...extrasStates, [nombreExtra]: !extrasStates[nombreExtra] };
    setExtrasStates(newStates);
    if (distancia) setPrecio(calcularPrecioTotal(distancia, newStates));
  };

  const onMapInteract = async (modo, coords) => {
    const [lat, lon] = coords;
    const nuevoOrigen = modo === "origen" ? coords : origenCoords;
    const nuevoDestino = modo === "destino" ? coords : destinoCoords;
    
    // Address lookup reverso
    let direccion = "Ubicación en mapa";
    const data = await reverseGeocode(lat, lon);
    if(data.address) direccion = data.address;

    if (modo === "origen") {
        setOrigenCoords(coords);
        setOrigen(direccion);
    } else {
        setDestinoCoords(coords);
        setDestino(direccion);
    }
    if (nuevoOrigen && nuevoDestino) recalcularRuta(nuevoOrigen, nuevoDestino);
  };

  const solicitarWhatsApp = () => {
    const msg = `${CONFIG.WHATSAPP.MENSAJE_SALUDO}\n\n📍 *Origen:* ${origen}\n🏁 *Destino:* ${destino}\n💰 *Valor:* ${formatoMoneda(precio)}\n📏 *Distancia:* ${distancia} km\n⏱ *Tiempo:* ${tiempoMin} min`; 
    window.open(`https://wa.me/${CONFIG.WHATSAPP.NUMERO}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Exponemos todo lo que el componente App necesita
  return {
    origen, setOrigen,
    destino, setDestino,
    origenCoords, destinoCoords,
    distancia, precio, rutaCoords, tiempoMin,
    extrasStates,
    modoSeleccion, setModoSeleccion,
    usarGPS,
    calcularPorInput,
    handleExtraChange,
    onMapInteract,
    solicitarWhatsApp,
    formatoMoneda
  };
};