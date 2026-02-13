import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";



function AjustarVista({ origenCoords, destinoCoords, rutaCoords }) {
  const map = useMap();

  useEffect(() => {
    if (rutaCoords && rutaCoords.length > 0) {
      map.fitBounds(rutaCoords, { padding: [50, 50] });
    } else if (origenCoords && destinoCoords) {
      map.fitBounds([origenCoords, destinoCoords], { padding: [50, 50] });
    } else if (origenCoords) {
      map.setView(origenCoords, 14);
    }
  }, [map, origenCoords, destinoCoords, rutaCoords]);

  return null;
}



function ClickEnMapa({ modo, onPick }) {
  useMapEvents({
    click(e) {
      onPick(modo, [e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}




export default function Mapa({ origenCoords, destinoCoords, rutaCoords, modo, onPick, onDrag }) {
  const centro = [10.4631, -73.2532]; // Valledupar

  return (
    // Quitamos width/height fijos, dejamos que el CSS del padre controle el tamaño
    <div style={{ width: "100%", height: "100%" }}>
      <MapContainer center={centro} zoom={13} style={{ width: "100%", height: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        <ClickEnMapa modo={modo} onPick={onPick} />
        <AjustarVista origenCoords={origenCoords} destinoCoords={destinoCoords} rutaCoords={rutaCoords} />

        {origenCoords && (
          <Marker 
            position={origenCoords} 
            draggable={true} 
            eventHandlers={{ dragend: (e) => onDrag("origen", [e.target.getLatLng().lat, e.target.getLatLng().lng]) }}
          >
            <Popup>📍 Origen</Popup>
          </Marker>
        )}

        {destinoCoords && (
          <Marker 
            position={destinoCoords} 
            draggable={true} 
            eventHandlers={{ dragend: (e) => onDrag("destino", [e.target.getLatLng().lat, e.target.getLatLng().lng]) }}
          >
            <Popup>🏁 Destino</Popup>
          </Marker>
        )}

        {rutaCoords && <Polyline positions={rutaCoords} pathOptions={{ color: "#2563eb", weight: 5 }} />}
      </MapContainer>
    </div>
  );
}
