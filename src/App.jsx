import Mapa from "./components/Mapa";
import "./App.css";
import { useCotizador } from "./hooks/useCotizador";
import { LogoWhatsApp, LogoGPS } from "./components/common/Icons";

export default function App() {
  const {
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
  } = useCotizador();

  // Pequeño componente local para los checkboxes
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
          {/* INPUT ORIGEN */}
          <div className="input-wrapper">
            <span className="input-icon">📍</span>
            <input 
              className="styled-input" 
              placeholder="Dirección de recogida" 
              value={origen}
              onChange={(e)=>setOrigen(e.target.value)} 
              onFocus={()=>setModoSeleccion("origen")} 
            />
            <button className="btn-gps" onClick={() => usarGPS('origen')} title="Usar mi ubicación actual">
                <LogoGPS />
            </button>
          </div>

          {/* INPUT DESTINO */}
          <div className="input-wrapper">
            <span className="input-icon">🏁</span>
            <input 
              className="styled-input" 
              placeholder="Dirección de entrega" 
              value={destino}
              onChange={(e)=>setDestino(e.target.value)} 
              onFocus={()=>setModoSeleccion("destino")} 
            />
            <button className="btn-gps" onClick={() => usarGPS('destino')} title="Usar mi ubicación actual">
                <LogoGPS />
            </button>
          </div>

          <button className="btn-primary" onClick={calcularPorInput}>
             🔍 Calcular Tarifa
          </button>
        </div>

        {precio && (
          <div className="info-card">
            <p className="price-label">Tarifa Estimada</p>
            <div className="price-tag">{formatoMoneda(precio)}</div>
            
            {/* --- SECCIÓN REDISEÑADA PARA MEJOR VISIBILIDAD MÓVIL --- */}
            <div className="metrics-container">
                {/* Item Distancia */}
                <div className="metric-item">
                    <div className="metric-icon">📏</div>
                    <div className="metric-info">
                        <span className="metric-label">Distancia</span>
                        <span className="metric-value">{distancia} km</span>
                    </div>
                </div>

                {/* Item Tiempo */}
                <div className="metric-item">
                    <div className="metric-icon">⏱</div>
                    <div className="metric-info">
                        <span className="metric-label">Tiempo Est.</span>
                        <span className="metric-value">{tiempoMin.min} - {tiempoMin.max} min</span>
                    </div>
                </div>
            </div>
            {/* ------------------------------------------------------- */}
          </div>
        )}

        <div className="extras-container">
            <ExtraCheckbox label="🌙 Recargo Nocturno (+$1k)" name="despues9pm" checked={extrasStates.despues9pm} />
            <ExtraCheckbox label="🌧 Con Lluvia (+$2k)" name="lloviendo" checked={extrasStates.lloviendo} />
            <ExtraCheckbox label="🚧 Barrio Complejo (+$3k)" name="barrioComplejo" checked={extrasStates.barrioComplejo} />
        </div>

        {precio && (
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
            origenCoords={origenCoords} 
            destinoCoords={destinoCoords} 
            rutaCoords={rutaCoords} 
            modo={modoSeleccion} 
            onPick={onMapInteract} 
            onDrag={onMapInteract} 
        />
      </div>
    </div>
  );
}