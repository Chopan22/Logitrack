# LogiTrack — App Movil del Repartidor (Expo)

App movil construida con **Expo (SDK 54) + Expo Router + TypeScript** para el rol **Repartidor** del sistema LogiTrack. Permite iniciar sesion, gestionar rutas de reparto, enviar la posicion GPS en tiempo real por WebSocket y administrar los pedidos de cada ruta sobre un mapa.

## Que hace

- **Login** contra `POST /api/auth/login` (JWT guardado con AsyncStorage; la sesion persiste).
- **Rutas**: lista las rutas en curso e inicia una nueva eligiendo vehiculo y conductor (`/api/rutas`).
- **Seguimiento**: mapa nativo (`react-native-maps`) con tu posicion en vivo (`expo-location`), envio de coordenadas por Socket.io (`enviar_ubicacion`), lista de pedidos de la ruta, asignacion de pedidos pendientes y marcado de entregas.
- **Cerrar ruta**: finaliza la ruta y detiene el GPS.

## Estructura

```
app/
  _layout.tsx              Provider de auth + guardia de sesion
  index.tsx                Splash / redireccion segun sesion
  login.tsx                Pantalla de login
  (repartidor)/
    _layout.tsx            Stack del area privada
    rutas.tsx              Rutas en curso + iniciar ruta
    seguimiento/[id].tsx   Mapa, GPS en vivo y pedidos
lib/
  config.ts                Lee la URL del backend (app.json -> extra.apiUrl)
  api.ts                   Cliente HTTP con JWT
  socket.ts                Cliente Socket.io
  auth.tsx                 Contexto de autenticacion (AsyncStorage)
  types.ts                 Tipos del modelo de datos
components/
  ui-kit.tsx               Boton, Input, Card, EstadoBadge
  mapa-ruta.tsx            Mapa nativo (.web.tsx = sustituto para web)
constants/ui.ts            Paleta de marca y colores por estado
```

## Configuracion (IMPORTANTE para Expo Go)

Expo Go corre en tu celular, por lo que `localhost` apunta al telefono, **no** a tu PC. Debes usar la **IP de tu PC en la red local**.

1. Averigua tu IP:
   - Windows: `ipconfig` (busca "Direccion IPv4", ej. `192.168.1.100`)
   - macOS/Linux: `ifconfig` o `ip addr`
2. Edita `app.json` y coloca esa IP con el puerto del backend (3000):

```json
"extra": {
  "apiUrl": "http://192.168.1.100:3000"
}
```

3. Tu PC y tu celular deben estar en la **misma red WiFi**, y el backend debe escuchar en `0.0.0.0` (Express lo hace por defecto).

## Como correr

```bash
cd app-movil
npm install

# Alinea las dependencias nativas con tu version de Expo SDK:
npx expo install react-native-maps expo-location @react-native-async-storage/async-storage

npx expo start
```

Escanea el QR con la app **Expo Go** (Android/iOS). Asegurate de tener el backend corriendo (`cd backend && npm run dev`) y un usuario creado.

> En **Android**, el mapa funciona en Expo Go sin API key. Para una build propia (EAS) necesitaras una Google Maps API key en `app.json > android.config.googleMaps.apiKey`.

## Notas tecnicas

- Las coordenadas de destino de los pedidos se guardan como geometria PostGIS en el backend; el endpoint `GET /api/pedidos` las devuelve en formato binario, por lo que el mapa muestra la posicion del repartidor (y su recorrido), y los destinos se listan por direccion. Si luego quieres pintar los destinos en el mapa, expone `lat`/`lng` desde el backend con `ST_Y`/`ST_X`.
- El muestreo GPS usa `Accuracy.Balanced`, `timeInterval: 5000ms` y `distanceInterval: 10m` para equilibrar precision y bateria (uno de los desafios del proyecto).
