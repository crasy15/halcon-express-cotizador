# 🦅 Halcón Express - Cotizador de Envíos

Halcón Express es una aplicación web moderna desarrollada en **React + Vite** diseñada para cotizar servicios de mensajería y transporte en tiempo real.

Utiliza **mapas interactivos**, **geolocalización** y **algoritmos de ruteo** para calcular distancias, tiempos y precios de forma precisa.

---

## 🚀 Características Principales

- 📍 **Geolocalización Automática**: Detecta la ubicación del usuario para el punto de recogida o entrega.
- 🗺️ **Mapa Interactivo**: Permite seleccionar origen y destino arrastrando marcadores o haciendo clic en el mapa.
- 💰 **Cotización Dinámica**: Cálculo de tarifas basado en kilometraje con reglas de negocio configurables.
- 🛠️ **Recargos Personalizables**: Soporte para tarifas extra (Nocturno, Lluvia, Barrio Complejo).
- 📱 **Integración con WhatsApp**: Genera un mensaje prellenado con el resumen del servicio para enviar el pedido directamente.
- 🎨 **Diseño Responsive**: Interfaz adaptada a móviles y escritorio.

---

## 🏗️ Arquitectura del Proyecto

El proyecto sigue una arquitectura escalable (**Separation of Concerns**), dividiendo la lógica de negocio de la interfaz de usuario.

### 📂 Estructura de Carpetas (`/src`)

src/
│
├── components/ # UI (Elementos visuales)
│ ├── Mapa.jsx # 🧩 Componente del mapa interactivo (Leaflet)
│ └── common/ # 🧩 Componentes reutilizables (Icons.jsx)
│
├── hooks/
│ └── useCotizador.js # 🧠 Lógica principal de la app
│
├── services/
│ └── apiService.js # 📡 Conexión con el backend
│
├── config.js # ⚙️ Configuración global (precios y constantes)
│
└── App.jsx # 🏗️ Componente principal


---

## ⚙️ Configuración de Precios

El negocio cambia, el código no debería.

Puedes ajustar las tarifas editando únicamente:



```js
// src/config.js
export const CONFIG = {
  PRECIOS: {
    MINIMA: 5000,      // Tarifa mínima (0 - 4.9 km)
    INTERMEDIA: 8000,  // Tarifa intermedia
    LARGA: 12000,      // Distancias largas
  },
  EXTRAS: {
    NOCTURNO: 1000,    // Recargo después de las 9pm
    LLUVIA: 2000,      // Recargo por clima
    BARRIO_COMPLEJO: 3000 // Recargo por zona
  },
  WHATSAPP: {
    NUMERO: "573001234567",
    MENSAJE_SALUDO: "Hola, quiero solicitar un servicio 🦅"
  }
};

```



## instalación y Ejecución

🔹 Requisitos Previos

Node.js (v16 o superior)

### Clonar el Repositorio
```js
git clone <tu-repositorio>
cd halcon-express-cotizador

```


## Configurar el Servidor (Backend)
El servidor actúa como proxy para proteger tus API Keys y evitar problemas de CORS.

```js

cd server
npm install

# (Opcional) Crear archivo .env si usas APIs privadas
# echo "API_KEY=tu_clave" > .env

node index.js

```


El servidor correrá en:

```js
http://localhost:3001

```


### Configurar el Cliente (Frontend)

```js
cd ..
npm install
npm run dev

```



### Scripts Disponibles
```js

npm run dev      # Inicia servidor de desarrollo
npm run build    # Compila para producción (carpeta dist)
npm run preview  # Vista previa del build
npm run lint     # Ejecuta ESLint

```


### Despliegue (Producción)
```js

npm run build

```


### Stack Tecnológico

Frontend: React 18 + Vite

🎨 Estilos: CSS3 (Variables, Flexbox, Grid)

🗺️ Mapas: React-Leaflet + OpenStreetMap

🖥️ Backend: Node.js + Express

🧹 Linter: ESLint




