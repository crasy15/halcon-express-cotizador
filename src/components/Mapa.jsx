import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from 'leaflet'; // Importamos Leaflet base para crear iconos personalizados
import { useEffect } from "react";


// --- DEFINICIÓN DE ICONOS PERSONALIZADOS ---
// Usamos imágenes alojadas externamente para los pines de colores.

// Icono Verde para ORIGEN
const iconOrigen = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],      // Tamaño del icono
    iconAnchor: [12, 41],   // Punto del icono que corresponde a la ubicación
    popupAnchor: [1, -34],  // Donde se abre el popup relativo al icono
    shadowSize: [41, 41]    // Tamaño de la sombra
});

// Icono Rojo para DESTINO
const iconDestino = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
// -------------------------------------------


// Componente auxiliar para hacer zoom automático
function AjustarVista({ origenCoords, destinoCoords, rutaCoords }) {
  const map = useMap();
  useEffect(() => {
    // Si hay ruta, mostrar toda la ruta con un pequeño margen (padding)
    if (rutaCoords && rutaCoords.length > 0) {
      map.fitBounds(rutaCoords, { padding: [50, 50] });
    } 
    // Si solo hay los dos puntos, encuadrarlos
    else if (origenCoords && destinoCoords) {
      const bounds = L.latLngBounds([origenCoords, destinoCoords]);
      map.fitBounds(bounds, { padding: [100, 100] });
    } 
    // Si solo hay origen (al inicio), centrar ahí
    else if (origenCoords && !destinoCoords) {
      map.setView(origenCoords, 15, { animate: true });
    }
  }, [map, origenCoords, destinoCoords, rutaCoords]);
  return null;
}

// Componente para manejar clics en el mapa
function ClickEnMapa({ modo, onPick }) {
  useMapEvents({
    click(e) { onPick(modo, [e.latlng.lat, e.latlng.lng]); },
  });
  return null;
}




export default function Mapa({ origenCoords, destinoCoords, rutaCoords, modo, onPick, onDrag }) {
  const centro = [10.4631, -73.2532]; // Valledupar

  const rutaOptions = { color: "#FF6B00", weight: 6, opacity: 0.8 };

  return (
    // Quitamos width/height fijos, dejamos que el CSS del padre controle el tamaño
    <div style={{ width: "100%", height: "100%" }}>
      <MapContainer center={centro} zoom={13} style={{ width: "100%", height: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        <ClickEnMapa modo={modo} onPick={onPick} />
        <AjustarVista origenCoords={origenCoords} destinoCoords={destinoCoords} rutaCoords={rutaCoords} />

        <ClickEnMapa modo={modo} onPick={onPick} />
        <AjustarVista origenCoords={origenCoords} destinoCoords={destinoCoords} rutaCoords={rutaCoords} />

        {/* Marcador de ORIGEN (Verde) */}
        {origenCoords && (
          <Marker 
            position={origenCoords} 
            draggable={true} 
            icon={iconOrigen} // <--- AQUÍ APLICAMOS EL ICONO VERDE
            eventHandlers={{ dragend: (e) => onDrag("origen", [e.target.getLatLng().lat, e.target.getLatLng().lng]) }}
          >
            <Popup>📍 Origen (Recogida)</Popup>
          </Marker>
        )}

        {/* Marcador de DESTINO (Rojo) */}
        {destinoCoords && (
          <Marker 
            position={destinoCoords} 
            draggable={true} 
            icon={iconDestino} // <--- AQUÍ APLICAMOS EL ICONO ROJO
            eventHandlers={{ dragend: (e) => onDrag("destino", [e.target.getLatLng().lat, e.target.getLatLng().lng]) }}
          >
            <Popup>🏁 Destino (Entrega)</Popup>
          </Marker>
        )}

        {rutaCoords && <Polyline positions={rutaCoords} pathOptions={rutaOptions} />}
      </MapContainer>
    </div>
  );
}
