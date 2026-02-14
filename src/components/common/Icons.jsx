import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { URL_BASE } from '../config';

const Mapa = ({ onOrigenSelect, onDestinoSelect, ruta }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({ origen: null, destino: null });
  const routeLayerRef = useRef(null);

  useEffect(() => {
    // Inicializar mapa una sola vez
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([10.4631, -73.2532], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);

      mapInstance.current.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        const coords = `${lng},${lat}`;

        try {
          const resp = await fetch(`${URL_BASE}/api/geocodificar-reversa?lat=${lat}&lon=${lng}`);
          const data = await resp.json();
          const address = data.direccion || coords;

          // Lógica de alternancia: si no hay origen, pone origen. Si hay origen, pone destino.
          if (!markersRef.current.origen || (markersRef.current.origen && markersRef.current.destino)) {
            actualizarMarcador('origen', [lat, lng], 'Recogida');
            onOrigenSelect(coords, address);
          } else {
            actualizarMarcador('destino', [lat, lng], 'Entrega');
            onDestinoSelect(coords, address);
          }
        } catch (error) {
          console.error("Error en mapa:", error);
        }
      });
    }
  }, []);

  const actualizarMarcador = (tipo, position, label) => {
    if (markersRef.current[tipo]) {
      markersRef.current[tipo].setLatLng(position);
    } else {
      markersRef.current[tipo] = L.marker(position, {
        icon: L.divIcon({
          className: `custom-marker ${tipo}`,
          html: `<div class="pin"></div><span>${label}</span>`,
          iconSize: [30, 30]
        })
      }).addTo(mapInstance.current);
    }

    if (tipo === 'origen' && markersRef.current.destino) {
      mapInstance.current.removeLayer(markersRef.current.destino);
      markersRef.current.destino = null;
      if (routeLayerRef.current) mapInstance.current.removeLayer(routeLayerRef.current);
    }
  };

  // Dibujar la ruta cuando cambie en las props
  useEffect(() => {
    if (ruta && mapInstance.current) {
      if (routeLayerRef.current) mapInstance.current.removeLayer(routeLayerRef.current);
      
      routeLayerRef.current = L.geoJSON(ruta, {
        style: { color: '#f39c12', weight: 5, opacity: 0.7 }
      }).addTo(mapInstance.current);

      mapInstance.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });
    }
  }, [ruta]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default Mapa;