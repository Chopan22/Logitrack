# LogiTrack — Panel de Administración (Web)

Panel web de administración de **LogiTrack**, la plataforma de gestión y trazabilidad de última milla. Desde aquí un administrador gestiona pedidos, rutas y flota (vehículos y conductores), y sigue en un **mapa en vivo** la ubicación GPS de todos los repartidores en tiempo real.

Construido con **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS 4** y **Leaflet**. Consume la API REST y el canal WebSocket del [`backend`](../backend) del proyecto.

---

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript 5**
- **Tailwind CSS 4** (vía `@tailwindcss/postcss`)
- **Leaflet** + **react-leaflet** — mapa y recorridos
- **socket.io-client** — posiciones en tiempo real
- Autenticación por **JWT** (token guardado en `localStorage`)

---

## Requisitos previos

- **Node.js 18+**
- **pnpm** (gestor de paquetes de este subproyecto)
- El **backend de LogiTrack** corriendo y accesible (por defecto en `http://localhost:3000`).

---

## Puesta en marcha

Desde `frontend-web/`:

```bash
# 1. Instalar dependencias
pnpm install

# 2. Levantar el servidor de desarrollo
pnpm dev
```

La app queda disponible en **http://localhost:4000**.

> El puerto es **4000** (no el 3000 por defecto de Next.js) para no chocar con el backend. Está fijado en los scripts `dev` y `start`.

---

## Scripts

| Script       | Descripción                                             |
|--------------|---------------------------------------------------------|
| `pnpm dev`   | Servidor de desarrollo en el puerto **4000**.           |
| `pnpm build` | Build de producción.                                    |
| `pnpm start` | Sirve el build de producción en el puerto **4000**.     |
| `pnpm lint`  | Ejecuta ESLint.                                         |

---

## Variables de entorno

| Variable              | Por defecto             | Descripción                                              |
|-----------------------|-------------------------|----------------------------------------------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | URL base del backend (API REST y WebSocket de Socket.io).|

Se define en `.env.local`. Al llevar el prefijo `NEXT_PUBLIC_`, se expone al navegador. Es la misma URL usada tanto para las llamadas REST como para la conexión de sockets.

---

## Estructura del proyecto

```
frontend-web/
├── app/                      # Rutas (App Router)
│   ├── layout.tsx            # Layout raíz + AuthProvider
│   ├── page.tsx              # Login (/)
│   └── admin/                # Sección protegida (requiere sesión)
│       ├── layout.tsx        # Navegación lateral + guardia de sesión
│       ├── page.tsx          # Resumen (tarjetas de estado)
│       ├── pedidos/          # Gestión de pedidos
│       ├── rutas/            # Gestión de rutas
│       ├── flota/            # Vehículos y conductores
│       └── mapa/             # Mapa en vivo + recorrido histórico
├── components/
│   ├── ui.tsx                # Componentes de UI (Button, Card, Input, etc.)
│   └── MapaLiveInner.tsx     # Mapa Leaflet (carga dinámica, sin SSR)
├── lib/
│   ├── config.ts             # API_URL (lee NEXT_PUBLIC_API_URL)
│   ├── types.ts              # Tipos compartidos con el modelo del backend
│   ├── api.ts                # Cliente HTTP tipado (fetch + JWT)
│   ├── auth.tsx              # AuthProvider / useAuth (sesión en localStorage)
│   └── socket.ts             # Cliente Socket.io (singleton)
└── public/                   # Assets estáticos
```

---

## Vistas

| Ruta              | Vista           | Descripción                                                                   |
|-------------------|-----------------|-------------------------------------------------------------------------------|
| `/`               | **Login**       | Inicio de sesión con email y contraseña. Redirige a `/admin` si ya hay sesión.|
| `/admin`          | **Resumen**     | Tarjetas con pedidos pendientes/en camino, rutas en curso y flota activa.     |
| `/admin/pedidos`  | **Pedidos**     | Crear, listar y actualizar pedidos; asignarlos a rutas.                       |
| `/admin/rutas`    | **Rutas**       | Iniciar y cerrar rutas (vehículo + conductor); ver su detalle.                |
| `/admin/flota`    | **Flota**       | Alta, edición y baja de vehículos y conductores.                              |
| `/admin/mapa`     | **Mapa en vivo**| Ubicación de repartidores en tiempo real (WebSocket) y recorrido histórico por ruta. |

Todas las rutas bajo `/admin` están protegidas: si no hay sesión, el layout redirige al login.

---

## Autenticación

El login (`/`) llama a `POST /api/auth/login`. Si es correcto, el token JWT y los datos del usuario se guardan en `localStorage` (`logitrack.token` y `logitrack.usuario`) mediante el `AuthProvider` (`lib/auth.tsx`).

El cliente HTTP (`lib/api.ts`) adjunta automáticamente el header `Authorization: Bearer <token>` en cada petición. Cerrar sesión limpia el `localStorage` y vuelve al login.

---

## Mapa en tiempo real

`components/MapaLiveInner.tsx` se carga de forma dinámica y **sin SSR** (Leaflet necesita el objeto `window`). Se conecta al backend por Socket.io (`lib/socket.ts`) para recibir las ubicaciones que emiten los repartidores y actualizar los marcadores en vivo. Al seleccionar una ruta se dibuja además su **recorrido histórico** (`GET /api/rutas/:id/ubicaciones`), con marcadores de inicio (verde) y fin (rojo).

---

## Notas

- Este subproyecto usa **pnpm**; la raíz y el backend usan **npm**.
- Forma parte del monorepo **LogiTrack** — ver el [README raíz](../README.md) para la arquitectura completa (backend, app móvil, base de datos y arranque conjunto).
