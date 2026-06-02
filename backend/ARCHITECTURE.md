# Backend — Documentación Técnica

## Índice

1. [Propósito](#propósito)
2. [Tecnologías](#tecnologías)
3. [Estructura de archivos](#estructura-de-archivos)
4. [Modelo de datos](#modelo-de-datos)
5. [Flujo de la aplicación](#flujo-de-la-aplicación)
6. [API REST](#api-rest)
7. [WebSocket](#websocket)
8. [Sistema de migraciones](#sistema-de-migraciones)
9. [Variables de entorno](#variables-de-entorno)
10. [Scripts disponibles](#scripts-disponibles)

---

## Propósito

El backend es el núcleo de LogiTrack. Cumple dos roles simultáneos:

- **Servidor HTTP (REST):** gestión de la flota — vehículos, conductores y rutas.
- **Servidor WebSocket:** recibe coordenadas GPS de los vehículos en tiempo real y las re-transmite a todos los clientes conectados (panel web).

---

## Tecnologías

| Paquete | Versión | Rol |
|---------|---------|-----|
| Node.js | 24.x (LTS) | Runtime |
| Express | 5.2.1 | Servidor HTTP y routing |
| Socket.io | 4.8.3 | Comunicación WebSocket bidireccional |
| pg | 8.20.0 | Driver PostgreSQL (queries con pool de conexiones) |
| dotenv | 17.x | Carga de variables de entorno desde `.env` |
| cors | 2.8.6 | Middleware para habilitar Cross-Origin requests |
| nodemon | 3.1.x | Recarga automática en desarrollo |

**Base de datos:** PostgreSQL 15 + extensión PostGIS 3.3 (coordenadas geográficas con SRID 4326 — WGS84, el mismo sistema que usa GPS).

---

## Estructura de archivos

```
backend/
│
├── index.js                  # Punto de entrada — monta Express, Socket.io y rutas
│
├── config/
│   └── db.js                 # Pool de conexiones a PostgreSQL
│
├── controllers/              # Lógica de negocio y queries SQL
│   ├── vehiculos.js
│   ├── conductores.js
│   └── rutas.js
│
├── routes/                   # Definición de endpoints HTTP
│   ├── vehiculos.js
│   ├── conductores.js
│   └── rutas.js
│
├── sockets/
│   └── ubicaciones.js        # Handler de eventos WebSocket
│
├── migrations/               # Archivos SQL ordenados, uno por cambio de esquema
│   ├── 001_crear_vehiculos.sql
│   ├── 002_crear_conductores.sql
│   ├── 003_crear_rutas.sql
│   └── 004_adaptar_ubicaciones.sql
│
├── scripts/
│   └── migrate.js            # Runner que aplica las migraciones pendientes
│
├── cliente-prueba.html       # Simulador GPS para pruebas sin hardware
├── .env.example              # Plantilla de variables de entorno
└── package.json
```

---

## Modelo de datos

### Diagrama de relaciones

```
┌─────────────┐         ┌──────────────┐
│  vehiculos  │         │  conductores │
│─────────────│         │──────────────│
│ id          │         │ id           │
│ patente     │         │ nombre       │
│ alias       │         │ telefono     │
│ tipo        │         │ activo       │
│ activo      │         │ creado_en    │
│ creado_en   │         └──────┬───────┘
└──────┬──────┘                │
       │                       │
       └──────────┬────────────┘
                  │
           ┌──────▼───────┐
           │    rutas     │
           │──────────────│
           │ id           │
           │ vehiculo_id  │──FK→ vehiculos
           │ conductor_id │──FK→ conductores
           │ estado       │  ('en_curso' | 'completada' | 'cancelada')
           │ inicio       │
           │ fin          │
           └──────┬───────┘
                  │
           ┌──────▼───────┐
           │  ubicaciones │
           │──────────────│
           │ id           │
           │ ruta_id      │──FK→ rutas
           │ coordenadas  │  GEOMETRY(Point, 4326)
           │ fecha_hora   │
           └──────────────┘
```

### Tabla `_migraciones`

Tabla interna de control. Registra qué migraciones SQL ya fueron aplicadas para que el runner nunca las ejecute dos veces.

```
_migraciones
  id          SERIAL PRIMARY KEY
  nombre      VARCHAR(255) UNIQUE   (ej: "001_crear_vehiculos.sql")
  aplicada_en TIMESTAMP
```

### PostGIS y coordenadas

Las ubicaciones se almacenan como puntos geográficos (`GEOMETRY(Point, 4326)`), no como pares de columnas `lat/lng`. Esto permite usar funciones espaciales de PostGIS en el futuro (distancia entre puntos, trayectorias, etc.).

Al insertar se usa:
```sql
ST_SetSRID(ST_MakePoint(lng, lat), 4326)
```
> El orden es `(longitud, latitud)` — estándar geográfico, no intuitivo.

---

## Flujo de la aplicación

### Flujo REST (gestión de flota)

```
Cliente HTTP
    │
    ▼
index.js  (Express app)
    │
    ├── /api/vehiculos   → routes/vehiculos.js   → controllers/vehiculos.js → db.js → PostgreSQL
    ├── /api/conductores → routes/conductores.js → controllers/conductores.js
    └── /api/rutas       → routes/rutas.js       → controllers/rutas.js
```

### Flujo WebSocket (tracking en tiempo real)

```
App Móvil
    │  emit('enviar_ubicacion', { ruta_id, lat, lng })
    ▼
sockets/ubicaciones.js
    │
    ├── Valida que ruta_id existe y está 'en_curso'
    ├── Inserta coordenadas en tabla ubicaciones (PostGIS)
    │
    └── io.emit('nueva_ubicacion', { ruta_id, lat, lng })
              │
              ▼
        Todos los clientes conectados (panel web)
```

### Ciclo de vida de una ruta

```
1. POST /api/vehiculos      → registrar vehículo en flota
2. POST /api/conductores    → registrar conductor
3. POST /api/rutas          → iniciar ruta (estado: 'en_curso')
       └── retorna ruta_id
4. WS enviar_ubicacion      → el móvil envía GPS continuamente
5. WS nueva_ubicacion       → el panel web recibe y muestra en mapa
6. PATCH /api/rutas/:id/cerrar → finalizar ruta (estado: 'completada', fin: NOW())
```

---

## API REST

### Vehículos — `GET /api/vehiculos`

Retorna todos los vehículos ordenados por id.

**Response 200:**
```json
[
  {
    "id": 1,
    "patente": "ABCD12",
    "alias": "Camion Norte",
    "tipo": "camion",
    "activo": true,
    "creado_en": "2026-06-01T00:00:00.000Z"
  }
]
```

---

### Vehículos — `POST /api/vehiculos`

Crea un nuevo vehículo. La patente se guarda en mayúsculas automáticamente.

**Body:**
```json
{ "patente": "ABCD12", "alias": "Camion Norte", "tipo": "camion" }
```

- `patente` — requerido, debe ser único
- `alias` — opcional
- `tipo` — opcional (ej: `"camion"`, `"van"`, `"moto"`)

**Response 201:** objeto del vehículo creado.
**Response 400:** si falta `patente`.

---

### Vehículos — `PATCH /api/vehiculos/:id`

Actualiza campos del vehículo. Solo se modifican los campos enviados (los no enviados conservan su valor actual — usa `COALESCE` en SQL).

**Body:**
```json
{ "alias": "Nuevo nombre", "activo": false }
```

**Response 200:** objeto actualizado.
**Response 404:** si el id no existe.

---

### Conductores — `GET /api/conductores`

Retorna todos los conductores ordenados por id.

---

### Conductores — `POST /api/conductores`

**Body:**
```json
{ "nombre": "Juan Pérez", "telefono": "+56912345678" }
```

- `nombre` — requerido
- `telefono` — opcional

**Response 201:** objeto del conductor creado.

---

### Conductores — `PATCH /api/conductores/:id`

Mismo patrón que vehículos. Campos actualizables: `nombre`, `telefono`, `activo`.

---

### Rutas — `GET /api/rutas`

Retorna todas las rutas con información del vehículo y conductor (JOIN).

**Query params:**
- `?estado=en_curso` — filtra solo rutas activas
- `?estado=completada` — filtra solo rutas cerradas

**Response 200:**
```json
[
  {
    "id": 1,
    "estado": "en_curso",
    "inicio": "2026-06-01T10:00:00.000Z",
    "fin": null,
    "patente": "ABCD12",
    "vehiculo_alias": "Camion Norte",
    "conductor_nombre": "Juan Pérez"
  }
]
```

---

### Rutas — `POST /api/rutas`

Inicia una nueva ruta. Valida que el vehículo no tenga ya una ruta `en_curso`.

**Body:**
```json
{ "vehiculo_id": 1, "conductor_id": 1 }
```

**Response 201:** objeto de la ruta creada con `estado: "en_curso"`.
**Response 400:** si faltan campos.
**Response 409:** si el vehículo ya tiene una ruta activa.

---

### Rutas — `PATCH /api/rutas/:id/cerrar`

Cierra una ruta activa: establece `estado = 'completada'` y registra la hora de fin.

**Response 200:** objeto de la ruta cerrada.
**Response 404:** si la ruta no existe o ya estaba cerrada.

---

## WebSocket

El servidor usa Socket.io sobre el mismo puerto HTTP (3000). El cliente se conecta a `ws://localhost:3000`.

### Evento de entrada: `enviar_ubicacion`

Emitido por la app móvil para reportar la posición actual.

**Payload:**
```json
{ "ruta_id": 1, "lat": -33.4569, "lng": -70.6483 }
```

**Validaciones internas:**
- `ruta_id`, `lat` y `lng` deben estar presentes
- La ruta debe existir en la DB y tener estado `en_curso`

Si alguna validación falla, el servidor emite `error` al cliente emisor:
```json
{ "mensaje": "Ruta no encontrada o no está en curso" }
```

**Al recibir una ubicación válida el servidor:**
1. Inserta el punto en la tabla `ubicaciones`
2. Emite `nueva_ubicacion` a **todos** los clientes conectados

---

### Evento de salida: `nueva_ubicacion`

Emitido por el servidor a todos los clientes conectados cada vez que llega una ubicación nueva.

**Payload:**
```json
{ "ruta_id": 1, "lat": -33.4569, "lng": -70.6483 }
```

---

## Sistema de migraciones

Las migraciones son archivos `.sql` numerados en `backend/migrations/`. El script `scripts/migrate.js` las gestiona.

### Cómo funciona el runner

1. Crea la tabla `_migraciones` si no existe
2. Lee los nombres de las migraciones ya aplicadas
3. Lee todos los `.sql` de la carpeta, ordenados alfabéticamente
4. Aplica solo las que aún no están registradas
5. Registra cada migración aplicada en `_migraciones`

### Agregar una nueva migración

Crear un archivo con el siguiente número en secuencia:
```
backend/migrations/005_nombre_descriptivo.sql
```

Luego correr:
```bash
node scripts/migrate.js
```

El runner aplica solo el archivo nuevo y lo registra. Es seguro correrlo múltiples veces.

---

## Variables de entorno

Definidas en `backend/.env` (no se sube al repositorio). Usar `.env.example` como plantilla.

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor HTTP | `3000` |
| `DB_HOST` | Host de PostgreSQL | `127.0.0.1` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos | `logitrack_dev` |
| `DB_USER` | Usuario de la base de datos | `logitrack_admin` |
| `DB_PASSWORD` | Contraseña de la base de datos | — |

---

## Scripts disponibles

Ejecutar desde la carpeta `backend/`:

| Comando | Descripción |
|---------|-------------|
| `node index.js` | Inicia el servidor en producción |
| `npm run dev` | Inicia con nodemon (recarga automática al guardar) |
| `node scripts/migrate.js` | Aplica las migraciones pendientes |
