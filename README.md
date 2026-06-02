# LogiTrack - Sistema de Monitoreo Vehicular en Tiempo Real

Plataforma de rastreo vehicular en tiempo real. Los vehículos transmiten coordenadas GPS via WebSocket al backend, que las persiste en PostgreSQL y las re-transmite al panel web para visualizarlas en un mapa en vivo.

## Arquitectura

```
App Móvil (GPS) ──→ Backend (Express + Socket.io) ──→ Frontend Web (mapa)
                              │
                        PostgreSQL + PostGIS
```

**Stack:**
- Backend: Node.js + Express 5
- Tiempo real: Socket.io
- Base de datos: PostgreSQL 15 + PostGIS 3.3 (Docker)
- Gestor de paquetes: pnpm

---

## Modelo de Datos

```
vehiculos         conductores
    │                  │
    └──────┬───────────┘
           ▼
         rutas
           │
           ▼
       ubicaciones  (coordenadas GPS en tiempo real)
```

| Tabla | Descripción |
|-------|-------------|
| `vehiculos` | Flota de vehículos (patente, alias, tipo) |
| `conductores` | Conductores activos |
| `rutas` | Sesión de trabajo: vehículo + conductor + período |
| `ubicaciones` | Puntos GPS asociados a una ruta activa |

---

## Requisitos Previos

- [Node.js](https://nodejs.org/) (versión LTS recomendada)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [pnpm](https://pnpm.io/installation) (`npm install -g pnpm`)
- Git

---

## Levantar el entorno local

### 1. Clonar el repositorio

```bash
git clone https://github.com/Chopan22/Logitrack.git
cd Logitrack
```

### 2. Levantar la base de datos

```bash
docker compose up -d
```

### 3. Configurar el backend

```bash
cd backend
cp .env.example .env
```

Edita `.env` con las credenciales del `docker-compose.yml`:

```env
DB_USER=logitrack_admin
DB_PASSWORD=superpassword123
DB_NAME=logitrack_dev
DB_HOST=localhost
DB_PORT=5432
PORT=3000
```

### 4. Instalar dependencias y correr migraciones

```bash
pnpm install
node scripts/migrate.js
```

### 5. Iniciar el servidor

```bash
node index.js
# o en modo desarrollo:
npm run dev
```

El servidor queda disponible en `http://localhost:3000`.

---

## API REST

### Vehículos

| Método | Endpoint | Body | Descripción |
|--------|----------|------|-------------|
| GET | `/api/vehiculos` | — | Listar todos |
| POST | `/api/vehiculos` | `{ patente, alias, tipo }` | Crear vehículo |
| PATCH | `/api/vehiculos/:id` | `{ alias?, tipo?, activo? }` | Actualizar |

### Conductores

| Método | Endpoint | Body | Descripción |
|--------|----------|------|-------------|
| GET | `/api/conductores` | — | Listar todos |
| POST | `/api/conductores` | `{ nombre, telefono? }` | Crear conductor |
| PATCH | `/api/conductores/:id` | `{ nombre?, telefono?, activo? }` | Actualizar |

### Rutas

| Método | Endpoint | Body | Descripción |
|--------|----------|------|-------------|
| GET | `/api/rutas` | — | Listar todas (acepta `?estado=en_curso`) |
| POST | `/api/rutas` | `{ vehiculo_id, conductor_id }` | Iniciar ruta |
| PATCH | `/api/rutas/:id/cerrar` | — | Cerrar ruta activa |

---

## WebSocket

Conexión: `ws://localhost:3000`

### Evento: `enviar_ubicacion` (cliente → servidor)

Envía la posición GPS de un vehículo. Requiere una ruta activa (`en_curso`).

```json
{
  "ruta_id": 1,
  "lat": -33.4569,
  "lng": -70.6483
}
```

### Evento: `nueva_ubicacion` (servidor → todos los clientes)

El servidor re-transmite cada ubicación recibida a todos los clientes conectados.

```json
{
  "ruta_id": 1,
  "lat": -33.4569,
  "lng": -70.6483
}
```

---

## Flujo típico de uso

1. Crear un vehículo: `POST /api/vehiculos`
2. Crear un conductor: `POST /api/conductores`
3. Iniciar una ruta: `POST /api/rutas` → obtienes el `ruta_id`
4. Conectar via WebSocket y emitir `enviar_ubicacion` con ese `ruta_id`
5. El frontend recibe `nueva_ubicacion` en tiempo real
6. Al terminar: `PATCH /api/rutas/:id/cerrar`

---

## Migraciones

Las migraciones viven en `backend/migrations/` y se aplican en orden numérico. Para aplicar las pendientes:

```bash
node scripts/migrate.js
```

El sistema registra las migraciones ya aplicadas en la tabla `_migraciones`, por lo que es seguro correr el comando múltiples veces.

---

## Git Flow

```
main        (producción)
  └── develop  (integración)
        └── feat/nombre-feature  (trabajo activo)
```

Crear una branch de trabajo:

```bash
git checkout develop
git checkout -b feat/nombre-de-lo-que-vas-a-hacer
```

<p align="center">
  <img src="gitflow.png" width="70%" />
</p>
