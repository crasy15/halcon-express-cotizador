import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";







function AjustarVista({ origenCoords, destinoCoords, rutaCoords }) {
  const map = useMap();

  useEffect(() => {
    if (rutaCoords && rutaCoords.length > 0) {
      map.fitBounds(rutaCoords, { padding: [50, 50] });
      return;
    }

    if (origenCoords && destinoCoords) {
      map.fitBounds([origenCoords, destinoCoords], { padding: [50, 50] });
      return;
    }

    if (origenCoords) {
      map.setView(origenCoords, 14);
    }
  }, [map, origenCoords, destinoCoords, rutaCoords]);

  return null;
}



function ClickEnMapa({ modo, onPick }) {
  useMapEvents({
    click(e) {
      const coords = [e.latlng.lat, e.latlng.lng];
      onPick(modo, coords);
    },
  });
  return null;
}




export default function Mapa({ origenCoords, destinoCoords, rutaCoords, modo, onPick, onDrag }) {

  const centro = [10.4631, -73.2532];

  return (
    <div style={{ height: 420, width: "100%" }}>
      <MapContainer center={centro} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <ClickEnMapa modo={modo} onPick={onPick} />


        <AjustarVista
        origenCoords={origenCoords}
        destinoCoords={destinoCoords}
        rutaCoords={rutaCoords}
        />

        {origenCoords && (
        <Marker
            position={origenCoords}
            draggable={true}
            eventHandlers={{
            dragend: (e) => {
                const p = e.target.getLatLng();
                onDrag("origen", [p.lat, p.lng]);
            },
            }}
        >
            <Popup>Origen (arrástrame)</Popup>
        </Marker>
        )}

        {destinoCoords && (
        <Marker
            position={destinoCoords}
            draggable={true}
            eventHandlers={{
            dragend: (e) => {
                const p = e.target.getLatLng();
                onDrag("destino", [p.lat, p.lng]);
            },
            }}
        >
            <Popup>Destino (arrástrame)</Popup>
        </Marker>
        )}


        {rutaCoords && rutaCoords.length > 0 && (
        <Polyline positions={rutaCoords} pathOptions={{ color: "blue", weight: 4 }} />
        )}


      </MapContainer>
    </div>
  );
}
